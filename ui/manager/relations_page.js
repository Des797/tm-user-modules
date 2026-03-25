// === SECTION: relations page | filename: relations_page ===
    /* ══════════════════════════════════════════
       RELATIONS PAGE
    ══════════════════════════════════════════ */
    function buildRelationsPage() {
      /* Add area */
      const addArea = document.createElement('div');
      addArea.className = 'qem-mgr-add-area';

      let editingRule = null; // null = add mode, string = edit mode

      const row1 = document.createElement('div');
      row1.className = 'qem-mgr-row';
      const leftInput = document.createElement('input');
      leftInput.className = 'qem-mgr-input';
      leftInput.placeholder = 'Left (space=AND, |=OR)…';
      leftInput.autocomplete = 'off';

      const ops = document.createElement('div');
      ops.className = 'qem-mgr-ops';
      let selectedOp = '=';
      ['=', '>', '<', '=/='].forEach(op => {
        const b = document.createElement('button');
        b.className = 'qem-mgr-op' + (op === '=' ? ' selected' : '');
        b.textContent = op;
        b.addEventListener('click', () => {
          selectedOp = op;
          ops.querySelectorAll('.qem-mgr-op').forEach(x => x.classList.remove('selected'));
          b.classList.add('selected');
        });
        ops.appendChild(b);
      });

      const swapBtn = document.createElement('button');
      swapBtn.className = 'qem-mgr-op';
      swapBtn.textContent = '⇄';
      swapBtn.title = 'Swap sides';
      swapBtn.addEventListener('click', () => {
        const tmp = leftInput.value;
        leftInput.value = rightInput.value;
        rightInput.value = tmp;
      });

      const rightInput = document.createElement('input');
      rightInput.className = 'qem-mgr-input';
      rightInput.placeholder = 'Right (space=AND, |=OR)…';
      rightInput.autocomplete = 'off';

      row1.appendChild(leftInput); row1.appendChild(ops); row1.appendChild(swapBtn); row1.appendChild(rightInput);

      const row2 = document.createElement('div');
      row2.className = 'qem-mgr-row';

      const searchInput = document.createElement('input');
      searchInput.className = 'qem-mgr-input';
      searchInput.placeholder = 'Search rules (either side)…';
      searchInput.autocomplete = 'off';

      const addBtn = document.createElement('button');
      addBtn.className = 'qem-mgr-add-btn';
      addBtn.textContent = '+ Add';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'qem-mgr-op';
      cancelBtn.textContent = '✕';
      cancelBtn.style.display = 'none';
      cancelBtn.addEventListener('click', () => {
        editingRule = null;
        leftInput.value = ''; rightInput.value = '';
        addBtn.textContent = '+ Add';
        cancelBtn.style.display = 'none';
        ops.querySelectorAll('.qem-mgr-op').forEach(b => b.classList.toggle('selected', b.textContent === '='));
        selectedOp = '=';
      });

      row2.appendChild(searchInput); row2.appendChild(cancelBtn); row2.appendChild(addBtn);

      addArea.appendChild(row1); addArea.appendChild(row2);

      /* Rules list */
      const list = document.createElement('div');
      list.className = 'qem-mgr-list';

      function loadRuleIntoEditor(rule) {
        const m = rule.match(/^(.+?)\s*(=\/=|=|>|<)\s*(.+)$/);
        if (!m) return;
        const [, left, op, right] = m;
        leftInput.value = left.trim();
        rightInput.value = right.trim();
        selectedOp = op;
        ops.querySelectorAll('.qem-mgr-op').forEach(b => b.classList.toggle('selected', b.textContent === op));
        addBtn.textContent = '✓ Save';
        cancelBtn.style.display = '';
        addArea.scrollIntoView({ block: 'nearest' });
        leftInput.focus();
      }

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
        /* Sort: =/= at bottom, rest alpha */
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

          const editBtnEl = document.createElement('button'); editBtnEl.className = 'qem-mgr-del'; editBtnEl.textContent = '✏️';
          editBtnEl.title = 'Edit';
          editBtnEl.addEventListener('click', () => {
            editingRule = rule;
            loadRuleIntoEditor(rule);
          });

          const dupBtnEl = document.createElement('button'); dupBtnEl.className = 'qem-mgr-del'; dupBtnEl.textContent = '⧉';
          dupBtnEl.title = 'Duplicate';
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

      /* Search filter — debounced */
      let searchTimer = null;
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => renderRulesList(searchInput.value), 150);
      });

      /* Autocomplete on left/right fields — replaces only the last token */
      function acReplaceLastToken(input, tag) {
        const val = input.value;
        const lastSpace = val.lastIndexOf(' ');
        input.value = (lastSpace === -1 ? '' : val.slice(0, lastSpace + 1)) + tag + ' ';
      }
      attachAutocomplete(leftInput,  tag => acReplaceLastToken(leftInput,  tag));
      attachAutocomplete(rightInput, tag => acReplaceLastToken(rightInput, tag));

      /* Add / Save rule */
      addBtn.addEventListener('click', () => {
        const l = leftInput.value.trim();
        const r = rightInput.value.trim();
        if (!l || !r) { showToast('Both fields required'); return; }
        const rule = `${l} ${selectedOp} ${r}`;
        const all = getRelations();
        if (editingRule) {
          const idx = all.indexOf(editingRule);
          if (idx !== -1) all.splice(idx, 1, rule);
          else all.push(rule);
          editingRule = null;
          addBtn.textContent = '+ Add';
          cancelBtn.style.display = 'none';
        } else {
          if (all.includes(rule)) { showToast('Rule already exists'); return; }
          all.push(rule);
        }
        saveRelations(all);
        rightInput.value = '';
        searchInput.value = '';
        renderRulesList('');
        showToast(editingRule ? 'Rule updated' : 'Rule added');
        rightInput.focus();
      });

      renderRulesList('');
      pageRel.appendChild(addArea);
      pageRel.appendChild(list);
    }