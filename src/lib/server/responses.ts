import { NoMoviesError, TmdbConfigError } from './tmdb';

/** Traduce los errores del servidor a respuestas HTTP sin exponer detalles internos. */
export function errorResponse(error: unknown): Response {
    if (error instanceof NoMoviesError) {
        return Response.json({ error: error.message }, { status: 404 });
    }
    console.error(error);
    if (error instanceof TmdbConfigError) {
        return Response.json({ error: 'El servidor no está configurado' }, { status: 500 });
    }
    return Response.json({ error: 'No se ha podido contactar con TMDB' }, { status: 502 });
}

export function invalidFiltersResponse(): Response {
    return Response.json({ error: 'Filtros no válidos' }, { status: 400 });
}
