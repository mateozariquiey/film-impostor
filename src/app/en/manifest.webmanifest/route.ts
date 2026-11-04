import { webManifest } from '@/lib/webManifest';

// `manifest.ts` solo vale en la raíz de app/, así que el segundo es una ruta normal.
export const dynamic = 'force-static';

export function GET() {
    return new Response(JSON.stringify(webManifest('en')), {
        headers: { 'Content-Type': 'application/manifest+json' },
    });
}
