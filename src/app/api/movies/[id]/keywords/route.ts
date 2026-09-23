import { getKeywords } from '@/lib/server/tmdb';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id <= 0) {
        return Response.json({ error: 'ID de película no válido' }, { status: 400 });
    }
    return Response.json(await getKeywords(id));
}
