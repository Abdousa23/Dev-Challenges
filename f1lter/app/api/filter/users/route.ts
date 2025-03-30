import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { getCachedQuery, cacheQuery, generateCacheKey } from '@/lib/cache';

interface UserFilterParams {
    active?: boolean;
    country?: string;
    company?: string;
    job?: string;
    searchQuery?: string;
}

const db = new Database('filter.db');

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const params: UserFilterParams = {
            active: searchParams.get('active') === 'true',
            country: searchParams.get('country') || undefined,
            company: searchParams.get('company') || undefined,
            job: searchParams.get('job') || undefined,
            searchQuery: searchParams.get('searchQuery') || undefined
        };

        const cacheKey = generateCacheKey(params);
        const cached = await getCachedQuery(cacheKey);
        if (cached) return NextResponse.json(cached);

        let query = `
            SELECT 
                id,
                name,
                email,
                active,
                country,
                company,
                job,
                registered_at AS registeredAt
            FROM users
            WHERE 1=1
        `;

        const queryParams: any[] = [];

        // Active filter
        if (params.active !== undefined) {
            query += ' AND active = ?';
            queryParams.push(params.active ? 1 : 0);
        }

        // Country filter
        if (params.country) {
            query += ' AND country = ?';
            queryParams.push(params.country);
        }

        // Company filter
        if (params.company) {
            query += ' AND company LIKE ?';
            queryParams.push(`%${params.company}%`);
        }

        // Job filter
        if (params.job) {
            query += ' AND job LIKE ?';
            queryParams.push(`%${params.job}%`);
        }

        // Search query
        if (params.searchQuery) {
            query += ' AND (name LIKE ? OR email LIKE ?)';
            const searchTerm = `%${params.searchQuery}%`;
            queryParams.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY registeredAt DESC LIMIT 100';

        const stmt = db.prepare(query);
        const results = stmt.all(...queryParams);

        await cacheQuery(cacheKey, results);
        return NextResponse.json(results);

    } catch (error) {
        console.error('Users API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}