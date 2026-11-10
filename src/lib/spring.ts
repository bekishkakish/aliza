type Values = Record<string, number>;

/** A critically damped spring. Retargeting preserves both position and velocity. */
export function createSpring<T extends Values>(
  initial: T,
  paint: (values: T) => void,
  response = 0.34,
) {
  let current = { ...initial };
  let target = { ...initial };
  const velocity = Object.fromEntries(
    Object.keys(initial).map((key) => [key, 0]),
  ) as T;
  let frame = 0;
  let previous = 0;
  const frequency = 7 / response;

  function tick(time: number) {
    const dt = previous ? Math.min((time - previous) / 1000, 0.04) : 1 / 60;
    previous = time;
    const decay = Math.exp(-frequency * dt);
    let moving = false;
    for (const key of Object.keys(current) as (keyof T)[]) {
      const distance = current[key] - target[key];
      const impulse = velocity[key] + frequency * distance;
      const next = target[key] + (distance + impulse * dt) * decay;
      velocity[key] = ((velocity[key] - frequency * impulse * dt) *
        decay) as T[keyof T];
      current[key] = next as T[keyof T];
      if (
        Math.abs(next - target[key]) > 0.001 ||
        Math.abs(velocity[key]) > 0.01
      )
        moving = true;
    }
    if (!moving) current = { ...target };
    paint(current);
    frame = moving ? requestAnimationFrame(tick) : 0;
    if (!moving) previous = 0;
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
  }
  return {
    to(next: T) {
      target = { ...next };
      if (!frame) frame = requestAnimationFrame(tick);
    },
    snap(next: T) {
      stop();
      current = { ...next };
      target = { ...next };
      for (const key of Object.keys(velocity) as (keyof T)[])
        velocity[key] = 0 as T[keyof T];
      paint(current);
    },
    stop,
  };
}
