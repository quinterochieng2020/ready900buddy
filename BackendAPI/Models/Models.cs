namespace BackendAPI.Models
{
    public record ChatTurn(string Role, string Content);

    public record BuddyRequest(
        string? ConversationId, string Message, string Mode, string Language, List<ChatTurn>? History);

    public record KeyTerm(string Term, string Meaning);

    public record BuddyReply(
        string ConversationId, string Mode, string Explanation, string? LocalExample,
        List<KeyTerm> KeyTerms, string? ExamTrap, string? CheckQuestion,
        string? OutlineSection, bool Cached);

    // What the model returns (parsed from JSON)
    public class ModelOutput
    {
        public bool OffTopic { get; set; }
        public string Explanation { get; set; } = "";
        public string? LocalExample { get; set; }
        public List<KeyTerm> KeyTerms { get; set; } = new();
        public string? ExamTrap { get; set; }
        public string? CheckQuestion { get; set; }
        public string? OutlineSection { get; set; }
    }

    public class ApiException(int status, string code, string message, int? retryAfter = null) : Exception(message)
    {
        public int Status { get; } = status;
        public string Code { get; } = code;
        public int? RetryAfter { get; } = retryAfter;
    }
}
