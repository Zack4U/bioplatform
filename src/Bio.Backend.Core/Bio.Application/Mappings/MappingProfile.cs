using AutoMapper;
using Bio.Application.DTOs;
using Bio.Domain.Entities;

namespace Bio.Application.Mappings;

/// <summary>
/// AutoMapper profile for entity-DTO mappings.
/// </summary>
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User Mappings
        CreateMap<User, UserResponseDTO>();
        
        // Role Mappings
        CreateMap<Role, RoleResponseDTO>();
        
        // UserRole Mappings
        CreateMap<UserRole, UserRoleResponseDTO>();
    }
}
