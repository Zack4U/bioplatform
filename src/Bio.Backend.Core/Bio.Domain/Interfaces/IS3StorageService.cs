namespace Bio.Domain.Interfaces;

/// <summary>
/// Abstraction for cloud object storage (AWS S3).
/// Allows the Application layer to upload files without depending
/// on any AWS SDK types — Infrastructure implements this interface.
/// </summary>
public interface IS3StorageService
{
    /// <summary>
    /// Uploads a binary stream to the configured S3 bucket and makes it
    /// publicly accessible.
    /// </summary>
    /// <param name="stream">The image data stream to upload.</param>
    /// <param name="objectKey">
    /// The full S3 key (path inside the bucket), e.g.
    /// <c>assets/images/species/heliconia-psittacorum/mobile_20260419174010123.jpg</c>.
    /// </param>
    /// <param name="contentType">MIME type of the file, e.g. <c>image/jpeg</c>.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The full public HTTPS URL of the uploaded object.</returns>
    Task<string> UploadImageAsync(
        Stream stream,
        string objectKey,
        string contentType,
        CancellationToken cancellationToken = default);
}
