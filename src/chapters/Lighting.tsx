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
          <span className="sun-symbol" aria-hidden="true">
            ✳
          </span>
          <p>
            Одна комната. Одно окно.
            <br />
            Четыре разных истории.
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
            >
              <ChevronsLeftRight size={21} />
            </div>
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
