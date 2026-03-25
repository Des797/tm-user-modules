// TOGGLE MODE: `toggleMode(btn)` — flips `isActive`, persists it to GM storage, updates the button icon and theme, and shows a toast. Central mutation point for the Quick Edit active state.
  function toggleMode(btn) {
    isActive = !isActive;
    GM_setValue(STORAGE_KEY, isActive);

    btn.innerHTML = getIcon(isActive);
    applyButtonTheme(btn, isActive);

    showToast(isActive ? '✏️ Quick Edit ON' : '🚫 Quick Edit OFF');
  }