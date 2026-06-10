namespace Bio.Application.Common.Models;

/// <summary>
/// Configuration settings for AWS services.
/// Bound from the "AwsSettings" section in appsettings.json.
/// Credentials (AccessKeyId, SecretAccessKey) are read from environment variables
/// by the AWS SDK automatically — never hardcoded here.
/// </summary>
public class AwsSettings
{
    /// <summary>Configuration section key in appsettings.json.</summary>
    public const string SectionName = "AwsSettings";

    /// <summary>Name of the S3 bucket where species images are stored.</summary>
    public string BucketName { get; init; } = string.Empty;

    /// <summary>AWS region where the bucket is hosted (e.g. "us-east-1").</summary>
    public string Region { get; init; } = string.Empty;

    /// <summary>Optional explicitly provided access key (e.g. for development). Usually injected via environment.</summary>
    public string? AccessKeyId { get; init; }

    /// <summary>Optional explicitly provided secret key (e.g. for development). Usually injected via environment.</summary>
    public string? SecretAccessKey { get; init; }
}
