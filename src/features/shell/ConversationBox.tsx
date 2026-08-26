import type { DialogueBeat } from "@/content/story-dialogue";
import { Sprite } from "@/features/shared/Sprite";

interface ConversationBoxProps {
  beat: DialogueBeat;
  current: number;
  total: number;
  onAdvance: () => void;
}

export function ConversationBox({ beat, current, total, onAdvance }: ConversationBoxProps) {
  const finalBeat = current === total - 1;

  return (
    <div className="conversation-backdrop" role="presentation">
      <section
        aria-labelledby="conversation-speaker"
        aria-modal="true"
        className="conversation-box"
        role="dialog"
      >
        <div className="conversation-portrait">
          <div className="conversation-sprite"><Sprite name={beat.sprite} alt="" /></div>
          <h2 id="conversation-speaker">{beat.speaker}</h2>
        </div>
        <div className="conversation-copy">
          <p>{beat.text}</p>
          <div className="conversation-footer">
            <div className="conversation-progress" aria-label={`Line ${current + 1} of ${total}`}>
              {Array.from({ length: total }, (_, index) => (
                <span className={index === current ? "is-current" : ""} key={index} />
              ))}
            </div>
            <button autoFocus onClick={onAdvance} type="button">
              {finalBeat ? "Continue" : "Next ›"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
