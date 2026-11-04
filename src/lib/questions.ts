import type { Locale } from '@/types';
import { addRecentMovie, parseRecentMovies, pickFresh } from '@/lib/recentMovies';

/**
 * Preguntas para arrancar la conversación. Sirven para cualquier película, se contestan con una
 * opinión y no con un dato, y así el impostor puede contestar sin saber el título: una pregunta que
 * solo se responde habiéndola visto («¿quién muere?») lo delataría al instante.
 *
 * Cada una va con su traducción al lado, porque la posición es lo que se guarda en la partida.
 */
export const QUESTIONS: readonly Readonly<Record<Locale, string>>[] = [
    { es: '¿La verías en una primera cita?', en: 'Would you watch it on a first date?' },
    { es: '¿La pondrías después de una comida familiar?', en: 'Would you put it on after a family lunch?' },
    { es: '¿La verías con tus padres en el sofá?', en: 'Would you watch it with your parents on the sofa?' },
    { es: '¿La verías a solas, de noche y con la luz apagada?', en: 'Would you watch it alone, at night, with the lights off?' },
    { es: '¿Se la recomendarías a tu jefe?', en: 'Would you recommend it to your boss?' },
    { es: '¿Se la pondrías a un niño de diez años?', en: 'Would you show it to a ten-year-old?' },
    { es: '¿Cómo se la describirías a tu abuela?', en: 'How would you describe it to your grandmother?' },
    { es: '¿Qué nota le pondría tu madre?', en: 'What score would your mum give it?' },
    { es: '¿A quién de esta mesa le gustaría menos?', en: 'Who at this table would like it least?' },
    { es: '¿A quién de esta mesa le darías un papel?', en: 'Who at this table would you cast in it?' },
    { es: '¿La verías justo después de una ruptura?', en: 'Would you watch it right after a breakup?' },
    { es: '¿La verías con resaca?', en: 'Would you watch it hungover?' },
    { es: '¿Te arreglaría un mal día?', en: 'Would it fix a bad day?' },
    { es: '¿Es una película de domingo por la tarde?', en: 'Is it a Sunday afternoon movie?' },
    { es: '¿Es más de invierno o de verano?', en: 'Is it more of a winter or a summer movie?' },
    { es: '¿Qué cenarías mientras la ves?', en: 'What would you have for dinner while watching it?' },
    { es: '¿La elegirías para un vuelo largo?', en: 'Would you pick it for a long flight?' },
    { es: '¿Mejor en el cine o en el sofá?', en: 'Better in a cinema or on the sofa?' },
    { es: '¿Se puede ver mientras haces otra cosa?', en: 'Can you watch it while doing something else?' },
    { es: '¿Te acordarías de comerte las palomitas?', en: 'Would you remember to eat your popcorn?' },
    { es: '¿La aguantarías entera sin mirar el móvil?', en: 'Could you get through it without checking your phone?' },
    { es: '¿Seguirías el hilo si llegas diez minutos tarde?', en: 'Could you keep up if you arrived ten minutes late?' },
    { es: '¿Te quedarías hasta el final de los créditos?', en: 'Would you stay until the end of the credits?' },
    { es: '¿Sales mejor o peor de como entraste?', en: 'Do you come out feeling better or worse?' },
    { es: '¿Te haría llorar?', en: 'Could it make you cry?' },
    { es: '¿Discutiríais al salir del cine?', en: 'Would you argue about it on the way out?' },
    { es: '¿La volverías a ver esta noche?', en: 'Would you watch it again tonight?' },
    { es: '¿Ha envejecido bien?', en: 'Has it aged well?' },
    { es: '¿Se podría rodar hoy tal cual?', en: 'Could it be made today exactly as it is?' },
    { es: '¿Necesita una secuela?', en: 'Does it need a sequel?' },
    { es: '¿Funcionaría como serie?', en: 'Would it work as a series?' },
    { es: '¿Funcionaría como musical?', en: 'Would it work as a musical?' },
    { es: '¿Le cambiarías el final?', en: 'Would you change the ending?' },
    { es: '¿Qué canción pondrías en los créditos?', en: 'What song would you play over the credits?' },
    { es: '¿Te gustaría vivir en ese mundo?', en: 'Would you want to live in its world?' },
    { es: '¿Sobrevivirías hasta el final?', en: 'Would you make it to the end alive?' },
    { es: '¿Te fiarías de su protagonista?', en: 'Would you trust its main character?' },
    { es: '¿Le prestarías dinero a su protagonista?', en: 'Would you lend its main character money?' },
    { es: '¿Invitarías a cenar a alguien de la película?', en: 'Would you have anyone from it over for dinner?' },
    { es: '¿Hay alguien en ella a quien no invitarías a tu boda?', en: 'Is there anyone in it you wouldn’t invite to your wedding?' },
];

/** Las últimas que no se repiten. Deja unas cuantas libres para que la siguiente siga siendo al azar. */
export const MAX_RECENT_QUESTIONS = 30;

const STORAGE_KEY = 'film-impostor-questions';
const QUESTION_IDS = QUESTIONS.map((_, id) => ({ id }));

/** Se elige sin mirar ni la película ni el reparto, así que la pregunta no puede decir nada de ellos. */
export function pickQuestion(recent: readonly number[], random: () => number = Math.random): number {
    return pickFresh(QUESTION_IDS, recent, random).id;
}

export function addRecentQuestion(recent: readonly number[], id: number): number[] {
    return addRecentMovie(recent, id).slice(-MAX_RECENT_QUESTIONS);
}

export function isQuestion(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < QUESTIONS.length;
}

export function loadRecentQuestions(): number[] {
    try {
        return parseRecentMovies(localStorage.getItem(STORAGE_KEY)).filter(isQuestion).slice(-MAX_RECENT_QUESTIONS);
    } catch {
        return [];
    }
}

export function saveRecentQuestions(recent: readonly number[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
    } catch {
        // Sin almacenamiento, la lista dura lo que dure la pestaña.
    }
}
