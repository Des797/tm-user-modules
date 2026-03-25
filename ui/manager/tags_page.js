// === SECTION: tags page | filename: tags_page ===
    function buildTagsPage() {
      /* ── Graph helpers ── */
      function buildGraph(rules) {
        const g = new Map(); // tag -> { parents, children, synonyms, antonyms, compound }
        function ensure(t) {
          if (!g.has(t)) g.set(t, { parents: new Set(), children: new Set(), synonyms: new Set(), antonyms: new Set(), compound: [] });
          return g.get(t);
        }
        rules.forEach(rule => {
          const parsed = parseRule(rule);
          if (!parsed) return;
          const { leftGroups, op, rightGroups } = parsed;
          const isCompound = leftGroups.some(gr => gr.length > 1) || rightGroups.some(gr => gr.length > 1);
          if (isCompound) {
            /* Store compound rules on every tag involved */
            const allTags = [...leftGroups.flat(), ...rightGroups.flat()];
            allTags.forEach(t => {
              ensure(t).compound.push({ rule, leftGroups, op, rightGroups });
            });
            return;
          }
          const lt = leftGroups.flat();
          const rt = rightGroups.flat();
          lt.forEach(l => { rt.forEach(r => {
            if (op === '=')   { ensure(l).synonyms.add(r); ensure(r).synonyms.add(l); }
            if (op === '=/=') { ensure(l).antonyms.add(r); ensure(r).antonyms.add(l); }
            if (op === '>')   { ensure(l).parents.add(r);  ensure(r).children.add(l); }
            if (op === '<')   { ensure(r).parents.add(l);  ensure(l).children.add(r); }
          }); });
          lt.concat(rt).forEach(t => ensure(t));
        });
        return g;
      }

      function transitive(tag, graph, dir) {
        const visited = new Set();
        const q = [tag];
        while (q.length) {
          const cur = q.shift();
          const node = graph.get(cur);
          if (!node) continue;
          node[dir].forEach(p => { if (!visited.has(p)) { visited.add(p); q.push(p); } });
          node.synonyms.forEach(s => {
            const sn = graph.get(s);
            if (!sn) return;
            sn[dir].forEach(p => { if (!visited.has(p)) { visited.add(p); q.push(p); } });
          });
        }
        return visited;
      }

      function relCount(tag, graph) {
        const n = graph.get(tag);
        if (!n) return 0;
        return n.parents.size + n.children.size + n.synonyms.size + n.antonyms.size + n.compound.length;
      }

      function getAllTags(rules) {
        const tags = new Set();
        rules.forEach(rule => {
          const parsed = parseRule(rule);
          if (!parsed) return;
          [...parsed.leftGroups.flat(), ...parsed.rightGroups.flat()].forEach(t => tags.add(t));
        });
        return tags;
      }

      function buildSynonymMap(rules) {
        // Union-find to group synonyms
        const uf = new Map();
        function find(x) { if (!uf.has(x)) uf.set(x, x); return uf.get(x) === x ? x : find(uf.get(x)); }
        function union(a, b) { uf.set(find(a), find(b)); }
        rules.forEach(r => {
          const parsed = parseRule(r);
          if (!parsed || parsed.op !== '=') return;
          const lf = parsed.leftGroups.flat(), rf = parsed.rightGroups.flat();
          if (lf.length === 1 && rf.length === 1) union(lf[0], rf[0]);
        });
        // canonical: pick member with highest count
        const groups = new Map();
        uf.forEach((_, t) => {
          const root = find(t);
          if (!groups.has(root)) groups.set(root, []);
          groups.get(root).push(t);
        });
        const canonical = new Map(); // tag -> canonical tag
        groups.forEach(members => {
          if (members.length < 2) return;
          members.sort((a, b) => (getCountCache()[b]?.count ?? 0) - (getCountCache()[a]?.count ?? 0) || a.localeCompare(b));
          const canon = members[0];
          members.forEach(m => canonical.set(m, canon));
        });
        return canonical;
      }

      /* ── State ── */
      let sortMode = 'relations';
      let searchQ = '';
      let currentDetailTag = null;

      /* ── DOM structure ── */
      /* Stats bar */
      const statsBar = document.createElement('div');
      statsBar.id = 'qem-tags-stats';

      /* Search + sort row */
      const searchRow = document.createElement('div');
      searchRow.id = 'qem-tags-search-row';
      const searchInput = document.createElement('input');
      searchInput.className = 'qem-mgr-input';
      searchInput.placeholder = 'Search tags…';
      searchInput.autocomplete = 'off';
      const sortSel = document.createElement('select');
      sortSel.className = 'qem-mgr-input';
      sortSel.style.flex = '0 0 auto';
      [['relations','By relations'],['alpha','A–Z'],['count','By count']].forEach(([v,l]) => {
        const o = document.createElement('option'); o.value = v; o.textContent = l; sortSel.appendChild(o);
      });

      searchRow.appendChild(searchInput);
      searchRow.appendChild(sortSel);

      /* List */
      const listEl = document.createElement('div');
      listEl.id = 'qem-tags-list';

      /* Detail panel */
      const detailEl = document.createElement('div');
      detailEl.id = 'qem-tags-detail';

      pageTags.appendChild(statsBar);
      pageTags.appendChild(searchRow);
      pageTags.appendChild(listEl);
      pageTags.appendChild(detailEl);

      /* ── Render helpers ── */
      function renderStats(allTags, rules, canonMap) {
        const synGroups = new Set([...canonMap.values()]).size;
        statsBar.innerHTML = '';
        [
          [allTags.size, 'Tags'],
          [rules.length, 'Relations'],
          [synGroups,    'Synonym groups'],
        ].forEach(([v, l]) => {
          const s = document.createElement('div'); s.className = 'qem-tags-stat';
          s.innerHTML = `<div class="qem-tags-stat-val">${v}</div><div class="qem-tags-stat-lbl">${l}</div>`;
          statsBar.appendChild(s);
        });
      }

      function renderList() {
        const rules = getRelations();
        const graph = buildGraph(rules);
        const allTags = getAllTags(rules);
        const canonMap = buildSynonymMap(rules);

        renderStats(allTags, rules, canonMap);

        let tags = [...allTags];
        if (searchQ) tags = tags.filter(t => t.includes(searchQ));

        tags.sort((a, b) => {
          if (sortMode === 'alpha') return a.localeCompare(b);
          if (sortMode === 'count') {
            const ca = getCountCache()[a]?.count ?? 0, cb = getCountCache()[b]?.count ?? 0;
            return cb - ca || a.localeCompare(b);
          }
          return relCount(b, graph) - relCount(a, graph) || a.localeCompare(b);
        });

        listEl.innerHTML = '';
        if (!tags.length) {
          listEl.innerHTML = `<div class="qem-mgr-empty">No tags found.</div>`;
          return;
        }

        tags.forEach(tag => {
          const n = relCount(tag, graph);
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
          if (isAlias) { const c = document.createElement('span'); c.className = 'qem-chip-alias';  c.textContent = '→ ' + canon; nameWrap.appendChild(c); }

          const meta = document.createElement('div');
          meta.className = 'qem-tag-meta';
          if (countEntry) meta.textContent = Number(countEntry.count).toLocaleString() + ' posts';

          row.appendChild(badge);
          row.appendChild(nameWrap);
          row.appendChild(meta);
          row.addEventListener('click', () => showDetail(tag));
          listEl.appendChild(row);
        });
      }

      function showDetail(tag) {
        currentDetailTag = tag;
        const rules = getRelations();
        const graph = buildGraph(rules);
        const node = graph.get(tag) || { parents: new Set(), children: new Set(), synonyms: new Set(), antonyms: new Set(), compound: [] };

        const transitiveParents   = transitive(tag, graph, 'parents');
        const transitiveChildren  = transitive(tag, graph, 'children');
        node.parents.forEach(p => transitiveParents.delete(p));
        node.children.forEach(c => transitiveChildren.delete(c));

        detailEl.innerHTML = '';

        const backBtn = document.createElement('button');
        backBtn.className = 'qem-detail-back';
        backBtn.textContent = '← Back';
        backBtn.addEventListener('click', () => {
          detailEl.classList.remove('visible');
          listEl.style.display = '';
          searchRow.style.display = '';
          statsBar.style.display = '';
        });

        const title = document.createElement('div');
        title.className = 'qem-detail-title';
        title.textContent = tag;

        const countEntry = getCountCache()[tag];
        const countDiv = document.createElement('div');
        countDiv.className = 'qem-detail-count';
        countDiv.textContent = countEntry ? Number(countEntry.count).toLocaleString() + ' posts' : '';

        detailEl.appendChild(backBtn);
        detailEl.appendChild(title);
        detailEl.appendChild(countDiv);

        function chipSection(label, tags, cls, prefix) {
          if (!tags.length) return;
          const lbl = document.createElement('div'); lbl.className = 'qem-detail-section-lbl'; lbl.textContent = label;
          const chips = document.createElement('div'); chips.className = 'qem-detail-chips';
          tags.forEach(t => {
            const ch = document.createElement('span');
            ch.className = 'qem-detail-chip ' + cls;
            ch.textContent = (prefix || '') + t;
            ch.addEventListener('click', () => showDetail(t));
            chips.appendChild(ch);
          });
          detailEl.appendChild(lbl);
          detailEl.appendChild(chips);
        }

        chipSection('Synonyms', [...node.synonyms], 'synonym');
        chipSection('↑ Parents (direct)', [...node.parents], 'parent', '↑ ');
        chipSection('↑↑ Parents (transitive)', [...transitiveParents], 'parent transitive', '↑↑ ');
        chipSection('↓ Children (direct)', [...node.children], 'child', '↓ ');
        chipSection('↓↓ Children (transitive)', [...transitiveChildren], 'child transitive', '↓↓ ');
        chipSection('Antonyms', [...node.antonyms], 'antonym');

        /* Compound rules */
        if (node.compound.length) {
          const lbl = document.createElement('div'); lbl.className = 'qem-detail-section-lbl'; lbl.textContent = 'Compound rules';
          detailEl.appendChild(lbl);
          // Deduplicate by rule string
          const seen = new Set();
          node.compound.forEach(({ rule, leftGroups, op, rightGroups }) => {
            if (seen.has(rule)) return; seen.add(rule);
            const block = document.createElement('div');
            block.className = 'qem-compound-block';
            const lSide = leftGroups.map(g => g.map(t => `<code>${t}</code>`).join(' + ')).join(' | ');
            const rSide = rightGroups.map(g => g.map(t => `<code>${t}</code>`).join(' + ')).join(' | ');
            const opStr = opDisplay(op);
            block.innerHTML = `${lSide} <span style="color:#2d9e5f;font-weight:700">${opStr}</span> ${rSide}`;
            block.style.cursor = 'default';
            detailEl.appendChild(block);
          });
        }

        /* Raw rules involving this tag */
        const myRules = rules.filter(r => {
          const parsed = parseRule(r);
          if (!parsed) return false;
          return [...parsed.leftGroups.flat(), ...parsed.rightGroups.flat()].includes(tag);
        });
        if (myRules.length) {
          const lbl = document.createElement('div'); lbl.className = 'qem-detail-section-lbl'; lbl.textContent = `Raw rules (${myRules.length})`;
          detailEl.appendChild(lbl);
          myRules.forEach(r => {
            const parsed = parseRule(r);
            if (!parsed) return;
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:0.5px solid #0e1a13;font-size:13px;font-family:monospace;color:#8ab89a;';
            const txt = document.createElement('span'); txt.style.flex = '1'; txt.style.wordBreak = 'break-all';
            const lSide = parsed.leftGroups.map(g => g.join(' ')).join(' | ');
            const rSide = parsed.rightGroups.map(g => g.join(' ')).join(' | ');
            txt.textContent = `${lSide} ${parsed.op} ${rSide}`;
            const del = document.createElement('button'); del.className = 'qem-mgr-del'; del.textContent = '🗑';
            del.addEventListener('click', () => {
              if (!confirm('Delete: ' + r)) return;
              const all = getRelations();
              const idx = all.indexOf(r);
              if (idx !== -1) { all.splice(idx, 1); saveRelations(all); }
              showDetail(tag);
            });
            row.appendChild(txt); row.appendChild(del);
            detailEl.appendChild(row);
          });
        }

        listEl.style.display = 'none';
        searchRow.style.display = 'none';
        statsBar.style.display = 'none';
        detailEl.classList.add('visible');
      }

      /* Wire events */
      let searchTimer = null;
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => { searchQ = searchInput.value.trim().toLowerCase(); renderList(); }, 150);
      });
      sortSel.addEventListener('change', () => { sortMode = sortSel.value; renderList(); });

      renderList();
    }