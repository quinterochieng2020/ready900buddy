using BackendAPI.Models;
using System.Text.Json;

namespace BackendAPI;

public class StaticFallbacks
{
    readonly Dictionary<string, ModelOutput> _items = new();

    public StaticFallbacks(ILogger<StaticFallbacks> log)
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Fallbacks.json");
        if (!File.Exists(path)) { log.LogWarning("Fallbacks.json not found, no static fallbacks loaded"); return; }
        try
        {
            var raw = JsonSerializer.Deserialize<Dictionary<string, ModelOutput>>(
                File.ReadAllText(path), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
            foreach (var kv in raw)
            {
                var p = kv.Key.Split('|', 3);
                if (p.Length == 3) _items[Key(p[0], p[1], p[2])] = kv.Value;
            }
            log.LogInformation("Loaded {Count} static fallbacks", _items.Count);
        }
        catch (Exception ex) { log.LogWarning(ex, "Could not read Fallbacks.json"); }
    }

    static string Norm(string s) =>
        string.Join(' ', s.ToLowerInvariant().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries)).TrimEnd('?', '.', '!');

    static string Key(string mode, string lang, string msg) => $"{mode}|{lang}|{Norm(msg)}";

    public ModelOutput? Find(string mode, string lang, string msg) =>
        _items.TryGetValue(Key(mode, lang, msg), out var o) ? o : null;
}