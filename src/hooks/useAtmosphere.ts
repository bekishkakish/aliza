import { useEffect, useRef, useState } from "react";
export function useAtmosphere() {
  const audio = useRef<{ context: AudioContext; gain: GainNode } | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(35);
  const [error, setError] = useState("");
  async function toggle() {
    try {
      if (!audio.current) {
        const context = new AudioContext();
        const gain = context.createGain();
        gain.gain.value = 0;
        gain.connect(context.destination);
        [55, 82.41, 110.2].forEach((frequency, i) => {
          const oscillator = context.createOscillator();
          oscillator.type = "sine";
          oscillator.frequency.value = frequency;
          const channel = context.createGain();
          channel.gain.value = i === 0 ? 0.5 : 0.15;
          oscillator.connect(channel);
          channel.connect(gain);
          oscillator.start();
        });
        audio.current = { context, gain };
      }
      await audio.current.context.resume();
      setEnabled((value) => !value);
      setError("");
    } catch {
      setError("Звук недоступен в этом браузере.");
    }
  }
  useEffect(() => {
    const update = () => {
      const a = audio.current;
      if (!a) return;
      a.gain.gain.setTargetAtTime(
        enabled && !document.hidden ? (volume / 100) * 0.075 : 0,
        a.context.currentTime,
        0.5,
      );
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [enabled, volume]);
  useEffect(
    () => () => {
      void audio.current?.context.close();
      audio.current = null;
    },
    [],
  );
  return { enabled, volume, setVolume, toggle, error };
}
