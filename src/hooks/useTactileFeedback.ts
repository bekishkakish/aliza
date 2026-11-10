import { useEffect } from "react";
import { createSpring } from "../lib/spring";

export function useTactileFeedback() {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const springs = new Map<
      HTMLButtonElement,
      ReturnType<typeof createSpring<{ scale: number }>>
    >();
    let pressed: HTMLButtonElement | null = null;
    function controller(button: HTMLButtonElement) {
      if (!springs.has(button))
        springs.set(
          button,
          createSpring(
            { scale: 1 },
            (value) => {
              button.style.scale = String(value.scale);
            },
            0.28,
          ),
        );
      return springs.get(button)!;
    }
    function release() {
      if (!pressed) return;
      pressed.classList.remove("is-pressing");
      if (reduced.matches) controller(pressed).snap({ scale: 1 });
      else controller(pressed).to({ scale: 1 });
      pressed = null;
    }
    function press(target: EventTarget | null) {
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>("button");
      if (!button || button.disabled) return;
      release();
      pressed = button;
      button.classList.add("is-pressing");
      if (!reduced.matches) controller(button).to({ scale: 0.975 });
    }
    const down = (event: PointerEvent) => {
      if (event.button === 0) press(event.target);
    };
    const keyDown = (event: KeyboardEvent) => {
      if ((event.key === "Enter" || event.key === " ") && !event.repeat)
        press(event.target);
    };
    const keyUp = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") release();
    };
    const change = () => {
      release();
      springs.forEach((spring) => spring.snap({ scale: 1 }));
    };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointerup", release, true);
    document.addEventListener("pointercancel", release, true);
    document.addEventListener("keydown", keyDown, true);
    document.addEventListener("keyup", keyUp, true);
    window.addEventListener("blur", release);
    reduced.addEventListener("change", change);
    return () => {
      release();
      springs.forEach((spring) => spring.stop());
      springs.forEach((_, button) => button.style.removeProperty("scale"));
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointerup", release, true);
      document.removeEventListener("pointercancel", release, true);
      document.removeEventListener("keydown", keyDown, true);
      document.removeEventListener("keyup", keyUp, true);
      window.removeEventListener("blur", release);
      reduced.removeEventListener("change", change);
    };
  }, []);
}
