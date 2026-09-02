export interface Brand {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  brand: Brand;
  olfactory_family: string;
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  description: string;
  image_url: string;
}

export interface PaginatedProducts {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}