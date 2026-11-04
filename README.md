# Film Impostor

Un juego de deducción para jugar en grupo con un solo móvil. Todos reciben el título de una película menos una persona: el impostor, que tiene que disimular mientras los demás intentan descubrirlo.

## Cómo se juega

1. Elegid entre 3 y 12 jugadores y ajustad las películas por década o año, género y lo conocidas que sean. Podéis revisar una hoja de hasta 60 títulos y tachar los que no conozcáis, y poner nombres si queréis.
2. Pasaos el móvil. Cada jugador mantiene el dedo para revelar su papel y, al soltar, desaparece.
3. La app sortea quién empieza. Dad pistas, haced preguntas y votad quién creéis que es el impostor. Antes de revelar el resultado, el impostor puede intentar adivinar el título.
4. Si adivina la película, gana. Si no, el grupo gana al acertar la votación; una votación incorrecta da la victoria al impostor.

La conversación y la votación se hacen en persona. La aplicación reparte los roles y revela el resultado; no lleva puntuaciones ni necesita cuentas.

Las pistas para el impostor son opcionales: género, año y palabras clave. Estas últimas pueden aparecer en inglés o faltar, según TMDB. Si filtráis por un género, la pista es otro género de la película («También: Ciencia ficción»), porque el que elegisteis ya lo sabe. Si no tiene otro, esa pista no sale.

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

