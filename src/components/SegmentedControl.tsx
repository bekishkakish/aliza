import { useLayoutEffect, useRef } from "react";
import { createSpring } from "../lib/spring";

export default function SegmentedControl({
  options,
  value,
  onChange,
  label,
  vertical = false,
}: {
  options: readonly string[];
  value: number;
  onChange: (value: number) => void;
  label: string;
  vertical?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const spring = useRef<ReturnType<
    typeof createSpring<{ x: number; y: number; width: number; height: number }>
  > | null>(null);
  const initialized = useRef(false);
  const measure = useRef<(snap?: boolean) => void>(() => {});
  useLayoutEffect(() => {
    const node = root.current!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let active = false;
    spring.current = createSpring(
      { x: 0, y: 0, width: 0, height: 0 },
      (frame) => {
        const element = indicator.current;
        if (!element) return;
        element.style.transform = `translate3d(${frame.x}px, ${frame.y}px, 0)`;
        element.style.width = `${frame.width}px`;
        element.style.height = `${frame.height}px`;
      },
    );
    measure.current = (snap = false) => {
      if (!active) return;
      const selected = node.querySelector<HTMLButtonElement>(
        '[aria-pressed="true"]',
      );
      if (!selected) return;
      const next = {
        x: selected.offsetLeft,
        y: selected.offsetTop,
        width: selected.offsetWidth,
        height: selected.offsetHeight,
      };
      if (snap || !initialized.current || reduced.matches)
        spring.current?.snap(next);
      else spring.current?.to(next);
      initialized.current = true;
      node.dataset.measured = "true";
    };
    const resize = new ResizeObserver(() => measure.current(true));
    resize.observe(node);
    const onPreference = () => measure.current(true);
    reduced.addEventListener("change", onPreference);
    void document.fonts.ready.then(() => {
      if (node.isConnected) measure.current(true);
    });
    const visibility = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          active = true;
          measure.current(true);
          visibility.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    visibility.observe(node);
    return () => {
      active = false;
      visibility.disconnect();
      resize.disconnect();
      reduced.removeEventListener("change", onPreference);
      spring.current?.stop();
      initialized.current = false;
      delete node.dataset.measured;
    };
  }, []);
  useLayoutEffect(() => {
    measure.current();
  }, [value]);
  function navigate(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = (index + 1) % options.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = (index - 1 + options.length) % options.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else return;
    event.preventDefault();
    onChange(next);
    root.current
      ?.querySelectorAll<HTMLButtonElement>("button")
      [next]?.focus({ preventScroll: true });
  }
  return (
    <div
      ref={root}
      className={`segmented-control ${vertical ? "segmented-vertical" : ""}`}
      role="group"
      aria-label={label}
      data-selected-index={value}
    >
      <span ref={indicator} className="segment-indicator" aria-hidden="true" />
      {options.map((option, index) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === index}
          className={value === index ? "selected" : ""}
          onClick={() => onChange(index)}
          onKeyDown={(event) => navigate(event, index)}
        >
          <span>{option}</span>
        </button>
      ))}
    </div>
  );
}
