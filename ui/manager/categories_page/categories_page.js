// CATEGORIES PAGE: `buildCategoriesPage(container)` — mobile-first single-open accordion editor. Each category row expands inline into grouped sections for add, child links, copy/remove actions, and tag chips.
function buildCategoriesPage(container) {
  const addArea = document.createElement('div');
  addArea.className = 'qem-mgr-add-area qem-mgr-sticky-controls';
  let activeCategorySlug = '';
  const expandedCategorySlugs = new Set();
  const removeModeByCategory = {};
  const pendingRemovedTagsByCategory = {};
  const pendingAddInputByCategory = {};
  const pendingAddPersistTimerByCategory = {};

  const row1 = document.createElement('div');
  row1.className = 'qem-mgr-row';
  const categoryInput = document.createElement('input');
  categoryInput.className = 'qem-mgr-input';
  categoryInput.placeholder = 'Category name...';
  const addCategoryBtn = document.createElement('button');
  addCategoryBtn.className = 'qem-mgr-add-btn';
  addCategoryBtn.textContent = '+ Add Category';
  row1.appendChild(categoryInput);
  row1.appendChild(addCategoryBtn);

  const row2 = document.createElement('div');
  row2.className = 'qem-mgr-row';
  const searchInput = document.createElement('input');
  searchInput.className = 'qem-mgr-input';
  searchInput.placeholder = 'Search categories...';
  row2.appendChild(searchInput);

  addArea.appendChild(row1);
  addArea.appendChild(row2);
  const list = document.createElement('div');
  list.className = 'qem-mgr-list qem-mgr-accordion-list';
  const persistedDrafts = loadDraftMap(CATEGORY_ADD_DRAFTS_KEY);
  Object.entries(persistedDrafts).forEach(([slug, entry]) => {
    pendingAddInputByCategory[slug] = String(entry?.value || '');
  });
  {
    const existing = getCategories();
    let changed = false;
    Object.keys(persistedDrafts).forEach(slug => {
      if (existing[slug]) return;
      delete pendingAddInputByCategory[slug];
      changed = true;
    });
    if (changed) {
      const next = {};
      Object.keys(pendingAddInputByCategory).forEach(slug => {
        const value = String(pendingAddInputByCategory[slug] || '');
        if (!value.trim()) return;
        next[slug] = { value, updatedAt: Date.now() };
      });
      saveDraftMap(CATEGORY_ADD_DRAFTS_KEY, next);
    }
  }

  function getCategoryEntries() {
    const categories = getCategories();
    const parentsIdx = getCategoryParentsIndex();
    const depthMemo = {};
    function depthOf(slug, stack) {
      if (depthMemo[slug] !== undefined) return depthMemo[slug];
      if (stack.has(slug)) return 0;
      const parents = parentsIdx[slug] || [];
      if (!parents.length) return 0;
      const nextStack = new Set(stack);
      nextStack.add(slug);
      const d = Math.min(...parents.map(p => 1 + depthOf(p, nextStack)));
      depthMemo[slug] = Number.isFinite(d) ? d : 0;
      return depthMemo[slug];
    }
    return Object.entries(categories).sort((a, b) => {
      const da = depthOf(a[0], new Set());
      const db = depthOf(b[0], new Set());
      if (da !== db) return da - db;
      return a[1].name.localeCompare(b[1].name);
    });
  }

  function getTagsForCategory(slug) {
    const membership = getCategoryMembership();
    return Object.entries(membership)
      .filter(([, slugs]) => Array.isArray(slugs) && slugs.includes(slug))
      .map(([tag]) => tag)
      .sort((a, b) => a.localeCompare(b));
  }

  function getChildrenForCategory(slug) {
    const hierarchy = getCategoryHierarchy();
    const categories = getCategories();
    return (hierarchy[slug] || []).filter(child => categories[child]).sort((a, b) => categories[a].name.localeCompare(categories[b].name));
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast('Copied')).catch(() => showToast('Clipboard unavailable'));
    } else {
      showToast('Clipboard unavailable');
    }
  }

  function rerenderCategoryCard(slug) {
    const card = list.querySelector(`.qem-mgr-accordion-card[data-category-slug="${slug}"]`);
    if (!card) {
      renderList();
      return;
    }
    const byCategory = getCategoryTagsMap();
    const meta = card.querySelector('.qem-mgr-category-meta');
    if (meta) meta.textContent = `${(byCategory[slug] || []).length} tags`;
    if (!expandedCategorySlugs.has(slug)) return;
    const oldDetail = card.querySelector('.qem-mgr-accordion-detail');
    if (oldDetail) oldDetail.remove();
    const detail = document.createElement('div');
    detail.className = 'qem-mgr-accordion-detail';
    renderCategoryDetail(slug, detail);
    card.appendChild(detail);
  }

  function renderCategoryDetail(slug, detailEl) {
    const categories = getCategories();
    const removeMode = !!removeModeByCategory[slug];
    const pendingRemoved = new Set(pendingRemovedTagsByCategory[slug] || []);
    const tags = getTagsForCategory(slug);
    const children = getChildrenForCategory(slug);

    const addBlock = document.createElement('div');
    addBlock.className = 'qem-mgr-accordion-block';
    const addRow = document.createElement('div');
    addRow.className = 'qem-mgr-row';
    const addInput = document.createElement('input');
    addInput.className = 'qem-mgr-input';
    addInput.placeholder = 'Add tags or category links (category:slug)...';
    addInput.value = pendingAddInputByCategory[slug] || '';
    const addBtn = document.createElement('button');
    addBtn.className = 'qem-mgr-add-btn';
    addBtn.textContent = '+ Add';
    addRow.appendChild(addInput);
    addRow.appendChild(addBtn);
    addBlock.appendChild(addRow);
    detailEl.appendChild(addBlock);

    function addMixedTokens() {
      const raw = addInput.value.trim();
      if (!raw) return;
      const tokens = raw.split(/\s+/).filter(Boolean);
      const tagTokens = [];
      const childTokens = [];
      tokens.forEach(tok => {
        const lower = tok.toLowerCase();
        if (lower.startsWith('category:')) {
          const key = lower.slice('category:'.length);
          const match = Object.entries(categories).find(([s, e]) => s === key || e.name.toLowerCase() === key);
          if (match && match[0] !== slug) childTokens.push(match[0]);
        } else tagTokens.push(tok);
      });
      const addedTags = tagTokens.length ? addTagsToCategory(slug, tagTokens) : 0;
      const addedChildren = childTokens.length ? addCategoryChildren(slug, childTokens) : 0;
      if (addedTags || addedChildren) {
        pendingAddInputByCategory[slug] = '';
        clearTimeout(pendingAddPersistTimerByCategory[slug]);
        clearDraftValue(CATEGORY_ADD_DRAFTS_KEY, slug);
      }
      if (addedChildren) renderList();
      else rerenderCategoryCard(slug);
      showToast((addedTags || addedChildren) ? `Added ${addedTags} tag(s), ${addedChildren} child link(s)` : 'Nothing new added');
    }
    addBtn.addEventListener('click', addMixedTokens);
    addInput.addEventListener('keydown', e => { if (e.key === 'Enter') addMixedTokens(); });
    addInput.addEventListener('input', () => {
      pendingAddInputByCategory[slug] = addInput.value;
      clearTimeout(pendingAddPersistTimerByCategory[slug]);
      pendingAddPersistTimerByCategory[slug] = setTimeout(() => {
        setDraftValue(CATEGORY_ADD_DRAFTS_KEY, slug, pendingAddInputByCategory[slug] || '');
      }, 160);
    });
    attachAutocomplete(addInput, tag => {
      const val = addInput.value;
      const lastSpace = val.lastIndexOf(' ');
      addInput.value = (lastSpace === -1 ? '' : val.slice(0, lastSpace + 1)) + tag + ' ';
      pendingAddInputByCategory[slug] = addInput.value;
      clearTimeout(pendingAddPersistTimerByCategory[slug]);
      pendingAddPersistTimerByCategory[slug] = setTimeout(() => {
        setDraftValue(CATEGORY_ADD_DRAFTS_KEY, slug, pendingAddInputByCategory[slug] || '');
      }, 160);
    });

    if (children.length) {
      const childLbl = document.createElement('div');
      childLbl.className = 'qem-mgr-tag-chip-preview';
      childLbl.textContent = 'Child categories';
      detailEl.appendChild(childLbl);
      const childWrap = document.createElement('div');
      childWrap.className = 'qem-mgr-category-members';
      children.forEach(childSlug => {
        const childChip = document.createElement('button');
        childChip.type = 'button';
        childChip.className = 'qem-mgr-category-chip';
        childChip.textContent = `category:${categories[childSlug].name}`;
        childChip.addEventListener('click', () => {
          activeCategorySlug = childSlug;
          expandedCategorySlugs.add(childSlug);
          const childCard = list.querySelector(`.qem-mgr-accordion-card[data-category-slug="${childSlug}"]`);
          if (!childCard) {
            renderList();
            return;
          }
          childCard.classList.add('active');
          rerenderCategoryCard(childSlug);
        });
        childWrap.appendChild(childChip);
      });
      detailEl.appendChild(childWrap);
    }

    const actions = document.createElement('div');
    actions.className = 'qem-mgr-row qem-mgr-mobile-actions';
    const copyListBtn = document.createElement('button');
    copyListBtn.className = 'qem-mgr-op qem-mgr-op-muted';
    copyListBtn.textContent = 'Copy List';
    copyListBtn.addEventListener('click', () => copyText(tags.join(' ')));
    const copyNegBtn = document.createElement('button');
    copyNegBtn.className = 'qem-mgr-op qem-mgr-op-muted';
    copyNegBtn.textContent = 'Copy Negated';
    copyNegBtn.addEventListener('click', () => copyText(tags.map(t => `-${t}`).join(' ')));
    const copyOrBtn = document.createElement('button');
    copyOrBtn.className = 'qem-mgr-op qem-mgr-op-muted';
    copyOrBtn.textContent = 'Copy OR';
    copyOrBtn.addEventListener('click', () => copyText(`( ${tags.join(' ~ ')} )`));
    actions.appendChild(copyListBtn);
    actions.appendChild(copyNegBtn);
    actions.appendChild(copyOrBtn);
    detailEl.appendChild(actions);

    const removeRow = document.createElement('div');
    removeRow.className = 'qem-mgr-row';
    const removeBtn = document.createElement('button');
    removeBtn.className = 'qem-mgr-op qem-mgr-op-danger';
    removeBtn.textContent = 'Remove Tags';
    removeBtn.style.display = removeMode ? 'none' : '';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'qem-mgr-op';
    saveBtn.textContent = 'Save';
    saveBtn.style.display = removeMode ? '' : 'none';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'qem-mgr-op qem-mgr-op-muted';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.display = removeMode ? '' : 'none';
    removeBtn.addEventListener('click', () => {
      removeModeByCategory[slug] = true;
      pendingRemovedTagsByCategory[slug] = [...pendingRemoved];
      rerenderCategoryCard(slug);
    });
    cancelBtn.addEventListener('click', () => {
      removeModeByCategory[slug] = false;
      delete pendingRemovedTagsByCategory[slug];
      rerenderCategoryCard(slug);
    });
    saveBtn.addEventListener('click', () => {
      const toRemove = new Set(pendingRemovedTagsByCategory[slug] || []);
      const membership = getCategoryMembership();
      Object.keys(membership).forEach(tag => {
        if (!toRemove.has(tag)) return;
        membership[tag] = (membership[tag] || []).filter(s => s !== slug);
        if (!membership[tag].length) delete membership[tag];
      });
      saveCategoryMembership(membership);
      removeModeByCategory[slug] = false;
      delete pendingRemovedTagsByCategory[slug];
      showToast('Tags removed');
      rerenderCategoryCard(slug);
    });
    removeRow.appendChild(removeBtn);
    removeRow.appendChild(saveBtn);
    removeRow.appendChild(cancelBtn);
    detailEl.appendChild(removeRow);

    if (!tags.length) {
      const none = document.createElement('div');
      none.className = 'qem-mgr-empty';
      none.textContent = 'No tags in this category yet.';
      detailEl.appendChild(none);
      return;
    }
    const tagWrap = document.createElement('div');
    tagWrap.className = 'qem-mgr-category-members';
    tags.forEach(tag => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'qem-mgr-category-chip';
      chip.textContent = tag;
      if (removeMode && pendingRemoved.has(tag)) chip.style.opacity = '0.35';
      chip.addEventListener('click', () => {
        if (!removeMode) return;
        const set = new Set(pendingRemovedTagsByCategory[slug] || []);
        if (set.has(tag)) set.delete(tag); else set.add(tag);
        pendingRemovedTagsByCategory[slug] = [...set];
        rerenderCategoryCard(slug);
      });
      tagWrap.appendChild(chip);
    });
    detailEl.appendChild(tagWrap);
  }

  function renderList() {
    const filter = searchInput.value.trim().toLowerCase();
    const byCategory = getCategoryTagsMap();
    const categories = getCategoryEntries().filter(([, entry]) => !filter || entry.name.toLowerCase().includes(filter));
    list.innerHTML = '';
    if (!categories.length) {
      const empty = document.createElement('div');
      empty.className = 'qem-mgr-empty';
      empty.textContent = 'No categories yet.';
      list.appendChild(empty);
      return;
    }
    if (activeCategorySlug && !categories.some(([slug]) => slug === activeCategorySlug)) activeCategorySlug = '';
    [...expandedCategorySlugs].forEach(slug => {
      if (!categories.some(([s]) => s === slug)) expandedCategorySlugs.delete(slug);
    });

    categories.forEach(([slug, entry]) => {
      const card = document.createElement('div');
      const isExpanded = expandedCategorySlugs.has(slug);
      card.className = 'qem-mgr-accordion-card' + (isExpanded ? ' active' : '');
      card.dataset.categorySlug = slug;

      const header = document.createElement('div');
      header.className = 'qem-mgr-rule';
      const name = document.createElement('span');
      name.className = 'qem-mgr-rule-left';
      name.textContent = entry.name;
      const meta = document.createElement('span');
      meta.className = 'qem-mgr-tag-chip-preview qem-mgr-category-meta';
      meta.textContent = `${(byCategory[slug] || []).length} tags`;
      const renameBtn = document.createElement('button');
      renameBtn.className = 'qem-mgr-del';
      renameBtn.textContent = '✏️';
      renameBtn.addEventListener('click', () => {
        const nextName = prompt('Rename category:', entry.name);
        if (!nextName) return;
        const nextSlug = upsertCategory(nextName, slug);
        if (!nextSlug) return showToast('Invalid category name');
        activeCategorySlug = nextSlug;
        renderList();
      });
      const del = document.createElement('button');
      del.className = 'qem-mgr-del';
      del.textContent = '🗑';
      del.addEventListener('click', () => {
        if (!confirm(`Delete category "${entry.name}"?`)) return;
        if (deleteCategory(slug)) {
          if (activeCategorySlug === slug) activeCategorySlug = '';
          renderList();
          showToast('Category deleted');
        }
      });
      header.addEventListener('click', e => {
        if (e.target === renameBtn || e.target === del) return;
        activeCategorySlug = slug;
        const detail = card.querySelector('.qem-mgr-accordion-detail');
        if (expandedCategorySlugs.has(slug)) {
          expandedCategorySlugs.delete(slug);
          card.classList.remove('active');
          if (detail) detail.remove();
          return;
        }
        expandedCategorySlugs.add(slug);
        card.classList.add('active');
        rerenderCategoryCard(slug);
      });
      header.appendChild(name);
      header.appendChild(meta);
      header.appendChild(renameBtn);
      header.appendChild(del);
      card.appendChild(header);

      if (isExpanded) {
        const detail = document.createElement('div');
        detail.className = 'qem-mgr-accordion-detail';
        renderCategoryDetail(slug, detail);
        card.appendChild(detail);
      }
      list.appendChild(card);
    });
  }

  addCategoryBtn.addEventListener('click', () => {
    const raw = categoryInput.value.trim();
    if (!raw) return;
    const slug = upsertCategory(raw);
    if (!slug) return showToast('Invalid category name');
    activeCategorySlug = slug;
    expandedCategorySlugs.add(slug);
    categoryInput.value = '';
    renderList();
  });

  let timer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(renderList, 120);
  });

  container.appendChild(addArea);
  container.appendChild(list);
  renderList();
}
