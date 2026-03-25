// BUTTON THEME: `applyButtonTheme(btn, active)` — sets the floating button's background gradient and box-shadow to red (active) or dark-grey (inactive).
  function applyButtonTheme(btn, active) {
    btn.style.background = active
      ? 'linear-gradient(135deg, #e84040 0%, #b01c1c 100%)'
      : 'linear-gradient(135deg, #3a3a4a 0%, #1e1e2a 100%)';
    btn.style.boxShadow = active
      ? '0 4px 18px rgba(232,64,64,0.55)'
      : '0 4px 18px rgba(0,0,0,0.45)';
  }