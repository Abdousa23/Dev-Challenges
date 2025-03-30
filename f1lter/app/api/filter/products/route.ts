import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { getCachedQuery, cacheQuery, generateCacheKey } from '@/lib/cache';

const db = new Database('filter.db');

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const params = {
            minPrice: searchParams.get('minPrice'),
            maxPrice: searchParams.get('maxPrice'),
            categories: searchParams.get('categories'),
            searchQuery: searchParams.get('searchQuery')
        };

        const cacheKey = generateCacheKey(params);
        const cached = await getCachedQuery(cacheKey);
        if (cached) return NextResponse.json(cached);

        let query = `SELECT * FROM products`;
        const conditions = [];
        const queryParams = [];

        if (params.minPrice) {
            conditions.push('price >= ?');
            queryParams.push(parseFloat(params.minPrice));
        }
        if (params.maxPrice) {
            conditions.push('price <= ?');
            queryParams.push(parseFloat(params.maxPrice));
        }
        if (params.categories) {
            const categories = params.categories.split(',');
            conditions.push(`category IN (${categories.map(() => '?').join(',')})`);
            queryParams.push(...categories);
        }
        if (params.searchQuery) {
            conditions.push('(name LIKE ? OR brand LIKE ?)');
            const searchTerm = `%${params.searchQuery}%`;
            queryParams.push(searchTerm, searchTerm);
        }

        if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
        query += ' ORDER BY price DESC LIMIT 100';

        const stmt = db.prepare(query);
        const results = stmt.all(...queryParams);

        await cacheQuery(cacheKey, results);
        return NextResponse.json(results);

    } catch (error) {
        console.error('Products API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}