// TAGS MIRROR: `createTagsMirror()` — entry point for the bottom mirror panel. Builds pages (`Assist`, `Categories`, `Recommended`, `Editor`, `Conflicts`), persists page/category visibility state, wires relation-driven chip suggestions, renders category-selector chips with per-category tag rows, Recommended long-press hide (session-only), and keeps textarea sync/autocomplete/submit behavior intact.
function createTagsMirror(onClose) {
  const sourceTextarea = document.getElementById('tags');
  if (!sourceTextarea) return null;

  const navEntry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  const navType = (performance.navigation && performance.navigation.type) || (navEntry && navEntry.type);
  const isReloadLike = navType === 1 || navType === 2 || navType === 'reload' || navType === 'back_forward';
  if (isReloadLike && typeof sourceTextarea.defaultValue === 'string') {
    sourceTextarea.value = sourceTextarea.defaultValue;
  }

  const originalTags = parseTags(sourceTextarea.value);
  injectMirrorStyles();
  const { mirror, body, mirrorTA, minBtn, backdrop } = buildMirrorDOM(sourceTextarea, onClose);

  const COLLAPSE_KEY_RECENT = 'r34_collapse_recent';
  const COLLAPSE_KEY_FAV = 'r34_collapse_fav';
  const COLLAPSE_KEY_TAGS = 'r34_collapse_textarea';
  const MIRROR_ACTIVE_CATEGORIES_KEY = 'r34_mirror_active_categories';
  const MIRROR_CATEGORY_ANCHOR_KEY = 'r34_mirror_category_anchor';
  const MIRROR_PAGE_KEY = 'r34_mirror_page';

  let _relatedDebounce = null;
  let renderRelatedRow = null;
  let relMaps = null;
  let blacklist = [];
  const categoryRows = [];
  const recommendedRows = [];
  const activeRecommendedSlugs = new Set();
  const hiddenRecommendedSlugs = new Set();
  let showHiddenRecommended = false;
  let recommendedOrderSnapshot = null;
  let recommendedHideMenuEl = null;
  let categorySelectorRow = null;
  let recommendedSelectorRow = null;
  let expandedConflictTag = '';
  let expandedBlacklistTag = '';

  const pagesBar = document.createElement('div');
  pagesBar.id = 'qem-mirror-pages';
  body.appendChild(pagesBar);

  const assistPage = document.createElement('div');
  assistPage.className = 'qem-mirror-page';
  const categoriesPage = document.createElement('div');
  categoriesPage.className = 'qem-mirror-page';
  const recommendedPage = document.createElement('div');
  recommendedPage.className = 'qem-mirror-page';
  const editorPage = document.createElement('div');
  editorPage.className = 'qem-mirror-page';
  const conflictsPage = document.createElement('div');
  conflictsPage.className = 'qem-mirror-page';
  body.appendChild(assistPage);
  body.appendChild(categoriesPage);
  body.appendChild(recommendedPage);
  body.appendChild(editorPage);
  body.appendChild(conflictsPage);

  const pageButtons = {};
  const pageDefs = [['assist', 'Assist'], ['categories', 'Categories'], ['recommended', 'Recommended'], ['editor', 'Editor'], ['conflicts', 'Conflicts']];
  const pageEls = {
    assist: assistPage,
    categories: categoriesPage,
    recommended: recommendedPage,
    editor: editorPage,
    conflicts: conflictsPage,
  };
  function setActivePage(name) {
    const allowed = new Set(pageDefs.map(([id]) => id));
    const next = allowed.has(name) ? name : 'assist';
    pageDefs.forEach(([id]) => {
      const isActive = id === next;
      pageButtons[id].classList.toggle('active', isActive);
      pageEls[id].classList.toggle('active', isActive);
    });
    GM_setValue(MIRROR_PAGE_KEY, next);
  }
  pageDefs.forEach(([id, label]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'qem-mirror-page-btn';
    btn.textContent = label;
    btn.addEventListener('click', () => setActivePage(id));
    pageButtons[id] = btn;
    pagesBar.appendChild(btn);
  });

  const recentRow = makeCollapsibleChipRow(
    getRecentTags(),
    'qem-chip-recent',
    'Recent',
    COLLAPSE_KEY_RECENT,
    mirrorTA,
    new Set(),
    val => { syncToSource(sourceTextarea, val); updateHelpersFromMerged(val); syncStaticChips(); scheduleRelated(); },
    {
      getSuppressedTags: () => (
        relMaps
          ? getSuppressedTags(new Set(parseTags(mirrorTA.value)), relMaps, blacklist)
          : new Set()
      ),
    }
  );
  const favRow = makeCollapsibleChipRow(
    getFavoriteTags(),
    'qem-chip-fav',
    'Favorites',
    COLLAPSE_KEY_FAV,
    mirrorTA,
    new Set(),
    val => { syncToSource(sourceTextarea, val); updateHelpersFromMerged(val); syncStaticChips(); scheduleRelated(); },
    {
      getSuppressedTags: () => (
        relMaps
          ? getSuppressedTags(new Set(parseTags(mirrorTA.value)), relMaps, blacklist)
          : new Set()
      ),
    }
  );
  if (recentRow) assistPage.appendChild(recentRow);
  if (favRow) assistPage.appendChild(favRow);

  const { ruleBar, ruleInput } = buildRuleBar();
  assistPage.insertBefore(ruleBar, assistPage.firstChild);

  function getActiveCategories() {
    try {
      const val = JSON.parse(GM_getValue(MIRROR_ACTIVE_CATEGORIES_KEY, '[]'));
      return Array.isArray(val) ? val : [];
    } catch {
      return [];
    }
  }
  function setActiveCategories(slugs) {
    GM_setValue(MIRROR_ACTIVE_CATEGORIES_KEY, JSON.stringify(slugs));
  }

  function getCategoryAnchorMap() {
    try {
      const val = JSON.parse(GM_getValue(MIRROR_CATEGORY_ANCHOR_KEY, '{}'));
      return val && typeof val === 'object' ? val : {};
    } catch {
      return {};
    }
  }

  function setCategoryAnchorMap(map) {
    GM_setValue(MIRROR_CATEGORY_ANCHOR_KEY, JSON.stringify(map || {}));
  }

  function getTagCountNum(tag, countCache) {
    const entry = countCache[tag];
    if (!entry || typeof entry !== 'object') return 0;
    return Number(entry.count || 0);
  }

  function buildWikiUrl(tag) {
    const wikiTag = String(tag || '').trim().replace(/\s+/g, '_');
    return `https://rule34.xxx/index.php?page=wiki&s=list&search=${encodeURIComponent(wikiTag)}`;
  }

  function openTagWiki(tag) {
    const clean = String(tag || '').trim();
    if (!clean) return;
    window.open(buildWikiUrl(clean), '_blank', 'noopener,noreferrer');
  }

  function applyMirrorTags(tags) {
    const cleaned = tags.filter(Boolean);
    const val = cleaned.length ? `${cleaned.join(' ')} ` : '';
    mirrorTA.value = val;
    syncToSource(sourceTextarea, val);
    updateHelpersFromMerged(val);
    syncStaticChips();
    scheduleRelated();
  }

  function removeTagFromMirror(tag) {
    const current = parseTags(mirrorTA.value);
    const next = current.filter(t => t !== tag);
    if (next.length === current.length) return;
    applyMirrorTags(next);
  }

  function attachLongPress(el, onLongPress, opts) {
    opts = opts || {};
    const longPressMs = Number(opts.longPressMs || 500);
    const moveCancelPx = Number(opts.moveCancelPx || 14);
    let longPressTimer = null;
    let longPressFired = false;
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      longPressFired = false;
      const startX = e.clientX;
      const startY = e.clientY;
      longPressTimer = window.setTimeout(() => {
        longPressTimer = null;
        longPressFired = true;
        suppressNextClick();
        onLongPress(e);
      }, longPressMs);
      function onMove(ev) {
        if (longPressTimer == null) return;
        if (Math.abs(ev.clientX - startX) > moveCancelPx || Math.abs(ev.clientY - startY) > moveCancelPx) {
          window.clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      }
      function onUp() {
        if (longPressTimer != null) {
          window.clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);
      }
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    });
    return function wasLongPressHandled(e) {
      if (!longPressFired) return false;
      e.preventDefault();
      e.stopPropagation();
      longPressFired = false;
      return true;
    };
  }

  function rebuildConflictsPage() {
    conflictsPage.innerHTML = '';
    const currentTags = parseTags(mirrorTA.value);
    const currentSet = new Set(currentTags);

    const headRow = document.createElement('div');
    headRow.className = 'qem-recommended-categories-header';
    const headLbl = document.createElement('span');
    headLbl.className = 'qem-chips-label';
    headLbl.textContent = 'Tag Conflicts';
    const refreshBtn = document.createElement('button');
    refreshBtn.type = 'button';
    refreshBtn.className = 'qem-mirror-refresh-btn';
    refreshBtn.textContent = 'Refresh chips';
    refreshBtn.setAttribute('aria-label', 'Force refresh conflict chips');
    refreshBtn.addEventListener('click', e => {
      e.stopPropagation();
      clearTimeout(_relatedDebounce);
      _relatedDebounce = null;
      try {
        relMaps = buildRelationMaps();
        blacklist = getBlacklist();
      } catch (err) {
        console.warn('[QEM] Error refreshing conflict maps:', err);
      }
      runRelatedAssistSync();
    });
    headRow.appendChild(headLbl);
    headRow.appendChild(refreshBtn);
    conflictsPage.appendChild(headRow);

    const blacklistSet = new Set(blacklist || []);
    const blacklistedTags = currentTags.filter(tag => blacklistSet.has(tag));
    if (!blacklistedTags.includes(expandedBlacklistTag)) expandedBlacklistTag = '';
    if (blacklistedTags.length) {
      const section = document.createElement('div');
      section.className = 'qem-chips';
      const label = document.createElement('span');
      label.className = 'qem-chips-label';
      label.textContent = 'Blacklisted on this post';
      label.style.cursor = 'default';
      section.appendChild(label);
      const scroller = document.createElement('div');
      scroller.className = 'qem-chip-scroller';
      const blWrap = document.createElement('div');
      blWrap.className = 'qem-chip-rows';
      const blChipRow = document.createElement('div');
      blChipRow.className = 'qem-chip-row';
      blacklistedTags.forEach(tag => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'qem-chip qem-chip-blacklist';
        if (expandedBlacklistTag === tag) chip.classList.add('active');
        chip.textContent = tag;
        const wasLongPressHandled = attachLongPress(chip, () => openTagWiki(tag));
        chip.addEventListener('click', e => {
          if (wasLongPressHandled(e)) return;
          expandedConflictTag = '';
          expandedBlacklistTag = expandedBlacklistTag === tag ? '' : tag;
          rebuildConflictsPage();
        });
        blChipRow.appendChild(chip);
      });
      blWrap.appendChild(blChipRow);
      if (expandedBlacklistTag) {
        const detailsWrap = document.createElement('div');
        detailsWrap.className = 'qem-conflicts-details';
        const detailsLabel = document.createElement('div');
        detailsLabel.className = 'qem-conflicts-details-label';
        detailsLabel.textContent = 'On your global blacklist.';
        detailsWrap.appendChild(detailsLabel);
        const removeBlBtn = document.createElement('button');
        removeBlBtn.type = 'button';
        removeBlBtn.className = 'qem-conflicts-remove-btn';
        removeBlBtn.textContent = 'Remove';
        removeBlBtn.setAttribute('aria-label', 'Remove tag from this post');
        removeBlBtn.addEventListener('click', e => {
          e.stopPropagation();
          removeTagFromMirror(expandedBlacklistTag);
          expandedBlacklistTag = '';
          rebuildConflictsPage();
        });
        detailsWrap.appendChild(removeBlBtn);
        blWrap.appendChild(detailsWrap);
      }
      scroller.appendChild(blWrap);
      section.appendChild(scroller);
      conflictsPage.appendChild(section);
    } else {
      expandedBlacklistTag = '';
    }

    const suppressedByRules = relMaps ? getSuppressedTags(currentSet, relMaps, []) : new Set();
    const conflictTags = relMaps
      ? currentTags
        .filter(tag => !blacklistSet.has(tag))
        .filter(tag => suppressedByRules.has(tag))
      : [];
    const rankedConflicts = conflictTags
      .map(tag => ({ tag, count: getConflictPartnerCount(tag, currentSet, relMaps) }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.tag.localeCompare(b.tag);
      });
    const validExpanded = rankedConflicts.some(entry => entry.tag === expandedConflictTag);
    if (!validExpanded) expandedConflictTag = '';

    if (!rankedConflicts.length) return;
    const conflictSection = document.createElement('div');
    conflictSection.className = 'qem-chips';
    const conflictLabel = document.createElement('span');
    conflictLabel.className = 'qem-chips-label';
    conflictLabel.textContent = 'Conflicting tags';
    conflictLabel.style.cursor = 'default';
    conflictSection.appendChild(conflictLabel);
    const conflictScroller = document.createElement('div');
    conflictScroller.className = 'qem-chip-scroller';
    const conflictWrap = document.createElement('div');
    conflictWrap.className = 'qem-chip-rows';
    const chipRow = document.createElement('div');
    chipRow.className = 'qem-chip-row';
    rankedConflicts.forEach(({ tag, count }) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'qem-chip qem-chip-conflict';
      if (expandedConflictTag === tag) chip.classList.add('active');
      chip.textContent = `${tag} (${count})`;
      const wasLongPressHandled = attachLongPress(chip, () => openTagWiki(tag));
      chip.addEventListener('click', e => {
        if (wasLongPressHandled(e)) return;
        expandedBlacklistTag = '';
        expandedConflictTag = expandedConflictTag === tag ? '' : tag;
        rebuildConflictsPage();
      });
      chipRow.appendChild(chip);
    });
    conflictWrap.appendChild(chipRow);
    if (expandedConflictTag) {
      const partnerTags = listConflictPartners(expandedConflictTag, currentSet, relMaps);
      const detailsWrap = document.createElement('div');
      detailsWrap.className = 'qem-conflicts-details';
      const detailsLabel = document.createElement('div');
      detailsLabel.className = 'qem-conflicts-details-label';
      detailsLabel.textContent = 'Conflicts with:';
      detailsWrap.appendChild(detailsLabel);
      if (!partnerTags.length) {
        const empty = document.createElement('div');
        empty.className = 'qem-conflicts-empty';
        empty.textContent = 'No active conflict partners.';
        detailsWrap.appendChild(empty);
      } else {
        partnerTags.forEach(tag => {
          const rowBtn = document.createElement('button');
          rowBtn.type = 'button';
          rowBtn.className = 'qem-conflict-partner-row';
          rowBtn.textContent = tag;
          rowBtn.addEventListener('click', () => openTagWiki(tag));
          detailsWrap.appendChild(rowBtn);
        });
      }
      const removeCfBtn = document.createElement('button');
      removeCfBtn.type = 'button';
      removeCfBtn.className = 'qem-conflicts-remove-btn';
      removeCfBtn.textContent = 'Remove';
      removeCfBtn.setAttribute('aria-label', 'Remove this tag from the post');
      removeCfBtn.addEventListener('click', e => {
        e.stopPropagation();
        const t = expandedConflictTag;
        if (!t) return;
        removeTagFromMirror(t);
        expandedConflictTag = '';
        rebuildConflictsPage();
      });
      detailsWrap.appendChild(removeCfBtn);
      conflictWrap.appendChild(detailsWrap);
    }
    conflictScroller.appendChild(conflictWrap);
    conflictSection.appendChild(conflictScroller);
    conflictsPage.appendChild(conflictSection);
  }

  function buildCategorySelectorRow() {
    if (categorySelectorRow) categorySelectorRow.remove();
    const categoryMap = getCategories();
    const hierarchy = getCategoryHierarchy();
    const byCategory = getCategoryTagsMap();
    const active = new Set(getActiveCategories());
    const topLevel = new Set(getTopLevelCategorySlugs());
    const selectorSlugs = [...new Set([...topLevel, ...active])].filter(slug => categoryMap[slug]).sort((a, b) => categoryMap[a].name.localeCompare(categoryMap[b].name));
    const suppressedTags = relMaps ? getSuppressedTags(new Set(parseTags(mirrorTA.value)), relMaps, blacklist) : new Set();
    const suppressedCats = new Set();
    Object.keys(categoryMap).forEach(slug => {
      const tags = byCategory[slug] || [];
      if (tags.length && tags.every(tag => suppressedTags.has(tag))) suppressedCats.add(slug);
    });
    function markSuppressedDesc(slug) {
      (hierarchy[slug] || []).forEach(child => {
        if (suppressedCats.has(child)) return markSuppressedDesc(child);
        suppressedCats.add(child);
        markSuppressedDesc(child);
      });
    }
    [...suppressedCats].forEach(markSuppressedDesc);
    const row = document.createElement('div');
    row.className = 'qem-chips';
    const lbl = document.createElement('span');
    lbl.className = 'qem-chips-label';
    lbl.textContent = 'Visible Categories';
    row.appendChild(lbl);
    const scroller = document.createElement('div');
    scroller.className = 'qem-chip-scroller';
    const chipsWrap = document.createElement('div');
    chipsWrap.className = 'qem-chip-row';
    scroller.appendChild(chipsWrap);
    row.appendChild(scroller);
    selectorSlugs.forEach(slug => {
      const entry = categoryMap[slug];
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'qem-chip qem-chip-category-toggle';
      if (active.has(slug)) chip.classList.add('active');
      chip.textContent = entry.name;
      const isConflicting = suppressedCats.has(slug);
      if (isConflicting) chip.classList.add('qem-chip-suppressed');
      chip.addEventListener('click', () => {
        if (isConflicting) {
          const confirmMs = 1800;
          const now = Date.now();
          const armedTs = Number(chip.dataset.qemConfirmTs || 0);
          if (!armedTs || now - armedTs > confirmMs) {
            chip.dataset.qemConfirmTs = String(now);
            chip.classList.add('qem-chip-confirm');
            showToast('Tap again to toggle conflicting category');
            return;
          }
          chip.dataset.qemConfirmTs = '';
          chip.classList.remove('qem-chip-confirm');
        }
        const current = new Set(getActiveCategories());
        const anchorMap = getCategoryAnchorMap();
        if (current.has(slug)) current.delete(slug);
        else {
          current.add(slug);
          if (!anchorMap[slug]) anchorMap[slug] = slug;
        }
        if (!current.has(slug)) delete anchorMap[slug];
        setActiveCategories([...current]);
        setCategoryAnchorMap(anchorMap);
        buildCategorySelectorRow();
        rebuildCategoryRows();
      });
      chipsWrap.appendChild(chip);
    });
    categorySelectorRow = row;
    categoriesPage.appendChild(row);
  }

  function rebuildCategoryRows() {
    while (categoryRows.length) {
      const row = categoryRows.pop();
      row.remove();
    }
    const selected = getActiveCategories();
    if (!selected.length) return;
    const byCategory = getCategoryTagsMap();
    const categoryMap = getCategories();
    const hierarchy = getCategoryHierarchy();
    const parentsIdx = getCategoryParentsIndex();
    const anchorMap = getCategoryAnchorMap();
    const suppressed = relMaps ? getSuppressedTags(new Set(parseTags(mirrorTA.value)), relMaps, blacklist) : new Set();
    const suppressedCats = new Set();
    Object.keys(categoryMap).forEach(slug => {
      const tags = byCategory[slug] || [];
      if (tags.length && tags.every(tag => suppressed.has(tag))) suppressedCats.add(slug);
    });
    function markSuppressedDesc(slug) {
      (hierarchy[slug] || []).forEach(child => {
        if (!suppressedCats.has(child)) suppressedCats.add(child);
        markSuppressedDesc(child);
      });
    }
    [...suppressedCats].forEach(markSuppressedDesc);
    const countCache = getCountCache();
    const selectedSet = new Set(selected.filter(slug => categoryMap[slug]));
    const placed = new Set();
    const order = [];
    function appendWithChildren(slug, stack) {
      if (placed.has(slug) || !selectedSet.has(slug) || stack.has(slug)) return;
      placed.add(slug);
      order.push(slug);
      const nextStack = new Set(stack);
      nextStack.add(slug);
      (hierarchy[slug] || []).forEach(child => {
        if (selectedSet.has(child) && anchorMap[child] === slug) appendWithChildren(child, nextStack);
      });
    }
    getTopLevelCategorySlugs().forEach(slug => appendWithChildren(slug, new Set()));
    [...selectedSet].sort((a, b) => categoryMap[a].name.localeCompare(categoryMap[b].name)).forEach(slug => appendWithChildren(slug, new Set()));

    order.forEach(slug => {
        const section = document.createElement('div');
        section.className = 'qem-chips';
        const childWrap = document.createElement('div');
        childWrap.className = 'qem-chip-row';
        (hierarchy[slug] || [])
          .filter(child => categoryMap[child])
          .sort((a, b) => categoryMap[a].name.localeCompare(categoryMap[b].name))
          .forEach(child => {
            const childChip = document.createElement('button');
            childChip.type = 'button';
            childChip.className = 'qem-chip qem-chip-category-toggle';
            if (selectedSet.has(child)) childChip.classList.add('active');
            if (suppressedCats.has(slug) || suppressedCats.has(child)) childChip.classList.add('qem-chip-suppressed');
            childChip.textContent = categoryMap[child].name;
            childChip.addEventListener('click', () => {
              const now = Date.now();
              const confirmMs = 1800;
              if (childChip.classList.contains('qem-chip-suppressed')) {
                const armedTs = Number(childChip.dataset.qemConfirmTs || 0);
                if (!armedTs || now - armedTs > confirmMs) {
                  childChip.dataset.qemConfirmTs = String(now);
                  childChip.classList.add('qem-chip-confirm');
                  showToast('Tap again to toggle conflicting category');
                  return;
                }
              }
              const cur = new Set(getActiveCategories());
              const nextAnchor = getCategoryAnchorMap();
              if (cur.has(child)) {
                cur.delete(child);
                delete nextAnchor[child];
              } else {
                cur.add(child);
                nextAnchor[child] = slug;
              }
              setActiveCategories([...cur]);
              setCategoryAnchorMap(nextAnchor);
              buildCategorySelectorRow();
              rebuildCategoryRows();
            });
            childWrap.appendChild(childChip);
          });
        if (childWrap.childElementCount) section.appendChild(childWrap);

        const raw = (byCategory[slug] || []).slice();
        if (!raw.length && !childWrap.childElementCount) return;
        raw.sort((a, b) => {
          const aSup = suppressed.has(a) ? 1 : 0;
          const bSup = suppressed.has(b) ? 1 : 0;
          if (aSup !== bSup) return aSup - bSup;
          const cDiff = getTagCountNum(b, countCache) - getTagCountNum(a, countCache);
          if (cDiff !== 0) return cDiff;
          return a.localeCompare(b);
        });
        const row = makeCollapsibleChipRow(
          raw,
          'qem-chip-related',
          categoryMap[slug].name,
          `r34_collapse_category_${slug}`,
          mirrorTA,
          suppressed,
          val => { syncToSource(sourceTextarea, val); updateHelpersFromMerged(val); syncStaticChips(); scheduleRelated(); },
          { showSuppressed: true, suppressedNeedsConfirm: true, suppressedConfirmMs: 1800 }
        );
        if (row) section.appendChild(row);
        if (!section.childElementCount) return;
        categoryRows.push(section);
        categoriesPage.appendChild(section);
      });
  }

  function getRecommendedCategorySlugs() {
    const currentTags = new Set(parseTags(mirrorTA.value));
    if (!currentTags.size) return [];
    const byCategory = getCategoryTagsMap();
    const categoryMap = getCategories();
    const countCache = getCountCache();
    function tagWeight(tag) {
      const count = Math.max(1, getTagCountNum(tag, countCache));
      return 1 / (1 + Math.log10(count));
    }
    const ranked = Object.keys(categoryMap).map(slug => {
      const tags = byCategory[slug] || [];
      if (!tags.length) return null;
      let overlap = 0;
      let overlapWeight = 0;
      tags.forEach(tag => {
        if (!currentTags.has(tag)) return;
        overlap += 1;
        overlapWeight += tagWeight(tag);
      });
      if (!overlap || overlapWeight <= 0) return null;
      const normalized = overlapWeight / Math.sqrt(tags.length);
      return { slug, score: normalized, overlap };
    }).filter(Boolean);
    ranked.sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;
      if (b.score !== a.score) return b.score - a.score;
      return categoryMap[a.slug].name.localeCompare(categoryMap[b.slug].name);
    });
    return ranked.map(entry => entry.slug);
  }

  function getStableRecommendedDisplaySlugs(fresh) {
    if (recommendedOrderSnapshot === null) {
      if (fresh.length) recommendedOrderSnapshot = fresh.slice();
      return fresh.slice();
    }
    const freshSet = new Set(fresh);
    const ordered = [];
    const seen = new Set();
    recommendedOrderSnapshot.forEach(slug => {
      if (freshSet.has(slug)) {
        ordered.push(slug);
        seen.add(slug);
      }
    });
    fresh.forEach(slug => {
      if (!seen.has(slug)) {
        ordered.push(slug);
        seen.add(slug);
      }
    });
    return ordered;
  }

  function removeRecommendedHideMenu() {
    if (recommendedHideMenuEl) {
      if (recommendedHideMenuEl._qemCleanup) recommendedHideMenuEl._qemCleanup();
      recommendedHideMenuEl.remove();
      recommendedHideMenuEl = null;
    }
  }

  function showRecommendedCategoryHideMenu(anchorEl, slug) {
    removeRecommendedHideMenu();
    const menu = document.createElement('div');
    recommendedHideMenuEl = menu;
    menu.className = 'qem-recommended-hide-menu';
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'qem-recommended-hide-menu-item';
    const isHidden = hiddenRecommendedSlugs.has(slug);
    item.textContent = isHidden ? 'Unhide category' : 'Hide from list';
    item.addEventListener('click', e => {
      e.stopPropagation();
      removeRecommendedHideMenu();
      if (isHidden) hiddenRecommendedSlugs.delete(slug);
      else hiddenRecommendedSlugs.add(slug);
      if (!isHidden) activeRecommendedSlugs.delete(slug);
      rebuildRecommendedRows();
    });
    menu.appendChild(item);
    document.body.appendChild(menu);
    function onOutside(e) {
      if (menu.contains(e.target)) return;
      removeRecommendedHideMenu();
    }
    function onEsc(e) {
      if (e.key === 'Escape') removeRecommendedHideMenu();
    }
    menu._qemCleanup = function() {
      document.removeEventListener('pointerdown', onOutside, true);
      document.removeEventListener('keydown', onEsc);
    };
    requestAnimationFrame(() => {
      if (!recommendedHideMenuEl) return;
      const ar = anchorEl.getBoundingClientRect();
      const mw = menu.offsetWidth;
      const mh = menu.offsetHeight;
      let left = Math.min(ar.left, window.innerWidth - mw - 8);
      let top = ar.bottom + 6;
      if (top + mh > window.innerHeight - 8) top = ar.top - mh - 6;
      if (top < 8) top = 8;
      if (left < 8) left = 8;
      if (left + mw > window.innerWidth - 8) left = window.innerWidth - mw - 8;
      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;
    });
    setTimeout(() => document.addEventListener('pointerdown', onOutside, true), 0);
    document.addEventListener('keydown', onEsc);
  }

  function buildRecommendedSelectorRow(recommendedSlugs, suppressedCats) {
    removeRecommendedHideMenu();
    if (recommendedSelectorRow) recommendedSelectorRow.remove();
    if (!recommendedSlugs.length && !hiddenRecommendedSlugs.size) {
      recommendedSelectorRow = null;
      return;
    }
    const categoryMap = getCategories();
    const row = document.createElement('div');
    row.className = 'qem-chips';
    const head = document.createElement('div');
    head.className = 'qem-recommended-categories-header';
    const lbl = document.createElement('span');
    lbl.className = 'qem-chips-label';
    lbl.textContent = 'Recommended Categories';
    const refreshOrderBtn = document.createElement('button');
    refreshOrderBtn.type = 'button';
    refreshOrderBtn.className = 'qem-recommended-refresh-order';
    refreshOrderBtn.textContent = 'Refresh Order';
    refreshOrderBtn.setAttribute('aria-label', 'Refresh recommended category order');
    refreshOrderBtn.addEventListener('click', e => {
      e.stopPropagation();
      clearTimeout(_relatedDebounce);
      _relatedDebounce = null;
      recommendedOrderSnapshot = getRecommendedCategorySlugs().slice();
      runRelatedAssistSync();
    });
    head.appendChild(lbl);
    if (hiddenRecommendedSlugs.size > 0) {
      const restoreHiddenBtn = document.createElement('button');
      restoreHiddenBtn.type = 'button';
      restoreHiddenBtn.className = 'qem-recommended-restore-hidden';
      if (showHiddenRecommended) restoreHiddenBtn.classList.add('qem-showing-hidden');
      restoreHiddenBtn.textContent = `${showHiddenRecommended ? 'Hide hidden' : 'Show hidden'} (${hiddenRecommendedSlugs.size})`;
      restoreHiddenBtn.setAttribute('aria-label', showHiddenRecommended ? 'Hide hidden categories from the list' : 'Show hidden categories in the list');
      restoreHiddenBtn.addEventListener('click', e => {
        e.stopPropagation();
        showHiddenRecommended = !showHiddenRecommended;
        rebuildRecommendedRows();
      });
      head.appendChild(restoreHiddenBtn);
    }
    head.appendChild(refreshOrderBtn);
    row.appendChild(head);
    const scroller = document.createElement('div');
    scroller.className = 'qem-chip-scroller';
    const chipsWrap = document.createElement('div');
    chipsWrap.className = 'qem-chip-row';
    scroller.appendChild(chipsWrap);
    row.appendChild(scroller);
    const longPressMs = 500;
    const moveCancelPx = 14;
    recommendedSlugs.filter(s => showHiddenRecommended || !hiddenRecommendedSlugs.has(s)).forEach(slug => {
      if (!categoryMap[slug]) return;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'qem-chip qem-chip-category-toggle';
      if (hiddenRecommendedSlugs.has(slug)) {
        chip.classList.add('qem-chip-recommended-hidden');
        chip.title = 'Hidden category (long-press for options)';
      }
      if (activeRecommendedSlugs.has(slug)) chip.classList.add('active');
      chip.textContent = categoryMap[slug].name;
      if (suppressedCats.has(slug)) chip.classList.add('qem-chip-suppressed');
      let longPressTimer = null;
      let longPressFired = false;
      chip.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        longPressFired = false;
        const startX = e.clientX;
        const startY = e.clientY;
        longPressTimer = window.setTimeout(() => {
          longPressTimer = null;
          longPressFired = true;
          suppressNextClick();
          showRecommendedCategoryHideMenu(chip, slug);
        }, longPressMs);
        function onMove(ev) {
          if (longPressTimer == null) return;
          if (Math.abs(ev.clientX - startX) > moveCancelPx || Math.abs(ev.clientY - startY) > moveCancelPx) {
            window.clearTimeout(longPressTimer);
            longPressTimer = null;
          }
        }
        function onUp() {
          if (longPressTimer != null) {
            window.clearTimeout(longPressTimer);
            longPressTimer = null;
          }
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
          document.removeEventListener('pointercancel', onUp);
        }
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);
      });
      chip.addEventListener('click', e => {
        if (longPressFired) {
          e.preventDefault();
          e.stopPropagation();
          longPressFired = false;
          return;
        }
        if (activeRecommendedSlugs.has(slug)) activeRecommendedSlugs.delete(slug);
        else activeRecommendedSlugs.add(slug);
        rebuildRecommendedRows();
      });
      chipsWrap.appendChild(chip);
    });
    recommendedSelectorRow = row;
    recommendedPage.appendChild(row);
  }

  function rebuildRecommendedRows() {
    while (recommendedRows.length) {
      const row = recommendedRows.pop();
      row.remove();
    }
    if (!hiddenRecommendedSlugs.size) showHiddenRecommended = false;
    const byCategory = getCategoryTagsMap();
    const categoryMap = getCategories();
    const hierarchy = getCategoryHierarchy();
    const suppressed = relMaps ? getSuppressedTags(new Set(parseTags(mirrorTA.value)), relMaps, blacklist) : new Set();
    const suppressedCats = new Set();
    Object.keys(categoryMap).forEach(slug => {
      const tags = byCategory[slug] || [];
      if (tags.length && tags.every(tag => suppressed.has(tag))) suppressedCats.add(slug);
    });
    function markSuppressedDesc(slug) {
      (hierarchy[slug] || []).forEach(child => {
        if (!suppressedCats.has(child)) suppressedCats.add(child);
        markSuppressedDesc(child);
      });
    }
    [...suppressedCats].forEach(markSuppressedDesc);
    const freshRanked = getRecommendedCategorySlugs();
    [...activeRecommendedSlugs].forEach(slug => {
      if (!freshRanked.includes(slug)) activeRecommendedSlugs.delete(slug);
    });
    const recommendedSlugs = getStableRecommendedDisplaySlugs(freshRanked);
    buildRecommendedSelectorRow(recommendedSlugs, suppressedCats);
    recommendedSlugs.filter(slug => activeRecommendedSlugs.has(slug)).forEach(slug => {
      const section = document.createElement('div');
      section.className = 'qem-chips';
      const raw = (byCategory[slug] || []).slice();
      raw.sort((a, b) => {
        const aSup = suppressed.has(a) ? 1 : 0;
        const bSup = suppressed.has(b) ? 1 : 0;
        if (aSup !== bSup) return aSup - bSup;
        return a.localeCompare(b);
      });
      const row = makeCollapsibleChipRow(
        raw,
        'qem-chip-related',
        categoryMap[slug].name,
        `r34_collapse_recommended_${slug}`,
        mirrorTA,
        suppressed,
        val => { syncToSource(sourceTextarea, val); updateHelpersFromMerged(val); syncStaticChips(); scheduleRelated(); },
        { showSuppressed: true, suppressedNeedsConfirm: true, suppressedConfirmMs: 1800 }
      );
      if (!row) return;
      section.appendChild(row);
      recommendedRows.push(section);
      recommendedPage.appendChild(section);
    });
  }

  function syncStaticChips() {
    if (recentRow) recentRow._syncVisibility();
    if (favRow) favRow._syncVisibility();
    categoryRows.forEach(section => {
      section.querySelectorAll('.qem-chips').forEach(row => {
        if (row._syncVisibility) row._syncVisibility();
      });
    });
    recommendedRows.forEach(section => {
      section.querySelectorAll('.qem-chips').forEach(row => {
        if (row._syncVisibility) row._syncVisibility();
      });
    });
  }

  function runRelatedAssistSync() {
    if (renderRelatedRow) renderRelatedRow();
    buildCategorySelectorRow();
    rebuildCategoryRows();
    rebuildRecommendedRows();
    rebuildConflictsPage();
    syncStaticChips();
  }

  function scheduleRelated() {
    clearTimeout(_relatedDebounce);
    _relatedDebounce = setTimeout(() => {
      _relatedDebounce = null;
      runRelatedAssistSync();
    }, 400);
  }

  try {
    relMaps = buildRelationMaps();
    blacklist = getBlacklist();
    const { renderRelatedRow: rrr } = buildRelatedRowManager(assistPage, mirrorTA, relMaps, blacklist);
    renderRelatedRow = rrr;
    renderRelatedRow();
  } catch (e) {
    console.warn('[QEM] Error building relation rows:', e);
  }

  buildCategorySelectorRow();
  rebuildCategoryRows();
  rebuildRecommendedRows();
  rebuildConflictsPage();
  syncStaticChips();

  const tagsWrap = document.createElement('div');
  tagsWrap.id = 'qem-mirror-tags-wrap';
  if (GM_getValue(COLLAPSE_KEY_TAGS, false)) tagsWrap.classList.add('collapsed');
  const label = document.createElement('div');
  label.id = 'qem-mirror-label';
  label.textContent = 'Tags';
  label.addEventListener('click', e => {
    e.stopPropagation();
    tagsWrap.classList.toggle('collapsed');
    GM_setValue(COLLAPSE_KEY_TAGS, tagsWrap.classList.contains('collapsed'));
  });
  tagsWrap.appendChild(label);

  const helpersWrap = document.createElement('div');
  helpersWrap.id = 'qem-mirror-editor-helpers';

  const addedLbl = document.createElement('div');
  addedLbl.className = 'qem-mirror-editor-label';
  addedLbl.textContent = 'Added Tags';
  const addedTA = document.createElement('textarea');
  addedTA.id = 'qem-mirror-added-textarea';
  addedTA.readOnly = true;
  addedTA.spellcheck = false;
  addedTA.autocomplete = 'off';

  const removedLbl = document.createElement('div');
  removedLbl.className = 'qem-mirror-editor-label';
  removedLbl.textContent = 'Removed Tags';
  const removedTA = document.createElement('textarea');
  removedTA.id = 'qem-mirror-removed-textarea';
  removedTA.readOnly = true;
  removedTA.spellcheck = false;
  removedTA.autocomplete = 'off';

  helpersWrap.appendChild(addedLbl);
  helpersWrap.appendChild(addedTA);
  helpersWrap.appendChild(removedLbl);
  helpersWrap.appendChild(removedTA);

  mirrorTA.id = 'qem-mirror-textarea-canonical';

  tagsWrap.appendChild(mirrorTA);
  tagsWrap.appendChild(helpersWrap);
  editorPage.appendChild(tagsWrap);

  const originalTagSet = new Set(originalTags);

  function tagsToText(tags) {
    if (!tags.length) return '';
    return `${tags.join(' ')} `;
  }

  function updateHelpersFromMerged(mergedVal) {
    const current = parseTags(mergedVal);
    const currentSet = new Set(current);
    const addedNow = current.filter(tag => !originalTagSet.has(tag));
    const removedNow = originalTags.filter(tag => !currentSet.has(tag));
    addedTA.value = tagsToText(addedNow);
    removedTA.value = tagsToText(removedNow);
  }

  attachAutocomplete(mirrorTA, tag => {
    const v = mirrorTA.value;
    const lastSpace = v.lastIndexOf(' ');
    const val = (lastSpace === -1 ? '' : v.slice(0, lastSpace + 1)) + tag + ' ';
    mirrorTA.value = val;
    syncToSource(sourceTextarea, val);
    updateHelpersFromMerged(val);
    mirrorTA.focus();
    requestAnimationFrame(() => {
      mirrorTA.scrollTop = mirrorTA.scrollHeight;
      mirrorTA.setSelectionRange(val.length, val.length);
    });
    document.querySelectorAll('.qem-chip').forEach(c => {
      if ((c.dataset.tag || c.textContent) === tag) c.style.display = 'none';
    });
    syncStaticChips();
    scheduleRelated();
  }, null, () => new Set(parseTags(mirrorTA.value)));

  attachAutocomplete(ruleInput, tag => {
    const val = ruleInput.value;
    const opMatch = val.match(/^(.*?)\s*(=\/=|=|>|<)\s*(.*)$/);
    if (opMatch) {
      const rightParts = opMatch[3].split(/\s+/).filter(Boolean);
      rightParts[Math.max(0, rightParts.length - 1)] = tag;
      ruleInput.value = `${opMatch[1].trim()} ${opMatch[2]} ${rightParts.join(' ')} `;
    } else {
      const parts = val.split(/\s+/);
      parts[parts.length - 1] = tag;
      ruleInput.value = parts.join(' ') + ' ';
    }
  }, null, () => {
    const stripped = ruleInput.value.replace(/=\/=|=|>|</g, ' ');
    return new Set(stripped.trim().split(/\s+/).filter(Boolean));
  }, { forceAbove: true });

  wireTextareaSync(mirrorTA, sourceTextarea, () => {
    updateHelpersFromMerged(mirrorTA.value);
    syncStaticChips();
    scheduleRelated();
  });
  wireSubmitHandler(sourceTextarea, originalTags);
  function refreshChipLayouts() {
    const rows = body.querySelectorAll('.qem-chips');
    rows.forEach(row => { if (row._refreshLayout) row._refreshLayout(); });
  }

  minBtn.addEventListener('click', () => { setTimeout(() => {
    refreshChipLayouts();
  }, 0); });

  const initialPage = GM_getValue(MIRROR_PAGE_KEY, 'assist');
  setActivePage(initialPage);

  if (mirrorTA.value && !mirrorTA.value.endsWith(' ')) {
    mirrorTA.value += ' ';
    syncToSource(sourceTextarea, mirrorTA.value);
  }
  updateHelpersFromMerged(mirrorTA.value);
  mirrorTA.scrollTop = mirrorTA.scrollHeight;
  mirror.addEventListener('wheel', e => e.stopPropagation(), { passive: true });
  mirror.addEventListener('pointerdown', e => e.stopPropagation());

  return { mirror, backdrop };
}