// MIRROR CHIPS: Chip row factory functions for the mirror panel.
//
// `makeChipRow(tags, extraClass, labelText, mirrorTA, suppressed, onChipAdded)` — builds a `.qem-chips` category section with:
//   a label, a horizontal scroller containing a grid (1 vertical row compact, 3 vertical rows expanded),
//   and an expand/compact button. Chips already present in `mirrorTA` are hidden. Each chip tap appends
//   the tag to the textarea, hides all matching chips, and calls `onChipAdded()`. Lazily fetches post counts via `fetchTagCountPermanent`.
//
// `makeCollapsibleChipRow(tags, extraClass, labelText, collapseKey, mirrorTA, suppressed, onChipAdded)` — wraps `makeChipRow` with GM-persisted collapse state toggled by clicking the label.

  function makeChipRow(tags, extraClass, labelText, mirrorTA, suppressed, onChipAdded) {
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

    const scroller = document.createElement('div');
    scroller.className = 'qem-chip-scroller';

    const rowsWrap = document.createElement('div');
    rowsWrap.className = 'qem-chip-rows';
    scroller.appendChild(rowsWrap);
    wrap.appendChild(scroller);

    const chipEls = [];
    const selectedSet = currentTags();
    let autoUpdateRaf = null;

    function scheduleAutoRowUpdate() {
      if (autoUpdateRaf !== null) cancelAnimationFrame(autoUpdateRaf);
      autoUpdateRaf = requestAnimationFrame(() => {
        autoUpdateRaf = null;
        updateAutoRowCount();
      });
    }

    visibleTags.forEach(tag => {
      const chip = document.createElement('span');
      chip.className = `qem-chip ${extraClass}`;
      chip.textContent = tag;
      chip.dataset.tag = tag;

      if (selectedSet.has(tag)) chip.style.display = 'none';
      chipEls.push(chip);

      fetchTagCountPermanent(tag, count => {
        if (count !== null) {
          chip.textContent = `${tag} (${Number(count).toLocaleString()})`;
          chip.dataset.tag = tag;
        }
        scheduleAutoRowUpdate();
      });

      let _downX, _downY;
      chip.addEventListener('pointerdown', e => {
        e.stopPropagation();
        _downX = e.clientX; _downY = e.clientY;
      });
      chip.addEventListener('pointerup', e => {
        suppressNextClick();
        if (Math.abs(e.clientX - _downX) > 8 || Math.abs(e.clientY - _downY) > 8) return;
        let val = mirrorTA.value;
        if (val && !val.endsWith(' ')) val += ' ';
        val += tag + ' ';
        mirrorTA.value = val;
        mirrorTA.scrollTop = mirrorTA.scrollHeight;
        document.querySelectorAll('.qem-chip').forEach(c => {
          if ((c.dataset.tag || c.textContent) === tag) c.style.display = 'none';
        });
        if (onChipAdded) onChipAdded(val);
        // Reflow this row so hidden chips collapse immediately.
        renderColumns();
        scheduleAutoRowUpdate();
      });

      // Append later via renderColumns().
    });

    // Auto row count: 1..3 based on horizontal overflow.
    // Manual override: when the arrow button is used to collapse, force 1 row.
    const expandBtn = document.createElement('button');
    expandBtn.className = 'qem-chip-expand-btn';
    expandBtn.type = 'button';
    expandBtn.textContent = '';
    expandBtn.setAttribute('aria-label', 'Compact tag list');

    let rowCount = 1;
    let manualCollapsed = false;

    expandBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (!manualCollapsed) {
        manualCollapsed = true;
        rowCount = 1;
        wrap.classList.remove('expanded');
        expandBtn.setAttribute('aria-label', 'Expand tag list');
        renderColumns();
        expandBtn.style.display = '';
      } else {
        manualCollapsed = false;
        expandBtn.setAttribute('aria-label', 'Compact tag list');
        updateAutoRowCount();
      }
    });

    function renderColumns() {
      const maxRows = rowCount;
      const activeChips = chipEls.filter(el => el.style.display !== 'none');

      rowsWrap.innerHTML = '';
      if (!activeChips.length) return;

      const colCount = Math.ceil(activeChips.length / maxRows);
      for (let row = 0; row < maxRows; row++) {
        const rowEl = document.createElement('div');
        rowEl.className = 'qem-chip-row';

        const start = row * colCount;
        const end = Math.min(start + colCount, activeChips.length);
        for (let i = start; i < end; i++) rowEl.appendChild(activeChips[i]);

        rowsWrap.appendChild(rowEl);
      }
    }

    wrap.appendChild(expandBtn);

    // React to responsive layout changes.
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => scheduleAutoRowUpdate());
      ro.observe(scroller);
    }

    function updateAutoRowCount() {
      if (!wrap.isConnected) { scheduleAutoRowUpdate(); return; }
      if (wrap.classList.contains('collapsed')) return;

      const clientW = scroller.clientWidth || 0;
      if (clientW < 40) {
        // Layout not stable yet (common when chip counts are cached and callbacks fire immediately).
        scheduleAutoRowUpdate();
        return;
      }

      if (manualCollapsed) {
        rowCount = 1;
        wrap.classList.remove('expanded');
        expandBtn.style.display = '';
        renderColumns();
        return;
      }

      const activeChips = chipEls.filter(el => el.style.display !== 'none');
      const n = activeChips.length;
      if (!n) {
        rowCount = 1;
        wrap.classList.remove('expanded');
        expandBtn.style.display = 'none';
        renderColumns();
        return;
      }

      // "How far things extend": if horizontal overflow is more than this, add rows.
      // We cap the threshold so it still works on very wide screens.
      // How far content may extend (in px) before we add more rows.
      // Recent previously stayed at 1 row because the threshold was too lenient.
      const overflowThreshold = Math.min(34, clientW * 0.12);

      let chosen = 1;
      for (let r = 1; r <= 3; r++) {
        rowCount = r;
        wrap.classList.toggle('expanded', r > 1);
        renderColumns();

        const firstRow = rowsWrap.firstElementChild;
        const rowW = firstRow ? firstRow.scrollWidth : rowsWrap.scrollWidth;
        const overflow = Math.max(0, rowW - scroller.clientWidth);
        if (overflow <= overflowThreshold) { chosen = r; break; }
      }

      rowCount = chosen;
      wrap.classList.toggle('expanded', chosen > 1);
      renderColumns();

      // Hide the button when a 1-row layout already keeps overflow reasonable.
      expandBtn.style.display = chosen > 1 ? '' : 'none';
    }

    // Initial evaluation.
    requestAnimationFrame(() => {
      manualCollapsed = false;
      rowCount = 1;
      wrap.classList.remove('expanded');
      renderColumns();
      updateAutoRowCount();
      expandBtn.setAttribute('aria-label', 'Compact tag list');
    });

    return wrap;
  }

  function makeCollapsibleChipRow(tags, extraClass, labelText, collapseKey, mirrorTA, suppressed, onChipAdded) {
    const wrap = makeChipRow(tags, extraClass, labelText, mirrorTA, suppressed, onChipAdded);
    if (!wrap) return null;
    if (GM_getValue(collapseKey, false)) wrap.classList.add('collapsed');
    wrap.querySelector('.qem-chips-label').addEventListener('click', e => {
      e.stopPropagation();
      wrap.classList.toggle('collapsed');
      GM_setValue(collapseKey, wrap.classList.contains('collapsed'));
    });
    return wrap;
  }