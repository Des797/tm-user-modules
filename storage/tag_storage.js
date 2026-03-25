// TAG STORAGE: CRUD helpers for all persistent tag data. `parseTags(str)` splits a whitespace-delimited tag string. `getRelations/saveRelations` and `getBlacklist/saveBlacklist` read/write GM arrays. `getRecentTags()` returns tags sorted by cross-session frequency. `getFavoriteTags(n)` returns top-n by use count. `recordAddedTags(original, newTags)` appends the session diff to recent history and increments favorite counts.
  function parseTags(str) {
    return str.trim().split(/\s+/).filter(Boolean);
  }

  function getRelations() {
    try { return JSON.parse(GM_getValue(RELATIONS_KEY, '[]')); } catch { return []; }
  }
  function saveRelations(arr) { GM_setValue(RELATIONS_KEY, JSON.stringify(arr)); }

  function getBlacklist() {
    try { return JSON.parse(GM_getValue(BLACKLIST_KEY, '[]')); } catch { return []; }
  }
  function saveBlacklist(arr) { GM_setValue(BLACKLIST_KEY, JSON.stringify(arr)); }

  function getRecentTags() {
    let history;
    try { history = JSON.parse(GM_getValue(RECENT_KEY, '[]')); } catch { return []; }
    if (!Array.isArray(history) || !history.length) return [];
    /* Support legacy flat-array format */
    if (!Array.isArray(history[0])) history = [history];
    const freq = {};
    history.forEach(session => {
      (session || []).forEach(tag => { freq[tag] = (freq[tag] || 0) + 1; });
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }

  function getFreqMap() {
    try { return JSON.parse(GM_getValue(FREQ_KEY, '{}')); } catch { return {}; }
  }

  function getFavoriteTags(n = 10) {
    const freq = getFreqMap();
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([tag]) => tag);
  }

  function recordAddedTags(originalTags, newTags) {
    const origSet = new Set(originalTags);
    const added   = newTags.filter(t => !origSet.has(t));
    if (!added.length) return;

    /* Recent: append session to history (max 20), keep as array-of-arrays */
    let history;
    try { history = JSON.parse(GM_getValue(RECENT_KEY, '[]')); } catch { history = []; }
    if (!Array.isArray(history) || (history.length && !Array.isArray(history[0]))) history = [history];
    history.push(added);
    if (history.length > 20) history = history.slice(history.length - 20);
    GM_setValue(RECENT_KEY, JSON.stringify(history));

    /* Favorites: increment frequency counts */
    const freq = getFreqMap();
    added.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
    GM_setValue(FREQ_KEY, JSON.stringify(freq));
  }