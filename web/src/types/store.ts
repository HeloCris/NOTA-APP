export interface Store {
    id: number;
    name: string;
    legal_name?: string;
    cnpj: string;
    phone?: string;
    bio?: string;
    logo_url?: string;
    cover_url?: string;
    is_active: boolean;
    vacation_mode: boolean;
    owner_id: number;
    created_at?: string;
    updated_at?: string;
}

export interface StoreUpdatePayload {
    name?: string;
    legal_name?: string;
    cnpj?: string;
    phone?: string;
    bio?: string;
    logo_url?: string;
    cover_url?: string;
    is_active?: boolean;
    vacation_mode?: boolean;
}

export interface DashboardData {
    rating: number;
    is_verified: boolean;
    kpis: {
        revenue_month: number;
        pending_orders: number;
        stock_alerts: number;
        store_views: number;
    };
    weekly_sales: number[];
    recent_orders: {
        id: string;
        date: string;
        client: string;
        frag: string;
        vol: string;
        val: string;
        st: string;
        stClass: string;
    }[];
    top_perfumes: {
        icon: string;
        name: string;
        brand: string;
        pct: string;
        val: string;
    }[];
    restock_alerts: {
        icon: string;
        name: string;
        qty: string;
    }[];
}
