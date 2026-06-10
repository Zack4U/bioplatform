using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Bio.Application.DTOs;
using Bio.Application.Features.Products.Commands;
using Bio.Application.Features.Products.Queries;
using Bio.Application.Features.ProductImages.Commands;
using Bio.Application.Features.ProductImages.Queries;
using Bio.Application.Features.Certifications.Commands;
using Bio.Application.Features.Certifications.Queries;
using Bio.Domain.Constants;
using MediatR;
using System.Security.Claims;

namespace Bio.API.Controllers;

/// <summary>Authenticated product management endpoints — role-based access.</summary>
[ApiController]
[Route("api/manage/products")]
[Authorize]
[Produces("application/json")]
public class ManageProductsController : ControllerBase
{
    private readonly IMediator _mediator;
    public ManageProductsController(IMediator mediator) => _mediator = mediator;

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")!.Value);
    private string GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value ?? "";

    [HttpGet]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Entrepreneur}")]
    public async Task<IActionResult> GetManaged([FromQuery(Name = "q")] string? q, [FromQuery] ProductFilterParams filters)
    {
        var role = GetUserRole();
        Guid? entrepreneurId = role == RoleNames.Admin ? null : GetUserId();
        return Ok(await _mediator.Send(new GetManagedProductsQuery
        {
            EntrepreneurId = entrepreneurId,
            Query = q,
            CategoryId = filters.CategoryId,
            SortBy = filters.SortBy,
            SortOrder = filters.SortOrder,
            Page = filters.Page,
            PageSize = filters.PageSize,
        }));
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.Entrepreneur)]
    public async Task<IActionResult> Create([FromBody] ProductCreateDTO dto)
    {
        var result = await _mediator.Send(new CreateProductCommand(dto, GetUserId()));
        return CreatedAtAction(nameof(Create), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Entrepreneur}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] ProductUpdateDTO dto)
        => Ok(await _mediator.Send(new UpdateProductCommand(id, dto, GetUserId(), GetUserRole())));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Entrepreneur}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _mediator.Send(new DeleteProductCommand(id, GetUserId(), GetUserRole()));
        return NoContent();
    }

    [HttpPost("{id:guid}/activate")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority}")]
    public async Task<IActionResult> Activate(Guid id)
    {
        await _mediator.Send(new ActivateProductCommand(id));
        return NoContent();
    }

    [HttpPost("{id:guid}/deactivate")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority}")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        await _mediator.Send(new DeactivateProductCommand(id));
        return NoContent();
    }

    // --- Product Images ---
    [HttpGet("{productId:guid}/images")]
    public async Task<IActionResult> GetImages(Guid productId)
        => Ok(await _mediator.Send(new GetProductImagesQuery(productId)));

    [HttpPost("{productId:guid}/images")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Entrepreneur}")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> AddImage(
        Guid productId,
        IFormFile file,
        [FromForm] ProductImageCreateDTO dto)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "An image file is required." });

        await using var fileStream = file.OpenReadStream();

        var command = new AddProductImageCommand
        {
            ProductId = productId,
            FileStream = fileStream,
            ContentType = file.ContentType,
            OriginalFileName = file.FileName,
            ActorId = GetUserId(),
            ActorRole = GetUserRole(),
            AltText = dto.AltText,
            DisplayOrder = dto.DisplayOrder,
            IsPrimary = dto.IsPrimary,
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetImages), new { productId }, result);
    }

    [HttpDelete("images/{imageId:guid}")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Entrepreneur}")]
    public async Task<IActionResult> DeleteImage(Guid imageId)
    {
        await _mediator.Send(new DeleteProductImageCommand(imageId, GetUserId(), GetUserRole()));
        return NoContent();
    }

    [HttpPost("images/{imageId:guid}/set-primary")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Entrepreneur}")]
    public async Task<IActionResult> SetPrimaryImage(Guid imageId)
    {
        await _mediator.Send(new SetPrimaryProductImageCommand(imageId, GetUserId(), GetUserRole()));
        return NoContent();
    }

    // --- Certifications ---
    [HttpGet("{productId:guid}/certifications")]
    public async Task<IActionResult> GetCertifications(Guid productId)
        => Ok(await _mediator.Send(new GetProductCertificationsQuery(productId)));

    [HttpPost("{productId:guid}/certifications")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Entrepreneur}")]
    public async Task<IActionResult> AddCertification(Guid productId, [FromBody] CertificationCreateDTO dto)
    {
        var result = await _mediator.Send(new CreateCertificationCommand(productId, dto, GetUserId(), GetUserRole()));
        return CreatedAtAction(nameof(GetCertifications), new { productId }, result);
    }

    [HttpPut("certifications/{certId:guid}")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Entrepreneur}")]
    public async Task<IActionResult> UpdateCertification(Guid certId, [FromBody] CertificationUpdateDTO dto)
        => Ok(await _mediator.Send(new UpdateCertificationCommand(certId, dto, GetUserId(), GetUserRole())));

    [HttpDelete("certifications/{certId:guid}")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Entrepreneur}")]
    public async Task<IActionResult> DeleteCertification(Guid certId)
    {
        await _mediator.Send(new DeleteCertificationCommand(certId, GetUserId(), GetUserRole()));
        return NoContent();
    }
}
