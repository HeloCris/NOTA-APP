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
    max_installments?: number;
    free_interest_installments?: number;
    min_installment_amount?: number;
    followers_count?: number;
    owner_id: number;
    is_official?: boolean;
    views_count?: number;
    is_ready_to_sell?: boolean;
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
    max_installments?: number;
    free_interest_installments?: number;
    min_installment_amount?: number;
}

export interface StoreCoupon {
    id: number;
    code: string;
    discount_type: "PERCENTAGE" | "FIXED_VALUE";
    discount_value: number;
    min_purchase_amount: number;
    usage_limit?: number | null;
    max_uses_per_user?: number;
    used_count: number;
    valid_from?: string | null;
    valid_until?: string | null;
    is_active: boolean;
    created_at: string;
}

export interface StoreCouponCreatePayload {
    code: string;
    discount_type: "PERCENTAGE" | "FIXED_VALUE";
    discount_value: number;
    min_purchase_amount?: number;
    usage_limit?: number | null;
    max_uses_per_user?: number;
    valid_from?: string | null;
    valid_until?: string | null;
    is_active?: boolean;
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
