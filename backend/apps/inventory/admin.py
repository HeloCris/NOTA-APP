from django.contrib import admin

from .models import StoreProduct


@admin.register(StoreProduct)
class StoreProductAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "store",
        "product",
        "volume_ml",
        "price",
        "promotional_price",
        "stock_quantity",
        "is_available",
    ]
    list_filter = ["is_available", "store"]
    search_fields = ["product__name", "store__name"]