Abre [localhost:3000](http://localhost:3000). Sin la clave, la interfaz carga y avisa de que TMDB no responde, y se puede jugar con la lista de reserva. Las pruebas automatizadas, también las de navegador, usan respuestas simuladas y no necesitan credenciales.

## Desarrollo

Next.js, React y TypeScript, con CSS Modules para los estilos, Vitest para las pruebas de la lógica y Playwright para las de navegador.

- `src/components/`: pantallas (`SetupScreen`, `MovieListScreen`, `TurnScreen`, `TableScreen`, `ResultScreen`, `ResumeScreen`) y sus piezas. `HoldButton` es el gesto de mantener pulsado y `ChoiceSheet`, el selector en hoja inferior.
- `src/app/globals.css`: tokens de color y estilos comunes. Claro y oscuro siguen al sistema, y `data-luz="baja"` atenúa la pantalla durante los turnos.
- `src/contexts/GameContext.tsx`: estado de la partida y transiciones entre turnos. `LocaleContext.tsx`: el idioma y sus textos.
- `src/messages/`: los textos de cada idioma.
- `src/lib/`: reparto de roles, filtros, géneros, películas ya vistas, ajustes y partida guardados en el navegador, y lista de reserva.
- `src/lib/server/`: consultas a TMDB y tratamiento de errores.
- `src/app/api/movies/`: rutas que consulta el navegador. La clave de TMDB se utiliza en el servidor.
- `e2e/`: la partida en un móvil de 360×640, con el dedo.
- `scripts/`: genera `public/sw.js` al compilar, con la lista de archivos de esa compilación (ese archivo no se versiona), y, a mano, las imágenes para compartir.

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
npm run test:e2e
```

Las pruebas de navegador corren sobre la compilación, así que van después de `npm run build`. La primera vez hay que descargar los navegadores con `npx playwright install chromium webkit`. También se ejecutan en la integración continua, y son las que avisan si se rompe el secreto o el gesto: el papel no puede estar en la página fuera del gesto, ni siquiera oculto, y al soltar no debe saltar el botón que aparece bajo el dedo.

Corren en Chromium y en WebKit, pero WebKit aquí es el motor de Safari y no un iPhone. Playwright no sabe dejar un dedo apoyado en él, así que allí el gesto se mantiene con el ratón (mismos eventos de puntero y misma captura, sin `touchstart` ni `touchend`), y los toques cortos sí son de dedo. Las dos pruebas que necesitan un dedo apoyado o arrastrándose se saltan en WebKit, con el motivo escrito. Lo propio de iOS, como la lupa, el menú al mantener o el gesto del sistema que cancela el toque, solo se puede ver en un iPhone.

Los ajustes y los nombres se conservan en `localStorage`. Al cambiar los filtros se borra la selección manual.

## No repetir películas

Cada película que sale se apunta en el dispositivo (`src/lib/recentMovies.ts`): solo los ID, hasta 200, sean cuales sean los filtros o el idioma. El navegador manda esa lista a la API, y el servidor mira hasta 5 páginas de resultados buscando una que no esté. Si se agotan, por filtros muy estrictos o tras muchas partidas, sale la que hace más tiempo que salió, así que nunca se queda sin película. La selección manual y la lista de reserva siguen la misma regla.

## Idiomas

Español e inglés, sin librería. Cada texto está en `src/messages/`: `es.ts` es la referencia y `en.ts` tiene que dar la misma forma, de modo que si falta algo no compila. Lo que depende de la frase es una función, porque en español no se dice igual «Jugador 3» que «al jugador 3».

- El idioma es el elegido a mano o, si no, el primero del navegador que la app tenga. Para quien no habla ninguno de los dos, inglés. Volver al idioma del navegador borra la elección.
- Hay dos direcciones, `/` y `/en`, y son la misma app. Existen por los metadatos, la imagen para compartir y el manifest: quien lee un enlace compartido no ejecuta JavaScript, así que solo la dirección puede decirle el idioma. Cada una es un layout raíz propio (`src/app/(es)/` y `src/app/en/`), y la app ajusta la dirección y `lang` al idioma de verdad, para que el enlace que se copie enseñe la tarjeta en ese idioma.
- Las películas se piden en el idioma de la partida, así que el título y el cartel son los de TMDB para ese idioma. Las palabras clave no se traducen: TMDB solo las da en inglés.
- La lista de reserva tiene su título en cada idioma. Una película sin título en inglés es porque no es conocida fuera de España, y no sale en esa lista.

Las imágenes para compartir salen de `scripts/generate-share-images.mjs`, que se ejecuta a mano si cambia el lema.

## Partida guardada

Cada cambio de turno se guarda en `localStorage` (`src/lib/savedGame.ts`), así que recargar, cerrar por error o que el navegador mate la pestaña no pierde la partida.

- Al volver sale `ResumeScreen`, que dice a quién le toca y no enseña ningún papel. El papel solo aparece, como siempre, mientras se mantiene el dedo.
- Lo guardado va en Base64 para que el título y el impostor no se lean de un vistazo. No es cifrado: quien abra las herramientas del navegador y lo decodifique puede leerlo.
- Caduca a las 6 horas del último turno, también con la pestaña abierta en segundo plano. Entonces se borra y el inicio lo avisa.
- El resultado no se guarda: al llegar a él se borra la partida, de modo que recargar lleva al inicio y nunca enseña al impostor sin el gesto de mantener.
- Si el navegador no deja guardar, se avisa antes de recargar, como antes.

## Sin conexión

La app es una PWA instalable. Android lo ofrece solo, pero iOS no avisa, y por eso «Cómo se juega» explica cómo hacerlo. En la primera visita, el service worker guarda la página y todos sus archivos, de modo que ya se abre sin red en la primera recarga. Sin conexión se juega con la lista de reserva.

- La app se sirve siempre de la caché. Una versión nueva se descarga aparte y se ve la siguiente vez que se abre, así que tras un despliegue hay que abrirla dos veces.
- La API y los carteles no pasan por el service worker: sin red fallan y la app propone la reserva o juega sin cartel.
- Solo funciona con `npm run build`, porque `next dev` no genera `public/sw.js`. En desarrollo, la app da de baja cualquier service worker que quedara de probar la compilación.

Si TMDB no responde o no hay conexión, se puede jugar con la lista de reserva de `src/lib/reserve.ts`, que no lleva carteles ni palabras clave y no aplica los filtros. Sus títulos, años y géneros están contrastados con las fichas de TMDB y con Wikidata.

Los modos Top 100 y Top 500 acotan las páginas de resultados ordenados por popularidad dentro de los filtros elegidos. Cinéfilo amplía la búsqueda y Clásicos ordena por número de votos. No son listas editoriales; los resultados cambian con TMDB.

## Despliegue

Puede ejecutarse en Vercel o en un servidor con Node.js usando `npm run build` y `npm start`. Configura `TMDB_API_KEY` en el entorno del servidor. No es una exportación estática: las rutas de API necesitan ejecutarse en el servidor.

### Límite de peticiones

Las rutas de `/api/movies` no tienen límite en el código, a propósito. Un contador en memoria solo ve lo que pasa por su instancia y se vacía al reiniciarse, así que parecería proteger sin hacerlo. En Vercel el límite real es una regla del cortafuegos, que está en todos los planes (en Hobby, una por proyecto), cuenta por IP antes de ejecutar la función y no necesita servicios externos. No se puede escribir en `vercel.json`, que solo admite denegar o desafiar, así que hay que crearla una vez:

```sh
vercel link
vercel firewall rules add "Limitar la API de películas" \
  --condition '{"type":"path","op":"pre","value":"/api/movies"}' \
  --action rate_limit --rate-limit-window 60 --rate-limit-requests 30 --rate-limit-keys ip --yes
vercel firewall diff
vercel firewall publish --yes
```

Un grupo hace una o dos peticiones por partida, así que 30 por minuto dejan margen de sobra, incluso a varios grupos detrás de la misma IP. Quien lo pase recibe un 429 y la app ofrece la lista de reserva, como con cualquier fallo del servidor. El contador es por región, de modo que quien reparta las peticiones por varias regiones o IP puede pasar de ahí: frena el abuso casual, no un ataque distribuido, para el que Vercel tiene sus propias defensas.

TMDB no tiene cuota diaria ni mensual, solo un tope de unas 40 peticiones por segundo, y las respuestas se guardan una hora en la caché de datos de Next. Lo que se gasta de verdad con el abuso son las invocaciones de funciones de Vercel, que esta regla corta antes de que ocurran. Un servidor propio con Node.js no tiene este cortafuegos, y tendría que poner el límite en su proxy.

Si vienes de la versión anterior, sustituye `NEXT_PUBLIC_TMDB_API_KEY` por `TMDB_API_KEY` y vuelve a desplegar. La variable antigua se incluía en el JavaScript público; conviene reemplazar esa clave en TMDB.

## Datos de películas

Títulos, géneros y carteles proceden de [The Movie Database](https://www.themoviedb.org/), que con `language=es-ES` o `en-US` devuelve el título en ese idioma y un cartel en él si lo hay. Este proyecto utiliza la API de TMDB y no está respaldado ni certificado por TMDB.
