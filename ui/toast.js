// TOAST: `showToast(msg)` — displays a transient fixed-position notification (top-right, 2 s, fade in/out). Removes any existing toast before creating a new one. Used throughout the script for user feedback.
  /* ─────────────────────────────────────────────
     TOAST NOTIFICATION
  ───────────────────────────────────────────── */
  function showToast(msg) {
    const old = document.getElementById('qem-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.id = 'qem-toast';
    toast.textContent = msg;
    Object.assign(toast.style, {
      position:     'fixed',
      top:       '30px',
      right:        '14px',
      zIndex:       '999999',
      background:   'rgba(20,20,30,0.92)',
      color:        '#fff',
      padding:      '8px 14px',
      borderRadius: '20px',
      fontSize:     '13px',
      fontFamily:   'system-ui, sans-serif',
      fontWeight:   '600',
      letterSpacing:'0.02em',
      boxShadow:    '0 2px 12px rgba(0,0,0,0.4)',
      opacity:      '0',
      transform:    'translateY(6px)',
      transition:   'opacity 0.2s, transform 0.2s',
      pointerEvents:'none',
    });

    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity  = '1';
      toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity   = '0';
      toast.style.transform = 'translateY(6px)';
      setTimeout(() => toast.remove(), 250);
    }, 2000);
  }