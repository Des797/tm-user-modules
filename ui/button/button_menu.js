// === SECTION: button menu | filename: button_menu ===
  /* Refactor note: openMenu was originally declared inside createButton, closing over btn.
     Lifted to top-level with btn as an explicit parameter — structurally identical behaviour. */
  function openMenu(btn) {
    let menu = document.getElementById('qem-menu');
    if (menu) { menu.remove(); return; }

    menu = document.createElement('div');
    menu.id = 'qem-menu';
    Object.assign(menu.style, {
      position:     'fixed',
      bottom:       '362px',
      right:        '10px',
      zIndex:       '1000000',
      background:   '#1a1a24',
      border:       '1px solid #333',
      borderRadius: '10px',
      boxShadow:    '0 4px 20px rgba(0,0,0,0.6)',
      overflow:     'hidden',
      minWidth:     '170px',
      fontFamily:   'system-ui, sans-serif',
    });

    function menuItem(icon, label, onClick) {
      const item = document.createElement('div');
      Object.assign(item.style, {
        padding:    '11px 16px',
        cursor:     'pointer',
        fontSize:   '13px',
        color:      '#ddd',
        display:    'flex',
        alignItems: 'center',
        gap:        '8px',
        borderBottom: '1px solid #2a2a3a',
      });
      item.innerHTML = `<span>${icon}</span><span>${label}</span>`;
      item.addEventListener('pointerdown', e => { e.stopPropagation(); });
      item.addEventListener('click', () => { menu.remove(); onClick(); });
      item.addEventListener('pointerenter', () => { item.style.background = '#2a2a3a'; });
      item.addEventListener('pointerleave', () => { item.style.background = ''; });
      return item;
    }

    const editLabel = isActive ? '✏️ Quick Edit  <b style="color:#e84040">ON</b>' : '✏️ Quick Edit  <b style="color:#555">OFF</b>';
    menu.appendChild(menuItem('', editLabel.replace('✏️ Quick Edit  ', '✏️ Quick Edit ').replace('<b', '').replace('</b>', '').replace('style="color:#e84040"', '').replace('style="color:#555"', ''), () => toggleMode(btn)));

    // Rebuild properly
    menu.innerHTML = '';
    const editItem = menuItem('✏️', isActive ? 'Quick Edit: ON' : 'Quick Edit: OFF', () => toggleMode(btn));
    editItem.querySelector('span:last-child').style.color = isActive ? '#e84040' : '#666';
    const relItem  = menuItem('🔗', 'Manage Relations', () => {
      const mgr = document.getElementById('qem-manager');
      if (mgr) mgr.remove(); else createRelationsManager();
    });
    relItem.style.borderBottom = 'none';
    menu.appendChild(editItem);
    menu.appendChild(relItem);
    document.body.appendChild(menu);

    /* Close on outside click */
    function onOutside(e) {
      if (!menu.contains(e.target) && e.target !== btn) {
        menu.remove();
        document.removeEventListener('pointerdown', onOutside);
      }
    }
    setTimeout(() => document.addEventListener('pointerdown', onOutside), 0);
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { menu.remove(); document.removeEventListener('keydown', esc); }
    });
  }