using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Bio.Application.Common.Models;
using Bio.Domain.Interfaces;
using Microsoft.Extensions.Options;

namespace Bio.Backend.Core.Bio.Infrastructure.Services;

/// <summary>
/// AWS S3 implementation of <see cref="IS3StorageService"/>.
/// Reads bucket name and region from <see cref="AwsSettings"/>.
/// AWS credentials (Access Key, Secret Key) are resolved by the AWS SDK
/// from environment variables (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) —
/// they are never hardcoded or stored in application config.
/// </summary>
public class S3StorageService : IS3StorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly AwsSettings _settings;

    public S3StorageService(IOptions<AwsSettings> awsOptions)
    {
        _settings = awsOptions.Value;

        // Region is explicitly set from config to avoid SDK default-region ambiguity.
        var region = RegionEndpoint.GetBySystemName(_settings.Region);

        // If credentials are explicitly provided in config (e.g. appsettings.Development.json)
        // use them directly. Otherwise, rely on the AWS SDK default chain (env vars, metadata, etc).
        if (!string.IsNullOrEmpty(_settings.AccessKeyId) && !string.IsNullOrEmpty(_settings.SecretAccessKey))
        {
            var credentials = new Amazon.Runtime.BasicAWSCredentials(_settings.AccessKeyId, _settings.SecretAccessKey);
            _s3Client = new AmazonS3Client(credentials, region);
        }
        else
        {
            _s3Client = new AmazonS3Client(region);
        }
    }

    /// <inheritdoc />
    public async Task<string> UploadImageAsync(
        Stream stream,
        string objectKey,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var putRequest = new PutObjectRequest
        {
            BucketName = _settings.BucketName,
            Key = objectKey,
            InputStream = stream,
            ContentType = contentType,
            AutoCloseStream = false,
        };

        await _s3Client.PutObjectAsync(putRequest, cancellationToken);

        // Build the canonical public URL for the uploaded object
        return BuildPublicUrl(objectKey);
    }

    /// <inheritdoc />
    public async Task DeleteObjectAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        var deleteRequest = new DeleteObjectRequest
        {
            BucketName = _settings.BucketName,
            Key = objectKey,
        };

        await _s3Client.DeleteObjectAsync(deleteRequest, cancellationToken);
    }

    /// <inheritdoc />
    public string ExtractObjectKey(string publicUrl)
    {
        var prefix = $"https://{_settings.BucketName}.s3.amazonaws.com/";
        return publicUrl.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
            ? publicUrl[prefix.Length..]
            : publicUrl;
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    /// <summary>
    /// Builds the public HTTPS URL for a given S3 object key.
    /// Format: https://{bucket}.s3.amazonaws.com/{key}
    /// </summary>
    private string BuildPublicUrl(string objectKey) =>
        $"https://{_settings.BucketName}.s3.amazonaws.com/{objectKey}";
}
