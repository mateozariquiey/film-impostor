/** Un título con subtítulo corta la línea tras los dos puntos, donde se leería en un cartel. */
export function TitleLines({ title, partClassName }: { title: string; partClassName: string }) {
  return title.split(/(?<=: )/).map((part, index) => (
    <span key={index} className={partClassName}>
      {part}
    </span>
  ));
}
