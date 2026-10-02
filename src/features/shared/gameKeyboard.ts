const editingTarget = "input, select, textarea, [contenteditable]:not([contenteditable='false']), .game-dropdown";
const activationTarget = "button, a[href], [role='button']";

/** Keep page controls and open dialogs from also issuing a game action. */
export function shouldHandleGameShortcut(
  event: KeyboardEvent,
  root: Pick<Document, "querySelector"> = document,
): boolean {
  if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return false;
  if (root.querySelector('[role="dialog"][aria-modal="true"], dialog[open]')) return false;
  const target = event.target;
  if (!(target instanceof Element)) return true;
  if (target.closest(editingTarget)) return false;
  // Board cells are buttons too; their focused Space key still attacks or passes.
  if (target.closest("[role='gridcell']")) return true;
  if ((event.key === " " || event.code === "Space") && target.closest(activationTarget)) return false;
  return true;
}
