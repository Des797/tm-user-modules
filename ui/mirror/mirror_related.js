// MIRROR RELATED: `buildRelatedRowManager(body, mirrorTA, relMaps, blacklist)` — sets up the dynamic "🔗 Related" chip row that re-evaluates whenever the tag set changes. Returns `{ renderRelatedRow }`. On each call, `renderRelatedRow()` recomputes suppressed tags, filters the implied tag list, removes the old row element if present, and prepends a new collapsible chip row to `body`. Callers should debounce calls to `renderRelatedRow` on textarea input.
//
// Also applies initial suppression to already-rendered chip rows: pass `{ recentRow, favRow }` to hide suppressed chips in those rows based on the current tag set at construction time.

  const COLLAPSE_KEY_RELATED = 'r34_collapse_related';

  function buildRelatedRowManager(body, mirrorTA, relMaps, blacklist, { recentRow, favRow } = {}) {
    const initialSet = new Set(parseTags(mirrorTA.value));
    const initialSuppressed = getSuppressedTags(initialSet, relMaps, blacklist);

    if (recentRow) recentRow.querySelectorAll('.qem-chip').forEach(c => {
      if (initialSuppressed.has(c.dataset.tag)) c.style.display = 'none';
    });
    if (favRow) favRow.querySelectorAll('.qem-chip').forEach(c => {
      if (initialSuppressed.has(c.dataset.tag)) c.style.display = 'none';
    });

    let _relatedRowEl = null;

    function renderRelatedRow() {
      const curSet = new Set(parseTags(mirrorTA.value));
      const sup = getSuppressedTags(curSet, relMaps, blacklist);
      const tags = getRelatedTags(curSet, relMaps).filter(t => !sup.has(t));

      if (_relatedRowEl) { _relatedRowEl.remove(); _relatedRowEl = null; }
      if (!tags.length) return;

      const row = makeChipRow(tags, 'qem-chip-related', '🔗 Related', mirrorTA, sup, () => {
        renderRelatedRow();
      });
      if (!row) return;

      if (GM_getValue(COLLAPSE_KEY_RELATED, false)) row.classList.add('collapsed');
      row.querySelector('.qem-chips-label').addEventListener('click', e => {
        e.stopPropagation();
        row.classList.toggle('collapsed');
        GM_setValue(COLLAPSE_KEY_RELATED, row.classList.contains('collapsed'));
      });

      _relatedRowEl = row;
      body.insertBefore(row, body.firstChild);
    }

    return { renderRelatedRow };
  }