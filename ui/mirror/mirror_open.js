// MIRROR LIFECYCLE: manager-style mirror open/close owner.
function hideTagsMirror() {
  const mirror = document.getElementById('qem-mirror');
  const backdrop = document.getElementById('qem-mirror-backdrop');
  if (!mirror) return;
  mirror.classList.remove('visible');
  if (backdrop) backdrop.classList.remove('visible');
  _unlockScroll();
  window.dispatchEvent(new Event('qem:mirror-visibility-change'));
}

function openTagsMirror() {
  const existing = document.getElementById('qem-mirror');
  if (existing) {
    existing.classList.add('visible');
    const existingBackdrop = document.getElementById('qem-mirror-backdrop');
    if (existingBackdrop) existingBackdrop.classList.add('visible');
    _lockScroll();
    window.dispatchEvent(new Event('qem:mirror-visibility-change'));
    return;
  }
  const built = createTagsMirror(hideTagsMirror);
  if (!built || !built.mirror) return;

  const { mirror, backdrop } = built;
  document.body.appendChild(mirror);
  document.body.appendChild(backdrop);
  mirror.classList.add('visible');
  backdrop.classList.add('visible');
  _lockScroll();
  window.dispatchEvent(new Event('qem:mirror-visibility-change'));
}

function toggleTagsMirror() {
  const existing = document.getElementById('qem-mirror');
  if (existing && existing.classList.contains('visible')) return hideTagsMirror();
  openTagsMirror();
}
