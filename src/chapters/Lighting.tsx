import { useMemo, useState } from "react";
import type { PointerEvent } from "react";
import { ChevronsLeftRight } from "lucide-react";
import ChapterLabel from "../components/ChapterLabel";
import SceneCanvas from "../components/SceneCanvas";
import { lights } from "../data/cinema";
import { defaultScene } from "../lib/scene";
export default function Lighting() {
  const [mode, setMode] = useState(1);
  const [compare, setCompare] = useState(false);
  const [other, setOther] = useState(2);
  const [position, setPosition] = useState(50);
  // Day uses a neutral brighter base, the other modes use the same underlying composition.
  const makeSettings = (i: number) => ({
    ...defaultScene,
    environment: 1,
    genre: i === 0 ? 2 : 0,
    light: [1, 1, 0, 3][i],
    mood: i === 0 ? 2 : i === 1 ? 1 : 0,
    composition: 1,
  });
  const settings = useMemo(() => makeSettings(mode), [mode]);
  const otherSettings = useMemo(() => makeSettings(other), [other]);
  const current = lights[mode];
  function dragDivider(event: PointerEvent<HTMLInputElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    setPosition(
      Math.round(
        Math.max(
          0,
          Math.min(100, ((event.clientX - box.left) / box.width) * 100),
        ),
      ),
    );
  }
  return (
    <section
      id="lighting"
      className="chapter lighting"
      data-chapter
      aria-labelledby="lighting-title"
    >
      <ChapterLabel number="03">СВЕТ МЕНЯЕТ ВСЁ</ChapterLabel>
      <div className="section-heading reveal">
        <h2 id="lighting-title">
          СВЕТ НЕ ПРОСТО
          <br />
          ПОКАЗЫВАЕТ.
          <br />
          <span className="muted-heading">ОН РАССКАЗЫВАЕТ.</span>
        </h2>
        <div className="heading-aside">
          <svg
            className="sun-symbol"
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M32 4v56M4 32h56M13 13l38 38M13 51l38-38" />
            <circle cx="32" cy="32" r="4" />
          </svg>
          <p>
            Одна комната. Одно окно. Четыре разных истории.
          </p>
        </div>
      </div>
      <div className="lighting-view reveal">
        <div className={`lighting-base ${mode === 0 ? "day-scene" : ""}`}>
          <SceneCanvas settings={settings} />
        </div>
        {compare && (
          <div
            className={`lighting-compare ${other === 0 ? "day-scene" : ""}`}
            style={{ clipPath: `inset(0 0 0 ${position}%)` }}
          >
            <SceneCanvas settings={otherSettings} />
          </div>
        )}
        <div className="light-label light-label-left">
          <span className="status-dot" />
          {current.name}
          <small>{current.temp}</small>
        </div>
        {compare && (
          <>
            <div className="light-label light-label-right">
              {lights[other].name}
            </div>
            <div
              className="compare-handle"
              style={{ left: `${position}%` }}
              aria-hidden="true"
            />
            <ChevronsLeftRight
              className="compare-knob"
              size={21}
              style={{ left: `clamp(24px, ${position}%, calc(100% - 24px))` }}
              aria-hidden="true"
            />
            <input
              className="compare-range"
              aria-label="Положение разделителя сравнения света"
              type="range"
              min="0"
              max="100"
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.focus();
                e.currentTarget.setPointerCapture(e.pointerId);
                dragDivider(e);
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  dragDivider(e);
              }}
            />
          </>
        )}
      </div>
      <div className="lighting-controls">
        <div className="light-tabs" role="group" aria-label="Режим освещения">
          {lights.map((light, i) => (
            <button
              key={light.id}
              onClick={() => setMode(i)}
              aria-pressed={mode === i}
              className={mode === i ? "selected" : ""}
            >
              <span className={`light-swatch ${light.id}`} />
              {light.name}
            </button>
          ))}
        </div>
        <button
          className={`compare-button ${compare ? "selected" : ""}`}
          aria-pressed={compare}
          onClick={() => setCompare(!compare)}
        >
          <ChevronsLeftRight size={17} />
          СРАВНИТЬ СВЕТ
        </button>
      </div>
      {compare && (
        <div className="compare-settings">
          <label>
            Справа
            <select
              aria-label="Освещение справа"
              value={other}
              onChange={(e) => setOther(Number(e.target.value))}
            >
              {lights.map((light, i) => (
                <option key={light.id} value={i}>
                  {light.name}
                </option>
              ))}
            </select>
          </label>
          <button onClick={() => setPosition((v) => Math.max(0, v - 10))}>
            ← Меньше
          </button>
          <button onClick={() => setPosition(50)}>50 / 50</button>
          <button onClick={() => setPosition((v) => Math.min(100, v + 10))}>
            Больше →
          </button>
          <span>Перетащите линию или используйте стрелки клавиатуры.</span>
        </div>
      )}
      <div className="lighting-note" aria-live="polite">
        <span className="eyebrow">{current.label}</span>
        <p>{current.text}</p>
        <span className="eyebrow light-note-tail">
          СВЕТ — ЭТО ТОЖЕ РЕЖИССУРА
        </span>
      </div>
    </section>
  );
}
