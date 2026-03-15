using Bio.API.Middlewares;
using Bio.Application.Common.Models;
using Bio.Application.DTOs;
using Bio.Application.Interfaces;
using Bio.Application.Services;
using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Backend.Core.Bio.Infrastructure.Repositories;
using Bio.Backend.Core.Bio.Infrastructure.Services;
using Bio.Domain.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Bio.Application.Behaviors;
using Bio.Application.Mappings;
using FluentValidation;
using MediatR;
using DotNetEnv;

// Cargar .env desde la raíz del proyecto (las credenciales no se duplican en appsettings)
Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

// Cadenas de conexión desde variables de entorno (.env) — única fuente de secretos
var defaultConnection = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING_SQL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

// PostgreSQL (Scientific): siempre desde DB_PG_* para que la contraseña venga solo de DB_PG_PASSWORD
var pgHost = Environment.GetEnvironmentVariable("DB_PG_HOST") ?? "localhost";
var pgPort = Environment.GetEnvironmentVariable("DB_PG_PORT") ?? "5432";
var pgDatabase = Environment.GetEnvironmentVariable("DB_PG_DATABASE") ?? "BioCommerce_Scientific";
var pgUser = Environment.GetEnvironmentVariable("DB_PG_USER") ?? "postgres";
var pgPassword = Environment.GetEnvironmentVariable("DB_PG_PASSWORD") ?? "";
var scientificConnection = $"Host={pgHost};Port={pgPort};Database={pgDatabase};Username={pgUser};Password={pgPassword}";

// Configure JWT Settings
var jwtSettings = new JwtSettings();
builder.Configuration.GetSection(JwtSettings.SectionName).Bind(jwtSettings);
builder.Services.AddSingleton(Options.Create(jwtSettings));

// Register BioPlatform Services (conexiones desde .env)
builder.Services.AddDbContext<BioDbContext>(options =>
    options.UseSqlServer(defaultConnection));

builder.Services.AddDbContext<ScientificDbContext>(options =>
    options.UseNpgsql(scientificConnection, o => o.UseNetTopologySuite()));

builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<IUserRoleRepository, UserRoleRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// Scientific (PostgreSQL) repositories and unit of work
builder.Services.AddScoped<ITaxonomyRepository, TaxonomyRepository>();
builder.Services.AddScoped<ISpeciesRepository, SpeciesRepository>();
builder.Services.AddScoped<IGeographicDistributionRepository, GeographicDistributionRepository>();
builder.Services.AddScoped<IScientificUnitOfWork, ScientificUnitOfWork>();

// Register AutoMapper and FluentValidation
builder.Services.AddValidatorsFromAssembly(typeof(UserResponseDTO).Assembly);
builder.Services.AddAutoMapper(typeof(MappingProfile).Assembly);
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

// Configure Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddControllers();

// Add services to the container.
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(UserResponseDTO).Assembly));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "BioPlatform API", Version = "v1" });

    // Add JWT Authentication support to Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication(); // Added authentication middleware
app.UseAuthorization();

app.MapControllers();

app.Run();
