import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { getCachedQuery, cacheQuery, generateCacheKey } from '@/lib/cache';
import { User } from '@/lib/types';

interface UserFilterParams {
    active?: boolean;
    country?: string;
    company?: string;
    job?: string;
    searchQuery?: string;
    dateOfBirth?: string;
    phone?: string;
}

const db = new Database('filter.db');
const normalizeDate = (date: string) => {
    if (!date) return null;
    const dateObj = new Date(date);
    return dateObj.toISOString().split('T')[0];
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const params: UserFilterParams = {
            active: searchParams.get('active') === 'true',
            country: searchParams.get('country') || undefined,
            company: searchParams.get('company') || undefined,
            job: searchParams.get('job') || undefined,
            searchQuery: searchParams.get('searchQuery') || undefined,
            dateOfBirth: searchParams.get('dateOfBirth') || undefined,
            phone: searchParams.get('phone') || undefined
        };

        const cacheKey = generateCacheKey(params);
        const cached = await getCachedQuery(cacheKey);
        if (cached) return NextResponse.json(cached);

        let query = `
        SELECT 
            u.id,
            u.name,
            u.email,
            u.active,
            u.company,
            u.job,
            u.registered_at AS registeredAt,
            u.date_of_birth AS dateOfBirth,
            u.phone,
            u.username,
            u.website,
            a.street,
            a.city,
            a.state,
            a.zipcode,
            a.country AS addressCountry
        FROM users u
        LEFT JOIN addresses a ON u.id = a.user_id
        WHERE 1=1
    `;

        const queryParams: any[] = [];

        // Filters (same as before)...
        if (params.active !== undefined) {
            query += ' AND u.active = ?';
            queryParams.push(params.active ? 1 : 0);
        }
        if (params.country) {
            query += ' AND a.country = ?';
            queryParams.push(params.country);
        }
        if (params.company) {
            query += ' AND u.company LIKE ?';
            queryParams.push(`%${params.company}%`);
        }
        if (params.job) {
            query += ' AND u.job LIKE ?';
            queryParams.push(`%${params.job}%`);
        }
        if (params.searchQuery) {
            query += ' AND (u.name LIKE ? OR u.email LIKE ?)';
            const searchTerm = `%${params.searchQuery}%`;
            queryParams.push(searchTerm, searchTerm);
        }
        console.log(params)
        if (params.dateOfBirth) {

            const normalizedDate = normalizeDate(params.dateOfBirth);
            console.log(normalizeDate)
            query += ' AND u.date_of_birth = ?';
            queryParams.push(normalizedDate);
        }

        if (params.phone) {
            query += ' AND u.phone LIKE ?';
            queryParams.push(`%${params.phone}%`);
        }

        query += ' ORDER BY registeredAt DESC LIMIT 100';

        const stmt = db.prepare(query);
        const rawResults = stmt.all(...queryParams);

        const results = rawResults.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            active: !!user.active,
            company: user.company,
            job: user.job,
            registeredAt: user.registeredAt,
            dateOfBirth: user.dateOfBirth,
            phone: user.phone,
            username: user.username,
            website: user.website,
            address: {
                street: user.street,
                city: user.city,
                state: user.state,
                zipcode: user.zipcode,
                country: user.addressCountry
            }
        }));

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
