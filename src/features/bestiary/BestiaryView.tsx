import { getEnemy } from "@/content/enemies";
import { enemySprite } from "@/content/enemy-sprites";
import { bestiaryDescription } from "@/content/story-dialogue";
import { formatWholeAmount } from "@/game/numbers";
import { Sprite } from "@/features/shared/Sprite";

interface BestiaryViewProps {
  defeatedEnemyIds: string[];
}

const STATS = [
  ["HP", "hp"],
  ["Stamina", "stamina"],
  ["Attack", "attack"],
  ["Defense", "defense"],
  ["Sp. Attack", "spAttack"],
  ["Sp. Defense", "spDefense"],
  ["Speed", "speed"],
  ["Luck", "luck"],
] as const;

export function BestiaryView({ defeatedEnemyIds }: BestiaryViewProps) {
  const enemies = [...new Set(defeatedEnemyIds)]
    .map(getEnemy)
    .filter((enemy): enemy is NonNullable<ReturnType<typeof getEnemy>> =>
      Boolean(enemy && !enemy.hideFromBestiary)
    );

  return (
    <main className="simple-page bestiary-view">
      <header className="page-heading">
        <h1>Bestiary</h1>
      </header>
      <section className="bestiary-portrait-grid" aria-label="Defeated enemies">
        {enemies.map((enemy) => (
          <article
            aria-label={enemy.name}
            className="bestiary-portrait"
            key={enemy.id}
            onFocus={(event) => alignTooltip(event.currentTarget)}
            onMouseEnter={(event) => alignTooltip(event.currentTarget)}
            tabIndex={0}
          >
            <Sprite name={enemySprite(enemy.id)} />
            <strong className="bestiary-portrait-name">{enemy.name}</strong>
            <aside className="bestiary-tooltip" role="tooltip">
              <h2>{enemy.name}</h2>
              <p className="bestiary-description">{bestiaryDescription(enemy.id)}</p>
              <dl>
                {STATS.map(([label, stat]) => (
                  <div key={stat}>
                    <dt>{label}</dt>
                    <dd>{formatWholeAmount(enemy.stats[stat])}</dd>
                  </div>
                ))}
                <div className="is-wide"><dt>Range</dt><dd>{enemy.attackRange ?? 1}</dd></div>
              </dl>
            </aside>
          </article>
        ))}
      </section>
    </main>
  );
}

function alignTooltip(card: HTMLElement): void {
  const tooltip = card.querySelector<HTMLElement>(".bestiary-tooltip");
  if (!tooltip) return;
  const cardBounds = card.getBoundingClientRect();
  const tooltipWidth = tooltip.getBoundingClientRect().width;
  card.dataset.tooltipAlign = cardBounds.left + tooltipWidth > window.innerWidth - 12
    ? "right"
    : "left";
}
