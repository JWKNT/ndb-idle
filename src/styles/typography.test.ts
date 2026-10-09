import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");

describe("site typography", () => {
  it("loads the approved Wrenfold font before component styles", () => {
    const css = source("./typography.css");
    expect(css).toContain('font-family: "Wrenfold Text"');
    expect(css).toContain('font-weight: 400');
    expect(css).toContain('"Noto Serif CJK JP"');
    const styles = source("../styles.css");
    expect(styles.indexOf('styles/typography.css')).toBeLessThan(styles.indexOf('styles/core.css'));
    const font = readFileSync(new URL("../assets/fonts/WrenfoldText-Regular.woff2", import.meta.url));
    expect(createHash("sha256").update(font).digest("hex")).toBe("826f6c238521bfbf98d897a8f81810a78ed2d6571fec0ef86d0d51edba0212be");
  });

  it("uses the shared text face without overriding specialized or sprite fonts", () => {
    const files = readdirSync(fileURLToPath(new URL(".", import.meta.url))).filter((name) => name.endsWith(".css"));
    for (const name of files) {
      const css = source(`./${name}`);
      expect(css).not.toMatch(/font-family:[^;]*!important/);
      for (const [, family] of css.matchAll(/font-family:\s*([^;]+);/g)) {
        expect(["var(--font-text)", '"Wrenfold Text"', "inherit", "monospace"]).toContain(family);
      }
    }
    expect(source("./adventure.css")).toMatch(/\.dungeon-map-room\s*\{[^}]*font-family: monospace/);
    expect(source("../main.tsx")).not.toContain("@fontsource/eb-garamond");
  });

  it("ships the redistribution notices in the public build", () => {
    for (const name of ["OFL-1.1.txt", "Noto-Debian-copyright.txt", "Wrenfold-README.txt"]) {
      expect(source(`../../public/fonts/${name}`).length).toBeGreaterThan(100);
    }
  });
});
