export interface Store {
    id: number;
    name: string;
    legal_name?: string;
    cnpj: string;
    phone?: string;
    postal_code?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    bio?: string;
    logo_url?: string;
    cover_url?: string;
    is_active: boolean;
    vacation_mode: boolean;
    shipping_local_pac?: number | null;
    shipping_local_sedex?: number | null;
    shipping_pac_price?: number | null;
    shipping_sedex_price?: number | null;
    shipping_handling_days?: number;
    free_shipping_threshold?: number | null;
    has_complete_address?: boolean;
    has_shipping_configured?: boolean;
    is_ready_to_sell?: boolean;
    owner_id: number;
    is_official?: boolean;
    views_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface StoreUpdatePayload {
    name?: string;
    legal_name?: string;
    cnpj?: string;
    phone?: string;
    postal_code?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    bio?: string;
    logo_url?: string;
    cover_url?: string;
    is_active?: boolean;
    vacation_mode?: boolean;
    shipping_local_pac?: number | null;
    shipping_local_sedex?: number | null;
    shipping_pac_price?: number | null;
    shipping_sedex_price?: number | null;
    shipping_handling_days?: number;
    free_shipping_threshold?: number | null;
}

export interface DashboardData {
    rating: number;
    reviews_count?: number;
    is_verified: boolean;
    period: "7d" | "30d";
    kpis: {
        gross_revenue: number;
        net_revenue: number;
        commission: number;
        refunds: number;
        average_ticket: number;
        pending_orders: number;
        stock_alerts: number;
        stock_value: number;
        store_views: number;
        cancellation_rate: number;
        return_rate: number;
    };
    chart: { labels: string[]; values: number[] };
    recent_orders: {
        id: string;
        date: string;
        client: string;
        frag: string;
        vol: string;
        val: string;
        status: string;
    }[];
    restock_alerts: {
        id: number;
        name: string;
        qty: number;
    }[];
}
