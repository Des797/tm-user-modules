// FLOATING BUTTONS: `createButton()` — creates and appends the Quick Edit menu button (`#qem-toggle`) and a mirror launcher (`#qem-mirror-toggle`). The mirror launcher uses a compact header-like style and explicit open/close label so the action is clear on mobile.
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

    btn.addEventListener('click', () => openMenu(btn));
    btn.addEventListener('contextmenu', e => { e.preventDefault(); openMenu(btn); });

    /* touch friendly press effect */
    btn.addEventListener('pointerdown', () => { btn.style.transform = 'scale(0.9)'; });
    btn.addEventListener('pointerup',   () => { btn.style.transform = 'scale(1)'; });
    btn.addEventListener('pointerleave',() => { btn.style.transform = 'scale(1)'; });

    const mirrorBtn = document.createElement('button');
    mirrorBtn.id = 'qem-mirror-toggle';
    mirrorBtn.setAttribute('aria-label', 'Open Mirror');
    mirrorBtn.innerHTML = '<span id="qem-mirror-toggle-label">Open Mirror</span><span id="qem-mirror-toggle-icon">+</span>';
    Object.assign(mirrorBtn.style, {
      position:     'fixed',
      top:          '0',
      left:         '0',
      right:        '0',
      zIndex:       '999999',
      width:        '100%',
      height:       '46px',
      borderRadius: '0',
      border:       'none',
      borderBottom: '1px solid #2a2a3a',
      cursor:       'pointer',
      display:      'flex',
      alignItems:   'center',
      justifyContent: 'space-between',
      boxShadow:    '0 4px 18px rgba(0,0,0,0.45)',
      transition:   'background 0.2s, transform 0.15s, box-shadow 0.2s, border-color 0.2s',
      outline:      'none',
      padding:      '0 12px',
      WebkitTapHighlightColor: 'transparent',
      touchAction:  'none',
      fontSize:     '14px',
      fontWeight:   '700',
      letterSpacing:'0.03em',
      background:   '#1a1a24',
      color:        '#fff',
    });

    function syncMirrorButtonTheme() {
      const isVisible = !!document.getElementById('qem-mirror')?.classList.contains('visible');
      const label = mirrorBtn.querySelector('#qem-mirror-toggle-label');
      const icon = mirrorBtn.querySelector('#qem-mirror-toggle-icon');
      if (label) label.textContent = isVisible ? 'Close Mirror' : 'Open Mirror';
      if (icon) icon.textContent = isVisible ? '×' : '+';
      mirrorBtn.setAttribute('aria-label', isVisible ? 'Close Mirror' : 'Open Mirror');
      mirrorBtn.style.background = '#1a1a24';
      mirrorBtn.style.borderBottom = `1px solid ${isVisible ? '#e84040' : '#2a2a3a'}`;
      mirrorBtn.style.boxShadow = isVisible
        ? '0 4px 18px rgba(232,64,64,0.45)'
        : '0 4px 18px rgba(0,0,0,0.45)';
    }

    function syncMirrorButtonVisibility() {
      mirrorBtn.style.display = isActive ? 'flex' : 'none';
    }

    mirrorBtn.addEventListener('click', () => {
      toggleTagsMirror();
      setTimeout(syncMirrorButtonTheme, 0);
    });
    mirrorBtn.addEventListener('pointerdown', () => { mirrorBtn.style.transform = 'scale(0.9)'; });
    mirrorBtn.addEventListener('pointerup',   () => { mirrorBtn.style.transform = 'scale(1)'; });
    mirrorBtn.addEventListener('pointerleave',() => { mirrorBtn.style.transform = 'scale(1)'; });

    if (POST_VIEW_RE.test(location.search)) {
      syncMirrorButtonTheme();
      syncMirrorButtonVisibility();
      window.addEventListener('qem:mirror-visibility-change', syncMirrorButtonTheme);
      window.addEventListener('qem:quickedit-change', syncMirrorButtonVisibility);
      document.body.appendChild(mirrorBtn);
    }
    document.body.appendChild(btn);
    return btn;
  }