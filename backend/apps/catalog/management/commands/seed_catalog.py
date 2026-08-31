from django.core.management.base import BaseCommand

from apps.catalog.models import Brand, Product


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


class Command(BaseCommand):
    help = "Popula o catálogo global inicial sem criar duplicidades."

    def handle(self, *args, **options):
        for brand_name, name, family, top, heart, base, description, image_name in CATALOG:
            brand, _ = Brand.objects.get_or_create(name=brand_name)
            Product.objects.update_or_create(
                brand=brand,
                name=name,
                defaults={"olfactory_family": family, "top_notes": top, "heart_notes": heart, "base_notes": base, "description": description, "image_url": f"https://cdn.nota.com/products/{image_name}", "is_approved": True},
            )
        self.stdout.write(self.style.SUCCESS("Catálogo inicial carregado com sucesso."))