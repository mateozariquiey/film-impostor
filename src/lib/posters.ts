export type PosterSize = 'w185' | 'w342' | 'w500';

/** Los carteles se piden directamente al CDN público de TMDB, que no necesita clave. */
export function posterUrl(path: string, size: PosterSize): string {
    return `https://image.tmdb.org/t/p/${size}${path}`;
}
