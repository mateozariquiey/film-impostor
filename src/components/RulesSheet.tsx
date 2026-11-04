import type { Ref } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/game";
import { Sheet } from "./Sheet";
import styles from "./RulesSheet.module.css";

export function RulesSheet({ ref }: { ref: Ref<HTMLDialogElement> }) {
  const { t } = useLocale();
  return (
    <Sheet ref={ref} titleId="reglas">
      <h2 id="reglas" className={styles.titulo}>
        {t.rules.title}
      </h2>
      <p className={styles.intro}>{t.rules.intro(MIN_PLAYERS, MAX_PLAYERS)}</p>
      <ol className={styles.pasos}>
        {t.rules.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {/* iOS no avisa de que se puede instalar, así que hay que contarlo. */}
      <h3 className={styles.apartado}>{t.rules.installTitle}</h3>
      <p className={styles.instalar}>{t.rules.installIntro}</p>
      <p className={styles.instalar}>{t.rules.installIos}</p>
      <p className={styles.instalar}>{t.rules.installAndroid}</p>
      <p className={`secundario ${styles.credito}`}>
        {t.rules.creditBefore}
        <a href="https://www.themoviedb.org/">The Movie Database</a>
        {t.rules.creditAfter}
      </p>
      <form method="dialog">
        <button className="accion">{t.rules.understood}</button>
      </form>
    </Sheet>
  );
}
