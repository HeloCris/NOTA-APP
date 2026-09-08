from django.contrib import admin
from apps.users.models import CustomUser
from .models import Brand, Product

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name", "cnpj", "status", "is_official", "owner")
    list_filter = ("status", "is_official")
    search_fields = ("name", "cnpj")
    actions = ["approve_brands", "reject_brands"]

    def save_model(self, request, obj, form, change):

        if obj.status == Brand.BrandStatus.APPROVED and obj.owner:
            obj.owner.is_active = True
            obj.owner.role = CustomUser.Roles.BRAND_OWNER
            obj.owner.save()
            obj.is_official = True

        super().save_model(request, obj, form, change)

    @admin.action(description="Aprovar marcas selecionadas")
    def approve_brands(self, request, queryset):
        for brand in queryset:
            brand.status = Brand.BrandStatus.APPROVED
            brand.is_official = True
            if brand.owner:
                brand.owner.is_active = True
                brand.owner.role = CustomUser.Roles.BRAND_OWNER
                brand.owner.save()
            brand.save()

    @admin.action(description="Rejeitar marcas selecionadas")
    def reject_brands(self, request, queryset):
        queryset.update(status=Brand.BrandStatus.REJECTED)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "brand", "is_approved")
    list_filter = ("is_approved", "olfactory_family")
    search_fields = ("name", "brand__name")
