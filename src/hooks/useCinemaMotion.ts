import { useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
export function useCinemaMotion() {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const media = gsap.matchMedia();
    const sections = [
      ...document.querySelectorAll<HTMLElement>("[data-chapter]"),
    ];
    const observers = sections.map((section, i) =>
      ScrollTrigger.create({
        trigger: section,
        start: "top 40%",
        end: "bottom 40%",
        onEnter: () => setCurrent(i),
        onEnterBack: () => setCurrent(i),
      }),
    );
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) =>
          gsap.from(el, {
            y: 32,
            opacity: 0,
            duration: 0.85,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 94%", once: true },
          }),
        );
      });
      return () => context.revert();
    });
    let pending = 0;
    const update = () => {
      if (pending) return;
      pending = requestAnimationFrame(() => {
        document.documentElement.style.setProperty(
          "--reading-progress",
          String(
            window.scrollY /
              Math.max(
                1,
                document.documentElement.scrollHeight - window.innerHeight,
              ),
          ),
        );
        pending = 0;
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      media.revert();
      observers.forEach((observer) => observer.kill());
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      cancelAnimationFrame(pending);
    };
  }, []);
  return current;
}
