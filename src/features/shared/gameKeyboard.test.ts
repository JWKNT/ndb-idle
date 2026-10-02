import { afterEach, describe, expect, it, vi } from "vitest";
import { shouldHandleGameShortcut } from "./gameKeyboard";

// This verifies keyboard routing, not browser focus or combat outcomes.
class Target {
  constructor(private readonly selector: string | string[] = "") {}
  closest(selectors: string) {
    const matches = Array.isArray(this.selector) ? this.selector : [this.selector];
    return matches.some((selector) => selector && selectors.split(", ").includes(selector)) ? this : null;
  }
}

afterEach(() => vi.unstubAllGlobals());

function key(overrides: Partial<KeyboardEvent> = {}) {
  vi.stubGlobal("Element", Target);
  return {
    key: "ArrowDown", code: "ArrowDown", defaultPrevented: false,
    isComposing: false, ctrlKey: false, metaKey: false, altKey: false,
    target: new Target(), ...overrides,
  } as KeyboardEvent;
}

const closedPage = { querySelector: () => null };

describe("game keyboard routing", () => {
  it("leaves ordinary movement and attack keys available on the game surface", () => {
    expect(shouldHandleGameShortcut(key(), closedPage)).toBe(true);
    expect(shouldHandleGameShortcut(key({ key: "w", code: "KeyW" }), closedPage)).toBe(true);
    expect(shouldHandleGameShortcut(key({ key: " ", code: "Space" }), closedPage)).toBe(true);
  });

  it("respects handled dropdown keys, composition, and browser shortcuts", () => {
    for (const flag of ["defaultPrevented", "isComposing", "ctrlKey", "metaKey", "altKey"]) {
      expect(shouldHandleGameShortcut(key({ [flag]: true }), closedPage), flag).toBe(false);
    }
  });

  it("ignores typing fields and every part of the custom dropdown", () => {
    for (const selector of ["input", "select", "textarea", "[contenteditable]:not([contenteditable='false'])", ".game-dropdown"]) {
      const target = new Target(selector) as unknown as EventTarget;
      expect(shouldHandleGameShortcut(key({ target }), closedPage), selector).toBe(false);
    }
  });

  it("lets Space activate focused controls without also attacking", () => {
    for (const selector of ["button", "a[href]", "[role='button']"]) {
      const target = new Target(selector) as unknown as EventTarget;
      expect(shouldHandleGameShortcut(key({ target, key: " ", code: "Space" }), closedPage)).toBe(false);
      expect(shouldHandleGameShortcut(key({ target, key: "w", code: "KeyW" }), closedPage)).toBe(true);
    }
  });

  it("preserves Space attack/pass on focused button-based board cells", () => {
    const target = new Target(["button", "[role='gridcell']"]) as unknown as EventTarget;
    expect(shouldHandleGameShortcut(key({ target, key: " ", code: "Space" }), closedPage)).toBe(true);
    expect(shouldHandleGameShortcut(key({ target }), closedPage)).toBe(true);
  });

  it("blocks shortcuts behind an open modal even when focus remains outside it", () => {
    const querySelector = vi.fn(() => ({}) as Element);
    expect(shouldHandleGameShortcut(key(), { querySelector })).toBe(false);
    expect(querySelector).toHaveBeenCalledWith('[role="dialog"][aria-modal="true"], dialog[open]');
  });
});
