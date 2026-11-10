import { useState } from "react";
import { ArrowDownRight, ScanLine } from "lucide-react";
import ChapterLabel from "../components/ChapterLabel";
import Photo from "../components/Photo";
import { shots } from "../data/cinema";
export default function Framing() {
  const [index, setIndex] = useState(0);
  const [grid, setGrid] = useState(false);
  const shot = shots[index];
  return (
    <section
      id="framing"
      className="chapter framing"
      data-chapter
      aria-labelledby="framing-title"
    >
      <ChapterLabel number="01">ИСКУССТВО ВИДЕТЬ</ChapterLabel>
      <div className="section-heading reveal">
        <h2 id="framing-title">
          ОДНА СЦЕНА.
          <br />
          <span className="muted-heading">ТЫСЯЧА СПОСОБОВ</span>
          <br />
          УВИДЕТЬ<span className="red-period">.</span>
        </h2>
        <div className="heading-aside">
          <ArrowDownRight size={36} strokeWidth={1} />
          <p>
            То, что остаётся за границами кадра, иногда важнее того, что
            находится внутри.
          </p>
          <span className="eyebrow">ЭТЮДЫ О ДИСТАНЦИИ</span>
        </div>
      </div>
      <div className="framing-workspace reveal">
        <div className="viewfinder">
          <div className="shot-image" key={shot.image}>
            <Photo name={shot.image} alt={shot.alt} />
          </div>
          <div className="finder-corners" aria-hidden="true" />
          {grid && <div className="thirds-grid" aria-hidden="true" />}
          <div className="finder-top">
            <span>
              <i className="record-dot" />
              ЭТЮД 0{index + 1}
            </span>
            <span>{shot.english}</span>
          </div>
          <div className="finder-bottom">
            <span>24 FPS / ВИЗУАЛЬНЫЙ ЭТЮД</span>
            <button
              className="icon-button"
              onClick={() => setGrid(!grid)}
              aria-label="Сетка третей"
              aria-pressed={grid}
            >
              <ScanLine size={18} />
            </button>
            <span>16:9</span>
          </div>
        </div>
        <div className="shot-tabs" role="group" aria-label="Крупность кадра">
          {shots.map((s, i) => (
            <button
              key={s.name}
              className={i === index ? "selected" : ""}
              onClick={() => setIndex(i)}
              aria-pressed={i === index}
            >
              <span>0{i + 1}</span>
              {s.name}
              <span className="selection-dot" />
            </button>
          ))}
        </div>
        <div className="shot-description" aria-live="polite">
          <span className="eyebrow">{shot.name}</span>
          <h3>{shot.title}</h3>
          <p>{shot.description}</p>
          <dl>
            <div>
              <dt>ЧТО ЧУВСТВУЕМ</dt>
              <dd>{shot.effect}</dd>
            </div>
            <div>
              <dt>ЗАЧЕМ РЕЖИССЁРУ</dt>
              <dd>{shot.use}</dd>
            </div>
          </dl>
        </div>
      </div>
      <p className="section-footnote">
        Четыре постановочных этюда показывают разные дистанции до героя. Метки
        видоискателя — часть оформления фотографий.
      </p>
    </section>
  );
}
