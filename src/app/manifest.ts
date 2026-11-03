import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Film Impostor',
        short_name: 'Impostor',
        description: 'Todos ven la misma película, menos uno. Un juego de deducción para jugar en grupo con un solo móvil.',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#140302',
        theme_color: '#140302',
        lang: 'es',
        icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    };
}
