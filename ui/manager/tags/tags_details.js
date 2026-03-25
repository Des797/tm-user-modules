// TAGS DETAIL: `renderTagDetail(detailEl, tag, { graph, rules, onBack, onTagClick })` — populates the detail panel for a single tag. Shows cached post count, then chip sections for synonyms, direct/transitive parents and children, and antonyms. Compound rules are rendered as inline code blocks (deduplicated). Raw rules involving the tag are listed with inline delete. `onBack` is called when the back button is tapped; `onTagClick(tag)` navigates to another tag's detail.

  function renderTagDetail(detailEl, tag, { graph, rules, onBack, onTagClick }) {
    const node = graph.get(tag) || { parents: new Set(), children: new Set(), synonyms: new Set(), antonyms: new Set(), compound: [] };

    const transitiveParents  = transitiveReach(tag, graph, 'parents');
    const transitiveChildren = transitiveReach(tag, graph, 'children');
    node.parents.forEach(p => transitiveParents.delete(p));
    node.children.forEach(c => transitiveChildren.delete(c));

    detailEl.innerHTML = '';

    const backBtn = document.createElement('button');
    backBtn.className = 'qem-detail-back';
    backBtn.textContent = '← Back';
    backBtn.addEventListener('click', onBack);

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
        ch.addEventListener('click', () => onTagClick(t));
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

    if (node.compound.length) {
      const lbl = document.createElement('div'); lbl.className = 'qem-detail-section-lbl'; lbl.textContent = 'Compound rules';
      detailEl.appendChild(lbl);
      const seen = new Set();
      node.compound.forEach(({ rule, leftGroups, op, rightGroups }) => {
        if (seen.has(rule)) return; seen.add(rule);
        const block = document.createElement('div');
        block.className = 'qem-compound-block';
        const lSide = leftGroups.map(g => g.map(t => `<code>${t}</code>`).join(' + ')).join(' | ');
        const rSide = rightGroups.map(g => g.map(t => `<code>${t}</code>`).join(' + ')).join(' | ');
        block.innerHTML = `${lSide} <span style="color:#2d9e5f;font-weight:700">${opDisplay(op)}</span> ${rSide}`;
        block.style.cursor = 'default';
        detailEl.appendChild(block);
      });
    }

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
          onTagClick(tag);
        });
        row.appendChild(txt); row.appendChild(del);
        detailEl.appendChild(row);
      });
    }
  }