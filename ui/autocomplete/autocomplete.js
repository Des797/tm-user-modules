// AUTOCOMPLETE LOGIC: `attachAutocomplete(element, onSelect, anchorEl?, getExistingTags?, opts?)` — wires tag autocomplete to any input or textarea. Debounces input, fetches suggestions from the AC API, renders them in the shared dropdown with smart above/below positioning, handles keyboard nav (↑↓ Enter Esc), greys out already-present tags, and calls `onSelect(tag)` on pick. Returns `{hide}`. Works for both multi-token textareas (mirror) and single-token inputs (manager fields).
  /*
   * attachAutocomplete(element, onSelect, anchorEl?)
   *
   * element   — any <input> or <textarea> to attach to
   * onSelect  — callback(tag: string) called when user picks a suggestion
   * anchorEl  — optional element whose top edge the dropdown sits above;
   *             defaults to element itself
   *
   * For textarea mirror: caller handles value mutation in onSelect.
   * For single-word inputs (manager): entire value is the partial.
   */
  function attachAutocomplete(element, onSelect, anchorEl, getExistingTags, opts) {
    const list = getAcList();
    let debounceTimer = null;
    let selectedIdx = -1;
    const isMultiWord = element.tagName === 'TEXTAREA';

    function getPartial() {
      /* Always extract the last whitespace-delimited token —
         works for textarea (last tag being typed) and single-line
         inputs with operators (e.g. "princess_peach > nint|") */
      const val = element.value;
      const tokens = val.split(/\s+/);
      return tokens[tokens.length - 1] || '';
    }

    function hideList() {
      list.classList.remove('visible');
      list.innerHTML = '';
      selectedIdx = -1;
    }

    function getItems() { return list.querySelectorAll('.qem-ac-item'); }

    function setSelected(idx) {
      const items = getItems();
      items.forEach(r => r.style.background = '');
      selectedIdx = Math.max(-1, Math.min(idx, items.length - 1));
      if (selectedIdx >= 0) {
        items[selectedIdx].style.background = '#2a2a40';
        items[selectedIdx].scrollIntoView({ block: 'nearest' });
      }
    }

    function showResults(items) {
      list.innerHTML = '';
      selectedIdx = -1;
      if (!items.length) { hideList(); return; }

      /* Smart positioning: prefer below element, fall back to above if not enough space */
      const posEl = element;
      const rect = posEl.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const maxH = 180;

      list.style.bottom = '';
      list.style.top = '';

      if (!opts?.forceAbove && (spaceBelow >= Math.min(maxH, 80) || spaceBelow >= spaceAbove)) {
        /* Show below */
        list.style.top    = rect.bottom + 'px';
        list.style.bottom = '';
      } else {
        /* Show above */
        list.style.bottom = (window.innerHeight - rect.top) + 'px';
        list.style.top    = '';
      }

      items.forEach(item => {
        const tag = item.value || String(item);
        const labelMatch = item.label && item.label.match(/^(.+?)\s*\((\d+)\)$/);
        const row = document.createElement('div');
        row.className = 'qem-ac-item';

        const name = document.createElement('span');
        name.textContent = tag;

        const count = document.createElement('span');
        count.className = 'qem-ac-item-count';
        if (labelMatch) count.textContent = Number(labelMatch[2]).toLocaleString();

        /* Grey out if tag already exists in the field (skip wildcards/partials) */
        const existing = getExistingTags ? getExistingTags() : null;
        const isWild = tag.includes('*');
        const alreadyPresent = !isWild && existing && existing.has(tag);
        if (alreadyPresent) {
          row.style.opacity = '0.35';
          row.style.pointerEvents = 'none';
          row.style.cursor = 'default';
        }

        row.appendChild(name);
        row.appendChild(count);
        if (!alreadyPresent) {
          let _downX, _downY;
          row.addEventListener('pointerdown', e => {
            e.preventDefault();
            _downX = e.clientX; _downY = e.clientY;
          });
          row.addEventListener('pointerup', e => {
            const dx = Math.abs(e.clientX - _downX);
            const dy = Math.abs(e.clientY - _downY);
            if (dx < 8 && dy < 8) { suppressNextClick(); hideList(); onSelect(tag); }
          });
        }
        list.appendChild(row);
      });

      list.scrollTop = 0;
      list.classList.add('visible');
    }

    element.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const partial = getPartial();
      if (partial.length < 2) { hideList(); return; }

      debounceTimer = setTimeout(() => {
        const url = `${AC_API_BASE}?q=${encodeURIComponent(partial)}&api_key=${AC_API_KEY}&user_id=${AC_USER_ID}`;
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          onload(res) {
            try {
              const data = JSON.parse(res.responseText);
              if (Array.isArray(data)) showResults(data.slice(0, 8));
              else hideList();
            } catch { hideList(); }
          },
          onerror() { hideList(); },
        });
      }, AC_DEBOUNCE);
    });

    element.addEventListener('keydown', e => {
      if (!list.classList.contains('visible')) return;
      const items = getItems();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected(selectedIdx + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected(selectedIdx - 1);
      } else if (e.key === 'Enter' && selectedIdx >= 0) {
        e.preventDefault();
        const tag = items[selectedIdx].querySelector('span').textContent;
        hideList();
        onSelect(tag);
      } else if (e.key === 'Escape') {
        hideList();
      }
    });

    element.addEventListener('blur', () => { setTimeout(hideList, 150); });

    return { hide: hideList };
  }