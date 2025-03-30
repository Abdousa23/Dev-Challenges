// lib/types.ts
export interface Product {
    id: string
    name: string
    price: number
    category: string
    brand: string
    release_date: string
    tags: string[]
}

export interface User {
    id: string
    name: string
    email: string
    active: boolean
    address: {
        country: string
    }
    registered_at: string
}


export interface FilterParams {
    minPrice?: number;
    maxPrice?: number;
    categories?: string[];
    activeUsers?: boolean;
    searchQuery?: string;
}