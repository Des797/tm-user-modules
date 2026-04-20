// MIRROR RELATED: `buildRelatedRowManager(body, mirrorTA, relMaps, blacklist)` — sets up the dynamic "🔗 Related" chip row that re-evaluates whenever the tag set changes. Returns `{ renderRelatedRow }`. On each call, `renderRelatedRow()` recomputes suppressed tags, filters the implied tag list, removes the old row element if present, and prepends a new collapsible chip row to `body`. Callers should debounce calls to `renderRelatedRow` on textarea input.

  const COLLAPSE_KEY_RELATED = 'r34_collapse_related';

  function buildRelatedRowManager(body, mirrorTA, relMaps, blacklist) {
    let _relatedRowEl = null;

    function renderRelatedRow() {
      const curSet = new Set(parseTags(mirrorTA.value));
      const sup = getSuppressedTags(curSet, relMaps, blacklist);
      const tags = getRelatedTags(curSet, relMaps).filter(t => !sup.has(t));

      if (_relatedRowEl) { _relatedRowEl.remove(); _relatedRowEl = null; }
      if (!tags.length) return;

      const row = makeCollapsibleChipRow(
        tags,
        'qem-chip-related',
        '🔗 Related',
        COLLAPSE_KEY_RELATED,
        mirrorTA,
        sup,
        () => { renderRelatedRow(); }
      );
      if (!row) return;

      _relatedRowEl = row;
      body.insertBefore(row, body.firstChild);
    }

    return { renderRelatedRow };
  }