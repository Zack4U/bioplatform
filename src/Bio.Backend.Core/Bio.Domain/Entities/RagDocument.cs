namespace Bio.Domain.Entities;

public class RagDocument
{
    public Guid Id { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Content { get; private set; } = string.Empty;
    public string? SourceType { get; private set; }
    public string? SourceUrl { get; private set; }
    public Guid? SpeciesId { get; private set; }
    public string? EmbeddingId { get; private set; }
    public int ChunkIndex { get; private set; } = 0;
    public string? Metadata { get; private set; } // JSONB
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public Species? Species { get; private set; }

    private RagDocument() { }

    public RagDocument(string title, string content)
    {
        Id = Guid.NewGuid();
        Title = title;
        Content = content;
    }
}
