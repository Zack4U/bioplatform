using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using MediatR;
using AutoMapper;

namespace Bio.Application.Features.Roles.Commands.CreateRole;

public record CreateRoleCommand(RoleCreateDTO Dto) : IRequest<RoleResponseDTO>;

public class CreateRoleCommandHandler : IRequestHandler<CreateRoleCommand, RoleResponseDTO>
{
    private readonly IRoleRepository _roleRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CreateRoleCommandHandler(IRoleRepository roleRepository, IUnitOfWork unitOfWork, IMapper mapper)
    {
        _roleRepository = roleRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<RoleResponseDTO> Handle(CreateRoleCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;
        var normalizedName = dto.Name.Trim().ToUpperInvariant();

        var existingRole = await _roleRepository.GetByNameAsync(normalizedName);
        if (existingRole != null)
        {
            throw new Bio.Domain.Exceptions.ConflictException($"Role with name '{normalizedName}' already exists.");
        }

        var role = new Role(Guid.NewGuid(), normalizedName, dto.Description);

        await _roleRepository.AddAsync(role);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<RoleResponseDTO>(role);
    }
}
