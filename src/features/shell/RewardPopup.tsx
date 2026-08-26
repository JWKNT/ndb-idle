import type { SpriteName } from "@/content/sprites";
import { Sprite } from "@/features/shared/Sprite";

export interface RewardPopupContent {
  title: string;
  description: string;
  sprite: SpriteName;
}

interface RewardPopupProps {
  content: RewardPopupContent;
  onClose: () => void;
}

export function RewardPopup({ content, onClose }: RewardPopupProps) {
  return (
    <div className="reward-popup-backdrop" role="presentation">
      <section
        aria-labelledby="reward-popup-title"
        aria-modal="true"
        className="reward-popup"
        role="dialog"
      >
        <h2 id="reward-popup-title">{content.title}</h2>
        <div className="reward-popup-sprite">
          <Sprite name={content.sprite} />
        </div>
        {content.description && <p>{content.description}</p>}
        <button autoFocus onClick={onClose} type="button">Continue</button>
      </section>
    </div>
  );
}
