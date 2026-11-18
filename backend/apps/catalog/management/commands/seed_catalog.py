from decimal import Decimal

from django.core.management.base import BaseCommand

from apps.catalog.models import Brand, Product
from apps.inventory.models import StoreProduct
from apps.orders.models import Order, OrderItem, OrderStatus
from apps.reviews.models import Review
from apps.stores.models import Store, StoreCoupon, StoreFollower
from apps.users.models import CustomUser


CATALOG = [
    ("Dior", "Sauvage", "Amadeirado", ["Bergamota da Calábria", "Pimenta"], ["Lavanda", "Pimenta Rosa", "Vetiver"], ["Ambroxan", "Cedro", "Labdano"], "Selvagem e nobre ao mesmo tempo, Sauvage é um Fougère amadeirado de presença marcante.", "dior-sauvage.png"),
    ("Chanel", "Chanel N°5", "Floral", ["Aldeídos", "Bergamota", "Limão"], ["Rosa de Grasse", "Jasmim", "Ylang-Ylang", "Lírio do Vale"], ["Sândalo", "Almíscar", "Âmbar", "Civeta"], "O perfume mais icônico da história, um floral aldéico intemporal e sofisticado.", "chanel-n5.png"),
    ("Carolina Herrera", "Good Girl", "Oriental", ["Amêndoa", "Café"], ["Tuberosa", "Jasmim Sambac", "Rosa"], ["Baunilha", "Fava Tonka", "Cacau", "Patchouli"], "Dualidade entre o bem e o mal: floral gourmand com fundo quente e envolvente.", "ch-good-girl.png"),
    ("Yves Saint Laurent", "Black Opium", "Gourmand", ["Pera", "Laranja", "Bergamota"], ["Café", "Flor de Laranjeira", "Jasmim"], ["Baunilha", "Patchouli", "Cedro", "Almíscar"], "Um gourmand floral intenso, centrado no café e baunilha. Ousado e viciante.", "ysl-black-opium.png"),
    ("Giorgio Armani", "Acqua di Giò", "Aquático", ["Bergamota", "Limão", "Lima", "Neroli"], ["Mar", "Jasmim", "Calone", "Fresia"], ["Cedro", "Patchouli", "Almíscar Branco"], "O clássico aquático masculino que captura a essência do Mediterrâneo.", "armani-acqua-di-gio.png"),
    ("Versace", "Eros", "Oriental", ["Hortelã", "Maçã Verde", "Limão"], ["Fava Tonka", "Flor de Gerânio", "Ambrosia"], ["Baunilha", "Vetiver", "Oakmoss", "Cedro do Atlas"], "Inspirado no deus grego do amor, Eros é intenso, vibrante e irresistível.", "versace-eros.png"),
    ("Tom Ford", "Black Orchid", "Oriental", ["Trufa", "Frutas Negras", "Ylang-Ylang"], ["Orquídea Negra", "Flor de Lótus", "Especiarias Negras"], ["Patchouli", "Baunilha", "Sândalo", "Incenso"], "Um oriental floral luxuoso e misterioso, com a orquídea negra como estrela.", "tomford-black-orchid.png"),
    ("Lancôme", "La Vie Est Belle", "Gourmand", ["Groselha Preta", "Pera"], ["Íris", "Jasmim", "Flor de Laranjeira"], ["Pralinê", "Baunilha", "Patchouli", "Fava Tonka"], "A vida é bela: um gourmand floral que celebra a alegria e a feminilidade.", "lancome-la-vie-est-belle.png"),
    ("Dior", "Miss Dior", "Floral", ["Sangria", "Pera", "Bergamota"], ["Rosa Damascena", "Peônia", "Rosa de Grasse"], ["Almíscar Branco", "Patchouli", "Fava Tonka"], "Um buquê de rosas contemporâneo: romântico, leve e inesquecível.", "dior-miss-dior.png"),
    ("Yves Saint Laurent", "Libre", "Floral", ["Bergamota da Calábria", "Groselha Preta"], ["Lavanda de Provence", "Flor de Laranjeira Marroquina"], ["Almíscar Branco", "Cedro da Virgínia", "Baunilha Bourbon"], "A liberdade tem o perfume de Libre: a lavanda encontra a flor de laranjeira numa fusão ousada.", "ysl-libre.png"),
]


