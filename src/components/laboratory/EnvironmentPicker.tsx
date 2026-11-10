import { options } from "../../lib/scene";
import { environments } from "../../lib/renderer";
import { Check } from "lucide-react";
import { assetUrl } from "../../lib/assets";
export default function EnvironmentPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="environment-picker">
      <span className="eyebrow">ВЫБЕРИТЕ ПРОСТРАНСТВО</span>
      <div role="group" aria-label="Окружение сцены">
        {options.environment.map((environment, i) => (
          <button
            key={environment}
            className={value === i ? "selected" : ""}
            aria-pressed={value === i}
            onClick={() => onChange(i)}
          >
            <img
              src={assetUrl(`media/${environments[i]}-768.webp`)}
              alt=""
              width="160"
              height="90"
              loading="lazy"
            />
            <i className="environment-check" aria-hidden="true">
              <Check size={12} />
            </i>
            <span>{environment}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
