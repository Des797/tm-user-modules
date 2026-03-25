// TAGS LIST: `renderTagsStats(statsBar, allTags, rules, canonMap)` — populates the stats bar with tag count, relation count, and synonym group count.
//
// `renderTagsList(listEl, opts)` — renders the scrollable tag list into `listEl`. `opts`: `{ rules, graph, allTags, canonMap, searchQ, sortMode, onTagClick }`. Each row shows a relation-count badge, tag name with canonical/alias chips, and cached post count. Rows call `onTagClick(tag)` when tapped.

  function renderTagsStats(statsBar, allTags, rules, canonMap) {
    const synGroups = new Set([...canonMap.values()]).size;
    statsBar.innerHTML = '';
    [[allTags.size, 'Tags'], [rules.length, 'Relations'], [synGroups, 'Synonym groups']].forEach(([v, l]) => {
      const s = document.createElement('div');
      s.className = 'qem-tags-stat';
      s.innerHTML = `<div class="qem-tags-stat-val">${v}</div><div class="qem-tags-stat-lbl">${l}</div>`;
      statsBar.appendChild(s);
    });
  }

  function renderTagsList(listEl, { rules, graph, allTags, canonMap, searchQ, sortMode, onTagClick }) {
    let tags = [...allTags];
    if (searchQ) tags = tags.filter(t => t.includes(searchQ));

    tags.sort((a, b) => {
      if (sortMode === 'alpha') return a.localeCompare(b);
      if (sortMode === 'count') {
        const ca = getCountCache()[a]?.count ?? 0, cb = getCountCache()[b]?.count ?? 0;
        return cb - ca || a.localeCompare(b);
      }
      return tagRelCount(b, graph) - tagRelCount(a, graph) || a.localeCompare(b);
    });

    listEl.innerHTML = '';
    if (!tags.length) {
      listEl.innerHTML = `<div class="qem-mgr-empty">No tags found.</div>`;
      return;
    }

    tags.forEach(tag => {
      const n = tagRelCount(tag, graph);
      const canon = canonMap.get(tag);
      const isAlias = canon && canon !== tag;
      const isCanon = canon === tag && [...canonMap.values()].filter(v => v === tag).length > 1;
      const countEntry = getCountCache()[tag];

      const row = document.createElement('div');
      row.className = 'qem-tag-row';

      const badge = document.createElement('div');
      badge.className = 'qem-tag-rel-badge';
      badge.textContent = n;

      const nameWrap = document.createElement('div');
      nameWrap.className = 'qem-tag-name';
      nameWrap.textContent = tag;
      if (isCanon) { const c = document.createElement('span'); c.className = 'qem-chip-canon'; c.textContent = 'canonical'; nameWrap.appendChild(c); }
      if (isAlias) { const c = document.createElement('span'); c.className = 'qem-chip-alias'; c.textContent = '→ ' + canon; nameWrap.appendChild(c); }

      const meta = document.createElement('div');
      meta.className = 'qem-tag-meta';
      if (countEntry) meta.textContent = Number(countEntry.count).toLocaleString() + ' posts';

      row.appendChild(badge);
      row.appendChild(nameWrap);
      row.appendChild(meta);
      row.addEventListener('click', () => onTagClick(tag));
      listEl.appendChild(row);
    });
  }