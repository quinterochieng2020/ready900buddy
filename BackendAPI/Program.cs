using BackendAPI;
using BackendAPI.Models;
using Microsoft.Extensions.Caching.Memory;
using System.Security.Cryptography;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<GeminiProvider>(c => c.Timeout = TimeSpan.FromSeconds(15));
// Order matters: Gemini first, OpenRouter fallback
builder.Services.AddTransient<ILlmProvider>(sp => sp.GetRequiredService<GeminiProvider>());
builder.Services.AddSingleton<StaticFallbacks>();
builder.Services.AddScoped<LlmService>();
builder.Services.AddSingleton<DailyBudget>();
var compat = builder.Configuration.GetSection("OpenAiCompat").GetChildren()
    .Select(c => new CompatSettings(c["Name"] ?? "", c["BaseUrl"] ?? "", c["ApiKey"] ?? "", c["Model"] ?? ""))
    .Where(s => s.Name != "" && s.ApiKey != "" && s.Model != "")   // unconfigured providers are skipped
    .ToList();

foreach (var s in compat)
{
    builder.Services.AddHttpClient("llm-" + s.Name, c => c.Timeout = TimeSpan.FromSeconds(15));
    builder.Services.AddTransient<ILlmProvider>(sp => new OpenAiCompatProvider(
        sp.GetRequiredService<IHttpClientFactory>().CreateClient("llm-" + s.Name),
        s,
        sp.GetRequiredService<ILoggerFactory>().CreateLogger("llm." + s.Name)));
}


var origins = builder.Configuration["Cors:Origins"]?.Split(',', StringSplitOptions.RemoveEmptyEntries) ?? ["http://localhost:5173"];
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = 429;
    o.AddPolicy("buddy", ctx =>
    {
        var key = ctx.Request.Headers["X-Session-Id"].FirstOrDefault()
                  ?? ctx.Connection.RemoteIpAddress?.ToString() ?? "anon";
        return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        });
    });
    o.OnRejected = async (ctx, ct) =>
    {
        var retry = ctx.Lease.TryGetMetadata(MetadataName.RetryAfter, out var ts) ? (int)ts.TotalSeconds : 30;
        ctx.HttpContext.Response.Headers.RetryAfter = retry.ToString();
        await ctx.HttpContext.Response.WriteAsJsonAsync(new
        {
            error = new { code = "RATE_LIMITED", message = "Slow down a little." },
            retryAfterSeconds = retry
        }, ct);
    };
});

var app = builder.Build();
app.UseCors();
app.UseRateLimiter();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapPost("/api/buddy/messages", async (BuddyRequest req, IMemoryCache cache, LlmService llm, DailyBudget budget, StaticFallbacks fallbacks, CancellationToken ct) =>
{
    try
    {
        var modes = new[] { "simple", "local", "exam", "socratic" };
        var langs = new[] { "en", "ss", "zu", "sw" };
        var msg = req.Message?.Trim() ?? "";
        if (msg.Length is 0 or > 500 || !modes.Contains(req.Mode) || !langs.Contains(req.Language))
            throw new ApiException(400, "BAD_REQUEST", "Please send a message of 1-500 characters with a valid mode and language.");

        var history = (req.History ?? new()).TakeLast(6).Select(h => h with { Content = h.Content.Length > 1500 ? h.Content[..1500] : h.Content }).ToList();
        var convId = req.ConversationId ?? Guid.NewGuid().ToString();

        var cacheable = history.Count == 0;
        var cacheKey = "buddy:" + Convert.ToHexString(SHA256.HashData(
            Encoding.UTF8.GetBytes($"{req.Mode}|{req.Language}|{msg.ToLowerInvariant()}")));

        if (cacheable && cache.TryGetValue(cacheKey, out BuddyReply? hit) && hit is not null)
            return Results.Ok(hit with { ConversationId = convId, Cached = true });

        
        ModelOutput o;
        try
        {
            o = await llm.AskAsync(Prompts.Build(req.Mode, req.Language), history, msg + Prompts.UserSuffix(req.Language), ct);
        }
        catch (ApiException e) when (e.Code == "PROVIDER_ERROR" && cacheable && fallbacks.Find(req.Mode, req.Language, msg) is { } fb)
        {
            return Results.Ok(new BuddyReply(convId, req.Mode, fb.Explanation, fb.LocalExample, fb.KeyTerms ?? new(),
                fb.ExamTrap, fb.CheckQuestion, fb.OutlineSection, true));
        }
        if (!budget.TryConsume())
            throw new ApiException(429, "DAILY_LIMIT", "The buddy has hit its daily limit. Please come back tomorrow.");


        if (o.OffTopic)
            throw new ApiException(422, "OFF_TOPIC", string.IsNullOrWhiteSpace(o.Explanation)
                ? "I can only help with AZ-900 topics. Try asking about cloud concepts, Azure services or governance." : o.Explanation);

        var reply = new BuddyReply(convId, req.Mode, o.Explanation, o.LocalExample, o.KeyTerms ?? new(),
            o.ExamTrap, o.CheckQuestion, o.OutlineSection, false);

        if (cacheable) cache.Set(cacheKey, reply, TimeSpan.FromHours(12));
        return Results.Ok(reply);
    }
    catch (ApiException e)
    {
        return Results.Json(new { error = new { code = e.Code, message = e.Message }, retryAfterSeconds = e.RetryAfter }, statusCode: e.Status);
    }
}).RequireRateLimiting("buddy");

app.Run();