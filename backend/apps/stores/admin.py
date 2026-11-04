from django.contrib import admin
from .models import Store, StoreCoupon, StoreFollower


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ("name", "cnpj", "owner", "is_active", "followers_count", "max_installments", "created_at")
    search_fields = ("name", "cnpj", "owner__email")
    list_filter = ("is_active", "is_official", "vacation_mode")


@admin.register(StoreCoupon)
class StoreCouponAdmin(admin.ModelAdmin):
    list_display = ("code", "store", "discount_type", "discount_value", "used_count", "usage_limit", "valid_until", "is_active")
    search_fields = ("code", "store__name")
    list_filter = ("discount_type", "is_active")


@admin.register(StoreFollower)
class StoreFollowerAdmin(admin.ModelAdmin):
    list_display = ("user", "store", "created_at")
    search_fields = ("user__email", "store__name")
    list_filter = ("created_at",)
