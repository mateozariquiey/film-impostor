let context: AudioContext | null = null;

/**
 * Deja el sonido listo. iOS solo permite arrancar el audio dentro de un toque, y el aviso llega
 * minutos después sin que nadie toque nada, así que hay que llamarlo desde el toque anterior.
 */
export function prepareChime(): void {
    try {
        // Con «ambient», el aviso respeta el modo silencio de iOS y no corta la música que esté sonando.
        const { audioSession } = navigator as Navigator & { audioSession?: { type: string } };
        if (audioSession) audioSession.type = 'ambient';
        context ??= new AudioContext();
        void context.resume();
    } catch {
        // Sin audio queda el aviso en pantalla y la vibración.
    }
}

/** Dos notas suaves, sin archivo que descargar, para que también suene sin conexión. */
export function scheduleChime(audio: BaseAudioContext, at: number): void {
    [
        { frequency: 523.25, start: 0 },
        { frequency: 659.25, start: 0.28 },
    ].forEach(({ frequency, start }) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, at + start);
        gain.gain.exponentialRampToValueAtTime(0.18, at + start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + start + 0.9);
        oscillator.connect(gain).connect(audio.destination);
        oscillator.start(at + start);
        oscillator.stop(at + start + 0.95);
    });
}

export function playChime(): void {
    navigator.vibrate?.([120, 80, 120]);
    prepareChime();
    if (context) scheduleChime(context, context.currentTime + 0.02);
}