DEMO_SELLERS = [
    {
        "email": "demo.atelier@nota.com",
        "first_name": "Atelier",
        "last_name": "des Décants",
        "store_name": "Atelier des Décants",
        "cnpj": "11111111000191",
        "bio": "Decants curados e frascos selecionados para descobrir sua próxima fragrância favorita.",
        "views_count": 420,
        "is_official": False,
        "city": "São Paulo",
        "state": "SP",
    },
    {
        "email": "demo.maison@nota.com",
        "first_name": "Maison",
        "last_name": "NŌTA",
        "store_name": "Maison NŌTA Parfums",
        "cnpj": "22222222000192",
        "bio": "A vitrine oficial NŌTA com os clássicos da perfumaria e novidades aprovadas pela curadoria.",
        "views_count": 310,
        "is_official": True,
        "city": "Rio de Janeiro",
        "state": "RJ",
    },
]


DEMO_OFFERS = [
    ("Atelier des Décants", "Sauvage", 5, "45.90", 24),
    ("Atelier des Décants", "Sauvage", 10, "79.90", 18),
    ("Atelier des Décants", "Sauvage", 50, "389.90", 6),
    ("Atelier des Décants", "Sauvage", 100, "649.90", 3),
    ("Atelier des Décants", "Acqua di Giò", 5, "39.90", 20),
    ("Atelier des Décants", "Acqua di Giò", 10, "69.90", 16),
    ("Atelier des Décants", "Acqua di Giò", 50, "329.90", 7),
    ("Atelier des Décants", "Acqua di Giò", 100, "559.90", 4),
    ("Maison NŌTA Parfums", "Chanel N°5", 5, "49.90", 22),
    ("Maison NŌTA Parfums", "Chanel N°5", 10, "89.90", 15),
    ("Maison NŌTA Parfums", "Chanel N°5", 50, "699.90", 5),
    ("Maison NŌTA Parfums", "Chanel N°5", 100, "1090.00", 2),
    ("Maison NŌTA Parfums", "Black Opium", 5, "54.90", 19),
    ("Maison NŌTA Parfums", "Black Opium", 10, "94.90", 14),
    ("Maison NŌTA Parfums", "Black Opium", 50, "729.90", 4),
]


DEMO_CUSTOMERS = [
    ("demo.ana@nota.com", "Ana", "Souza", ["Gourmand"], ["Baunilha", "Café"]),
    ("demo.bruno@nota.com", "Bruno", "Lima", ["Gourmand", "Oriental"], ["Baunilha", "Fava Tonka"]),
    ("demo.carla@nota.com", "Carla", "Melo", ["Floral"], ["Jasmim", "Rosa"]),
    ("demo.diego@nota.com", "Diego", "Rocha", ["Amadeirado"], ["Sândalo", "Vetiver"]),
    ("demo.elisa@nota.com", "Elisa", "Prado", ["Gourmand", "Floral"], ["Pralinê", "Íris"]),
    ("demo.felipe@nota.com", "Felipe", "Nunes", ["Aquático"], ["Mar", "Bergamota"]),
    ("demo.gabi@nota.com", "Gabi", "Dias", ["Oriental"], ["Âmbar", "Patchouli"]),
    ("demo.hugo@nota.com", "Hugo", "Reis", ["Gourmand"], ["Baunilha", "Cacau"]),
]


