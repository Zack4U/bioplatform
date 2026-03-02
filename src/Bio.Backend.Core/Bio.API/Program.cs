using Bio.Infrastructure;
using Stripe;
using Bio.Application.Orders.Commands.CreateOrder;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuración de Stripe
StripeConfiguration.ApiKey = builder.Configuration.GetSection("Stripe:SecretKey").Value;

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 2. Registro de MediatR (Apunta a la capa de Application)
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(CreateOrderCommand).Assembly);
});

// 3. Registro de Capas (Inyecta Infrastructure y DB)
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();
app.Run();
