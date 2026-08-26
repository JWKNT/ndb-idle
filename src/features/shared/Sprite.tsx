import { sprites, type SpriteName } from "@/content/sprites";

interface SpriteProps {
  name: SpriteName;
  alt?: string;
}

export function Sprite({ name, alt = "" }: SpriteProps) {
  return (
    <img
      alt={alt}
      className={`pixel-sprite sprite-${name}`}
      draggable={false}
      height={16}
      src={sprites[name]}
      width={16}
    />
  );
}
