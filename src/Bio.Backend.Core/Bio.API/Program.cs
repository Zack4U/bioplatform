using Bio.API.Middlewares;
using Microsoft.EntityFrameworkCore;
using Bio.Domain.Interfaces;
using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Backend.Core.Bio.Infrastructure.Repositories;
using Bio.Backend.Core.Bio.Infrastructure.Services;
using Bio.Infrastructure.Services;
using Bio.Application.DTOs;
using FluentValidation;
using Hangfire;
using Hangfire.Redis.StackExchange;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(UserResponseDTO).Assembly));

builder.Services.AddControllers();

// Register BioPlatform Services
builder.Services.AddDbContext<BioDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddDbContext<ScientificDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("ScientificConnection"),
        o => o.UseNetTopologySuite()));

builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<IUserRoleRepository, UserRoleRepository>();

// Register Species Background Job
builder.Services.AddScoped<ISpeciesBulkImportJob, SpeciesImportJob>();
builder.Services.AddScoped<Bio.Application.Common.Interfaces.IJobEnqueuer, JobEnqueuer>();

// Configure Hangfire with Redis
builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseRedisStorage(builder.Configuration.GetConnectionString("RedisConnection")));

builder.Services.AddHangfireServer();

// MediatR registration is enough as it scans everything in Bio.Application assembly.

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

// Expose Hangfire Dashboard
app.UseHangfireDashboard("/hangfire");

app.MapControllers();

app.Run();
