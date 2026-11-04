import type { NextRequest } from 'next/server';
import { parseFilters } from '@/lib/filters';
import { isLocale } from '@/lib/locale';
import { parseExcludeParam } from '@/lib/recentMovies';
import { getRandomMovie } from '@/lib/server/tmdb';
import { errorResponse, invalidFiltersResponse } from '@/lib/server/responses';

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const filters = parseFilters(params);
    if (!filters) return invalidFiltersResponse();
    // Una versión anterior guardada en el móvil no manda idioma: sigue recibiendo español.
    const lang = params.get('lang');

    try {
        return Response.json(await getRandomMovie(filters, isLocale(lang) ? lang : 'es', parseExcludeParam(params.get('exclude'))));
    } catch (error) {
        return errorResponse(error);
    }
}
