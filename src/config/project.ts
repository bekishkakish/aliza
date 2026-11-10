export const project = {
  author: "БЕЙСЕМБИНА АЛИЗА",
  group: "Р-26-02",
  year: 2026,
  title: "По ту сторону кадра",
} as const;
export const chapters = [
  { id: "prologue", name: "Пролог", note: "Начните с тишины" },
  { id: "framing", name: "Искусство видеть", note: "Найдите свой ракурс" },
  { id: "emotions", name: "Анатомия эмоций", note: "Почувствуйте историю" },
  { id: "lighting", name: "Свет меняет всё", note: "Измените атмосферу" },
  {
    id: "laboratory",
    name: "Режиссёрская лаборатория",
    note: "Создайте свою сцену",
  },
  { id: "credits", name: "Финальные титры", note: "История продолжается" },
] as const;
