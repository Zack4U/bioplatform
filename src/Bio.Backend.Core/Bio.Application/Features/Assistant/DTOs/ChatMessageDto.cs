namespace Bio.Application.Features.Assistant.DTOs;

public class ChatMessageDto
{
    /// <summary>
    /// Role of the message sender: 'user' or 'model'
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// Content of the message
    /// </summary>
    public string Content { get; set; } = string.Empty;
}
