// TAGS MIRROR: `createTagsMirror()` — entry point for the fixed bottom mirror panel. Guards against duplicates and bails if the source `#tags` textarea is absent. Orchestrates all mirror sub-modules: injects styles (mirror_styles.js), builds DOM shell (mirror_dom.js), assembles chip rows for Recent and Favorites (mirror_chips.js), adds the quick-rule bar (mirror_rule_bar.js), wires the relations-dependent Related row (mirror_related.js), attaches autocomplete to the textarea and rule input, syncs textarea↔source (mirror_sync.js), and mounts the panel to the document. Starts minimized.

  function createTagsMirror() {
    if (document.getElementById('qem-mirror')) return;
    const sourceTextarea = document.getElementById('tags');
    if (!sourceTextarea) return;

    const originalTags = parseTags(sourceTextarea.value);

    injectMirrorStyles();

    const { mirror, body, mirrorTA, minBtn, backdrop } = buildMirrorDOM(sourceTextarea);

    const COLLAPSE_KEY_RECENT = 'r34_collapse_recent';
    const COLLAPSE_KEY_FAV    = 'r34_collapse_fav';
    const COLLAPSE_KEY_TAGS   = 'r34_collapse_textarea';

    /* ── Chip rows (no relation dependency) ── */
    let _relatedDebounce = null;
    let renderRelatedRow = null;

    const recentRow = makeCollapsibleChipRow(
      getRecentTags(), 'qem-chip-recent', '🕘 Recent', COLLAPSE_KEY_RECENT, mirrorTA, new Set(),
      val => { syncToSource(sourceTextarea, val); scheduleRelated(); }
    );
    const favRow = makeCollapsibleChipRow(
      getFavoriteTags(), 'qem-chip-fav', '★ Favorites', COLLAPSE_KEY_FAV, mirrorTA, new Set(),
      val => { syncToSource(sourceTextarea, val); scheduleRelated(); }
    );

    function scheduleRelated() {
      if (!renderRelatedRow) return;
      clearTimeout(_relatedDebounce);
      _relatedDebounce = setTimeout(renderRelatedRow, 400);
    }

    if (recentRow) body.appendChild(recentRow);
    if (favRow) body.appendChild(favRow);

    /* ── Quick-rule bar ── */
    const { ruleBar, ruleInput } = buildRuleBar();
    body.insertBefore(ruleBar, body.firstChild);

    /* ── Relations-dependent block ── */
    try {
      const relMaps = buildRelationMaps();
      const blacklist = getBlacklist();
      const { renderRelatedRow: rrr } = buildRelatedRowManager(body, mirrorTA, relMaps, blacklist, { recentRow, favRow });
      renderRelatedRow = rrr;
      renderRelatedRow();
      mirrorTA.addEventListener('input', scheduleRelated);
    } catch (e) {
      console.warn('[QEM] Error building relation rows:', e);
    }

    /* ── Tags textarea section ── */
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
    tagsWrap.appendChild(mirrorTA);
    body.appendChild(tagsWrap);

    /* ── Autocomplete: textarea ── */
    attachAutocomplete(mirrorTA, tag => {
      const v = mirrorTA.value;
      const lastSpace = v.lastIndexOf(' ');
      const val = (lastSpace === -1 ? '' : v.slice(0, lastSpace + 1)) + tag + ' ';
      mirrorTA.value = val;
      syncToSource(sourceTextarea, val);
      mirrorTA.focus();
      requestAnimationFrame(() => {
        mirrorTA.scrollTop = mirrorTA.scrollHeight;
        mirrorTA.setSelectionRange(val.length, val.length);
      });
      document.querySelectorAll('.qem-chip').forEach(c => {
        if ((c.dataset.tag || c.textContent) === tag) c.style.display = 'none';
      });
      scheduleRelated();
    }, null, () => new Set(parseTags(mirrorTA.value)));

    /* ── Autocomplete: rule input ── */
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

    /* ── Sync & submit ── */
    wireTextareaSync(mirrorTA, sourceTextarea, scheduleRelated);
    wireSubmitHandler(sourceTextarea, originalTags);
    wireBackdropObserver(mirror, backdrop);

    /* ── Mount ── */
    document.body.appendChild(mirror);
    document.body.appendChild(backdrop);

    mirror.classList.add('visible', 'minimized');
    minBtn.innerHTML = '&#x2b;';

    if (mirrorTA.value && !mirrorTA.value.endsWith(' ')) {
      mirrorTA.value += ' ';
      syncToSource(sourceTextarea, mirrorTA.value);
    }
    mirrorTA.scrollTop = mirrorTA.scrollHeight;

    mirror.addEventListener('wheel', e => e.stopPropagation(), { passive: true });
    mirror.addEventListener('pointerdown', e => e.stopPropagation());
  }