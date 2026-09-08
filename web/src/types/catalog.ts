export interface Brand {
  id: number;
  name: string;
  cnpj?: string;
  inpi_registration?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  is_official?: boolean;
  d2c_store?: number | null;
}

export interface Product {
  id: number;
  ean: string;
  anvisa_code: string;
  name: string;
  brand: Brand;
  olfactory_family: string;
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  description: string;
  image_url: string;
  is_approved?: boolean;
}

export interface PaginatedProducts {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}