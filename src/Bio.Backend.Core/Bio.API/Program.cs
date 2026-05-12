using Bio.API.Middlewares;
using Bio.Application.Behaviors;
using Bio.Application.Common.Models;
using Bio.Application.DTOs;
using Bio.Application.Interfaces;
using Bio.Application.Services;
using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Backend.Core.Bio.Infrastructure.Repositories;
using Bio.Backend.Core.Bio.Infrastructure.Services;
using Bio.Domain.Constants;
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
using Microsoft.AspNetCore.RateLimiting;
using StackExchange.Redis;
using System.Text;
using System.Threading.RateLimiting;

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
    // Keep JWT claim names as-is (sub, name, role) to match emitted token claims and role checks.
    options.MapInboundClaims = false;

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

builder.Services.AddAuthorization();

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
builder.Services.AddScoped<Bio.Domain.Interfaces.IGeographicDistributionRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.GeographicDistributionRepository>();
builder.Services.AddScoped<Bio.Domain.Interfaces.ISpeciesImageRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.SpeciesImageRepository>();
builder.Services.AddScoped<Bio.Application.Interfaces.IRelatedProductsQuery, Bio.Backend.Core.Bio.Infrastructure.Services.RelatedProductsQuery>();

// Marketplace context (SQL Server) — Product, Order, Favorite, Address, Certification, AbsPermit, Cart, Traceability
builder.Services.AddScoped<Bio.Domain.Interfaces.IProductRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.ProductRepository>();
builder.Services.AddScoped<Bio.Domain.Interfaces.IProductImageRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.ProductImageRepository>();
builder.Services.AddScoped<Bio.Domain.Interfaces.IProductCategoryRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.ProductCategoryRepository>();
builder.Services.AddScoped<Bio.Domain.Interfaces.IProductReviewRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.ProductReviewRepository>();
builder.Services.AddScoped<Bio.Domain.Interfaces.IOrderRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.OrderRepository>();
builder.Services.AddScoped<Bio.Domain.Interfaces.IFavoriteRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.FavoriteRepository>();
builder.Services.AddScoped<Bio.Domain.Interfaces.IAddressRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.AddressRepository>();
builder.Services.AddScoped<Bio.Domain.Interfaces.ICertificationRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.CertificationRepository>();
builder.Services.AddScoped<Bio.Domain.Interfaces.IAbsPermitRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.AbsPermitRepository>();
builder.Services.AddScoped<Bio.Domain.Interfaces.ICartRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.CartRepository>();
builder.Services.AddScoped<Bio.Domain.Interfaces.ITraceabilityBatchRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.TraceabilityBatchRepository>();

// Community context (SQL Server) — Posts, Comments, Reactions, Connections, Messaging
builder.Services.AddScoped<Bio.Domain.Interfaces.ICommunityPostRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.CommunityPostRepository>();
builder.Services.AddScoped<Bio.Domain.Interfaces.ICommunityPostCommentRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.CommunityPostCommentRepository>();
builder.Services.AddScoped<Bio.Domain.Interfaces.ICommunityReactionRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.CommunityReactionRepository>();

// Networking context (SQL Server) — User Connections, Direct Threads & Messages
builder.Services.AddScoped<Bio.Domain.Interfaces.IUserConnectionRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.UserConnectionRepository>();
builder.Services.AddScoped<Bio.Domain.Interfaces.IDirectThreadRepository, Bio.Backend.Core.Bio.Infrastructure.Repositories.DirectThreadRepository>();

// AWS S3 — Species observation image uploads
builder.Services.Configure<AwsSettings>(builder.Configuration.GetSection(AwsSettings.SectionName));
builder.Services.Configure<IdentificationSettings>(builder.Configuration.GetSection(IdentificationSettings.SectionName));
builder.Services.AddScoped<IS3StorageService, S3StorageService>();

// Configure multipart form-data size limit to allow observation image uploads
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = ObservationConstants.MaxFileSizeBytes;
});

// Hangfire — background job processing with Redis storage
var redisConnection = builder.Configuration.GetConnectionString("RedisConnection")
    ?? "localhost:6379";
// Ensure abortConnect=false so Hangfire retries instead of crashing when Redis is momentarily unavailable
if (!redisConnection.Contains("abortConnect", StringComparison.OrdinalIgnoreCase))
    redisConnection += ",abortConnect=false";

// Redis — Distributed Cache & IConnectionMultiplexer (for prefix invalidation)
var redisOptions = ConfigurationOptions.Parse(redisConnection);
redisOptions.AbortOnConnectFail = false;
builder.Services.AddSingleton<IConnectionMultiplexer>(
    ConnectionMultiplexer.Connect(redisOptions));
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = redisConnection;
    options.InstanceName = "bioplatform:";
});
builder.Services.AddScoped<ICacheService, RedisCacheService>();

builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseRedisStorage(redisConnection));
builder.Services.AddHangfireServer();

// Rate Limiting — fixed window per IP
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("api", limiterOptions =>
    {
        limiterOptions.PermitLimit = 120;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 10;
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

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
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(Bio.Application.Features.Species.Commands.ImportSpeciesCsvCommand).Assembly);
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(Bio.Application.Behaviors.ValidationBehavior<,>));
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(HtmlSanitizationBehavior<,>));
});
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

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

// Expose Hangfire Dashboard
app.UseHangfireDashboard("/hangfire");

app.MapControllers();

app.Run();
