const DB_NAME = 'filterCache';
const STORE_NAME = 'queries';

interface CacheEntry<T = any> {
    data: T;
    timestamp: number;
}

export const clientCache = {
    async get<T = any>(key: string): Promise<T | null> {
        if (typeof window === 'undefined') return null;

        return new Promise((resolve) => {
            const request = indexedDB.open(DB_NAME, 1);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const getRequest = store.get(key);

                getRequest.onsuccess = () => {
                    const result = getRequest.result as CacheEntry<T>;
                    if (result && Date.now() - result.timestamp < 3600000) {
                        resolve(result.data);
                    } else {
                        resolve(null);
                    }
                };
            };
        });
    },

    async set<T = any>(key: string, data: T): Promise<void> {
        if (typeof window === 'undefined') return;

        return new Promise((resolve) => {
            const request = indexedDB.open(DB_NAME, 1);

            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const entry: CacheEntry<T> = {
                    data,
                    timestamp: Date.now()
                };
                store.put(entry, key);
                resolve();
            };
        });
    }
};