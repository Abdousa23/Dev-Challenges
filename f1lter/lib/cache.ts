// Simple in-memory cache for server-side
const serverCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const getCachedQuery = async (key: string) => {
    const entry = serverCache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
        return entry.data;
    }
    return null;
};

export const cacheQuery = async (key: string, data: any) => {
    serverCache.set(key, {
        data,
        timestamp: Date.now()
    });
};

export const generateCacheKey = (params: any) => {
    return JSON.stringify(params);
};