import { useEffect, useState } from "react";
import gsap from "gsap";
import { ArrowDown, ArrowUpRight, MoveRight } from "lucide-react";
import { chapters } from "../config/project";
import Photo from "../components/Photo";
export default function Prologue({
  go,
  replay,
}: {
  go: (id: string) => void;
  replay: number;
}) {
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    setPortrait(false);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const motion = gsap.context(() => {
      gsap.from(".hero-reveal", {
        y: 28,
        opacity: 0,
        stagger: 0.12,
        duration: 1.1,
        ease: "power3.out",
        delay: 0.1,
      });
    });
    const enter = setTimeout(() => setPortrait(true), 6500);
    const leave = setTimeout(() => setPortrait(false), 11000);
    return () => {
      clearTimeout(enter);
      clearTimeout(leave);
      motion.revert();
    };
  }, [replay]);
  return (
    <section
      id="prologue"
      className="prologue"
      data-chapter
      aria-labelledby="prologue-title"
    >
      <div
        className={`hero-visual ${portrait ? "show-portrait" : ""}`}
        aria-hidden="true"
      >
        <Photo name="theatre" alt="" eager />
        <Photo name="aliza-portrait" alt="" className="hero-portrait" />
      </div>
      <div className="hero-shade" />
      <div className="hero-content">
        <div className="hero-kicker hero-reveal">
          <span className="status-dot" />
          ЦИФРОВОЙ КИНЕМАТОГРАФИЧЕСКИЙ ОПЫТ
          <span className="hero-edition">EST. 2026</span>
        </div>
        <h1 id="prologue-title">
          <span className="hero-reveal">КАЖДАЯ ИСТОРИЯ</span>
          <span className="hero-reveal">НАЧИНАЕТСЯ</span>
          <span className="hero-reveal hero-last">
            С ТИШИНЫ<span className="red-period">.</span>
          </span>
        </h1>
        <div className="hero-description hero-reveal">
          <span className="small-line" />
          <p>
            Иногда, чтобы увидеть главное,
            <br />
            нужно заглянуть за пределы кадра.
          </p>
        </div>
        <div className="hero-buttons hero-reveal">
          <button className="primary-button" onClick={() => go("framing")}>
            НАЧАТЬ ПРОСМОТР <ArrowUpRight size={19} />
          </button>
          <button
            className="text-button skip-intro"
            onClick={() => go("framing")}
          >
            Пропустить вступление <MoveRight size={17} />
          </button>
        </div>
      </div>
      <div className="hero-bottom">
        <button className="scroll-hint" onClick={() => go("framing")}>
          <ArrowDown size={16} />
          <span>ЛИСТАЙТЕ, ЧТОБЫ УВИДЕТЬ БОЛЬШЕ</span>
        </button>
        <div className="hero-frame-toggle" aria-label="Кадры пролога">
          <button aria-pressed={!portrait} onClick={() => setPortrait(false)}>
            01 / ПРОСТРАНСТВО
          </button>
          <span />
          <button aria-pressed={portrait} onClick={() => setPortrait(true)}>
            02 / ЧЕЛОВЕК
          </button>
        </div>
        <span className="hero-film-label">ВНЕ ГРАНИЦ ПРИВЫЧНОГО</span>
      </div>
      <nav className="chapter-strip" aria-label="Путешествие по главам">
        {chapters.slice(1, 5).map((c, i) => (
          <button key={c.id} onClick={() => go(c.id)}>
            <span className="strip-number">0{i + 1}</span>
            <span>
              <strong>{c.name}</strong>
              <small>{c.note}</small>
            </span>
            <ArrowUpRight size={17} />
          </button>
        ))}
      </nav>
    </section>
  );
}
