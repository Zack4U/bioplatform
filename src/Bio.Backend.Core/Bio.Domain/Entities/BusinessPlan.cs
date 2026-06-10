namespace Bio.Domain.Entities;

public class BusinessPlan
{
    public Guid Id { get; private set; }
    public Guid EntrepreneurId { get; private set; }
    public string ProjectTitle { get; private set; } = string.Empty;
    public Guid[] SpeciesIds { get; private set; } = Array.Empty<Guid>();
    public string GeneratedContent { get; private set; } = string.Empty;
    public string? MarketAnalysisData { get; private set; } // JSONB
    public string? FinancialProjections { get; private set; } // JSONB
    public string? GenerationPrompt { get; private set; }
    public string? ModelUsed { get; private set; }
    public string Status { get; private set; } = "draft";
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;

    private BusinessPlan() { }

    public BusinessPlan(Guid entrepreneurId, string projectTitle, string generatedContent)
    {
        Id = Guid.NewGuid();
        EntrepreneurId = entrepreneurId;
        ProjectTitle = projectTitle;
        GeneratedContent = generatedContent;
    }
}
