using Bio.Application.Features.Assistant.DTOs;
using Bio.Application.Features.Assistant.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Bio.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AssistantController : ControllerBase
{
    private readonly IMediator _mediator;

    public AssistantController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Ask a question to the RAG Gemini Assistant
    /// </summary>
    /// <param name="query">The query containing the question</param>
    /// <returns>The AI generated answer based on RAG context</returns>
    [HttpPost("ask")]
    public async Task<ActionResult<AssistantResponseDto>> AskAssistant([FromBody] AskAssistantQuery query)
    {
        if (string.IsNullOrWhiteSpace(query.Question))
        {
            return BadRequest("The question cannot be empty.");
        }

        var response = await _mediator.Send(query);
        return Ok(response);
    }
}
