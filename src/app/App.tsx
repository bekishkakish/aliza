import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Navigation from "../components/Navigation";
import Cursor from "../components/Cursor";
import Prologue from "../chapters/Prologue";
import Framing from "../chapters/Framing";
import Emotions from "../chapters/Emotions";
import Lighting from "../chapters/Lighting";
import Laboratory from "../chapters/Laboratory";
import Credits from "../chapters/Credits";
import { useCinemaMotion } from "../hooks/useCinemaMotion";
import { useTactileFeedback } from "../hooks/useTactileFeedback";
export default function App() {
  const current = useCinemaMotion();
  useTactileFeedback();
  const [introVersion, setIntroVersion] = useState(0);
  const [studioSession, setStudioSession] = useState(0);
  const transition = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const go = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    if (id === "prologue") setIntroVersion((value) => value + 1);
    const scroll = () => {
      target.scrollIntoView({ behavior: "instant", block: "start" });
      history.replaceState(
        null,
        "",
        `${location.pathname}${location.search}#${id}`,
      );
    };
    timeline.current?.kill();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(transition.current, { opacity: 0 });
      scroll();
      return;
    }
    timeline.current = gsap
      .timeline()
      .to(transition.current, { opacity: 1, duration: 0.22, ease: "power1.in" })
      .call(scroll)
      .to(transition.current, {
        opacity: 0,
        duration: 0.38,
        ease: "power1.out",
      })
      .set(transition.current, { pointerEvents: "none" });
  }, []);
  useEffect(() => {
    const id = new URLSearchParams(location.search).has("scene")
      ? "laboratory"
      : location.hash.slice(1);
    const timer = setTimeout(() => {
      if (id)
        document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
    }, 100);
    return () => {
      clearTimeout(timer);
      timeline.current?.kill();
    };
  }, []);
  return (
    <>
      <a className="skip-link" href="#main">
        Перейти к содержанию
      </a>
      <Navigation current={current} go={go} />
      <main id="main">
        <Prologue go={go} replay={introVersion} />
        <Framing />
        <Emotions />
        <Lighting />
        <Laboratory go={go} session={studioSession} />
        <Credits
          go={go}
          newScene={() => {
            setStudioSession((value) => value + 1);
            go("laboratory");
          }}
        />
      </main>
      <Cursor />
      <div className="film-grain" aria-hidden="true" />
      <div ref={transition} className="chapter-transition" aria-hidden="true" />
    </>
  );
}
