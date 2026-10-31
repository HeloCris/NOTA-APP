import pytest
from rest_framework.test import APIClient

from apps.stores.models import Store
from apps.users.models import CustomUser


@pytest.mark.django_db
def test_public_store_view_increments_atomically():
    store = Store.objects.create(
        owner=CustomUser.objects.create_user(
            email="rf17-view-owner@example.com",
            password="secret",
            first_name="View",
            last_name="Owner",
            role=CustomUser.Roles.SELLER,
        ),
        name="RF17 Views",
        cnpj="12345678000199",
    )

    response = APIClient().post(f"/api/v1/stores/{store.id}/view/")

    assert response.status_code == 200
    assert response.json()["views_count"] == 1
    store.refresh_from_db()
    assert store.views_count == 1
