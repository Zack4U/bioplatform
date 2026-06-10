using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Addresses.Commands;

public record CreateAddressCommand(AddressCreateDTO Dto, Guid UserId) : IRequest<AddressResponseDTO>;

public class CreateAddressCommandHandler : IRequestHandler<CreateAddressCommand, AddressResponseDTO>
{
    private readonly IAddressRepository _repo;
    private readonly IUnitOfWork _uow;

    public CreateAddressCommandHandler(IAddressRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<AddressResponseDTO> Handle(CreateAddressCommand request, CancellationToken ct)
    {
        if (request.Dto.IsDefault)
            await _repo.ClearDefaultsForUserAsync(request.UserId, request.Dto.AddressType, ct);

        var address = new Address(request.UserId, request.Dto.AddressType, request.Dto.RecipientName,
            request.Dto.StreetLine1, request.Dto.City, request.Dto.Department, request.Dto.PostalCode,
            request.Dto.StreetLine2, request.Dto.Country, request.Dto.PhoneNumber, request.Dto.IsDefault);
        await _repo.AddAsync(address, ct);
        await _uow.SaveChangesAsync(ct);
        return MapToResponse(address);
    }

    internal static AddressResponseDTO MapToResponse(Address a) => new(
        a.Id, a.AddressType, a.RecipientName, a.StreetLine1, a.StreetLine2,
        a.City, a.Department, a.PostalCode, a.Country, a.PhoneNumber, a.IsDefault, a.CreatedAt);
}

public record UpdateAddressCommand(Guid AddressId, AddressUpdateDTO Dto, Guid UserId) : IRequest<AddressResponseDTO>;

public class UpdateAddressCommandHandler : IRequestHandler<UpdateAddressCommand, AddressResponseDTO>
{
    private readonly IAddressRepository _repo;
    private readonly IUnitOfWork _uow;

    public UpdateAddressCommandHandler(IAddressRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<AddressResponseDTO> Handle(UpdateAddressCommand request, CancellationToken ct)
    {
        var address = await _repo.GetByIdAsync(request.AddressId, ct)
            ?? throw new NotFoundException(nameof(Address), request.AddressId);
        if (address.UserId != request.UserId)
            throw new ForbiddenException("You can only update your own addresses.");

        if (request.Dto.IsDefault == true)
            await _repo.ClearDefaultsForUserAsync(request.UserId, address.AddressType, ct);

        address.Update(request.Dto.RecipientName, request.Dto.StreetLine1, request.Dto.StreetLine2,
            request.Dto.City, request.Dto.Department, request.Dto.PostalCode,
            request.Dto.Country, request.Dto.PhoneNumber, request.Dto.IsDefault);
        await _uow.SaveChangesAsync(ct);
        return CreateAddressCommandHandler.MapToResponse(address);
    }
}

public record SetDefaultAddressCommand(Guid AddressId, Guid UserId) : IRequest<AddressResponseDTO>;

public class SetDefaultAddressCommandHandler : IRequestHandler<SetDefaultAddressCommand, AddressResponseDTO>
{
    private readonly IAddressRepository _repo;
    private readonly IUnitOfWork _uow;

    public SetDefaultAddressCommandHandler(IAddressRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<AddressResponseDTO> Handle(SetDefaultAddressCommand request, CancellationToken ct)
    {
        var address = await _repo.GetByIdAsync(request.AddressId, ct)
            ?? throw new NotFoundException(nameof(Address), request.AddressId);
        if (address.UserId != request.UserId)
            throw new ForbiddenException("You can only set your own addresses as default.");

        await _repo.ClearDefaultsForUserAsync(request.UserId, address.AddressType, ct);
        address.SetDefault(true);
        await _uow.SaveChangesAsync(ct);
        return CreateAddressCommandHandler.MapToResponse(address);
    }
}

public record DeleteAddressCommand(Guid AddressId, Guid UserId) : IRequest<Unit>;

public class DeleteAddressCommandHandler : IRequestHandler<DeleteAddressCommand, Unit>
{
    private readonly IAddressRepository _repo;
    private readonly IUnitOfWork _uow;

    public DeleteAddressCommandHandler(IAddressRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<Unit> Handle(DeleteAddressCommand request, CancellationToken ct)
    {
        var address = await _repo.GetByIdAsync(request.AddressId, ct)
            ?? throw new NotFoundException(nameof(Address), request.AddressId);
        if (address.UserId != request.UserId)
            throw new ForbiddenException("You can only delete your own addresses.");

        await _repo.DeleteAsync(address, ct);
        await _uow.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
