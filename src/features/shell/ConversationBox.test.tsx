import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { conversation } from "@/content/story-dialogue";
import { ConversationBox } from "./ConversationBox";

describe("ConversationBox", () => {
  it("attaches the speaker name to a character portrait", () => {
    const beats = conversation("shopkeeper-rescued");
    const html = renderToStaticMarkup(
      <ConversationBox beat={beats[0]} current={0} total={beats.length} onAdvance={vi.fn()} />,
    );

    expect(html).toContain("Lost Adventurer");
    expect(html).toContain("sprite-shopkeeper");
    expect(html).toContain("Next ›");
    expect(html).toContain('aria-label="Line 1 of 2"');
  });

  it("labels the final click as Continue", () => {
    const beats = conversation("worm-rescued");
    const html = renderToStaticMarkup(
      <ConversationBox
        beat={beats[beats.length - 1]}
        current={beats.length - 1}
        total={beats.length}
        onAdvance={vi.fn()}
      />,
    );

    expect(html).toContain("Continue");
    expect(html).not.toContain("Next ›");
  });
});
