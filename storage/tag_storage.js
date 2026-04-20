// TAG STORAGE: CRUD helpers for all persistent tag data. `parseTags(str)` splits a whitespace-delimited tag string. `getRelations/saveRelations` and `getBlacklist/saveBlacklist` read/write GM arrays. `getRecentTags()` returns tags sorted by cross-session frequency. `getFavoriteTags(n)` returns top-n by use count. `recordAddedTags(original, newTags)` appends the session diff to recent history and increments favorite counts.
  function parseTags(str) {
    return str.trim().split(/\s+/).filter(Boolean);
  }

  function loadDraftMap(key, ttlMs = DRAFT_TTL) {
    let raw;
    try { raw = JSON.parse(GM_getValue(key, '{}')); } catch { raw = {}; }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) raw = {};
    const now = Date.now();
    const out = {};
    let changed = false;
    Object.entries(raw).forEach(([draftKey, entry]) => {
      const value = String(entry?.value || '');
      const updatedAt = Number(entry?.updatedAt || 0);
      if (!value) { changed = true; return; }
      if (!updatedAt || (now - updatedAt) > ttlMs) { changed = true; return; }
      out[draftKey] = { value, updatedAt };
    });
    if (changed) GM_setValue(key, JSON.stringify(out));
    return out;
  }

  function saveDraftMap(key, map) {
    const out = {};
    Object.entries(map || {}).forEach(([draftKey, entry]) => {
      const value = String(entry?.value || '');
      if (!value) return;
      out[draftKey] = { value, updatedAt: Number(entry?.updatedAt || Date.now()) };
    });
    GM_setValue(key, JSON.stringify(out));
  }

  function setDraftValue(key, draftKey, value) {
    const cleanValue = String(value || '');
    const map = loadDraftMap(key);
    if (!cleanValue.trim()) {
      if (!map[draftKey]) return;
      delete map[draftKey];
      saveDraftMap(key, map);
      return;
    }
    map[draftKey] = { value: cleanValue, updatedAt: Date.now() };
    saveDraftMap(key, map);
  }

  function clearDraftValue(key, draftKey) {
    const map = loadDraftMap(key);
    if (!map[draftKey]) return;
    delete map[draftKey];
    saveDraftMap(key, map);
  }

  function loadSingleDraft(key, ttlMs = DRAFT_TTL) {
    let raw;
    try { raw = JSON.parse(GM_getValue(key, 'null')); } catch { raw = null; }
    if (!raw || typeof raw !== 'object') return null;
    const updatedAt = Number(raw.updatedAt || 0);
    if (!updatedAt || (Date.now() - updatedAt) > ttlMs) {
      GM_setValue(key, 'null');
      return null;
    }
    return raw;
  }

  function saveSingleDraft(key, payload) {
    if (!payload || typeof payload !== 'object') {
      GM_setValue(key, 'null');
      return;
    }
    GM_setValue(key, JSON.stringify({ ...payload, updatedAt: Date.now() }));
  }

  function clearSingleDraft(key) {
    GM_setValue(key, 'null');
  }

  function getRelations() {
    try { return JSON.parse(GM_getValue(RELATIONS_KEY, '[]')); } catch { return []; }
  }
  function saveRelations(arr) { GM_setValue(RELATIONS_KEY, JSON.stringify(arr)); }

  function getBlacklist() {
    try { return JSON.parse(GM_getValue(BLACKLIST_KEY, '[]')); } catch { return []; }
  }
  function saveBlacklist(arr) { GM_setValue(BLACKLIST_KEY, JSON.stringify(arr)); }

  function slugifyCategoryName(name) {
    return String(name || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function normalizeCategories(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object') return out;
    Object.entries(raw).forEach(([slug, entry]) => {
      const normalizedSlug = slugifyCategoryName(slug);
      if (!normalizedSlug) return;
      const name = String(entry?.name || normalizedSlug).trim();
      const ts = Number(entry?.updatedAt || entry?.createdAt || Date.now());
      out[normalizedSlug] = {
        name: name || normalizedSlug,
        createdAt: Number(entry?.createdAt || ts),
        updatedAt: ts,
      };
    });
    return out;
  }

  function getCategories() {
    try {
      return normalizeCategories(JSON.parse(GM_getValue(CATEGORIES_KEY, '{}')));
    } catch {
      return {};
    }
  }

  function saveCategories(categories) {
    GM_setValue(CATEGORIES_KEY, JSON.stringify(normalizeCategories(categories)));
  }

  function normalizeCategoryMembership(raw, categories) {
    const out = {};
    const validCategories = new Set(Object.keys(categories || {}));
    if (!raw || typeof raw !== 'object') return out;
    Object.entries(raw).forEach(([tag, slugs]) => {
      const cleanTag = String(tag || '').trim();
      if (!cleanTag) return;
      const arr = Array.isArray(slugs) ? slugs : [];
      const deduped = [...new Set(arr.map(s => slugifyCategoryName(s)).filter(s => validCategories.has(s)))];
      if (deduped.length) out[cleanTag] = deduped;
    });
    return out;
  }

  function normalizeCategoryHierarchy(raw, categories) {
    const out = {};
    const validCategories = new Set(Object.keys(categories || {}));
    if (!raw || typeof raw !== 'object') return out;
    Object.entries(raw).forEach(([parent, children]) => {
      const parentSlug = slugifyCategoryName(parent);
      if (!validCategories.has(parentSlug)) return;
      const arr = Array.isArray(children) ? children : [];
      const deduped = [...new Set(arr.map(s => slugifyCategoryName(s)).filter(s => s && s !== parentSlug && validCategories.has(s)))];
      if (deduped.length) out[parentSlug] = deduped;
    });
    return out;
  }

  function getCategoryMembership() {
    const categories = getCategories();
    try {
      return normalizeCategoryMembership(JSON.parse(GM_getValue(CATEGORY_MEMBERSHIP_KEY, '{}')), categories);
    } catch {
      return {};
    }
  }

  function getCategoryHierarchy() {
    const categories = getCategories();
    try {
      return normalizeCategoryHierarchy(JSON.parse(GM_getValue(CATEGORY_HIERARCHY_KEY, '{}')), categories);
    } catch {
      return {};
    }
  }

  function saveCategoryHierarchy(map) {
    const categories = getCategories();
    GM_setValue(CATEGORY_HIERARCHY_KEY, JSON.stringify(normalizeCategoryHierarchy(map, categories)));
  }

  function saveCategoryMembership(map) {
    const categories = getCategories();
    GM_setValue(CATEGORY_MEMBERSHIP_KEY, JSON.stringify(normalizeCategoryMembership(map, categories)));
  }

  function getCategoryTagsMap() {
    const byTag = getCategoryMembership();
    const byCategory = {};
    Object.keys(getCategories()).forEach(slug => { byCategory[slug] = []; });
    Object.entries(byTag).forEach(([tag, slugs]) => {
      slugs.forEach(slug => {
        if (!byCategory[slug]) byCategory[slug] = [];
        byCategory[slug].push(tag);
      });
    });
    Object.keys(byCategory).forEach(slug => byCategory[slug].sort());
    return byCategory;
  }

  function upsertCategory(name, preferredSlug) {
    const categories = getCategories();
    const slug = slugifyCategoryName(preferredSlug || name);
    if (!slug) return null;
    const now = Date.now();
    const prev = categories[slug];
    categories[slug] = {
      name: String(name || slug).trim() || slug,
      createdAt: Number(prev?.createdAt || now),
      updatedAt: now,
    };
    saveCategories(categories);
    return slug;
  }

  function deleteCategory(slugOrName) {
    const slug = slugifyCategoryName(slugOrName);
    if (!slug) return false;
    const categories = getCategories();
    if (!categories[slug]) return false;
    delete categories[slug];
    saveCategories(categories);
    const membership = getCategoryMembership();
    Object.keys(membership).forEach(tag => {
      membership[tag] = membership[tag].filter(s => s !== slug);
      if (!membership[tag].length) delete membership[tag];
    });
    saveCategoryMembership(membership);
    const hierarchy = getCategoryHierarchy();
    delete hierarchy[slug];
    Object.keys(hierarchy).forEach(parent => {
      hierarchy[parent] = hierarchy[parent].filter(child => child !== slug);
      if (!hierarchy[parent].length) delete hierarchy[parent];
    });
    saveCategoryHierarchy(hierarchy);
    return true;
  }

  function setTagCategories(tag, slugs) {
    const cleanTag = String(tag || '').trim();
    if (!cleanTag) return;
    const membership = getCategoryMembership();
    const categories = getCategories();
    const valid = [...new Set((slugs || []).map(s => slugifyCategoryName(s)).filter(s => categories[s]))];
    if (valid.length) membership[cleanTag] = valid;
    else delete membership[cleanTag];
    saveCategoryMembership(membership);
  }

  function addTagsToCategory(categorySlug, tags) {
    const slug = slugifyCategoryName(categorySlug);
    const categories = getCategories();
    if (!slug || !categories[slug]) return 0;
    const membership = getCategoryMembership();
    let added = 0;
    (tags || []).forEach(tag => {
      const cleanTag = String(tag || '').trim();
      if (!cleanTag) return;
      const arr = membership[cleanTag] || [];
      if (!arr.includes(slug)) {
        membership[cleanTag] = [...arr, slug];
        added++;
      }
    });
    if (added) saveCategoryMembership(membership);
    return added;
  }

  function setCategoryChildren(parentSlug, childrenSlugs) {
    const parent = slugifyCategoryName(parentSlug);
    const categories = getCategories();
    if (!parent || !categories[parent]) return;
    const hierarchy = getCategoryHierarchy();
    const next = [...new Set((childrenSlugs || []).map(s => slugifyCategoryName(s)).filter(s => s && s !== parent && categories[s]))];
    if (next.length) hierarchy[parent] = next;
    else delete hierarchy[parent];
    saveCategoryHierarchy(hierarchy);
  }

  function addCategoryChildren(parentSlug, childrenSlugs) {
    const parent = slugifyCategoryName(parentSlug);
    const categories = getCategories();
    if (!parent || !categories[parent]) return 0;
    const hierarchy = getCategoryHierarchy();
    const cur = hierarchy[parent] || [];
    let added = 0;
    (childrenSlugs || []).forEach(child => {
      const c = slugifyCategoryName(child);
      if (!c || c === parent || !categories[c]) return;
      if (!cur.includes(c)) {
        cur.push(c);
        added++;
      }
    });
    if (cur.length) hierarchy[parent] = cur;
    saveCategoryHierarchy(hierarchy);
    return added;
  }

  function removeCategoryChild(parentSlug, childSlug) {
    const parent = slugifyCategoryName(parentSlug);
    const child = slugifyCategoryName(childSlug);
    if (!parent || !child) return;
    const hierarchy = getCategoryHierarchy();
    const cur = hierarchy[parent] || [];
    const next = cur.filter(c => c !== child);
    if (next.length) hierarchy[parent] = next;
    else delete hierarchy[parent];
    saveCategoryHierarchy(hierarchy);
  }

  function getCategoryParentsIndex() {
    const index = {};
    const hierarchy = getCategoryHierarchy();
    Object.entries(hierarchy).forEach(([parent, children]) => {
      (children || []).forEach(child => {
        if (!index[child]) index[child] = [];
        if (!index[child].includes(parent)) index[child].push(parent);
      });
    });
    return index;
  }

  function getTopLevelCategorySlugs() {
    const categories = getCategories();
    const parentsIndex = getCategoryParentsIndex();
    return Object.keys(categories)
      .filter(slug => !(parentsIndex[slug] && parentsIndex[slug].length))
      .sort((a, b) => categories[a].name.localeCompare(categories[b].name));
  }

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