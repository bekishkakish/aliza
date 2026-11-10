import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import ChapterLabel from "../components/ChapterLabel";
import Photo from "../components/Photo";
import { emotions } from "../data/cinema";
export default function Emotions() {
  const [index, setIndex] = useState(2);
  const emotion = emotions[index];
  return (
    <section
      id="emotions"
      className={`chapter emotions emotion-${emotion.className}`}
      data-chapter
      aria-labelledby="emotions-title"
    >
      <ChapterLabel number="02">АНАТОМИЯ ЭМОЦИЙ</ChapterLabel>
      <div className="emotion-heading reveal">
        <span className="eyebrow">ЛИЦО — ТОЛЬКО НАЧАЛО ИСТОРИИ</span>
        <h2 id="emotions-title">
          КАМЕРА ВИДИТ ЛИЦО.
          <br />
          <span className="muted-heading">ЗРИТЕЛЬ ЧУВСТВУЕТ</span>
          <br />
          ИСТОРИЮ<span className="red-period">.</span>
        </h2>
      </div>
      <div className="emotion-stage reveal">
        <div className="emotion-visual" key={emotion.image}>
          <Photo
            name={emotion.image}
            alt={`Ализа с длинными светлыми волосами — кинематографический этюд «${emotion.name}»`}
          />
          <span className="emotion-photo-label">
            АЛИЗА / ЭМОЦИОНАЛЬНЫЙ ЭТЮД 0{index + 1}
          </span>
        </div>
        <div className="emotion-copy" aria-live="polite">
          <span className="emotion-index">
            0{index + 1}
            <span>/ 05</span>
          </span>
          <h3>{emotion.name}</h3>
          <blockquote>«{emotion.quote}»</blockquote>
          <p>{emotion.note}</p>
          <div className="technique">
            <span className="red-tick" />
            {emotion.technique}
          </div>
        </div>
      </div>
      <div
        className="emotion-selector"
        role="group"
        aria-label="Эмоциональные эпизоды"
      >
        {emotions.map((e, i) => (
          <button
            className={i === index ? "selected" : ""}
            key={e.name}
            onClick={() => setIndex(i)}
            aria-pressed={i === index}
          >
            <span>0{i + 1}</span>
            {e.name}
            <ArrowUpRight size={16} />
          </button>
        ))}
      </div>
      <p className="section-footnote">
        Это возможные режиссёрские прочтения. Значение света и жеста меняется
        вместе с контекстом сцены.
      </p>
    </section>
  );
}
