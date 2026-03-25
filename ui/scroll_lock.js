// === SECTION: scroll lock | filename: scroll_lock ===
  /* ─────────────────────────────────────────────
     SCROLL LOCK
  ───────────────────────────────────────────── */
  let _scrollLockY = 0;
  function _lockScroll() {
    _scrollLockY = window.scrollY;
    document.body.style.setProperty('overflow', 'hidden', 'important');
    document.body.style.setProperty('position', 'fixed',  'important');
    document.body.style.setProperty('top',      '-' + _scrollLockY + 'px', 'important');
    document.body.style.setProperty('left',     '0', 'important');
    document.body.style.setProperty('right',    '0', 'important');
  }
  function _unlockScroll() {
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('position');
    document.body.style.removeProperty('top');
    document.body.style.removeProperty('left');
    document.body.style.removeProperty('right');
    window.scrollTo(0, _scrollLockY);
  }