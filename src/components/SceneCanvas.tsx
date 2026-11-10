import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { SceneSettings } from "../lib/scene";
import { describeScene } from "../lib/scene";
import { drawScene } from "../lib/renderer";
export default function SceneCanvas({ settings }: { settings: SceneSettings }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const previousFrame = useRef<HTMLCanvasElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const version = useRef(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [active, setActive] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const hasFrame = useRef(false);
  useEffect(() => {
    const previous = previousFrame.current;
    return () => {
      if (previous) gsap.killTweensOf(previous);
    };
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!active) return;
    const request = ++version.current;
    const buffer = document.createElement("canvas");
    buffer.width = 1600;
    buffer.height = 900;
    setBusy(true);
    drawScene(buffer, settings)
      .then(() => {
        if (request !== version.current || !ref.current) return;
        const previous = previousFrame.current;
        if (
          previous &&
          hasFrame.current &&
          !matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          // Capture the visible blend, so another choice can interrupt this fade without a jump.
          const visible = document.createElement("canvas");
          visible.width = 1600;
          visible.height = 900;
          const context = visible.getContext("2d")!;
          context.drawImage(ref.current, 0, 0);
          context.globalAlpha = Number(previous.style.opacity || 0);
          context.drawImage(previous, 0, 0);
          gsap.killTweensOf(previous);
          previous.getContext("2d")?.drawImage(visible, 0, 0);
          gsap.fromTo(
            previous,
            { opacity: 1 },
            { opacity: 0, duration: 0.32, ease: "power1.out" },
          );
        } else if (previous) {
          gsap.killTweensOf(previous);
          previous.style.opacity = "0";
        }
        ref.current.getContext("2d")?.drawImage(buffer, 0, 0);
        hasFrame.current = true;
        setError("");
        setBusy(false);
        setDrawn(true);
      })
      .catch((e: Error) => {
        if (request === version.current) {
          setError(e.message);
          setBusy(false);
        }
      });
    return () => {
      version.current++;
    };
  }, [settings, active]);
  return (
    <div
      ref={container}
      className="scene-canvas"
      aria-busy={active && busy}
      data-ready={drawn}
    >
      <canvas
        ref={ref}
        width={1600}
        height={900}
        role="img"
        aria-label={`Предпросмотр сцены «${describeScene(settings).title}»`}
      />
      <canvas
        ref={previousFrame}
        width={1600}
        height={900}
        className="scene-previous"
        aria-hidden="true"
      />
      {error && (
        <p className="canvas-error" role="alert">
          {error}{" "}
          <button onClick={() => window.location.reload()}>Обновить</button>
        </p>
      )}
    </div>
  );
}
