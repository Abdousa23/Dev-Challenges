import { FilterParams } from "./types";
export function generateCacheKey(params: FilterParams): string {
    // Clone and normalize parameters
    const keyParts: Record<string, any> = {
        min: params.minPrice ?? '',
        max: params.maxPrice ?? '',
        cats: params.categories?.sort().join(',') ?? '',
        active: params.activeUsers ? '1' : '0',
        q: params.searchQuery?.trim().toLowerCase() ?? ''
    };

    // Stringify with stable key order
    return Object.keys(keyParts)
        .sort()
        .map(k => `${k}=${keyParts[k]}`)
        .join('&');
}