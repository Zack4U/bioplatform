using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Cart.Queries;

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATE CART PRICES — Checks current DB prices for a list of cart items.
// Called when the user opens the cart or enters the checkout flow.
// Does NOT mutate state; returns price diffs so the frontend can alert the user.
// ═══════════════════════════════════════════════════════════════════════════════
public record ValidateCartPricesQuery(CartValidatePricesRequestDTO Dto) : IRequest<CartValidatePricesResponseDTO>;

public class ValidateCartPricesQueryHandler : IRequestHandler<ValidateCartPricesQuery, CartValidatePricesResponseDTO>
{
    private readonly IProductRepository _productRepo;

    public ValidateCartPricesQueryHandler(IProductRepository productRepo)
        => _productRepo = productRepo;

    public async Task<CartValidatePricesResponseDTO> Handle(ValidateCartPricesQuery request, CancellationToken ct)
    {
        var results = new List<CartPriceValidationItemDTO>();
        bool anyPriceChanged = false;
        bool anyUnavailable = false;

        foreach (var item in request.Dto.Items)
        {
            var product = await _productRepo.GetByIdAsync(item.ProductId, ct);

            if (product is null || !product.IsActive)
            {
                results.Add(new CartPriceValidationItemDTO(
                    ProductId: item.ProductId,
                    ProductName: product?.Name ?? "Producto no disponible",
                    CurrentPrice: 0,
                    IsActive: false,
                    AvailableStock: 0,
                    PriceChanged: false,
                    OldPrice: null));
                anyUnavailable = true;
                continue;
            }

            // The client sends no "old price" — we only return the current price.
            // The frontend compares against its Zustand-stored price to detect changes.
            results.Add(new CartPriceValidationItemDTO(
                ProductId: product.Id,
                ProductName: product.Name,
                CurrentPrice: product.SellPrice,
                IsActive: product.IsActive,
                AvailableStock: product.StockQuantity,
                PriceChanged: false,   // Frontend detects by comparing vs stored price
                OldPrice: null));

            if (product.StockQuantity == 0) anyUnavailable = true;
        }

        return new CartValidatePricesResponseDTO(results, anyPriceChanged, anyUnavailable);
    }
}
