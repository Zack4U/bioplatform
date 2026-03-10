using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Bio.Application.Features.Species.Commands;

namespace Bio.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SpeciesController : ControllerBase
{
    private readonly IMediator _mediator;

    public SpeciesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("import")]
    // [Authorize(Roles = "Researcher, Admin")] // Assuming RBAC
    public async Task<IActionResult> ImportSpeciesCsv(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded.");
        }

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("File must be a CSV.");
        }

        // Save file locally to a temp path
        var tempFolder = Path.Combine(Path.GetTempPath(), "BioPlatformUploads");
        Directory.CreateDirectory(tempFolder);
        
        var tempFilePath = Path.Combine(tempFolder, $"{Guid.NewGuid()}_{file.FileName}");

        using (var stream = new FileStream(tempFilePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Assuming UserId comes from User Claims
        // var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
        var dummyUserId = Guid.NewGuid(); // Placeholder

        var command = new ImportSpeciesCsvCommand
        {
            FilePath = tempFilePath,
            UserId = dummyUserId
        };

        var jobId = await _mediator.Send(command);

        return Accepted(new { 
            Message = "CSV upload accepted and job enqueued in the background.", 
            JobId = jobId 
        });
    }
}
