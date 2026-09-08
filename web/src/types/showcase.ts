export interface ShowcaseProduct {
  id: number;
  name: string;
  brand: string;
  family: string;
  image_url: string;
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  volume_ml: number;
  price: string;
  promotional_price: string | null;
  effective_price: string;
  store_name: string;
  store_slug: string;
}

export interface ShowcaseStore {
  id: number;
  slug: string;
  name: string;
  logo_url: string;
  cover_url: string;
  bio: string;
  is_official: boolean;
  products: ShowcaseProduct[];
}

export interface PaginatedShowcaseProducts {
  count: number;
  next: string | null;
  previous: string | null;
  results: ShowcaseProduct[];
}
