// === SECTION: toggle mode | filename: toggle_mode ===
  function toggleMode(btn) {
    isActive = !isActive;
    GM_setValue(STORAGE_KEY, isActive);

    btn.innerHTML = getIcon(isActive);
    applyButtonTheme(btn, isActive);

    showToast(isActive ? '✏️ Quick Edit ON' : '🚫 Quick Edit OFF');
  }