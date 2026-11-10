import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, Volume2, VolumeX, X } from "lucide-react";
import { chapters } from "../config/project";
import { useAtmosphere } from "../hooks/useAtmosphere";
export default function Navigation({
  current,
  go,
}: {
  current: number;
  go: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const sound = useAtmosphere();
  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      document.body.classList.add("menu-open");
    } else {
      dialog.current?.close();
      document.body.classList.remove("menu-open");
    }
    return () => document.body.classList.remove("menu-open");
  }, [open]);
  function close() {
    setOpen(false);
    menuButton.current?.focus();
  }
  function navigate(id: string) {
    close();
    go(id);
  }
  return (
    <>
      <header className="site-header">
        <a
          href="#prologue"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            go("prologue");
          }}
          aria-label="По ту сторону кадра — к прологу"
        >
          <span className="brand-mark" aria-hidden="true">
            <i />
          </span>
          <span>
            ПО ТУ СТОРОНУ
            <br />
            КАДРА<span className="brand-dot">.</span>
          </span>
        </a>
        <span className="header-caption">ИСКУССТВО ВИДЕТЬ ТО, ЧТО СКРЫТО</span>
        <div className="header-actions">
          <span className="header-chapter">
            <span className="status-dot" />
            {String(current).padStart(2, "0")} <span>/ 05</span>
          </span>
          <button
            className="icon-button sound-button"
            onClick={() => void sound.toggle()}
            aria-label={sound.enabled ? "Выключить звук" : "Включить звук"}
            aria-pressed={sound.enabled}
          >
            {sound.enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            ref={menuButton}
            className="menu-button"
            onClick={() => setOpen(true)}
            aria-label="Открыть меню"
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            <span>МЕНЮ</span>
            <Menu size={20} />
          </button>
        </div>
      </header>
      <div className="reading-progress" aria-hidden="true">
        <span />
      </div>
      <dialog
        ref={dialog}
        className="chapter-menu"
        aria-labelledby="menu-title"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
      >
        <div className="menu-top">
          <span id="menu-title" className="eyebrow">
            МОНТАЖНЫЙ ЛИСТ / 6 ГЛАВ
          </span>
          <button
            className="icon-button"
            onClick={close}
            aria-label="Закрыть меню"
          >
            <X />
          </button>
        </div>
        <nav aria-label="Главы проекта">
          {chapters.map((chapter, i) => (
            <button
              key={chapter.id}
              className={current === i ? "menu-link active" : "menu-link"}
              onClick={() => navigate(chapter.id)}
              aria-current={current === i ? "location" : undefined}
            >
              <span className="menu-number">0{i}</span>
              <span>{chapter.name}</span>
              <ArrowUpRight aria-hidden="true" />
            </button>
          ))}
        </nav>
        <div className="menu-bottom">
          <p>Не спешите. У каждой сцены — свой ритм.</p>
          <div className="volume-control">
            <button
              onClick={() => void sound.toggle()}
              aria-pressed={sound.enabled}
            >
              {sound.enabled ? "Звук включён" : "Звук выключен"}
            </button>
            <label>
              Громкость
              <input
                aria-label="Громкость атмосферы"
                type="range"
                min="0"
                max="100"
                value={sound.volume}
                onChange={(e) => sound.setVolume(Number(e.target.value))}
              />
            </label>
          </div>
        </div>
      </dialog>
      {sound.error && (
        <p className="sound-error" role="status">
          {sound.error}
        </p>
      )}
    </>
  );
}
