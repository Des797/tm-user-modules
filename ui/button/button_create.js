// === SECTION: floating button | filename: button_create ===
  /* ─────────────────────────────────────────────
     FLOATING BUTTON
  ───────────────────────────────────────────── */
  function createButton() {
    const btn = document.createElement('button');
    btn.id = 'qem-toggle';
    btn.setAttribute('aria-label', 'Toggle Quick Edit Mode');
    btn.innerHTML = getIcon(isActive);

    Object.assign(btn.style, {
      position:     'fixed',
      bottom:       '300px',
      right:        '18px',
      zIndex:       '999999',
      width:        '52px',
      height:       '52px',
      borderRadius: '50%',
      border:       'none',
      cursor:       'pointer',
      display:      'flex',
      alignItems:   'center',
      justifyContent: 'center',
      boxShadow:    '0 4px 18px rgba(0,0,0,0.45)',
      transition:   'background 0.2s, transform 0.15s, box-shadow 0.2s',
      outline:      'none',
      padding:      '0',
      WebkitTapHighlightColor: 'transparent',
      touchAction:  'none',
    });

    applyButtonTheme(btn, isActive);

    /* Button always opens menu */
    let _pressTimer = null;

    btn.addEventListener('click', () => openMenu(btn));
    btn.addEventListener('contextmenu', e => { e.preventDefault(); openMenu(btn); });

    /* touch friendly press effect */
    btn.addEventListener('pointerdown', () => { btn.style.transform = 'scale(0.9)'; });
    btn.addEventListener('pointerup',   () => { btn.style.transform = 'scale(1)'; });
    btn.addEventListener('pointerleave',() => { btn.style.transform = 'scale(1)'; });

    /* Hide the floating button on post view pages — mirror replaces it there */
    if (POST_VIEW_RE.test(location.search)) {
      btn.style.display = 'none';
    }

    document.body.appendChild(btn);
    return btn;
  }