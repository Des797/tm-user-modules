// BLACKLIST PAGE: `buildBlacklistPage()` — inner function of createRelationsManager. Builds the Blacklisted tab: add-input with autocomplete (space-separated batch add), search filter, scrollable list of blacklisted tags with post counts and undo-able delete. Appends to `pageBl`.
    /* ══════════════════════════════════════════
       BLACKLIST PAGE
    ══════════════════════════════════════════ */
    function buildBlacklistPage(container) {
      const addArea = document.createElement('div');
      addArea.className = 'qem-mgr-add-area';

      const row1 = document.createElement('div');
      row1.className = 'qem-mgr-row';
      const blInput = document.createElement('input');
      blInput.className = 'qem-mgr-input';
      blInput.placeholder = 'Tag or paste space-separated list…';
      blInput.autocomplete = 'off';
      const addBtn = document.createElement('button');
      addBtn.className = 'qem-mgr-add-btn';
      addBtn.textContent = '+  Add';
      row1.appendChild(blInput); row1.appendChild(addBtn);

      const row2 = document.createElement('div');
      row2.className = 'qem-mgr-row';
      const searchInput = document.createElement('input');
      searchInput.className = 'qem-mgr-input';
      searchInput.placeholder = 'Search blacklist…';
      searchInput.autocomplete = 'off';
      row2.appendChild(searchInput);

      addArea.appendChild(row1); addArea.appendChild(row2);

      const list = document.createElement('div');
      list.className = 'qem-mgr-list';

      function renderBlList(filter) {
        list.innerHTML = '';
        let tags = getBlacklist();
        filter = (filter || '').toLowerCase().trim();
        if (filter) tags = tags.filter(t => t.toLowerCase().includes(filter));
        tags.sort();
        if (!tags.length) {
          const empty = document.createElement('div');
          empty.className = 'qem-mgr-empty';
          empty.textContent = filter ? 'No matching tags.' : 'No blacklisted tags yet.';
          list.appendChild(empty); return;
        }
        tags.forEach(tag => {
          const row = document.createElement('div');
          row.className = 'qem-mgr-rule';
          const lEl = document.createElement('span'); lEl.className = 'qem-mgr-rule-left'; lEl.textContent = tag;
          const countEl = document.createElement('span'); countEl.className = 'qem-mgr-tag-chip-preview';
          fetchTagCountPermanent(tag, c => { if (c) countEl.textContent = Number(c).toLocaleString(); });
          const del = document.createElement('button'); del.className = 'qem-mgr-del'; del.innerHTML = '🗑';
          del.addEventListener('click', () => {
            const all = getBlacklist();
            const idx = all.indexOf(tag);
            if (idx === -1) return;
            all.splice(idx, 1);
            saveBlacklist(all);
            renderBlList(searchInput.value);
            showToast('Removed — tap to undo');
            const toastEl = document.getElementById('qem-toast');
            let undone = false;
            if (toastEl) toastEl.addEventListener('click', () => {
              if (undone) return; undone = true;
              const cur = getBlacklist(); cur.splice(idx, 0, tag);
              saveBlacklist(cur); renderBlList(searchInput.value);
              showToast('Restored');
            }, { once: true });
          });
          row.appendChild(lEl); row.appendChild(countEl); row.appendChild(del);
          list.appendChild(row);
        });
      }

      let searchTimer = null;
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => renderBlList(searchInput.value), 150);
      });

      attachAutocomplete(blInput, tag => { blInput.value = tag + ' '; });

      addBtn.addEventListener('click', () => {
        const raw = blInput.value.trim();
        if (!raw) return;
        const incoming = raw.split(/\s+/).filter(Boolean);
        const all = getBlacklist();
        let added = 0;
        incoming.forEach(tag => { if (!all.includes(tag)) { all.push(tag); added++; } });
        if (added) { saveBlacklist(all); showToast(`${added} tag${added > 1 ? 's' : ''} blacklisted`); }
        else showToast('Already in blacklist');
        blInput.value = '';
        searchInput.value = '';
        renderBlList('');
      });

      renderBlList('');
      container.appendChild(addArea);
      container.appendChild(list);
    }