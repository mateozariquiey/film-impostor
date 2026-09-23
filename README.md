# Film Impostor

Un juego de deducción para jugar en grupo con un solo móvil. Todos reciben el título de una película menos una persona: el impostor, que tiene que disimular mientras los demás intentan descubrirlo.

## Cómo se juega

1. Elegid entre 3 y 12 jugadores y ajustad las películas por década o año. Podéis revisar una lista de hasta 60 títulos y descartar los que no conozcáis.
2. Pasad el móvil por turnos. Cada jugador revela su rol en privado y lo oculta antes de pasárselo al siguiente.
3. Dad pistas, haced preguntas y votad quién creéis que es el impostor. Antes de revelar el resultado, el impostor puede intentar adivinar el título.
4. Si adivina la película, gana. Si no, el grupo gana al acertar la votación; una votación incorrecta da la victoria al impostor.

La conversación y la votación se hacen en persona. La aplicación reparte los roles y revela el resultado; no lleva puntuaciones ni necesita cuentas.

Las pistas para el impostor son opcionales: género, año y palabras clave. Estas últimas pueden aparecer en inglés o faltar, según TMDB.

## Ejecutarlo en local

Necesitas Node.js 24 (también indicado en `.nvmrc`) y una clave API v3 de [TMDB](https://www.themoviedb.org/settings/api).

```sh
npm ci
cp .env.example .env.local
```

Añade la clave en `.env.local`:

```dotenv
TMDB_API_KEY=tu_clave
```

```sh
npm run dev
```

Abre [localhost:3000](http://localhost:3000). Sin la clave, la interfaz carga, pero no se pueden obtener películas. Las pruebas automatizadas usan respuestas simuladas y no necesitan credenciales.

## Desarrollo

Next.js, React y TypeScript, con Tailwind para los estilos y Vitest para las pruebas.

- `src/components/`: pantallas de configuración, selección y partida.
- `src/contexts/GameContext.tsx`: estado de la partida y transiciones entre turnos.
- `src/lib/`: reparto de roles, filtros y ajustes guardados en el navegador.
- `src/lib/server/`: consultas a TMDB y tratamiento de errores.
- `src/app/api/movies/`: rutas que consulta el navegador. La clave de TMDB se utiliza en el servidor.

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm start
```

Los ajustes se conservan en `localStorage`. La partida y la selección manual solo duran hasta recargar la página. Al cambiar los filtros se borra la selección manual.

Los modos Top 100 y Top 500 acotan las páginas de resultados ordenados por popularidad dentro de los filtros elegidos. Cinéfilo amplía la búsqueda y Clásicos ordena por número de votos. No son listas editoriales; los resultados cambian con TMDB.

## Despliegue

Puede ejecutarse en Vercel o en un servidor con Node.js usando `npm run build` y `npm start`. Configura `TMDB_API_KEY` en el entorno del servidor. No es una exportación estática: las rutas de API necesitan ejecutarse en el servidor.

Si vienes de la versión anterior, sustituye `NEXT_PUBLIC_TMDB_API_KEY` por `TMDB_API_KEY` y vuelve a desplegar. La variable antigua se incluía en el JavaScript público; conviene reemplazar esa clave en TMDB.

## Datos de películas

Títulos, géneros y carteles proceden de [The Movie Database](https://www.themoviedb.org/). Este proyecto utiliza la API de TMDB y no está respaldado ni certificado por TMDB.
