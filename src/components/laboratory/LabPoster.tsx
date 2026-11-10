import type { RefObject } from "react";
import { ArrowLeft } from "lucide-react";
import { describeScene, options } from "../../lib/scene";
import type { SceneKey, SceneSettings } from "../../lib/scene";
export default function LabPoster({
  settings,
  titleRef,
  edit,
}: {
  settings: SceneSettings;
  titleRef: RefObject<HTMLHeadingElement | null>;
  edit: () => void;
}) {
  const description = describeScene(settings);
  return (
    <div className="poster-copy">
      <span className="eyebrow">ВАША ПРЕМЬЕРА</span>
      <h3 ref={titleRef} tabIndex={-1}>
        {description.title}
      </h3>
      <div className="poster-parameters">
        {Object.entries(settings).map(([key, value]) => (
          <span key={key}>{options[key as SceneKey][value]}</span>
        ))}
      </div>
      <p>{description.description}</p>
      <small>
        Создано в режиссёрской лаборатории проекта «По ту сторону кадра».
      </small>
      <button className="text-button" onClick={edit}>
        <ArrowLeft size={16} />
        Вернуться к редактированию
      </button>
    </div>
  );
}
