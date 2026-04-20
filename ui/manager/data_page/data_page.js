// DATA PAGE: `buildDataPage()` — inner function of createRelationsManager. Builds the Data tab: Export (serialises all GM stores to a downloadable JSON file), Import (reads a JSON file and writes each valid key, merging tag counts without overwriting newer entries, then reopens the manager on the same tab), and Reset (confirms then nulls all GM keys). Appends to `pageData`.
    /* ══════════════════════════════════════════
       DATA PAGE
    ══════════════════════════════════════════ */
    function buildDataPage(container) {
      // Back-compat: older builds referenced `pageData`; keep it defined.
      const pageData = container;
      const wrap = document.createElement('div');
      Object.assign(wrap.style, { padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: '1' });

      function section(title, desc, btnLabel, btnColor, onClick) {
        const box = document.createElement('div');
        Object.assign(box.style, { background: '#13131e', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' });
        const h = document.createElement('div');
        Object.assign(h.style, { color: '#ddd', fontWeight: '700', fontSize: '13px' });
        h.textContent = title;
        const d = document.createElement('div');
        Object.assign(d.style, { color: '#666', fontSize: '12px', lineHeight: '1.5' });
        d.textContent = desc;
        const btn = document.createElement('button');
        Object.assign(btn.style, { marginTop: '4px', alignSelf: 'flex-start', background: btnColor, border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: '700', padding: '7px 16px', cursor: 'pointer' });
        btn.textContent = btnLabel;
        btn.addEventListener('click', onClick);
        btn.addEventListener('pointerenter', () => { btn.style.opacity = '0.85'; });
        btn.addEventListener('pointerleave', () => { btn.style.opacity = '1'; });
        box.appendChild(h); box.appendChild(d); box.appendChild(btn);
        return box;
      }

      const ALL_KEYS = {
        relations:  RELATIONS_KEY,
        blacklist:  BLACKLIST_KEY,
        categories: CATEGORIES_KEY,
        categoryMembership: CATEGORY_MEMBERSHIP_KEY,
        categoryHierarchy: CATEGORY_HIERARCHY_KEY,
        categoryAddDrafts: CATEGORY_ADD_DRAFTS_KEY,
        relationsFormDraft: RELATIONS_FORM_DRAFT_KEY,
        blacklistAddDraft: BLACKLIST_ADD_DRAFT_KEY,
        recent:     RECENT_KEY,
        favorites:  FREQ_KEY,
        tagCounts:  COUNT_KEY,
        colRecent:  'r34_collapse_recent',
        colFav:     'r34_collapse_fav',
        colRelated: 'r34_collapse_related',
        colCategories: 'r34_collapse_categories',
        mirrorActiveCategories: 'r34_mirror_active_categories',
      };

      function collectData() {
        const out = {};
        Object.entries(ALL_KEYS).forEach(([k, gmKey]) => {
          try { out[k] = JSON.parse(GM_getValue(gmKey, 'null')); } catch { out[k] = null; }
        });
        return out;
      }

      /* Export */
      wrap.appendChild(section(
        '⬆️ Export',
        'Download all your relations, blacklist, recent tags, favorites, and cached counts as a JSON file.',
        'Export JSON',
        'linear-gradient(135deg,#3a7bd5,#1a4fa0)',
        () => {
          const data = collectData();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'r34_quick_edit_data.json';
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          showToast('Exported');
        }
      ));

      /* Import */
      wrap.appendChild(section(
        '⬇️ Import',
        'Load a previously exported JSON file. Existing data will be replaced. Tag counts are merged (imported counts do not overwrite newer cached values).',
        'Choose file…',
        'linear-gradient(135deg,#3a9d5d,#1a6a3a)',
        () => {
          const input = document.createElement('input');
          input.type = 'file'; input.accept = '.json,application/json';
          input.addEventListener('change', () => {
            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
              try {
                const data = JSON.parse(e.target.result);
                const keyMap = {
                  relations:  [RELATIONS_KEY,  v => Array.isArray(v)],
                  blacklist:  [BLACKLIST_KEY,   v => Array.isArray(v)],
                  categories: [CATEGORIES_KEY,  v => typeof v === 'object' && !!v],
                  categoryMembership: [CATEGORY_MEMBERSHIP_KEY, v => typeof v === 'object' && !!v],
                  categoryHierarchy: [CATEGORY_HIERARCHY_KEY, v => typeof v === 'object' && !!v],
                  recent:     [RECENT_KEY,      v => Array.isArray(v)],
                  favorites:  [FREQ_KEY,        v => typeof v === 'object' && v],
                };
                let imported = 0;
                Object.entries(keyMap).forEach(([k, [gmKey, valid]]) => {
                  if (data[k] !== undefined && valid(data[k])) {
                    GM_setValue(gmKey, JSON.stringify(data[k])); imported++;
                  }
                });
                /* Merge tag counts — don't overwrite existing cached entries */
                if (data.tagCounts && typeof data.tagCounts === 'object') {
                  const existing = getCountCache();
                  Object.entries(data.tagCounts).forEach(([tag, entry]) => {
                    if (!existing[tag]) existing[tag] = entry;
                  });
                  saveCountCache(existing);
                }
                showToast(`Imported ${imported} data sets — reloading…`);
                /* Reopen manager on same tab to pick up new data */
                setTimeout(() => {
                  const currentTab = GM_getValue('qem_last_tab', 'rel');
                  document.getElementById('qem-manager')?.remove();
                  /* Do NOT unlock scroll here — we're immediately reopening the manager,
                     so the page should stay locked. _lockScroll is called by createRelationsManager. */
                  GM_setValue('qem_last_tab', currentTab);
                  createRelationsManager();
                }, 400);
              } catch { showToast('⚠️ Invalid JSON file'); }
            };
            reader.readAsText(file);
          });
          input.click();
        }
      ));

      /* Reset */
      wrap.appendChild(section(
        '🗑 Reset All Data',
        'Permanently delete all relations, blacklist, recent tags, favorites, and cached counts. This cannot be undone.',
        'Reset Everything',
        '#6a1a1a',
        () => {
          if (!confirm('Delete ALL Quick Edit data? This cannot be undone.')) return;
          Object.values(ALL_KEYS).forEach(gmKey => GM_setValue(gmKey, 'null'));
          showToast('All data reset');
        }
      ));

      container.appendChild(wrap);
    }