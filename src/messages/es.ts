const player = (index: number, names: readonly string[]) => names[index];

/**
 * Los textos en español. Son la referencia: `en.ts` tiene que dar exactamente la misma forma, y si
 * falta algo no compila. Lo que depende de un jugador es una función, porque en español cambia con
 * la frase: «Jugador 3», «el jugador 3» o «al jugador 3».
 */
export const es = {
    meta: {
        tagline: 'Todos ven la misma película, menos uno.',
        description:
            'Todos ven la misma película, menos uno. Un juego de deducción para jugar en grupo con un solo móvil.',
    },
    loading: 'Cargando…',
    /** Para los títulos: «Lucía» o «Jugador 3». */
    playerName: (index: number, names: readonly string[]) => player(index, names) || `Jugador ${index + 1}`,
    otherLanguage: 'English',
    setup: {
        players: 'Cuántos jugáis',
        playersCount: (count: number) => `${count} jugadores`,
        fewerPlayers: 'Un jugador menos',
        morePlayers: 'Un jugador más',
        era: 'De qué época',
        eraOptions: {
            ALL: 'Cualquiera',
            '80s': 'Los 80',
            '90s': 'Los 90',
            '00s': 'Los 2000',
            '10s': 'Los 2010',
            '20s': 'Los 2020',
            YEAR: 'Un año concreto',
        },
        yearMissing: 'Falta el año',
        year: 'Año',
        yearRange: (min: number, max: number) => `Escribe un año entre ${min} y ${max}.`,
        genre: 'De qué género',
        anyGenre: 'Cualquiera',
        popularity: 'Cómo de conocidas',
        popularityOptions: {
            TOP_100: 'Muy conocidas',
            TOP_500: 'Un poco de todo',
            HARDCORE: 'Para cinéfilos',
            CLASSICS: 'Clásicos populares',
        },
        hints: 'Pistas del impostor',
        hintOptions: { GENRE: 'Género', YEAR: 'Año', KEYWORDS: 'Palabras clave' },
        /** Más cortas, para que quepan en la fila. */
        hintShort: { GENRE: 'género', YEAR: 'año', KEYWORDS: 'claves' },
        noHints: 'Ninguna',
        noneRemoved: 'Ninguna',
        noNames: 'Sin nombres',
        removeMovies: 'Quitar películas',
        moviesLeft: (count: number) => `Quedan ${count}`,
        addNames: 'Poner nombres',
        namedCount: (named: number, total: number) => `${named} de ${total}`,
        expired: 'La partida anterior ha caducado.',
        errors: {
            offline: 'No hay conexión, así que no se puede buscar una película.',
            server: 'TMDB no responde, así que no se puede buscar una película.',
            'no-movies': 'No hay películas con estos filtros. Prueba con otra época o género.',
        },
        reserveNote: (count: number) =>
            `La lista de reserva son ${count} películas muy conocidas, sin carteles ni filtros.`,
        useReserve: 'Jugar con la lista de reserva',
        searching: 'Buscando película…',
        retry: 'Reintentar',
        start: 'Empezar',
    },
    done: 'Listo',
    rules: {
        title: 'Cómo se juega',
        intro: (min: number, max: number) => `De ${min} a ${max} personas, un solo móvil y una película secreta.`,
        steps: [
            'Pasaos el móvil. Cada uno mantiene el dedo para ver su papel y, al soltar, desaparece. Todos ven el título menos el impostor.',
            'Dad pistas y haced preguntas sin decir el título. Después, votad quién está disimulando.',
            'Antes de ver el resultado, el impostor puede intentar adivinar la película. Si acierta, gana. Si no, el grupo gana al acertar la votación.',
        ],
        installTitle: 'Instalarla',
        installIntro: 'Se abre a pantalla completa y funciona sin conexión.',
        installIos: 'En iPhone: Compartir y «Añadir a pantalla de inicio».',
        installAndroid: 'En Android: menú del navegador e «Instalar app» o «Añadir a pantalla de inicio».',
        creditBefore: 'Títulos, géneros y carteles de ',
        creditAfter: '. Este producto usa la API de TMDB, pero TMDB no lo respalda ni lo certifica.',
        understood: 'Entendido',
    },
    names: {
        title: 'Nombres',
        note: 'Son opcionales. Se recuerdan para la próxima partida.',
        clear: 'Borrar los nombres',
    },
    list: {
        cancel: 'Cancelar',
        title: 'Tachad las que no conozcáis',
        loading: 'Cargando películas…',
        errors: {
            offline: 'No hay conexión, así que no se puede cargar la lista.',
            server: 'TMDB no responde, así que no se puede cargar la lista.',
            'no-movies': 'No hay películas con estos filtros. Vuelve y prueba con otra época o género.',
        },
        retry: 'Reintentar',
        inPlay: (count: number, total: number) => `${count} de ${total} en juego`,
        keepOne: 'Deja al menos una',
        useOne: 'Usar solo esta',
        useMany: (count: number) => `Usar estas ${count}`,
        crossOff: (title: string) => `Tachar ${title}`,
    },
    turn: {
        whoseTurn: 'Le toca a',
        playerOf: (number: number, total: number) => `jugador ${number} de ${total}`,
        player: 'Jugador',
        ofTotal: (total: number) => `de ${total}`,
        youAreImpostor: 'Eres el impostor',
        giveClues: 'Da pistas sin regalársela al impostor.',
        hidden: 'Ya está oculto',
        seeAgain: 'Para verlo otra vez, mantén el dedo.',
        takePhone: 'Coge el móvil',
        holdLonger: 'Mantén un momento más, hasta que te dé tiempo a leerlo.',
        holdNote: 'Tu papel se ve solo mientras mantienes el dedo. Que no mire nadie más.',
        releaseHint: 'Suelta para ocultar',
        holdAria: 'Mantén pulsado para ver tu papel',
        leaveOnTable: 'Dejar el móvil en la mesa',
        passTo: (index: number, names: readonly string[]) =>
            `Pásale el móvil ${player(index, names) ? `a ${player(index, names)}` : `al jugador ${index + 1}`}`,
        holdHint: 'Mantén para ver tu papel',
        hideRole: 'Ocultar mi papel',
        showRole: 'Mostrar mi papel sin mantener pulsado',
        noHints: 'Sin pistas esta vez. Escucha y disimula.',
        hintGenre: (genre: string) => `Género: ${genre}`,
        hintExtraGenre: (genre: string) => `También: ${genre}`,
        hintYear: (year: string | null) => `Año: ${year ?? 'desconocido'}`,
        hintKeywords: (keywords: readonly string[]) =>
            `Palabras clave: ${keywords.length ? keywords.join(', ') : 'ninguna'}`,
    },
    table: {
        title: 'Pistas, en este orden',
        rules: [
            'Cada uno da una, sin decir el título. Después, preguntad y votad quién disimula.',
            'Antes de ver el resultado, el impostor puede intentar adivinar la película.',
            'Si la adivina o el grupo falla la votación, gana el impostor. Si no, gana el grupo.',
        ],
        starter: 'Para arrancar',
        anotherQuestion: 'Otra pregunta',
        tooShort: 'Deja el dedo hasta que se llene el botón.',
        hold: 'Mantén para ver quién era',
    },
    result: {
        was: (index: number, names: readonly string[]) =>
            `Era ${player(index, names) || `el jugador ${index + 1}`}`,
        poster: (title: string) => `Cartel de ${title}`,
        movieWas: 'La película era ',
        searching: 'Buscando película…',
        another: 'Otra película',
        settings: 'Cambiar ajustes',
    },
    resume: {
        title: 'Partida a medias',
        atTable: 'Ya lo habíais visto todos. Falta votar y ver quién era.',
        turnOf: (index: number, names: readonly string[]) =>
            `Le toca ${player(index, names) ? `a ${player(index, names)}` : `al jugador ${index + 1}`}. Los papeles siguen ocultos.`,
        continue: 'Seguir',
        restart: 'Empezar de nuevo',
    },
    quit: {
        aria: 'Abandonar la partida',
        title: '¿Abandonar la partida?',
        text: 'Se pierde el reparto y volvéis a los ajustes.',
        confirm: 'Abandonar',
        keepPlaying: 'Seguir jugando',
    },
};

export type Messages = typeof es;
