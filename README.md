# Film Impostor

Un juego de deducción para jugar en grupo con un solo móvil. Todos reciben el título de una película menos una persona: el impostor, que tiene que disimular mientras los demás intentan descubrirlo.

## Cómo se juega

1. Elegid entre 3 y 12 jugadores y ajustad las películas por década o año. Podéis revisar una hoja de hasta 60 títulos y tachar los que no conozcáis.
2. Pasaos el móvil. Cada jugador mantiene el dedo para revelar su papel y, al soltar, desaparece.
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

Abre [localhost:3000](http://localhost:3000). Sin la clave, la interfaz carga y avisa de que TMDB no responde, y se puede jugar con la lista de reserva. Las pruebas automatizadas usan respuestas simuladas y no necesitan credenciales.

## Desarrollo

Next.js, React y TypeScript, con CSS Modules para los estilos y Vitest para las pruebas.

- `src/components/`: pantallas (`SetupScreen`, `MovieListScreen`, `TurnScreen`, `TableScreen`, `ResultScreen`) y sus piezas. `HoldButton` es el gesto de mantener pulsado y `ChoiceSheet`, el selector en hoja inferior.
- `src/app/globals.css`: tokens de color y estilos comunes. Claro y oscuro siguen al sistema, y `data-luz="baja"` atenúa la pantalla durante los turnos.
- `src/contexts/GameContext.tsx`: estado de la partida y transiciones entre turnos.
- `src/lib/`: reparto de roles, filtros, ajustes guardados en el navegador y lista de reserva.
- `src/lib/server/`: consultas a TMDB y tratamiento de errores.
- `src/app/api/movies/`: rutas que consulta el navegador. La clave de TMDB se utiliza en el servidor.

## Diseño

Sobria, pero con presión donde importa: una sola familia (Chivo), neutros con sombras algo verdosas y luces cálidas, y un único color, el ocre, reservado para el jugador al que le toca, lo que se está llenando y el impostor. El resto de la jerarquía la llevan dos tamaños: `.numeral` para las cifras y `.enorme` para los títulos que revela la partida.

- El papel solo está en la página mientras se mantiene el dedo, y desaparece sin transición al soltar, al cancelarse el gesto o al pasar la app a segundo plano.
- Todos los estados del turno comparten el mismo esqueleto (número de jugador, título y nota), y el papel del impostor tiene el mismo sitio, tamaño y color que el título de la película, para que no se distingan desde lejos. Solo un título de más de 64 caracteres baja de tamaño, porque no cabría.
- Durante los turnos y la conversación la pantalla pasa a un tono muy oscuro, también en tema claro, para que no ilumine caras. Al mantener sube un poco la luz de toda la pantalla. La luz normal vuelve en el resultado.

Hay dos gestos propios, y conviene no añadir más:

- `PlayerDots`: un punto por jugador, la misma forma del icono. El punto hueco significa siempre «impostor», así que no se usa para nada más.
- El llenado de izquierda a derecha: el botón de la mesa se llena, los puntos se llenan con él y el cartel se destapa en la misma dirección.

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm start
```

Los ajustes se conservan en `localStorage`. La partida y la selección manual solo duran hasta recargar la página. Al cambiar los filtros se borra la selección manual.

Si TMDB no responde o no hay conexión, se puede jugar con la lista de reserva de `src/lib/reserve.ts`, que no lleva carteles ni palabras clave y no aplica los filtros.

Los modos Top 100 y Top 500 acotan las páginas de resultados ordenados por popularidad dentro de los filtros elegidos. Cinéfilo amplía la búsqueda y Clásicos ordena por número de votos. No son listas editoriales; los resultados cambian con TMDB.

## Despliegue

Puede ejecutarse en Vercel o en un servidor con Node.js usando `npm run build` y `npm start`. Configura `TMDB_API_KEY` en el entorno del servidor. No es una exportación estática: las rutas de API necesitan ejecutarse en el servidor.

Si vienes de la versión anterior, sustituye `NEXT_PUBLIC_TMDB_API_KEY` por `TMDB_API_KEY` y vuelve a desplegar. La variable antigua se incluía en el JavaScript público; conviene reemplazar esa clave en TMDB.

## Datos de películas

Títulos, géneros y carteles proceden de [The Movie Database](https://www.themoviedb.org/). Este proyecto utiliza la API de TMDB y no está respaldado ni certificado por TMDB.
