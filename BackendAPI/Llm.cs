using BackendAPI.Models;
using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;

namespace BackendAPI
{
    public record CompatSettings(string Name, string BaseUrl, string ApiKey, string Model);
    public interface ILlmProvider
    {
        string Name { get; }
        Task<string> CompleteAsync(string system, IReadOnlyList<ChatTurn> history, string userMessage, CancellationToken ct);
    }

    public class GeminiProvider(HttpClient http, IConfiguration cfg, ILogger<GeminiProvider> log) : ILlmProvider
    {
        public string Name => "gemini";

        public async Task<string> CompleteAsync(string system, IReadOnlyList<ChatTurn> history, string userMessage, CancellationToken ct)
        {
            var model = cfg["Gemini:Model"] ?? throw new InvalidOperationException("Gemini:Model not set");
            var contents = history.Select(h => new { role = h.Role == "assistant" ? "model" : "user", parts = new[] { new { text = h.Content } } })
                .Append(new { role = "user", parts = new[] { new { text = userMessage } } });

            var body = new
            {
                systemInstruction = new { parts = new[] { new { text = system } } },
                contents,
               generationConfig = new { responseMimeType = "application/json", maxOutputTokens = 2500, temperature = 0.4,
                         thinkingConfig = new { thinkingBudget = 0 } }
            };

            using var req = new HttpRequestMessage(HttpMethod.Post,
                $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent")
            { Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json") };
            req.Headers.Add("x-goog-api-key", cfg["Gemini:ApiKey"]);

            var json = await LlmHttp.SendForStringAsync(http, req, log, Name, ct);
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.GetProperty("candidates")[0].GetProperty("content")
                .GetProperty("parts")[0].GetProperty("text").GetString() ?? "";
        }
    }

    public class OpenAiCompatProvider(HttpClient http, CompatSettings s, ILogger log) : ILlmProvider
    {
        public string Name => s.Name;

        public async Task<string> CompleteAsync(string system, IReadOnlyList<ChatTurn> history, string userMessage, CancellationToken ct)
        {
            var messages = new List<object> { new { role = "system", content = system } };
            messages.AddRange(history.Select(h => (object)new { role = h.Role, content = h.Content }));
            messages.Add(new { role = "user", content = userMessage });

            var body = new
            {
                model = s.Model,
                messages,
                max_tokens = 2500,
                temperature = 0.4,
                response_format = new { type = "json_object" }
            };

            using var req = new HttpRequestMessage(HttpMethod.Post, s.BaseUrl.TrimEnd('/') + "/chat/completions")
            { Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json") };
            req.Headers.Authorization = new("Bearer", s.ApiKey);

            var json = await LlmHttp.SendForStringAsync(http, req, log, Name, ct);

            // --- new part: replaces the old JsonDocument.Parse + return lines ---
            using var doc = JsonDocument.Parse(json);
            var choice = doc.RootElement.GetProperty("choices")[0];
            var content = choice.GetProperty("message").TryGetProperty("content", out var c) ? c.GetString() : null;

            if (string.IsNullOrWhiteSpace(content))
            {
                var finish = choice.TryGetProperty("finish_reason", out var f) ? f.GetString() : "unknown";
                var snippet = json.Length > 1000 ? json[..1000] + "…" : json;
                log.LogWarning("{Provider} returned empty content (finish_reason={Finish}): {Body}", Name, finish, snippet);
                throw new JsonException("Empty content from provider");
            }
            return content;
        }
    }

    // Tries providers in order; falls through on any HTTP/parse failure.
    public class LlmService(IEnumerable<ILlmProvider> providers, ILogger<LlmService> log)
    {
        static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };
        static readonly ConcurrentDictionary<string, DateTime> SkipUntil = new();
        public async Task<ModelOutput> AskAsync(string system, IReadOnlyList<ChatTurn> history, string message, CancellationToken ct, Func<ModelOutput, bool>? accept = null)
        {
            var all = providers.ToList();
            var active = all.Where(p => !SkipUntil.TryGetValue(p.Name, out var u) || u <= DateTime.UtcNow).ToList();
            if (active.Count == 0) { SkipUntil.Clear(); active = all; }   // never refuse without trying

            foreach (var p in active)
            {
                try
                {
                    var raw = await p.CompleteAsync(system, history, message, ct);
                    raw = raw.Trim().TrimStart('`').TrimEnd('`');
                    if (raw.StartsWith("json", StringComparison.OrdinalIgnoreCase)) raw = raw[4..];
                    var o = JsonSerializer.Deserialize<ModelOutput>(raw, Json)
                            ?? throw new JsonException("Empty model output");
                    if (accept is not null && !accept(o)) throw new JsonException("Output rejected by validator");
                    return o;
                }
                catch (Exception ex) when (!ct.IsCancellationRequested)
                {
                    SkipUntil[p.Name] = DateTime.UtcNow.AddSeconds(30);
                    log.LogWarning(ex, "Provider {Provider} failed, skipping it for 30s", p.Name);
                }
            }
            throw new ApiException(502, "PROVIDER_ERROR", "The buddy is having trouble right now. Please try again.");
        }
    }

    public class DailyBudget(IConfiguration cfg)
    {
        readonly int _max = cfg.GetValue("Limits:DailyCalls", 500);
        readonly object _lock = new();
        DateOnly _day = DateOnly.FromDateTime(DateTime.UtcNow);
        int _count;

        public bool TryConsume()
        {
            lock (_lock)
            {
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                if (today != _day) { _day = today; _count = 0; }
                if (_count >= _max) return false;
                _count++;
                return true;
            }
        }
    }

    static class LlmHttp
    {
        public static async Task<string> SendForStringAsync(
            HttpClient http, HttpRequestMessage req, ILogger log, string provider, CancellationToken ct)
        {
            using var res = await http.SendAsync(req, ct);
            var body = await res.Content.ReadAsStringAsync(ct);

            if (!res.IsSuccessStatusCode)
            {
                var snippet = body.Length > 1000 ? body[..1000] + "…" : body;
                log.LogWarning("{Provider} returned {Status}: {Body}", provider, (int)res.StatusCode, snippet);
                throw new HttpRequestException($"{provider} returned {(int)res.StatusCode}", null, res.StatusCode);
            }
            return body;
        }
    }
}