/**
 * Keep wheel delta on a nested overflow element until it hits an edge, then
 * let the ancestor (settings drawer) scroll. Attach with `{ passive: false }`.
 *
 * @param {WheelEvent} event
 * @param {HTMLElement} scroller
 */
export function containNestedWheel(event, scroller) {
  if (!scroller || typeof scroller.scrollTop !== 'number') return;

  const { scrollTop, scrollHeight, clientHeight } = scroller;
  const maxScroll = scrollHeight - clientHeight;
  if (maxScroll <= 0) return;

  const { deltaY } = event;
  if (deltaY === 0) return;

  const atTop = scrollTop <= 0;
  const atBottom = scrollTop >= maxScroll - 1;
  if ((deltaY < 0 && atTop) || (deltaY > 0 && atBottom)) return;

  scroller.scrollTop = Math.min(maxScroll, Math.max(0, scrollTop + deltaY));
  event.preventDefault();
  event.stopPropagation();
}
