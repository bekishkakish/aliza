import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Expand,
  LoaderCircle,
  Share2,
  Shuffle,
  X,
} from "lucide-react";
import ChapterLabel from "../components/ChapterLabel";
import SceneCanvas from "../components/SceneCanvas";
import {
  defaultScene,
  describeScene,
  options,
  randomScene,
  readScene,
  sceneURL,
} from "../lib/scene";
import type { SceneKey, SceneSettings } from "../lib/scene";
import { exportPoster } from "../lib/renderer";
import LabControls from "../components/laboratory/LabControls";
import EnvironmentPicker from "../components/laboratory/EnvironmentPicker";
import LabPoster from "../components/laboratory/LabPoster";

export default function Laboratory({
  go,
  session,
}: {
  go: (id: string) => void;
  session: number;
}) {
  const [settings, setSettings] = useState<SceneSettings>(() => readScene());
  const [poster, setPoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [note, setNote] = useState(false);
  useEffect(() => {
    if (session === 0) return;
    setSettings({ ...defaultScene });
    setPoster(false);
    setShareLink("");
    setStatus("");
  }, [session]);
  const fullscreen = useRef<HTMLDialogElement>(null);
  const resultTitle = useRef<HTMLHeadingElement>(null);
  const description = describeScene(settings);
  function update(key: SceneKey, value: number) {
    setSettings((s) => ({ ...s, [key]: value }));
    setShareLink("");
    setStatus("");
  }
  function create() {
    setPoster(true);
    setStatus("Сцена создана. Ваш режиссёрский этюд готов.");
    requestAnimationFrame(() =>
      resultTitle.current?.focus({ preventScroll: true }),
    );
  }
  async function save() {
    setSaving(true);
    setStatus("");
    try {
      const blob = await exportPoster(settings);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `beyond-the-frame-${settings.environment}-${settings.genre}-${settings.mood}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setStatus("PNG готов. Файл передан браузеру для сохранения.");
    } catch (e) {
      setStatus(
        e instanceof Error
          ? e.message
          : "Не удалось сохранить кадр. Попробуйте ещё раз.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function share() {
    const url = sceneURL(settings);
    setShareLink(url);
    if (navigator.share) {
      try {
        await navigator.share({
          title: description.title,
          text: "Мой режиссёрский этюд в проекте «По ту сторону кадра»",
          url,
        });
        setStatus("Ссылка передана в меню отправки.");
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          setStatus("Ссылка доступна ниже.");
          return;
        }
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Ссылка скопирована. Она восстановит все параметры сцены.");
    } catch {
      setStatus(
        "Скопируйте ссылку из поля ниже — все параметры уже сохранены в ней.",
      );
    }
  }
  function reset() {
    setSettings({ ...defaultScene });
    setPoster(false);
    setShareLink("");
    setStatus("Настройки сброшены.");
  }
  return (
    <section
      id="laboratory"
      className="chapter laboratory"
      data-chapter
      aria-labelledby="lab-title"
    >
      <ChapterLabel number="04">РЕЖИССЁРСКАЯ ЛАБОРАТОРИЯ</ChapterLabel>
      <div className="lab-heading reveal">
        <div>
          <span className="eyebrow">ВЫ УЖЕ ЗНАЕТЕ ЯЗЫК. ПОРА ЗАГОВОРИТЬ.</span>
          <h2 id="lab-title">
            ТЕПЕРЬ
            <br />
            РЕЖИССЁР — <span className="red-word">ТЫ.</span>
          </h2>
        </div>
        <p>
          Одна сцена. Бесконечное количество интерпретаций.
          <br />
          <span>Выберите пространство, найдите свет, задайте настроение.</span>
        </p>
      </div>
      <div className={`lab-workspace ${poster ? "poster-mode" : ""}`}>
        {!poster && (
          <LabControls settings={settings} update={update} reset={reset} />
        )}
        <div className="lab-screen-panel">
          <div className="lab-monitor">
            <div className="monitor-top">
              <span>
                <span className="record-dot" />
                {poster
                  ? "РЕЖИССЁРСКИЙ ЭТЮД / ГОТОВО"
                  : "ПРЕДПРОСМОТР / ВАША СЦЕНА"}
              </span>
              <button
                className="icon-button"
                onClick={() => fullscreen.current?.showModal()}
                aria-label="Посмотреть кадр без интерфейса"
              >
                <Expand size={17} />
              </button>
            </div>
            <SceneCanvas settings={settings} />
            <div className="monitor-bottom">
              <span>
                {options.environment[settings.environment].toUpperCase()}
              </span>
              <span>
                16:9 / {options.shot[settings.shot].toUpperCase()} ПЛАН
              </span>
            </div>
          </div>
          {poster ? (
            <LabPoster
              settings={settings}
              titleRef={resultTitle}
              edit={() => {
                setPoster(false);
                setStatus("");
              }}
            />
          ) : (
            <>
              <EnvironmentPicker
                value={settings.environment}
                onChange={(value) => update("environment", value)}
              />
              <div className="live-description" aria-live="polite">
                <span className="eyebrow">РЕЖИССЁРСКАЯ ЗАМЕТКА</span>
                <h3>{description.title}</h3>
                <p>{description.description}</p>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="lab-actions">
        <div>
          {!poster && (
            <button className="primary-button" onClick={create}>
              СОЗДАТЬ СЦЕНУ
              <ArrowUpRight size={18} />
            </button>
          )}
          {poster && (
            <button className="primary-button" onClick={() => go("credits")}>
              К ФИНАЛЬНЫМ ТИТРАМ
              <ArrowUpRight size={18} />
            </button>
          )}
          <button
            className="secondary-button"
            onClick={() => {
              setSettings(randomScene());
              setPoster(false);
              setShareLink("");
              setStatus(
                "Новый вариант готов. Исследуйте сочетание параметров.",
              );
            }}
          >
            <Shuffle size={16} />
            Случайный вариант
          </button>
        </div>
        <div>
          <button
            className="secondary-button"
            onClick={() => void save()}
            disabled={saving}
          >
            {saving ? (
              <LoaderCircle size={16} className="spin" />
            ) : (
              <ArrowDownToLine size={16} />
            )}
            {saving ? "Сохранение…" : "Сохранить кадр"}
          </button>
          <button className="secondary-button" onClick={() => void share()}>
            <Share2 size={16} />
            Поделиться
          </button>
        </div>
      </div>
      <p className="lab-status" role="status">
        {status}
      </p>
      {shareLink && (
        <div className="share-field">
          <label htmlFor="scene-link">Ссылка на вашу сцену</label>
          <input
            id="scene-link"
            readOnly
            value={shareLink}
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            onClick={() => {
              const el = document.getElementById(
                "scene-link",
              ) as HTMLInputElement;
              el.focus();
              el.select();
            }}
          >
            Выделить
          </button>
        </div>
      )}
      <div className="lab-footnote">
        <p>
          Конструктор работает с подготовленными кадрами, световыми слоями и
          композицией. Описание составляется по вашим настройкам.
        </p>
        <button
          className="secret-note"
          onClick={() => setNote(!note)}
          aria-expanded={note}
        >
          [ ЗАМЕТКА НА ПОЛЯХ ]
        </button>
      </div>
      {note && (
        <p className="secret-note-text">
          Попробуйте оставить половину кадра пустой. Иногда режиссёрское решение
          — это то, от чего вы отказались.
        </p>
      )}
      <dialog
        className="frame-dialog"
        ref={fullscreen}
        aria-label="Просмотр сцены без интерфейса"
      >
        <button
          className="icon-button frame-close"
          onClick={() => fullscreen.current?.close()}
          aria-label="Закрыть просмотр кадра"
        >
          <X />
        </button>
        <SceneCanvas settings={settings} />
        <p>{description.title}</p>
      </dialog>
    </section>
  );
}
