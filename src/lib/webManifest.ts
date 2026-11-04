import type { MetadataRoute } from 'next';
import { MESSAGES } from '@/messages';
import type { Locale } from '@/types';

/** Las dos versiones son la misma app instalada: mismo `id` y `start_url`, y al abrirse sigue el idioma elegido. */
export function webManifest(locale: Locale): MetadataRoute.Manifest {
    return {
        name: 'Film Impostor',
        short_name: 'Impostor',
        description: MESSAGES[locale].meta.description,
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1b2220',
        theme_color: '#1b2220',
        lang: locale,
        icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    };
}
