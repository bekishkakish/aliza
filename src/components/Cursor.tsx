import { useEffect, useRef } from "react";
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      !matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)")
        .matches
    )
      return;
    const move = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      el.classList.add("visible");
      el.classList.toggle(
        "hover",
        !!(e.target as Element).closest("button, a, input, select"),
      );
    };
    const hide = () => ref.current?.classList.remove("visible");
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", hide);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", hide);
    };
  }, []);
  return (
    <div className="cinema-cursor" ref={ref} aria-hidden="true">
      <span />
    </div>
  );
}
