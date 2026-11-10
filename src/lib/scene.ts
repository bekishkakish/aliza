export const options = {
  environment: [
    "Театр",
    "Комната с окном",
    "Ночная улица",
    "За кулисами",
    "Ализа",
  ],
  genre: ["Драма", "Триллер", "Романтика", "Артхаус"],
  light: ["Холодное", "Тёплое", "Контрастное", "Красное"],
  shot: ["Общий", "Средний", "Крупный"],
  mood: ["Тревога", "Ностальгия", "Спокойствие", "Напряжение"],
  composition: [
    "Центрированная",
    "Асимметричная",
    "Отрицательное пространство",
  ],
} as const;
export type SceneKey = keyof typeof options;
export type SceneSettings = Record<SceneKey, number>;
export const defaultScene: SceneSettings = {
  environment: 0,
  genre: 0,
  light: 1,
  shot: 0,
  mood: 1,
  composition: 1,
};
export const sceneKeys = Object.keys(options) as SceneKey[];
export function readScene(search = window.location.search): SceneSettings {
  const query = new URLSearchParams(search);
  return Object.fromEntries(
    sceneKeys.map((key) => {
      const raw = query.get(key);
      const value = raw !== null && /^\d+$/.test(raw) ? Number(raw) : -1;
      return [
        key,
        Number.isInteger(value) && value >= 0 && value < options[key].length
          ? value
          : defaultScene[key],
      ];
    }),
  ) as SceneSettings;
}
export function sceneURL(
  settings: SceneSettings,
  origin = window.location.href,
): string {
  const url = new URL(origin);
  url.search = "";
  url.searchParams.set("scene", "1");
  sceneKeys.forEach((key) => url.searchParams.set(key, String(settings[key])));
  url.hash = "laboratory";
  return url.toString();
}
export function randomScene(): SceneSettings {
  return Object.fromEntries(
    sceneKeys.map((key) => [
      key,
      Math.floor(Math.random() * options[key].length),
    ]),
  ) as SceneSettings;
}
export function describeScene(s: SceneSettings) {
  const titles = [
    [
      "Последний свет",
      "Пока горят окна",
      "Тихое возвращение",
      "Остаться в кадре",
    ],
    ["Кто-то за дверью", "След в темноте", "До рассвета", "Обратный отсчёт"],
    [
      "Между двумя взглядами",
      "Тепло твоего голоса",
      "Рядом с тишиной",
      "Встреча после дождя",
    ],
    [
      "Комната без времени",
      "Память света",
      "Невидимая сторона",
      "Предел присутствия",
    ],
  ];
  const place = [
    "На пустой сцене остаётся один человек.",
    "У окна стоит пустое кресло; чьё-то отсутствие становится главным героем.",
    "На мокрой улице силуэт растворяется в отражениях.",
    "В глубине коридора открытая дверь отделяет героя от неизвестности.",
    "Ализа задерживает взгляд, словно прислушиваясь к тому, что осталось за кадром.",
  ][s.environment];
  const light = [
    "Холодный свет отдаляет привычные предметы.",
    "Тёплый свет собирает пространство в тихое воспоминание.",
    "Жёсткий контраст делит видимое и скрытое.",
    "Красный свет превращает ожидание в тревожный знак.",
  ][s.light];
  const shot = [
    "Общий план оставляет герою целый мир вокруг.",
    "Средний план приближает нас к жестам и фактурам.",
    "Крупный план удерживает внимание на едва заметной детали.",
  ][s.shot];
  const mood = [
    "Пауза становится вопросом, на который ещё нет ответа.",
    "Всё здесь напоминает о моменте, который уже не вернуть.",
    "Кадр не торопится: можно просто смотреть и дышать.",
    "Каждая секунда ожидания делает тишину плотнее.",
  ][s.mood];
  const comp = [
    "Центр кадра удерживает хрупкое равновесие.",
    "Смещение вправо оставляет композицию намеренно неустойчивой.",
    "Большая пустота слева даёт невысказанному собственное место.",
  ][s.composition];
  const genre = [
    "Драма развивается через наблюдение.",
    "В триллере пространство становится источником вопроса.",
    "Романтическая интонация возникает из мягкости и внимания.",
    "Артхаусный этюд оставляет связь образов открытой.",
  ][s.genre];
  return {
    title: titles[s.genre][s.mood],
    description: `${place} ${light} ${shot} ${mood} ${comp} ${genre}`,
  };
}
