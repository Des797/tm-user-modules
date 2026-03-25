// GHOST CLICK: `suppressNextClick()` — on mobile, the browser fires a synthetic click ~300 ms after a touch sequence at the original coordinates. When UI elements are removed or repositioned in response to a tap, the ghost click lands on whatever is underneath. Call `suppressNextClick()` immediately before acting on a tap to swallow that event via a capture-phase listener.

  let _suppressClickUntil = 0;

  function suppressNextClick() {
    _suppressClickUntil = Date.now() + 600;
  }

  document.addEventListener('click', e => {
    if (Date.now() < _suppressClickUntil) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);