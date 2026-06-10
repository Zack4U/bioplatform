using System.Net.Http.Json;
using System.Text.Json;
using Bio.Application.Features.Assistant.DTOs;
using Bio.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;

namespace Bio.Infrastructure.Services;

public class AiAssistantService : IAiAssistantService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AiAssistantService> _logger;

    public AiAssistantService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<AiAssistantService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> AskQuestionAsync(string question, List<ChatMessageDto> history, CancellationToken cancellationToken)
    {
        try
        {
            // El AiService.BaseUrl debe estar configurado en appsettings.json (ej: http://localhost:8000)
            var baseUrl = _configuration["AiService:BaseUrl"] ?? "http://localhost:8000";
            var url = $"{baseUrl.TrimEnd('/')}/api/v1/assistant/ask";

            var requestBody = new
            {
                question = question,
                history = history
            };

            var response = await _httpClient.PostAsJsonAsync(url, requestBody, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Error from Python AI Service: {Error}", error);
                return "Ocurrió un error al intentar comunicarme con el motor de Inteligencia Artificial.";
            }

            var resultStr = await response.Content.ReadAsStringAsync(cancellationToken);
            var resultJson = JsonSerializer.Deserialize<PythonAiResponse>(resultStr, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            return resultJson?.Answer ?? "No recibí respuesta del motor de Inteligencia Artificial.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error forwarding AI Assistant query to Python AI Service.");
            return "Ocurrió un error inesperado al procesar tu consulta.";
        }
    }

    private class PythonAiResponse
    {
        public string? Answer { get; set; }
    }
}
