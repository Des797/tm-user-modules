// WIKI PANEL: `createWikiPanel(tag)` injects blacklist/category/relation controls on wiki pages.
  function getCurrentWikiTagName() {
    const headingCandidates = [
      ...document.querySelectorAll('h1, h2, h3, .title, #content h2, #content h3'),
    ];
    for (const el of headingCandidates) {
      const text = String(el.textContent || '').trim();
      const m = text.match(/Now Viewing:\s*(.+)$/i);
      if (m && m[1]) return m[1].trim().toLowerCase();
    }
    const viewMore = document.querySelector('a[href*="page=post&s=list&tags="]');
    if (viewMore) {
      try {
        const url = new URL(viewMore.href, location.origin);
        const tags = url.searchParams.get('tags');
        if (tags) return decodeURIComponent(tags).trim().toLowerCase();
      } catch {}
    }
    return '';
  }

  function createWikiPanel(wikiTag) {
    injectWikiPanelStyles();
    const insertionAnchor = findWikiInsertionAnchor();
    if (!insertionAnchor) return;

    const panel = document.createElement('section');
    panel.id = 'qem-wiki-panel';
    panel.className = 'qem-wiki-inline';

    const warningBanner = document.createElement('div');
    warningBanner.id = 'qem-wiki-blacklist-warning';
    warningBanner.className = 'qem-wiki-warning';
    warningBanner.style.display = 'none';
    warningBanner.textContent = `Warning: "${wikiTag}" is currently blacklisted.`;

    const actionsRow = document.createElement('div');
    actionsRow.className = 'qem-wiki-actions';
    const blacklistBtn = document.createElement('button');
    blacklistBtn.className = 'qem-wiki-btn qem-wiki-danger';
    actionsRow.appendChild(blacklistBtn);

    const openManagerBtn = document.createElement('button');
    openManagerBtn.className = 'qem-wiki-btn';
    openManagerBtn.textContent = 'Open in Manager';
    openManagerBtn.addEventListener('click', () => {
      GM_setValue('qem_last_tab', 'rel');
      createRelationsManager();
    });
    actionsRow.appendChild(openManagerBtn);
    panel.appendChild(actionsRow);

    const categoriesSection = document.createElement('section');
    categoriesSection.className = 'qem-wiki-section';
    const categoriesTitle = document.createElement('h4');
    categoriesTitle.textContent = 'Categories';
    const categoriesInLabel = document.createElement('h5');
    categoriesInLabel.textContent = 'In categories';
    const categoriesInWrap = document.createElement('div');
    categoriesInWrap.className = 'qem-wiki-chip-wrap';
    const categoriesOtherLabel = document.createElement('h5');
    categoriesOtherLabel.textContent = 'Other categories';
    const categoriesOtherWrap = document.createElement('div');
    categoriesOtherWrap.className = 'qem-wiki-chip-wrap';
    categoriesSection.appendChild(categoriesTitle);
    categoriesSection.appendChild(categoriesInLabel);
    categoriesSection.appendChild(categoriesInWrap);
    categoriesSection.appendChild(categoriesOtherLabel);
    categoriesSection.appendChild(categoriesOtherWrap);
    panel.appendChild(categoriesSection);

    const relationsDetails = document.createElement('details');
    relationsDetails.className = 'qem-wiki-section qem-wiki-relations';
    relationsDetails.open = false;
    const relationsSummary = document.createElement('summary');
    relationsSummary.className = 'qem-wiki-summary';
    relationsSummary.textContent = 'Relations';
    relationsDetails.appendChild(relationsSummary);
    const relationsSection = document.createElement('div');
    const relationsTitle = document.createElement('h4');
    relationsTitle.textContent = 'Add Relation';
    relationsSection.appendChild(relationsTitle);

    const relationForm = document.createElement('div');
    relationForm.className = 'qem-wiki-form';
    const leftInput = document.createElement('input');
    leftInput.className = 'qem-wiki-input';
    leftInput.value = wikiTag;
    const opSelect = document.createElement('select');
    opSelect.className = 'qem-wiki-select';
    ['=', '>', '<', '=/='].forEach(op => {
      const option = document.createElement('option');
      option.value = op;
      option.textContent = op;
      opSelect.appendChild(option);
    });
    const rightInput = document.createElement('input');
    rightInput.className = 'qem-wiki-input';
    rightInput.placeholder = 'Right side tag(s)';
    const addRelationBtn = document.createElement('button');
    addRelationBtn.className = 'qem-wiki-btn';
    addRelationBtn.textContent = 'Add Relation';
    relationForm.appendChild(leftInput);
    relationForm.appendChild(opSelect);
    relationForm.appendChild(rightInput);
    relationForm.appendChild(addRelationBtn);
    relationsSection.appendChild(relationForm);

    attachAutocomplete(leftInput, tag => {
      const val = leftInput.value;
      const lastSpace = val.lastIndexOf(' ');
      leftInput.value = (lastSpace === -1 ? '' : val.slice(0, lastSpace + 1)) + tag + ' ';
    });
    attachAutocomplete(rightInput, tag => {
      const val = rightInput.value;
      const lastSpace = val.lastIndexOf(' ');
      rightInput.value = (lastSpace === -1 ? '' : val.slice(0, lastSpace + 1)) + tag + ' ';
    });

    const impactPreview = document.createElement('div');
    impactPreview.className = 'qem-wiki-impact';
    relationsSection.appendChild(impactPreview);

    const directListTitle = document.createElement('h5');
    directListTitle.textContent = 'Direct';
    const directRulesList = document.createElement('div');
    directRulesList.className = 'qem-wiki-list';
    relationsSection.appendChild(directListTitle);
    relationsSection.appendChild(directRulesList);

    const transitiveTitle = document.createElement('h5');
    transitiveTitle.textContent = 'Transitive';
    const transitiveWrap = document.createElement('div');
    transitiveWrap.className = 'qem-wiki-list';
    relationsSection.appendChild(transitiveTitle);
    relationsSection.appendChild(transitiveWrap);

    relationsDetails.appendChild(relationsSection);
    panel.appendChild(relationsDetails);

    const undoSection = document.createElement('section');
    undoSection.className = 'qem-wiki-section';
    const undoTitle = document.createElement('h4');
    undoTitle.textContent = 'Recent Actions';
    const undoBtn = document.createElement('button');
    undoBtn.className = 'qem-wiki-btn';
    undoBtn.textContent = 'Undo Last';
    const undoList = document.createElement('div');
    undoList.className = 'qem-wiki-undo-list';
    undoSection.appendChild(undoTitle);
    undoSection.appendChild(undoBtn);
    undoSection.appendChild(undoList);
    panel.appendChild(undoSection);

    insertionAnchor.parentNode.insertBefore(panel, insertionAnchor);
    const warningAnchor = findWikiTopAnchor();
    if (warningAnchor && warningAnchor.parentNode) {
      warningAnchor.parentNode.insertBefore(warningBanner, warningAnchor);
    }

    const undoStack = [];
    function pushUndo(label, fn) {
      undoStack.unshift({ label, fn });
      if (undoStack.length > 3) undoStack.length = 3;
      renderUndo();
    }
    function renderUndo() {
      undoList.innerHTML = '';
      if (!undoStack.length) {
        const empty = document.createElement('div');
        empty.className = 'qem-wiki-empty';
        empty.textContent = 'No recent actions.';
        undoList.appendChild(empty);
        undoBtn.disabled = true;
        return;
      }
      undoBtn.disabled = false;
      undoStack.forEach((entry, idx) => {
        const row = document.createElement('div');
        row.className = 'qem-wiki-undo-row';
        row.textContent = `${idx + 1}. ${entry.label}`;
        undoList.appendChild(row);
      });
    }
    undoBtn.addEventListener('click', () => {
      const next = undoStack.shift();
      if (!next) return;
      next.fn();
      showToast('Action undone');
      refreshAll();
    });

    function buildCandidateRule() {
      const l = leftInput.value.trim();
      const r = rightInput.value.trim();
      if (!l || !r) return '';
      return `${l} ${opSelect.value} ${r}`;
    }

    function analyzeRuleImpact(rule) {
      if (!rule) {
        impactPreview.textContent = 'Enter both sides to preview impact.';
        return { duplicate: false };
      }
      const all = getRelations();
      const duplicate = all.includes(rule);
      const parsed = parseRule(rule);
      if (!parsed) {
        impactPreview.textContent = 'Invalid rule format.';
        return { duplicate: false };
      }
      const blacklist = new Set(getBlacklist().map(x => String(x).toLowerCase()));
      const tagsFromRight = parsed.rightGroups.flat().map(x => String(x).toLowerCase());
      const directHit = tagsFromRight.filter(tag => blacklist.has(tag));
      const maybeSuppressed = new Set();
      if (['>', '='].includes(parsed.op)) {
        const graph = buildTagGraph(all.concat(rule));
        parsed.leftGroups.flat().forEach(tag => {
          const clean = String(tag).toLowerCase();
          if (clean.startsWith('category:') || clean.includes('*')) return;
          const parents = transitiveReach(clean, graph, 'parents');
          parents.forEach(p => {
            if (blacklist.has(String(p).toLowerCase())) maybeSuppressed.add(clean);
          });
        });
      }
      const messages = [];
      if (duplicate) messages.push('Duplicate of existing rule.');
      if (directHit.length) messages.push(`Directly implies blacklisted tag(s): ${directHit.join(', ')}`);
      if (maybeSuppressed.size) messages.push(`May cause suppression via transitive implications for: ${[...maybeSuppressed].join(', ')}`);
      impactPreview.textContent = messages.length ? messages.join(' ') : 'No obvious duplicate or blacklist suppression conflicts.';
      return { duplicate };
    }

    function getDirectRulesForTag() {
      const tagNeedle = wikiTag.toLowerCase();
      return getRelations().filter(rule => {
        const parsed = parseRule(rule);
        if (!parsed) return false;
        const allTokens = [...parsed.leftGroups.flat(), ...parsed.rightGroups.flat()].map(x => String(x).toLowerCase());
        return allTokens.includes(tagNeedle);
      });
    }

    function renderCategories() {
      categoriesInWrap.innerHTML = '';
      categoriesOtherWrap.innerHTML = '';
      const categories = Object.entries(getCategories()).sort((a, b) => a[1].name.localeCompare(b[1].name));
      if (!categories.length) {
        const empty = document.createElement('div');
        empty.className = 'qem-wiki-empty';
        empty.textContent = 'No categories configured.';
        categoriesInWrap.appendChild(empty);
        return 0;
      }
      const membership = getCategoryMembership();
      const current = new Set((membership[wikiTag] || []).map(String));
      categories.forEach(([slug, entry]) => {
        const chip = document.createElement('button');
        chip.className = 'qem-wiki-chip' + (current.has(slug) ? ' active' : '');
        chip.textContent = entry.name;
        chip.title = current.has(slug) ? 'Remove from category' : 'Add to category';
        chip.addEventListener('click', () => {
          const map = getCategoryMembership();
          const curSet = new Set((map[wikiTag] || []).map(String));
          if (curSet.has(slug)) {
            curSet.delete(slug);
            if (curSet.size) map[wikiTag] = [...curSet];
            else delete map[wikiTag];
            saveCategoryMembership(map);
            pushUndo(`Removed ${wikiTag} from ${entry.name}`, () => {
              const restoreMap = getCategoryMembership();
              const restoreSet = new Set((restoreMap[wikiTag] || []).map(String));
              restoreSet.add(slug);
              restoreMap[wikiTag] = [...restoreSet];
              saveCategoryMembership(restoreMap);
            });
            showToast(`Removed from ${entry.name}`);
          } else {
            curSet.add(slug);
            map[wikiTag] = [...curSet];
            saveCategoryMembership(map);
            pushUndo(`Added ${wikiTag} to ${entry.name}`, () => {
              const restoreMap = getCategoryMembership();
              const restoreSet = new Set((restoreMap[wikiTag] || []).map(String));
              restoreSet.delete(slug);
              if (restoreSet.size) restoreMap[wikiTag] = [...restoreSet];
              else delete restoreMap[wikiTag];
              saveCategoryMembership(restoreMap);
            });
            showToast(`Added to ${entry.name}`);
          }
          refreshAll();
        });
        if (current.has(slug)) categoriesInWrap.appendChild(chip);
        else categoriesOtherWrap.appendChild(chip);
      });
      if (!categoriesInWrap.children.length) {
        const emptyIn = document.createElement('div');
        emptyIn.className = 'qem-wiki-empty';
        emptyIn.textContent = 'Not in any categories.';
        categoriesInWrap.appendChild(emptyIn);
      }
      if (!categoriesOtherWrap.children.length) {
        const emptyOther = document.createElement('div');
        emptyOther.className = 'qem-wiki-empty';
        emptyOther.textContent = 'No remaining categories.';
        categoriesOtherWrap.appendChild(emptyOther);
      }
      return current.size;
    }

    function renderBlacklist() {
      const blacklist = getBlacklist();
      const idx = blacklist.indexOf(wikiTag);
      const isBlocked = idx !== -1;
      blacklistBtn.textContent = isBlocked ? 'Remove from Blacklist' : 'Add to Blacklist';
      warningBanner.style.display = isBlocked ? '' : 'none';
      panel.classList.toggle('qem-wiki-is-blacklisted', isBlocked);
      relationsDetails.open = isBlocked ? false : relationsDetails.open;
      blacklistBtn.onclick = () => {
        const all = getBlacklist();
        const position = all.indexOf(wikiTag);
        if (position === -1) {
          if (!confirm(`Add "${wikiTag}" to blacklist?`)) return;
          all.push(wikiTag);
          saveBlacklist(all);
          pushUndo(`Blacklisted ${wikiTag}`, () => {
            const next = getBlacklist().filter(t => t !== wikiTag);
            saveBlacklist(next);
          });
          showToast('Tag blacklisted');
        } else {
          all.splice(position, 1);
          saveBlacklist(all);
          pushUndo(`Un-blacklisted ${wikiTag}`, () => {
            const next = getBlacklist();
            if (!next.includes(wikiTag)) next.splice(position, 0, wikiTag);
            saveBlacklist(next);
          });
          showToast('Removed from blacklist');
        }
        refreshAll();
      };
      return isBlocked;
    }

    function renderDirectRules() {
      directRulesList.innerHTML = '';
      const rules = getDirectRulesForTag();
      if (!rules.length) {
        const empty = document.createElement('div');
        empty.className = 'qem-wiki-empty';
        empty.textContent = 'No direct relations mention this tag.';
        directRulesList.appendChild(empty);
        return 0;
      }
      rules.forEach(rule => {
        const m = rule.match(/^(.+?)\s*(=\/=|=|>|<)\s*(.+)$/);
        if (!m) return;
        const row = document.createElement('div');
        row.className = 'qem-wiki-rule';
        const text = document.createElement('span');
        text.textContent = `${m[1].trim()} ${opDisplay(m[2])} ${m[3].trim()}`;
        const del = document.createElement('button');
        del.className = 'qem-wiki-del';
        del.textContent = 'Delete';
        del.addEventListener('click', () => {
          const all = getRelations();
          const idx = all.indexOf(rule);
          if (idx === -1) return;
          all.splice(idx, 1);
          saveRelations(all);
          pushUndo(`Deleted relation: ${rule}`, () => {
            const restore = getRelations();
            restore.splice(idx, 0, rule);
            saveRelations(restore);
          });
          showToast('Relation deleted');
          refreshAll();
        });
        row.appendChild(text);
        row.appendChild(del);
        directRulesList.appendChild(row);
      });
      return rules.length;
    }

    function collectSynonymClosure(startTag, graph) {
      const out = new Set();
      const q = [startTag];
      while (q.length) {
        const cur = q.shift();
        const node = graph.get(cur);
        if (!node) continue;
        node.synonyms.forEach(s => {
          const clean = String(s).toLowerCase();
          if (clean === startTag || out.has(clean)) return;
          out.add(clean);
          q.push(clean);
        });
      }
      return out;
    }

    function renderTransitive() {
      transitiveWrap.innerHTML = '';
      const graph = buildTagGraph(getRelations());
      const node = graph.get(wikiTag);
      if (!node) {
        const empty = document.createElement('div');
        empty.className = 'qem-wiki-empty';
        empty.textContent = 'No transitive relations yet.';
        transitiveWrap.appendChild(empty);
        return 0;
      }
      const directParents = new Set([...node.parents].map(x => String(x).toLowerCase()));
      const directChildren = new Set([...node.children].map(x => String(x).toLowerCase()));
      const directSynonyms = new Set([...node.synonyms].map(x => String(x).toLowerCase()));
      const directAntonyms = new Set([...node.antonyms].map(x => String(x).toLowerCase()));
      const allParents = [...transitiveReach(wikiTag, graph, 'parents')].map(x => String(x).toLowerCase());
      const allChildren = [...transitiveReach(wikiTag, graph, 'children')].map(x => String(x).toLowerCase());
      const synonymClosure = [...collectSynonymClosure(wikiTag, graph)];
      const inheritedParents = allParents.filter(x => x !== wikiTag && !directParents.has(x)).sort();
      const inheritedChildren = allChildren.filter(x => x !== wikiTag && !directChildren.has(x)).sort();
      const inheritedSynonyms = synonymClosure.filter(x => !directSynonyms.has(x)).sort();
      const inheritedAntonyms = [];
      synonymClosure.concat([wikiTag]).forEach(tag => {
        const n = graph.get(tag);
        if (!n) return;
        n.antonyms.forEach(a => {
          const clean = String(a).toLowerCase();
          if (clean === wikiTag || directAntonyms.has(clean) || inheritedAntonyms.includes(clean)) return;
          inheritedAntonyms.push(clean);
        });
      });
      inheritedAntonyms.sort();

      const typedRows = [];
      inheritedParents.forEach(tag => typedRows.push({ tag, type: 'implied by', badge: '>' }));
      inheritedChildren.forEach(tag => typedRows.push({ tag, type: 'implies', badge: '<' }));
      inheritedSynonyms.forEach(tag => typedRows.push({ tag, type: 'synonym chain', badge: '=' }));
      inheritedAntonyms.forEach(tag => typedRows.push({ tag, type: 'antonym chain', badge: '=/=' }));

      if (!typedRows.length) {
        const empty = document.createElement('div');
        empty.className = 'qem-wiki-empty';
        empty.textContent = 'No transitive-only relations.';
        transitiveWrap.appendChild(empty);
        return 0;
      }

      typedRows.forEach(item => {
        const row = document.createElement('div');
        row.className = 'qem-wiki-rule';
        const left = document.createElement('span');
        left.textContent = item.tag;
        const right = document.createElement('span');
        right.className = 'qem-wiki-rel-type';
        right.textContent = `${item.badge} ${item.type}`;
        row.appendChild(left);
        row.appendChild(right);
        row.addEventListener('click', () => {
          window.open(
            `https://rule34.xxx/index.php?page=wiki&s=list&search=${encodeURIComponent(item.tag)}`,
            '_blank',
            'noopener,noreferrer'
          );
        });
        transitiveWrap.appendChild(row);
      });
      return typedRows.length;
    }

    function refreshAll() {
      const isBlocked = renderBlacklist();
      renderCategories();
      renderDirectRules();
      renderTransitive();
      categoriesSection.classList.toggle('qem-wiki-dimmed', isBlocked);
      relationsDetails.classList.toggle('qem-wiki-dimmed', isBlocked);
      undoSection.classList.toggle('qem-wiki-dimmed', isBlocked);
      analyzeRuleImpact(buildCandidateRule());
      renderUndo();
    }

    [leftInput, rightInput, opSelect].forEach(el => {
      el.addEventListener('input', () => analyzeRuleImpact(buildCandidateRule()));
      el.addEventListener('change', () => analyzeRuleImpact(buildCandidateRule()));
    });

    addRelationBtn.addEventListener('click', () => {
      const l = leftInput.value.trim();
      const r = rightInput.value.trim();
      if (!l || !r) {
        showToast('Both sides are required');
        return;
      }
      const rule = `${l} ${opSelect.value} ${r}`;
      if (rule.includes('category:*')) {
        showToast('Wildcard categories are not supported');
        return;
      }
      const parsed = parseRule(rule);
      if (!parsed) {
        showToast('Invalid rule format');
        return;
      }
      const impact = analyzeRuleImpact(rule);
      if (impact.duplicate) {
        showToast('Rule already exists');
        return;
      }
      const all = getRelations();
      all.push(rule);
      saveRelations(all);
      rightInput.value = '';
      pushUndo(`Added relation: ${rule}`, () => {
        const next = getRelations();
        const idx = next.indexOf(rule);
        if (idx !== -1) {
          next.splice(idx, 1);
          saveRelations(next);
        }
      });
      showToast('Relation added');
      refreshAll();
      rightInput.focus();
    });

    refreshAll();
  }

  function findWikiInsertionAnchor() {
    const seeAlsoHeader = [...document.querySelectorAll('h2, h3, h4, .title')]
      .find(el => /^see also$/i.test(String(el.textContent || '').trim()));
    if (seeAlsoHeader) return seeAlsoHeader;
    const infoMarker = [...document.querySelectorAll('h2, h3, h4, .title, b, strong')]
      .find(el => /other wiki information/i.test(String(el.textContent || '')));
    if (infoMarker) return infoMarker;
    const content = document.querySelector('#content') || document.querySelector('#content_wrapper');
    if (content && content.firstChild) return content.firstChild;
    return document.body.firstChild || document.body;
  }

  function findWikiTopAnchor() {
    const nowViewing = [...document.querySelectorAll('h1, h2, h3, .title')]
      .find(el => /Now Viewing:/i.test(String(el.textContent || '')));
    if (nowViewing) return nowViewing;
    return document.querySelector('#content') || document.querySelector('#content_wrapper') || document.body;
  }

  function injectWikiPanelStyles() {
    if (document.getElementById('qem-wiki-panel-styles')) return;
    const style = document.createElement('style');
    style.id = 'qem-wiki-panel-styles';
    style.textContent = `
#qem-wiki-panel{margin:12px 0 16px;padding:0;color:inherit;font:12px/1.5 Verdana,Arial,Helvetica,sans-serif}
#qem-wiki-panel h4,#qem-wiki-panel h5{margin:0;color:inherit;font-size:1em;font-weight:700}
#qem-wiki-panel h5{margin:4px 0 2px}
#qem-wiki-panel .qem-wiki-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
#qem-wiki-panel .qem-wiki-section{margin-top:10px;padding-top:8px;border-top:1px solid #999;display:flex;flex-direction:column;gap:6px}
#qem-wiki-panel .qem-wiki-btn,#qem-wiki-panel .qem-wiki-del{border:1px solid #6d6d6d;background:linear-gradient(#fbfbfb,#dedede);color:#111;border-radius:3px;padding:5px 12px;min-height:30px;font:700 12px Verdana,Arial,sans-serif;letter-spacing:.01em;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.75)}
#qem-wiki-panel .qem-wiki-btn:hover,#qem-wiki-panel .qem-wiki-del:hover{background:linear-gradient(#ffffff,#e6e6e6)}
#qem-wiki-panel .qem-wiki-btn:active,#qem-wiki-panel .qem-wiki-del:active{background:linear-gradient(#d9d9d9,#f1f1f1);box-shadow:inset 0 1px 2px rgba(0,0,0,.2)}
#qem-wiki-panel .qem-wiki-btn:disabled{opacity:.55;cursor:not-allowed}
#qem-wiki-panel .qem-wiki-danger{border-color:#9b3434;background:linear-gradient(#ffdede,#f0bbbb)}
#qem-wiki-panel .qem-wiki-input,#qem-wiki-panel .qem-wiki-select{min-height:24px;border:1px solid #888;background:#fff;color:#111;border-radius:2px;padding:2px 6px;font:12px Verdana,Arial,sans-serif}
#qem-wiki-panel .qem-wiki-form{display:grid;grid-template-columns:1fr 64px 1fr auto;gap:6px}
#qem-wiki-panel .qem-wiki-impact{font-size:11px;padding:5px 6px;border:1px dashed #888;background:rgba(120,120,120,.08)}
#qem-wiki-panel .qem-wiki-list{display:flex;flex-direction:column;gap:4px}
#qem-wiki-panel .qem-wiki-rule{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:4px 0;border-bottom:1px dotted #999}
#qem-wiki-panel .qem-wiki-rule:hover{background:rgba(120,120,120,.08)}
#qem-wiki-panel .qem-wiki-rel-type{opacity:.82;font-size:11px;white-space:nowrap}
#qem-wiki-panel .qem-wiki-chip-wrap{display:flex;flex-wrap:wrap;gap:5px}
#qem-wiki-panel .qem-wiki-chip{border:1px solid #999;background:transparent;color:inherit;border-radius:10px;padding:2px 8px;font-size:11px;text-decoration:none;cursor:pointer}
#qem-wiki-panel .qem-wiki-chip:hover{text-decoration:underline}
#qem-wiki-panel .qem-wiki-chip.active{border-color:#5a8}
#qem-wiki-panel .qem-wiki-empty{opacity:.75;font-style:italic}
#qem-wiki-panel .qem-wiki-undo-list{display:flex;flex-direction:column;gap:2px}
#qem-wiki-panel .qem-wiki-undo-row{font-size:11px;opacity:.92}
#qem-wiki-panel .qem-wiki-summary{cursor:pointer;user-select:none;font-weight:700}
#qem-wiki-panel.qem-wiki-is-blacklisted .qem-wiki-dimmed{opacity:.7}
#qem-wiki-blacklist-warning{margin:6px 0 10px;padding:10px 12px;background:#a11212;border:1px solid #7b0d0d;color:#fff;font:700 13px Verdana,Arial,sans-serif;text-transform:uppercase;letter-spacing:.04em}
@media (max-width:900px){#qem-wiki-panel .qem-wiki-form{grid-template-columns:1fr}}
`;
    document.head.appendChild(style);
  }
