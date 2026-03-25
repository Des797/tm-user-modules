// COUNT CACHE: `getCountCache()` / `saveCountCache(cache)` — read/write the GM `r34_tag_counts` store, a `{tag: {count, ts}}` object used by the api client and tag storage helpers.
  function getCountCache() {
    try { return JSON.parse(GM_getValue(COUNT_KEY, '{}')); } catch { return {}; }
  }

  function saveCountCache(cache) {
    GM_setValue(COUNT_KEY, JSON.stringify(cache));
  }