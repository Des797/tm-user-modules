// === SECTION: tags mirror | filename: mirror_create ===
  /* ─────────────────────────────────────────────
     FLOATING TAGS MIRROR
  ───────────────────────────────────────────── */
  function createTagsMirror() {
    if (document.getElementById('qem-mirror')) return; // prevent duplicate mirrors
    const sourceTextarea = document.getElementById('tags');
    if (!sourceTextarea) return;

    /* Snapshot tags present before user edits */
    const originalTags = parseTags(sourceTextarea.value);

    /* Inject styles */
    if (!document.getElementById('qem-mirror-styles')) {
      const style = document.createElement('style');
      style.id = 'qem-mirror-styles';
      style.textContent = `
        #qem-mirror {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 680px;
          z-index: 999990;
          background: #1a1a24;
          border-top: 2px solid #e84040;
          border-left: 1px solid #2a2a3a;
          border-right: 1px solid #2a2a3a;
          border-radius: 10px 10px 0 0;
          display: none;
          flex-direction: column;
          box-shadow: 0 -4px 24px rgba(0,0,0,0.7);
          box-sizing: border-box;
          overflow: hidden;
          will-change: transform;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          touch-action: pan-y;
          pointer-events: all;
        }
        #qem-mirror-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 999989;
          pointer-events: none;
          touch-action: auto;
          background: transparent;
        }
        #qem-mirror-backdrop.visible { display: block; }
        #qem-mirror.visible { display: flex; }
        #qem-mirror-titlebar {
          display: flex;
          align-items: center;
          padding: 4px 8px;
          border-bottom: 1px solid #2a2a3a;
          flex-shrink: 0;
          position: relative;
        }
        #qem-mirror-title {
          display: none;
        }
        #qem-tbar-scroll {
          flex-shrink: 0;
        }
        #qem-tbar-min {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }
        .qem-tbar-btn {
          background: none;
          border: none;
          color: #555;
          cursor: pointer;
          padding: 3px 7px;
          font-size: 15px;
          line-height: 1;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .qem-tbar-btn:active { color: #fff; background: #333; }
        #qem-mirror-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 8px;
          touch-action: pan-x pan-y;
          overscroll-behavior: contain;
        }
        #qem-mirror.minimized #qem-mirror-body { display: none; }
        #qem-mirror.minimized #qem-mirror-titlebar { border-bottom: none; }
        #qem-mirror-textarea { touch-action: pan-x pan-y; }
        #qem-mirror-tags-wrap.collapsed #qem-mirror-textarea { display: none; }
        #qem-mirror-tags-wrap.collapsed #qem-mirror-label::after { content: '▸'; }
        #qem-mirror-label { cursor: pointer; display: flex; align-items: center; gap: 4px; color: #666; font-size: 10px; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; width: 100%; margin-bottom: 1px; }
        #qem-mirror-label::after { content: '▾'; font-size: 10px; margin-left: auto; transition: transform 0.15s; }
        #qem-mirror-textarea {
          width: 100%;
          box-sizing: border-box;
          background: #0e0e18;
          color: #e0e0e0;
          border: 1px solid #333;
          border-radius: 6px;
          font-size: 13px;
          font-family: monospace;
          padding: 8px;
          resize: none;
          min-height: 120px;
          outline: none;
          line-height: 1.5;
        }
        #qem-mirror-textarea:focus { border-color: #e84040; }
        .qem-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          padding: 2px 0;
        }
        .qem-chips.collapsed .qem-chip { display: none !important; }
        .qem-chips-label {
          color: #666;
          font-size: 10px;
          font-family: system-ui, sans-serif;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          width: 100%;
          margin-bottom: 1px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .qem-chips-label::after {
          content: '▾';
          font-size: 10px;
          margin-left: auto;
          transition: transform 0.15s;
        }
        .qem-chips.collapsed .qem-chips-label::after { content: '▸'; }
        .qem-chip {
          background: #2a2a38;
          color: #ccc;
          border: 1px solid #444;
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 12px;
          font-family: monospace;
          cursor: pointer;
          white-space: nowrap;
          user-select: none;
          transition: background 0.15s, color 0.15s;
        }
        .qem-chip:active { background: #e84040; color: #fff; border-color: #e84040; }
        .qem-chip.qem-chip-recent  { border-color: #555; }
        .qem-chip.qem-chip-fav     { border-color: #7a4; color: #9c6; }
        .qem-chip.qem-chip-related { border-color: #46a; color: #8af; }
        #qem-rule-bar {
          display: flex;
          gap: 6px;
          align-items: center;
          padding: 0 0 2px 0;
        }
        #qem-rule-input {
          flex: 1;
          background: #0e0e18;
          border: 1px solid #333;
          border-radius: 6px;
          color: #e0e0e0;
          font-size: 12px;
          font-family: monospace;
          padding: 5px 8px;
          outline: none;
          min-width: 0;
        }
        #qem-rule-input:focus { border-color: #46a; }
        #qem-rule-input::placeholder { color: #444; }
        #qem-rule-add {
          background: none;
          border: 1px solid #46a;
          border-radius: 6px;
          color: #8af;
          font-size: 12px;
          font-weight: 700;
          padding: 5px 10px;
          cursor: pointer;
          flex-shrink: 0;
          white-space: nowrap;
        }
        #qem-rule-add:active { background: #46a; color: #fff; }
      `;
      document.head.appendChild(style);
    }

    const COLLAPSE_KEY_RECENT = 'r34_collapse_recent';
    const COLLAPSE_KEY_FAV    = 'r34_collapse_fav';

    const mirror = document.createElement('div');
    mirror.id = 'qem-mirror';

    /* ── Titlebar ── */
    const titlebar = document.createElement('div');
    titlebar.id = 'qem-mirror-titlebar';

    const titleSpan = document.createElement('span');
    titleSpan.id = 'qem-mirror-title';
    titleSpan.textContent = 'Tags';

    /* Scroll-down button */
    const scrollDownBtn = document.createElement('button');
    scrollDownBtn.className = 'qem-tbar-btn';
    scrollDownBtn.id = 'qem-tbar-scroll';
    scrollDownBtn.title = 'Go to edit box';
    scrollDownBtn.innerHTML = '&#x2193;';
    scrollDownBtn.addEventListener('click', e => {
      e.stopPropagation();
      const target = document.getElementById('tags') ||
        document.getElementById('edit') ||
        document.getElementById('edit_form');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    /* Minimize button */
    const minBtn = document.createElement('button');
    minBtn.className = 'qem-tbar-btn';
    minBtn.id = 'qem-tbar-min';
    minBtn.title = 'Minimize';
    minBtn.innerHTML = '&#x2212;';
    minBtn.addEventListener('click', e => {
      e.stopPropagation();
      mirror.classList.toggle('minimized');
      minBtn.innerHTML = mirror.classList.contains('minimized') ? '&#x2b;' : '&#x2212;';
    });

    /* Clicking anywhere on titlebar toggles minimized */
    titlebar.addEventListener('click', () => {
      mirror.classList.toggle('minimized');
      minBtn.innerHTML = mirror.classList.contains('minimized') ? '&#x2b;' : '&#x2212;';
    });

    titlebar.appendChild(titleSpan);
    titlebar.appendChild(scrollDownBtn);
    titlebar.appendChild(minBtn);
    mirror.appendChild(titlebar);

    /* ── Body ── */
    const body = document.createElement('div');
    body.id = 'qem-mirror-body';

    /* ── Chip rows ── */
    /* suppressed: Set of tag strings to hide (from negates + blacklist) */
    function makeChipRow(tags, extraClass, labelText, mirrorTA, suppressed) {
      suppressed = suppressed || new Set();
      const visibleTags = tags.filter(t => !suppressed.has(t));
      if (!visibleTags.length) return null;
      const currentTags = () => new Set(parseTags(mirrorTA.value));

      const wrap = document.createElement('div');
      wrap.className = 'qem-chips';

      const lbl = document.createElement('span');
      lbl.className = 'qem-chips-label';
      lbl.textContent = labelText;
      wrap.appendChild(lbl);

      visibleTags.forEach(tag => {
        const chip = document.createElement('span');
        chip.className = `qem-chip ${extraClass}`;
        chip.textContent = tag;
        chip.dataset.tag = tag;

        /* Hide chip if tag already present in textarea */
        if (currentTags().has(tag)) chip.style.display = 'none';

        /* Lazy count fetch — no TTL for relation/fav/recent chips */
        fetchTagCountPermanent(tag, count => {
          if (count !== null) {
            chip.textContent = `${tag} (${Number(count).toLocaleString()})`;
            chip.dataset.tag = tag;
          }
        });

        chip.addEventListener('pointerdown', e => {
          e.preventDefault();
          let val = mirrorTA.value;
          if (val && !val.endsWith(' ')) val += ' ';
          val += tag + ' ';
          mirrorTA.value = val;
          sourceTextarea.value = val;
          mirrorTA.scrollTop = mirrorTA.scrollHeight;
          /* Don't call mirrorTA.focus() here — re-opens keyboard on mobile */
          document.querySelectorAll('.qem-chip').forEach(c => {
            if ((c.dataset.tag || c.textContent) === tag) c.style.display = 'none';
          });
        });

        wrap.appendChild(chip);
      });

      return wrap;
    }

    const mirrorTA = document.createElement('textarea');
    mirrorTA.id = 'qem-mirror-textarea';
    mirrorTA.value = sourceTextarea.value;
    mirrorTA.rows = 4;
    mirrorTA.spellcheck = false;
    mirrorTA.autocomplete = 'off';

    const label = document.createElement('div');
    label.id = 'qem-mirror-label';
    label.textContent = 'Tags';

    /* Build chip rows with persistent collapse state */
    function makeCollapsibleChipRow(tags, extraClass, labelText, collapseKey, suppressed) {
      const wrap = makeChipRow(tags, extraClass, labelText, mirrorTA, suppressed);
      if (!wrap) return null;
      const collapsed = GM_getValue(collapseKey, false);
      if (collapsed) wrap.classList.add('collapsed');
      const lbl = wrap.querySelector('.qem-chips-label');
      lbl.addEventListener('click', e => {
        e.stopPropagation();
        wrap.classList.toggle('collapsed');
        GM_setValue(collapseKey, wrap.classList.contains('collapsed'));
      });
      return wrap;
    }

    /* Build relation maps and chip rows — wrapped so a throw with large datasets
       doesn't prevent the mirror from being functional. */
    try {
      const _relMaps   = buildRelationMaps();
      const _blacklist = getBlacklist();
      const _currentTagSet = new Set(parseTags(sourceTextarea.value));
      const _suppressed = getSuppressedTags(_currentTagSet, _relMaps, _blacklist);

    const COLLAPSE_KEY_RELATED = 'r34_collapse_related';

    /* Related row — built fresh on each re-evaluation */
    let _relatedRowEl = null;
    function renderRelatedRow() {
      const curSet = new Set(parseTags(mirrorTA.value));
      const sup    = getSuppressedTags(curSet, _relMaps, _blacklist);
      const tags   = getRelatedTags(curSet, _relMaps).filter(t => !sup.has(t));
      /* Early exit if nothing to show */
      if (_relatedRowEl) { _relatedRowEl.remove(); _relatedRowEl = null; }
      if (!tags.length) return;
      const row = makeChipRow(tags, 'qem-chip-related', '🔗 Related', mirrorTA, sup);
      if (!row) return;
      /* Collapsible */
      const collapsed = GM_getValue(COLLAPSE_KEY_RELATED, false);
      if (collapsed) row.classList.add('collapsed');
      const lbl = row.querySelector('.qem-chips-label');
      lbl.addEventListener('click', e => {
        e.stopPropagation();
        row.classList.toggle('collapsed');
        GM_setValue(COLLAPSE_KEY_RELATED, row.classList.contains('collapsed'));
      });
      _relatedRowEl = row;
      /* Insert before Recent row (first child of body), or before label if no recent */
      const firstChild = body.firstChild;
      body.insertBefore(row, firstChild);
    }

    const recentRow = makeCollapsibleChipRow(getRecentTags(),  'qem-chip-recent', '🕘 Recent',    COLLAPSE_KEY_RECENT, _suppressed);
    const favRow    = makeCollapsibleChipRow(getFavoriteTags(), 'qem-chip-fav',   '★ Favorites', COLLAPSE_KEY_FAV,    _suppressed);

    /* ── Quick-rule bar ── */
    const ruleBar = document.createElement('div');
    ruleBar.id = 'qem-rule-bar';

    const ruleInput = document.createElement('input');
    ruleInput.id = 'qem-rule-input';
    ruleInput.placeholder = 'e.g. princess_peach > nintendo';
    ruleInput.autocomplete = 'off';
    ruleInput.spellcheck = false;

    const ruleAddBtn = document.createElement('button');
    ruleAddBtn.id = 'qem-rule-add';
    ruleAddBtn.textContent = '+ Rule';

    function commitRule() {
      const raw = ruleInput.value.trim();
      if (!raw) return;
      const m = raw.match(/^(.+?)\s*(=\/=|=|>|<)\s*(.+)$/);
      if (!m) { showToast('⚠️ Use: left = > < =/= right'); return; }
      const rule = `${m[1].trim()} ${m[2]} ${m[3].trim()}`;
      const all = getRelations();
      if (all.includes(rule)) { showToast('Rule already exists'); return; }
      all.push(rule);
      saveRelations(all);
      ruleInput.value = '';
      showToast('🔗 Rule added');
    }

    ruleAddBtn.addEventListener('click', commitRule);
    ruleInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); commitRule(); }
    });

    ruleBar.appendChild(ruleInput);
    ruleBar.appendChild(ruleAddBtn);

    /* Autocomplete on rule input — replaces last token only, appends space */
    attachAutocomplete(ruleInput, tag => {
      const val = ruleInput.value;
      const opMatch = val.match(/^(.*?)\s*(=\/=|=|>|<)\s*(.*)$/);
      if (opMatch) {
        /* Replace only the last token on the right side, preserve preceding ones */
        const rightParts = opMatch[3].split(/\s+/).filter(Boolean);
        rightParts[Math.max(0, rightParts.length - 1)] = tag;
        ruleInput.value = `${opMatch[1].trim()} ${opMatch[2]} ${rightParts.join(' ')} `;
      } else {
        const parts = val.split(/\s+/);
        parts[parts.length - 1] = tag;
        ruleInput.value = parts.join(' ') + ' ';
      }
    }, null, () => {
      /* Existing tags = all non-operator tokens in the rule input */
      const v = ruleInput.value;
      const stripped = v.replace(/=\/=|=|>|</g, ' ');
      return new Set(stripped.trim().split(/\s+/).filter(Boolean));
    }, { forceAbove: true });

    if (recentRow) body.appendChild(recentRow);
    if (favRow)    body.appendChild(favRow);
    body.insertBefore(ruleBar, body.firstChild);
    } catch (e) {
      console.warn('[QEM] Error building chip/relation rows:', e);
    }
    const tagsWrap = document.createElement('div');
    tagsWrap.id = 'qem-mirror-tags-wrap';
    const tagsCollapseKey = 'r34_collapse_textarea';
    if (GM_getValue(tagsCollapseKey, false)) tagsWrap.classList.add('collapsed');
    label.addEventListener('click', e => {
      e.stopPropagation();
      tagsWrap.classList.toggle('collapsed');
      GM_setValue(tagsCollapseKey, tagsWrap.classList.contains('collapsed'));
    });
    tagsWrap.appendChild(label);
    tagsWrap.appendChild(mirrorTA);
    body.appendChild(tagsWrap);
    mirror.appendChild(body);
    document.body.appendChild(mirror);

    /* Make the mirror visible immediately — before any chip/relation work that
       could throw or take time. This guarantees the bar is always present. */
    mirror.classList.add('visible');
    mirror.classList.add('minimized');
    minBtn.innerHTML = '&#x2b;';
    if (mirrorTA.value && !mirrorTA.value.endsWith(' ')) {
      mirrorTA.value += ' ';
      sourceTextarea.value = mirrorTA.value;
    }
    mirrorTA.scrollTop = mirrorTA.scrollHeight;

    const backdrop = document.createElement('div');
    backdrop.id = 'qem-mirror-backdrop';
    /* Backdrop is transparent and non-blocking — it exists only as a z-index layer.
       Do NOT prevent/stop touch or wheel events here; the page must remain scrollable
       while the mirror is open. The mirror's own CSS (touch-action, overscroll-behavior)
       keeps internal mirror scrolling contained. */
    document.body.appendChild(backdrop);

    const _mirrorObserver = new MutationObserver(() => {
      backdrop.classList.toggle('visible', mirror.classList.contains('visible'));
    });
    _mirrorObserver.observe(mirror, { attributes: true, attributeFilter: ['class'] });

    renderRelatedRow();

    /* Wire autocomplete via refactored attachAutocomplete */
    attachAutocomplete(mirrorTA, tag => {
      const val = (() => {
        const v = mirrorTA.value;
        const lastSpace = v.lastIndexOf(' ');
        const base = lastSpace === -1 ? '' : v.slice(0, lastSpace + 1);
        return base + tag + ' ';
      })();
      mirrorTA.value = val;
      sourceTextarea.value = val;
      mirrorTA.focus();
      /* Defer scroll until after virtual keyboard has opened and viewport settled */
      requestAnimationFrame(() => {
        mirrorTA.scrollTop = mirrorTA.scrollHeight;
        mirrorTA.setSelectionRange(val.length, val.length);
      });
      document.querySelectorAll('.qem-chip').forEach(c => {
        if ((c.dataset.tag || c.textContent) === tag) c.style.display = 'none';
      });
      /* Recalculate relations immediately after tag insert */
      clearTimeout(_relatedDebounce);
      _relatedDebounce = setTimeout(renderRelatedRow, 400);
    }, null, () => new Set(parseTags(mirrorTA.value)));

    /* Sync: mirror → source while typing; debounced Related row re-render */
    let _relatedDebounce = null;
    mirrorTA.addEventListener('input', () => {
      sourceTextarea.value = mirrorTA.value;
      clearTimeout(_relatedDebounce);
      _relatedDebounce = setTimeout(renderRelatedRow, 400);
    });

    /* Sync: source → mirror if something else changes source */
    sourceTextarea.addEventListener('input', () => {
      if (document.activeElement !== mirrorTA) {
        mirrorTA.value = sourceTextarea.value;
      }
    });

    /* Record added tags and fix back-stack pollution on submit.
       Rule34 reloads the page after save. We replace the current history entry
       so the post-save reload lands on the same entry, meaning one back-press
       returns to the search results instead of three. */
    const editForm =
      document.getElementById('edit') ||
      document.getElementById('edit_form') ||
      sourceTextarea.closest('form');
    if (editForm) {
      editForm.addEventListener('submit', () => {
        recordAddedTags(originalTags, parseTags(sourceTextarea.value));
        /* Replace so the reload doesn't add a new history entry */
        history.replaceState(null, '', location.href);
      }, { once: true });
    }

    mirror.addEventListener('wheel', e => e.stopPropagation(), { passive: true });
  }