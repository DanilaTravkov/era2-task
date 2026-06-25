export function formatEta(seconds?: number) {
  if (seconds === undefined) return "ETA -";
  return `ETA ${formatSeconds(seconds)}`;
}

export function formatDuration(seconds?: number) {
  if (seconds === undefined) return "duration -";
  return formatSeconds(seconds);
}

function formatSeconds(seconds: number) {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
}
