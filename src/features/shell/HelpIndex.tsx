import { useEffect, useMemo, useState } from "react";
import {
  HELP_GROUPS,
  unlockedHelpEntries,
  unlockedHelpSections,
  type HelpGroupId,
} from "@/content/help";
import type { ProgressionState } from "@/game/progression";

interface HelpIndexProps {
  progression: ProgressionState;
  onClose: () => void;
}

export function HelpIndex({ progression, onClose }: HelpIndexProps) {
  const entries = useMemo(() => unlockedHelpEntries(progression), [progression]);
  const groups = HELP_GROUPS
    .map((group) => ({ ...group, entries: entries.filter((entry) => entry.group === group.id) }))
    .filter((group) => group.entries.length > 0);
  const [selectedGroupId, setSelectedGroupId] = useState<HelpGroupId>(groups[0]?.id ?? "basics");
  const [selectedId, setSelectedId] = useState(entries[0]?.id ?? "");
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0];
  const selected = selectedGroup?.entries.find((entry) => entry.id === selectedId)
    ?? selectedGroup?.entries[0];
  const sections = selected ? unlockedHelpSections(selected, progression) : [];

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="help-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="help-index-title"
        aria-modal="true"
        className="help-index"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="help-index-header">
          <div>
            <span className="help-index-kicker">NDB IDLE REFERENCE</span>
            <h1 id="help-index-title">Help</h1>
          </div>
          <button aria-label="Close help" className="help-close" onClick={onClose} type="button">
            CLOSE
          </button>
        </header>

        <div className="help-index-body">
          <nav aria-label="Help sections" className="help-section-list">
            {groups.map((group, index) => (
              <button
                aria-current={group.id === selectedGroup?.id ? "page" : undefined}
                className={group.id === selectedGroup?.id ? "is-active" : ""}
                key={group.id}
                onClick={() => {
                  setSelectedGroupId(group.id);
                  setSelectedId(group.entries[0].id);
                }}
                type="button"
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {group.title}
              </button>
            ))}
          </nav>

          {selected && (
            <div className="help-content">
              <nav aria-label={`${selectedGroup.title} pages`} className="help-page-list">
                {selectedGroup.entries.map((entry) => (
                  <button
                    aria-current={entry.id === selected.id ? "page" : undefined}
                    className={entry.id === selected.id ? "is-active" : ""}
                    key={entry.id}
                    onClick={() => setSelectedId(entry.id)}
                    type="button"
                  >
                    {entry.title}
                  </button>
                ))}
              </nav>
              <article className="help-article">
                <span className="help-article-kicker">{selected.kicker}</span>
                <h2>{selected.title}</h2>
                {sections.map((section, index) => (
                  <section className="help-article-section" key={section.title ?? index}>
                    {section.title && <h3>{section.title}</h3>}
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    {section.items && (
                      <dl className="help-mechanic-list">
                        {section.items.map((item) => (
                          <div key={item.label}>
                            <dt>{item.label}</dt>
                            <dd>{item.text}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </section>
                ))}
              </article>
            </div>
          )}
        </div>

        <footer className="help-index-footer">
          <strong>{entries.length} pages unlocked</strong>
          <span>INDEX EXPANDS WITH PROGRESSION</span>
        </footer>
      </section>
    </div>
  );
}
