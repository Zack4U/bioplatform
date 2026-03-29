using Bio.API.Middlewares;
using Bio.Application.Common.Models;
using Bio.Application.DTOs;
using Bio.Application.Interfaces;
using Bio.Application.Services;
using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Backend.Core.Bio.Infrastructure.Repositories;
using Bio.Backend.Core.Bio.Infrastructure.Services;
using Bio.Domain.Interfaces;
using FluentValidation;
using MediatR;
using DotNetEnv;
using AutoMapper;
using Hangfire;
using Hangfire.Redis.StackExchange;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Cadenas de conexión exclusivamente desde appsettings.json o appsettings.Development.json
var defaultConnection = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection no está configurado en appsettings.");

var scientificConnection = builder.Configuration.GetConnectionString("ScientificConnection")
    ?? throw new InvalidOperationException("ScientificConnection no está configurado en appsettings.");

// Configure JWT Settings
var jwtSettings = new JwtSettings();
builder.Configuration.GetSection(JwtSettings.SectionName).Bind(jwtSettings);
builder.Services.AddSingleton(Options.Create(jwtSettings));

// JWT Authentication
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
        NameClaimType = "name",
        RoleClaimType = "role"
    };
});

// Register BioPlatform Services
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

// Scientific context (PostgreSQL) — Biodiversity Catalog
builder.Services.AddScoped<Bio.Domain.Interfaces.ISpeciesRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.SpeciesRepository>();
builder.Services.AddScoped<Bio.Domain.Interfaces.ITaxonomyRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.TaxonomyRepository>();
builder.Services.AddScoped<Bio.Domain.Interfaces.IScientificUnitOfWork, Bio.Backend.Core.Bio.Infrastructure.Persistence.ScientificUnitOfWork>();

// Hangfire — background job processing with Redis storage
var redisConnection = builder.Configuration.GetConnectionString("RedisConnection")
    ?? "localhost:6379";
// Ensure abortConnect=false so Hangfire retries instead of crashing when Redis is momentarily unavailable
if (!redisConnection.Contains("abortConnect", StringComparison.OrdinalIgnoreCase))
    redisConnection += ",abortConnect=false";
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseRedisStorage(redisConnection));
builder.Services.AddHangfireServer();

builder.Services.AddScoped<Bio.Domain.Interfaces.ISpeciesBulkImportJob, Bio.Infrastructure.Services.SpeciesImportJob>();
builder.Services.AddScoped<Bio.Application.Common.Interfaces.IJobEnqueuer, Bio.Infrastructure.Services.JobEnqueuer>();

// CORS — allow configured frontend origins
var corsOrigins = builder.Configuration
    .GetSection("CorsSettings:AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:3000"];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// MediatR, AutoMapper, FluentValidation, Controllers
builder.Services.AddControllers();
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Bio.Application.Features.Species.Commands.ImportSpeciesCsvCommand).Assembly));
builder.Services.AddAutoMapper(cfg => cfg.AddMaps(typeof(Bio.Application.Mappings.MappingProfile).Assembly));
builder.Services.AddValidatorsFromAssembly(typeof(Bio.Application.Features.Species.Commands.ImportSpeciesCsvCommand).Assembly);

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
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
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT"
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

// CORS must be before Authentication/Authorization
app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

// Expose Hangfire Dashboard
app.UseHangfireDashboard("/hangfire");

app.MapControllers();

app.Run();
