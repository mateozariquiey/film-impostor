import type { NextRequest } from 'next/server';
import { parseFilters } from '@/lib/filters';
import { getMoviePool } from '@/lib/server/tmdb';
import { errorResponse, invalidFiltersResponse } from '@/lib/server/responses';

export async function GET(request: NextRequest) {
    const filters = parseFilters(request.nextUrl.searchParams);
    if (!filters) return invalidFiltersResponse();

    try {
        return Response.json(await getMoviePool(filters));
    } catch (error) {
        return errorResponse(error);
    }
}
