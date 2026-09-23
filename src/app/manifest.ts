import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Film Impostor',
        short_name: 'Impostor',
        description: 'Juego de deducción con películas para jugar en grupo con un solo móvil.',
        start_url: '/',
        display: 'standalone',
        background_color: '#fff5c9',
        theme_color: '#193c9f',
        lang: 'es',
    };
}
