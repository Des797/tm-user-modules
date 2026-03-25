// === SECTION: count cache | filename: count_cache ===
  function getCountCache() {
    try { return JSON.parse(GM_getValue(COUNT_KEY, '{}')); } catch { return {}; }
  }

  function saveCountCache(cache) {
    GM_setValue(COUNT_KEY, JSON.stringify(cache));
  }