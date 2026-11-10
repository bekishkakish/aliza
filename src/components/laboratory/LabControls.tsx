import { RotateCcw } from "lucide-react";
import SegmentedControl from "../SegmentedControl";
import { options } from "../../lib/scene";
import type { SceneKey, SceneSettings } from "../../lib/scene";
const labels: Record<SceneKey, string> = {
  environment: "ОКРУЖЕНИЕ",
  genre: "ЖАНР",
  light: "ОСВЕЩЕНИЕ",
  shot: "КРУПНОСТЬ ПЛАНА",
  mood: "НАСТРОЕНИЕ",
  composition: "КОМПОЗИЦИЯ",
};
export default function LabControls({
  settings,
  update,
  reset,
}: {
  settings: SceneSettings;
  update: (key: SceneKey, value: number) => void;
  reset: () => void;
}) {
  return (
    <aside className="lab-settings" aria-label="Настройки сцены">
      <div className="panel-caption">
        <span className="status-dot" />
        ПУЛЬТ РЕЖИССЁРА<span>01—05</span>
      </div>
      {(["genre", "light", "shot", "mood", "composition"] as SceneKey[]).map(
        (key, group) => (
          <fieldset className={`setting-group setting-${key}`} key={key}>
            <legend>
              <span>0{group + 1}</span>
              {labels[key]}
            </legend>
            <SegmentedControl
              options={options[key]}
              value={settings[key]}
              onChange={(value) => update(key, value)}
              label={labels[key]}
              vertical={key === "composition"}
            />
          </fieldset>
        ),
      )}
      <button className="reset-button" onClick={reset}>
        <RotateCcw size={14} />
        Сбросить настройки
      </button>
    </aside>
  );
}
