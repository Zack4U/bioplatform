using Bio.Application.Features.Assistant.DTOs;
using Bio.Application.Interfaces;
using MediatR;

namespace Bio.Application.Features.Assistant.Queries;

public class AskAssistantQueryHandler : IRequestHandler<AskAssistantQuery, AssistantResponseDto>
{
    private readonly IAiAssistantService _aiAssistantService;

    public AskAssistantQueryHandler(IAiAssistantService aiAssistantService)
    {
        _aiAssistantService = aiAssistantService;
    }

    public async Task<AssistantResponseDto> Handle(AskAssistantQuery request, CancellationToken cancellationToken)
    {
        var answer = await _aiAssistantService.AskQuestionAsync(request.Question, request.History, cancellationToken);
        
        return new AssistantResponseDto
        {
            Answer = answer
        };
    }
}
