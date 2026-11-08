import unicodedata
from typing import Dict, List, Optional, Set, Tuple, Any


def normalize_text(text: str) -> str:
    """Normaliza texto removendo acentos, espaços extras e convertendo para minúsculas."""
    if not text:
        return ""
    nfkd = unicodedata.normalize("NFKD", text)
    without_accents = "".join([c for c in nfkd if not unicodedata.combining(c)])
    return without_accents.strip().lower()


def is_note_match(user_note: str, product_note: str) -> bool:
    """Verifica correspondência parcial entre nota do usuário e nota do produto (case-insensitive e sem acentos)."""
    u_norm = normalize_text(user_note)
    p_norm = normalize_text(product_note)
    if not u_norm or not p_norm:
        return False
    return u_norm in p_norm or p_norm in u_norm


def calculate_olfactory_match(
    user: Any,
    product: Any,
    followed_store_ids: Optional[Set[int]] = None
) -> Dict[str, Any]:
    """
    Calcula a afinidade olfativa (0 a 100%) entre um usuário e um perfume.
    RN-02 e RN-03 da RF-20.
    """
    default_response = {
        "match_percentage": None,
        "matched_notes": [],
        "matched_family": False,
    }

    if not user or not getattr(user, "is_authenticated", False):
        return default_response

    user_families: List[str] = getattr(user, "olfactory_families", []) or []
    user_notes: List[str] = getattr(user, "preferred_notes", []) or []

    if not user_families and not user_notes:
        return default_response

    # 1. Compatibilidade de Família Olfativa (Até 45 pontos)
    matched_family = False
    product_family = getattr(product, "olfactory_family", "") or ""

    if user_families and product_family:
        norm_product_family = normalize_text(product_family)
        norm_user_families = {normalize_text(f) for f in user_families}
        if norm_product_family in norm_user_families:
            matched_family = True

    # 2. Compatibilidade de Notas da Pirâmide (Até 45 pontos - 15 pontos por nota em comum, máx 3)
    top_notes: List[str] = getattr(product, "top_notes", []) or []
    heart_notes: List[str] = getattr(product, "heart_notes", []) or []
    base_notes: List[str] = getattr(product, "base_notes", []) or []

    all_product_notes = top_notes + heart_notes + base_notes
    matched_product_notes: List[str] = []

    for u_note in user_notes:
        for p_note in all_product_notes:
            if is_note_match(u_note, p_note):
                if p_note not in matched_product_notes:
                    matched_product_notes.append(p_note)

    notes_match_count = len(matched_product_notes)

    # Cálculo dos Pontos Brutos
    has_family_pref = len(user_families) > 0
    has_notes_pref = len(user_notes) > 0

    if has_family_pref and has_notes_pref:
        family_score = 45 if matched_family else 0
        notes_score = min(notes_match_count * 15, 45)
    elif has_family_pref and not has_notes_pref:
        # Reescalonamento para quem escolheu apenas famílias
        family_score = 90 if matched_family else 0
        notes_score = 0
    else:
        # Reescalonamento para quem escolheu apenas notas
        family_score = 0
        notes_score = min(notes_match_count * 30, 90)

    # 3. Bônus de Fidelização / Lojas Seguidas (Até 10 pontos)
    bonus_score = 0
    if followed_store_ids and hasattr(product, "store_products"):
        product_store_ids = set(
            product.store_products.filter(
                is_available=True, stock_quantity__gt=0, store__is_active=True
            ).values_list("store_id", flat=True)
        )
        if product_store_ids.intersection(followed_store_ids):
            bonus_score = 10

    total_score = family_score + notes_score + bonus_score
    final_percentage = min(max(total_score, 0), 100)

    return {
        "match_percentage": final_percentage,
        "matched_notes": matched_product_notes,
        "matched_family": matched_family,
    }