class Command(BaseCommand):
    help = "Popula o catálogo global e dados de demonstração sem criar duplicidades."

    def handle(self, *args, **options):
        self.seed_catalog()
        self.seed_demo_data()
        self.stdout.write(self.style.SUCCESS("Catálogo e dados de demonstração carregados com sucesso."))

    def seed_catalog(self):
        for brand_name, name, family, top, heart, base, description, image_name in CATALOG:
            brand, _ = Brand.objects.get_or_create(name=brand_name)
            Product.objects.update_or_create(
                brand=brand,
                name=name,
                defaults={
                    "olfactory_family": family,
                    "top_notes": top,
                    "heart_notes": heart,
                    "base_notes": base,
                    "description": description,
                    "image_url": f"https://cdn.nota.com/products/{image_name}",
                    "is_approved": True,
                },
            )

    def seed_demo_data(self):
        stores = {}
        for config in DEMO_SELLERS:
            user = CustomUser.objects.filter(email=config["email"]).first()
            if user is None:
                user = CustomUser.objects.create_user(
                    email=config["email"],
                    password="senha123",
                    role=CustomUser.Roles.SELLER,
                    first_name=config["first_name"],
                    last_name=config["last_name"],
                )

            store, _ = Store.objects.update_or_create(
                cnpj=config["cnpj"],
                defaults={
                    "owner": user,
                    "name": config["store_name"],
                    "bio": config["bio"],
                    "views_count": config["views_count"],
                    "is_active": True,
                    "is_official": config["is_official"],
                    "phone": "1133334444",
                    "postal_code": "01310100",
                    "street": "Avenida Paulista",
                    "number": "1000",
                    "neighborhood": "Bela Vista",
                    "city": config["city"],
                    "state": config["state"],
                    "shipping_local_pac": Decimal("18.90"),
                    "shipping_local_sedex": Decimal("29.90"),
                    "shipping_pac_price": Decimal("24.90"),
                    "shipping_sedex_price": Decimal("39.90"),
                },
            )
            stores[config["store_name"]] = store

        products = {product.name: product for product in Product.objects.all()}
        offers = {}
        for store_name, product_name, volume_ml, price, stock in DEMO_OFFERS:
            offer, _ = StoreProduct.objects.update_or_create(
                store=stores[store_name],
                product=products[product_name],
                volume_ml=volume_ml,
                defaults={
                    "price": Decimal(price),
                    "stock_quantity": stock,
                    "is_available": True,
                },
            )
            offers[(store_name, product_name, volume_ml)] = offer

        customers = []
        for email, first_name, last_name, families, notes in DEMO_CUSTOMERS:
            user = CustomUser.objects.filter(email=email).first()
            if user is None:
                user = CustomUser.objects.create_user(
                    email=email,
                    password="senha123",
                    role=CustomUser.Roles.CUSTOMER,
                    first_name=first_name,
                    last_name=last_name,
                )
            user.olfactory_families = families
            user.preferred_notes = notes
            user.save(update_fields=["olfactory_families", "preferred_notes"])
            customers.append(user)

        atelier = stores["Atelier des Décants"]
        maison = stores["Maison NŌTA Parfums"]
        for customer in customers[:6]:
            StoreFollower.objects.get_or_create(store=atelier, user=customer)
        for customer in customers[:4]:
            StoreFollower.objects.get_or_create(store=maison, user=customer)
        Store.objects.filter(pk=atelier.pk).update(followers_count=6)
        Store.objects.filter(pk=maison.pk).update(followers_count=4)

        coupon, _ = StoreCoupon.objects.update_or_create(
            store=atelier,
            code="BEMVINDO10",
            defaults={
                "discount_type": StoreCoupon.DISCOUNT_TYPE_FIXED,
                "discount_value": Decimal("10.00"),
                "is_active": True,
            },
        )

        demo_purchases = [
            (atelier, customers[0], "Sauvage", 10, 2, Decimal("79.90"), coupon),
            (atelier, customers[1], "Acqua di Giò", 100, 1, Decimal("559.90"), None),
            (atelier, customers[4], "Acqua di Giò", 10, 3, Decimal("69.90"), None),
            (maison, customers[2], "Black Opium", 50, 1, Decimal("729.90"), None),
            (maison, customers[7], "Chanel N°5", 10, 2, Decimal("89.90"), None),
        ]
        for index, (store, customer, product_name, volume_ml, quantity, unit_price, coupon_used) in enumerate(
            demo_purchases
        ):
            order = Order.objects.filter(
                user=customer,
                store=store,
                total_amount=unit_price * quantity,
            ).first()
            if order is None:
                order = Order.objects.create(
                    user=customer,
                    store=store,
                    status=OrderStatus.DELIVERED,
                    coupon=coupon_used,
                    discount_amount=Decimal("10.00") if coupon_used else Decimal("0.00"),
                    total_amount=unit_price * quantity,
                    shipping_cost=Decimal("0.00"),
                    shipping_address={
                        "street": "Avenida Paulista",
                        "number": "1000",
                        "city": store.city,
                        "state": store.state,
                    },
                )

            offer = offers[(store.name, product_name, volume_ml)]
            order_item, _ = OrderItem.objects.get_or_create(
                order=order,
                store_product=offer,
                defaults={"quantity": quantity, "unit_price": unit_price},
            )
            Review.objects.get_or_create(
                order_item=order_item,
                defaults={
                    "user": customer,
                    "store": store,
                    "product": products[product_name],
                    "store_product": offer,
                    "rating": 5 - (index % 2),
                    "comment": "Excelente fragrância, entrega rápida e embalagem impecável!",
                },
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Demo RF-24: {len(stores)} lojas, {len(DEMO_OFFERS)} ofertas, "
                f"{len(customers)} clientes com perfil olfativo."
            )
        )
