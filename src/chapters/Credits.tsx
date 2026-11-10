import { useState } from "react";
import { ArrowUpRight, Pause, Play, RotateCcw } from "lucide-react";
import ChapterLabel from "../components/ChapterLabel";
import Photo from "../components/Photo";
import { project } from "../config/project";
export default function Credits({
  go,
  newScene,
}: {
  go: (id: string) => void;
  newScene: () => void;
}) {
  const [paused, setPaused] = useState(false);
  return (
    <section
      id="credits"
      className={`chapter credits ${paused ? "credits-paused" : ""}`}
      data-chapter
      aria-labelledby="credits-title"
    >
      <ChapterLabel number="05">ФИНАЛЬНЫЕ ТИТРЫ</ChapterLabel>
      <div className="credits-statement reveal">
        <p>
          КАЖДАЯ ИСТОРИЯ
          <br />
          КОГДА-НИБУДЬ ЗАКАНЧИВАЕТСЯ.
        </p>
        <h2 id="credits-title">
          НО ИСКУССТВО
          <br />
          ВИДЕТЬ{" "}
          <span>
            ОСТАЁТСЯ
            <br />С НАМИ.
          </span>
        </h2>
      </div>
      <div className="credits-content">
        <div className="author-photo">
          <Photo
            name="aliza-credits"
            alt="Чёрно-белый художественный портрет Ализы с длинными светлыми волосами"
          />
          <span className="eyebrow">ПО ТУ СТОРОНУ КАМЕРЫ</span>
        </div>
        <div className="credit-roll">
          <span className="eyebrow">ПО ТУ СТОРОНУ КАДРА</span>
          <p className="credit-project-type">
            Интерактивный кинематографический проект
          </p>
          <div className="author-credit">
            <span>Автор проекта</span>
            <strong>{project.author}</strong>
            <span className="credit-group">Группа {project.group}</span>
          </div>
          <span className="credit-year">{project.year}</span>
          <button
            className="text-button credits-pause-button"
            onClick={() => setPaused(!paused)}
            aria-pressed={paused}
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
            {paused
              ? "Продолжить движение титров"
              : "Остановить движение титров"}
          </button>
        </div>
      </div>
      <div className="credits-final reveal">
        <span className="brand-mark" aria-hidden="true">
          <i />
        </span>
        <p>
          ТЕПЕРЬ ТВОЯ ОЧЕРЕДЬ
          <br />
          РАССКАЗАТЬ ИСТОРИЮ.
        </p>
        <div>
          <button className="primary-button" onClick={newScene}>
            СОЗДАТЬ НОВУЮ СЦЕНУ
            <ArrowUpRight size={18} />
          </button>
          <button className="text-button" onClick={() => go("prologue")}>
            <RotateCcw size={15} />
            Пройти ещё раз
          </button>
        </div>
      </div>
      <footer>
        <span>
          © {project.year} / {project.title.toUpperCase()}
        </span>
        <span>УЧЕБНЫЙ ПРОЕКТ · АВТОР — {project.author.toUpperCase()}</span>
        <button onClick={() => go("prologue")}>К НАЧАЛУ ↑</button>
      </footer>
    </section>
  );
}
