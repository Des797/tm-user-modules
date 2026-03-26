// RELATIONS LIST: `buildRelationsList(container, formRefs)` — builds the searchable, sorted rule list for the Relations tab. Wires per-rule edit/duplicate/undo-able-delete actions. `formRefs` is the object returned by `buildRelationsForm`. Returns `{ list, renderRulesList }`.

  function buildRelationsList(container, { searchInput, addBtn, cancelBtn, loadRuleIntoEditor }) {
    const list = document.createElement('div');
    list.className = 'qem-mgr-list';
    container.appendChild(list);

    let editingRule = null;

    function renderRulesList(filter) {
      list.innerHTML = '';
      let rules = getRelations();
      filter = (filter || '').toLowerCase().trim();
      if (filter) {
        rules = rules.filter(r => {
          const m = r.match(/^(.+?)\s*(=\/=|=|>|<)\s*(.+)$/);
          if (!m) return false;
          return m[1].toLowerCase().includes(filter) || m[3].toLowerCase().includes(filter);
        });
      }
      rules.sort((a, b) => {
        const aIsNeg = a.includes('=/='), bIsNeg = b.includes('=/=');
        if (aIsNeg !== bIsNeg) return aIsNeg ? 1 : -1;
        return a.localeCompare(b);
      });
      if (!rules.length) {
        const empty = document.createElement('div');
        empty.className = 'qem-mgr-empty';
        empty.textContent = filter ? 'No matching rules.' : 'No relations yet. Add one above.';
        list.appendChild(empty); return;
      }
      rules.forEach(rule => {
        const m = rule.match(/^(.+?)\s*(=\/=|=|>|<)\s*(.+)$/);
        if (!m) return;
        const [, left, op, right] = m;
        const row = document.createElement('div');
        row.className = 'qem-mgr-rule';

        const lEl = document.createElement('span'); lEl.className = 'qem-mgr-rule-left'; lEl.textContent = left.trim();
        const oEl = document.createElement('span'); oEl.className = 'qem-mgr-rule-op'; oEl.textContent = opDisplay(op);
        const rEl = document.createElement('span'); rEl.className = 'qem-mgr-rule-right'; rEl.textContent = right.trim();

        const editBtnEl = document.createElement('button'); editBtnEl.className = 'qem-mgr-del'; editBtnEl.textContent = '✏️'; editBtnEl.title = 'Edit';
        editBtnEl.addEventListener('click', () => { editingRule = rule; loadRuleIntoEditor(rule); });

        const dupBtnEl = document.createElement('button'); dupBtnEl.className = 'qem-mgr-del'; dupBtnEl.textContent = '⧉'; dupBtnEl.title = 'Duplicate';
        dupBtnEl.addEventListener('click', () => {
          editingRule = null;
          loadRuleIntoEditor(rule);
          addBtn.textContent = '+ Add';
        });

        const del = document.createElement('button'); del.className = 'qem-mgr-del'; del.innerHTML = '🗑';
        del.addEventListener('click', () => {
          const all = getRelations();
          const idx = all.indexOf(rule);
          if (idx === -1) return;
          all.splice(idx, 1);
          saveRelations(all);
          renderRulesList(searchInput.value);
          showToast('Deleted — tap to undo');
          let undone = false;
          const toastEl = document.getElementById('qem-toast');
          if (toastEl) toastEl.addEventListener('click', () => {
            if (undone) return; undone = true;
            const cur = getRelations(); cur.splice(idx, 0, rule);
            saveRelations(cur); renderRulesList(searchInput.value);
            showToast('Restored');
          }, { once: true });
        });

        row.appendChild(lEl); row.appendChild(oEl); row.appendChild(rEl);
        row.appendChild(editBtnEl); row.appendChild(dupBtnEl); row.appendChild(del);
        list.appendChild(row);
      });
    }

    let searchTimer = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => renderRulesList(searchInput.value), 150);
    });

    return {
      list,
      renderRulesList,
      getEditingRule: () => editingRule,
      setEditingRule: r => { editingRule = r; },
    };
  }