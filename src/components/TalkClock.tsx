import { useEffect, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { useLocale } from "@/contexts/LocaleContext";
import { playChime, prepareChime } from "@/lib/chime";
import { formatTalkTime, pauseTalkTimer, resumeTalkTimer, talkRemainingMs } from "@/lib/talkTimer";
import styles from "./TalkClock.module.css";

/** El tiempo de conversación, si el grupo lo ha pedido. Suave: ni parpadea ni cambia de color, y al acabar da un aviso y nada más. */
export function TalkClock() {
  const { talkTimer, setTalkTimer } = useGame();
  const { t } = useLocale();
  const [now, setNow] = useState(Date.now);

  const endsAt = talkTimer?.status === "running" ? talkTimer.endsAt : null;

  useEffect(() => {
    if (endsAt === null) return;
    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (current < endsAt) return;
      setTalkTimer({ status: "over", skipped: false });
      playChime();
    };
    const interval = window.setInterval(tick, 250);
    // En segundo plano el intervalo casi no corre: al volver se mira enseguida si ya se ha acabado.
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [endsAt, setTalkTimer]);

  if (!talkTimer) return null;

  if (talkTimer.status === "over") {
    return (
      <p className={styles.reloj} role="status">
        {talkTimer.skipped ? t.table.timeSkipped : t.table.timeOver}
      </p>
    );
  }

  const paused = talkTimer.status === "paused";
  return (
    <div className={styles.reloj}>
      <span role="timer" aria-label={t.table.timeLeft} className={`cartelon ${styles.cifra}`} data-pausado={paused || undefined}>
        {formatTalkTime(talkRemainingMs(talkTimer, now))}
      </span>
      <span className={styles.botones}>
        <button
          type="button"
          className="enlace"
          onClick={() => {
            prepareChime();
            const current = Date.now();
            setNow(current);
            setTalkTimer(paused ? resumeTalkTimer(talkTimer, current) : pauseTalkTimer(talkTimer, current));
          }}
        >
          {paused ? t.table.resumeTime : t.table.pauseTime}
        </button>
        <button type="button" className="enlace" onClick={() => setTalkTimer({ status: "over", skipped: true })}>
          {t.table.skipTime}
        </button>
      </span>
    </div>
  );
}
