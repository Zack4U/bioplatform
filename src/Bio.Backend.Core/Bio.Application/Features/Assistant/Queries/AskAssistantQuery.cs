using System.Collections.Generic;
using Bio.Application.Features.Assistant.DTOs;
using MediatR;

namespace Bio.Application.Features.Assistant.Queries;

public class AskAssistantQuery : IRequest<AssistantResponseDto>
{
    public string Question { get; set; } = string.Empty;
    public List<ChatMessageDto> History { get; set; } = new();
}
