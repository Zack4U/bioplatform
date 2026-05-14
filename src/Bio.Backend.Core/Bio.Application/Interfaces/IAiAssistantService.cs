using Bio.Application.Features.Assistant.DTOs;
using System.Collections.Generic;

namespace Bio.Application.Interfaces;

public interface IAiAssistantService
{
    Task<string> AskQuestionAsync(string question, List<ChatMessageDto> history, CancellationToken cancellationToken);
}
