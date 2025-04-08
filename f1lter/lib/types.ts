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
    id: any,
    name: string,
    email: string,
    active: number,
    company: string,
    job: string,
    registeredAt: Date,
    dateOfBirth: Date,
    phone: string,
    username: string,
    website: string,
    age: string,
    address: {
        street: string,
        city: string,
        state: string,
        zipcode: string,
        country: string
    }
}


export interface FilterParams {
    minPrice?: number;
    maxPrice?: number;
    categories?: string[];
    activeUsers?: boolean;
    searchQuery?: string;
}