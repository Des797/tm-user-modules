// TAGS PAGE: `buildTagsPage(pageTags)` — builds the Tags tab UI and appends it to `pageTags`. Constructs the stats bar, search+sort row, scrollable tag list, and detail panel; wires all events. Delegates rendering to `renderTagsStats`, `renderTagsList`, and `renderTagDetail` (tags_list.js / tags_detail.js) and graph construction to `buildTagGraph`, `buildSynonymMap` (tags_graph.js / tags_synonyms.js). Previously an inner function of createRelationsManager; now a module-level function that accepts its container as a parameter.

  function buildTagsPage(pageTags) {
    let sortMode = 'relations';
    let searchQ = '';

    const statsBar = document.createElement('div');
    statsBar.id = 'qem-tags-stats';

    const searchRow = document.createElement('div');
    searchRow.id = 'qem-tags-search-row';
    const searchInput = document.createElement('input');
    searchInput.className = 'qem-mgr-input';
    searchInput.placeholder = 'Search tags…';
    searchInput.autocomplete = 'off';
    const sortSel = document.createElement('select');
    sortSel.className = 'qem-mgr-input';
    sortSel.style.flex = '0 0 auto';
    [['relations', 'By relations'], ['alpha', 'A–Z'], ['count', 'By count']].forEach(([v, l]) => {
      const o = document.createElement('option'); o.value = v; o.textContent = l; sortSel.appendChild(o);
    });
    searchRow.appendChild(searchInput);
    searchRow.appendChild(sortSel);

    const listEl = document.createElement('div');
    listEl.id = 'qem-tags-list';

    const detailEl = document.createElement('div');
    detailEl.id = 'qem-tags-detail';

    pageTags.appendChild(statsBar);
    pageTags.appendChild(searchRow);
    pageTags.appendChild(listEl);
    pageTags.appendChild(detailEl);

    function renderList() {
      const rules = getRelations();
      const graph = buildTagGraph(rules);
      const allTags = getAllTagsFromRules(rules);
      const canonMap = buildSynonymMap(rules);
      renderTagsStats(statsBar, allTags, rules, canonMap);
      renderTagsList(listEl, { rules, graph, allTags, canonMap, searchQ, sortMode, onTagClick: showDetail });
    }

    function showDetail(tag) {
      const rules = getRelations();
      const graph = buildTagGraph(rules);
      renderTagDetail(detailEl, tag, {
        graph,
        rules,
        onBack: () => {
          detailEl.classList.remove('visible');
          listEl.style.display = '';
          searchRow.style.display = '';
          statsBar.style.display = '';
        },
        onTagClick: showDetail,
      });
      listEl.style.display = 'none';
      searchRow.style.display = 'none';
      statsBar.style.display = 'none';
      detailEl.classList.add('visible');
    }

    let searchTimer = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { searchQ = searchInput.value.trim().toLowerCase(); renderList(); }, 150);
    });
    sortSel.addEventListener('change', () => { sortMode = sortSel.value; renderList(); });

    renderList();
  }