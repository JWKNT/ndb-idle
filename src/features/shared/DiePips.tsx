interface DiePipsProps {
  className?: string;
  value?: number;
}

export function DiePips({ className = "die-pips", value }: DiePipsProps) {
  return (
    <span aria-hidden="true" className={className}>
      {diePipIndexes(value).map((pip) => (
        <i className={`die-pip die-pip-${pip}`} key={pip} />
      ))}
    </span>
  );
}

export function diePipIndexes(value?: number): number[] {
  if (value === 1) return [5];
  if (value === 2) return [1, 9];
  if (value === 3) return [1, 5, 9];
  if (value === 4) return [1, 3, 7, 9];
  if (value === 5) return [1, 3, 5, 7, 9];
  if (value === 6) return [1, 3, 4, 6, 7, 9];
  return [];
}
