import pytest
from django.core.management import call_command

from apps.catalog.models import Product
from apps.inventory.models import StoreProduct
from apps.reviews.models import Review
from apps.stores.models import Store
from apps.users.models import CustomUser


@pytest.mark.django_db
def test_seed_catalog_creates_rich_demo_data_idempotently():
    call_command("seed_catalog", verbosity=0)

    counts = {
        "products": Product.objects.count(),
        "stores": Store.objects.count(),
        "offers": StoreProduct.objects.count(),
        "customers": CustomUser.objects.filter(role=CustomUser.Roles.CUSTOMER).count(),
        "reviews": Review.objects.count(),
    }

    assert counts["products"] == 10
    assert counts["stores"] == 2
    assert counts["offers"] == 15
    assert counts["customers"] == 8
    assert counts["reviews"] == 5
    assert Store.objects.filter(name="Atelier des Décants", is_active=True).exists()
    assert Store.objects.filter(name="Maison NŌTA Parfums", is_active=True).exists()
    assert any(
        "Gourmand" in user.olfactory_families
        for user in CustomUser.objects.filter(role=CustomUser.Roles.CUSTOMER)
    )
    assert StoreProduct.objects.filter(volume_ml=5).count() >= 2
    assert StoreProduct.objects.filter(volume_ml=100).count() >= 2

    call_command("seed_catalog", verbosity=0)

    assert {
        "products": Product.objects.count(),
        "stores": Store.objects.count(),
        "offers": StoreProduct.objects.count(),
        "customers": CustomUser.objects.filter(role=CustomUser.Roles.CUSTOMER).count(),
        "reviews": Review.objects.count(),
    } == counts
