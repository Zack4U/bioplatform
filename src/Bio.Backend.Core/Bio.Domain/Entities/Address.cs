namespace Bio.Domain.Entities;

/// <summary>
/// Physical address for shipping and billing purposes.
/// Table: Addresses (SQL Server).
/// </summary>
public class Address
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string AddressType { get; private set; } = string.Empty;
    public string RecipientName { get; private set; } = string.Empty;
    public string StreetLine1 { get; private set; } = string.Empty;
    public string? StreetLine2 { get; private set; }
    public string City { get; private set; } = string.Empty;
    public string Department { get; private set; } = string.Empty;
    public string PostalCode { get; private set; } = string.Empty;
    public string Country { get; private set; } = "CO";
    public string? PhoneNumber { get; private set; }
    public bool IsDefault { get; private set; } = false;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    public User User { get; private set; } = null!;

    private Address() { }

    public Address(
        Guid userId,
        string addressType,
        string recipientName,
        string streetLine1,
        string city,
        string department,
        string postalCode,
        string? streetLine2 = null,
        string country = "CO",
        string? phoneNumber = null,
        bool isDefault = false)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        AddressType = addressType;
        RecipientName = recipientName;
        StreetLine1 = streetLine1;
        StreetLine2 = streetLine2;
        City = city;
        Department = department;
        PostalCode = postalCode;
        Country = country;
        PhoneNumber = phoneNumber;
        IsDefault = isDefault;
    }

    public void Update(
        string? recipientName,
        string? streetLine1,
        string? streetLine2,
        string? city,
        string? department,
        string? postalCode,
        string? country,
        string? phoneNumber,
        bool? isDefault)
    {
        if (recipientName != null) RecipientName = recipientName;
        if (streetLine1 != null) StreetLine1 = streetLine1;
        if (streetLine2 != null) StreetLine2 = streetLine2;
        if (city != null) City = city;
        if (department != null) Department = department;
        if (postalCode != null) PostalCode = postalCode;
        if (country != null) Country = country;
        if (phoneNumber != null) PhoneNumber = phoneNumber;
        if (isDefault.HasValue) IsDefault = isDefault.Value;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Sets or clears the default flag for this address.
    /// Use this instead of calling Update with 8 nulls just to toggle IsDefault.
    /// </summary>
    public void SetDefault(bool value)
    {
        IsDefault = value;
        UpdatedAt = DateTime.UtcNow;
    }
}
