// RELATIONS PAGE: `buildRelationsPage(container)` — orchestrates the Relations tab. Composes `buildRelationsForm` and `buildRelationsList`, wires the add/save flow and autocomplete on the left/right inputs.

  function buildRelationsPage(container) {
    const form = buildRelationsForm(container);
    const { addArea, leftInput, rightInput, searchInput, addBtn, cancelBtn, getSelectedOp, setSelectedOp, loadRuleIntoEditor, categoryBtn, getActiveRuleInput, persistDraftNow } = form;

    const { renderRulesList, getEditingRule, setEditingRule } = buildRelationsList(container, form);

    cancelBtn.addEventListener('click', () => {
      setEditingRule(null);
      leftInput.value = ''; rightInput.value = '';
      addBtn.textContent = '+ Add';
      cancelBtn.style.display = 'none';
      setSelectedOp('=');
      persistDraftNow();
    });

    function acReplaceLastToken(input, tag) {
      const val = input.value;
      const lastSpace = val.lastIndexOf(' ');
      input.value = (lastSpace === -1 ? '' : val.slice(0, lastSpace + 1)) + tag + ' ';
      persistDraftNow();
    }
    attachAutocomplete(leftInput,  tag => acReplaceLastToken(leftInput,  tag));
    attachAutocomplete(rightInput, tag => acReplaceLastToken(rightInput, tag));

    addArea.addEventListener('focusin', e => {
      const el = e.target;
      if (!el || el.tagName !== 'TEXTAREA' || !el.classList.contains('qem-mgr-expanded-input')) return;
      if (el._qemAcAttached) return;
      el._qemAcAttached = true;
      attachAutocomplete(el, tag => acReplaceLastToken(el, tag));
    });

    categoryBtn.addEventListener('click', () => {
      const categories = Object.entries(getCategories()).sort((a, b) => a[1].name.localeCompare(b[1].name));
      if (!categories.length) { showToast('No categories available'); return; }
      const pick = prompt(
        'Insert category selector using category name or slug:',
        categories[0][1].name
      );
      if (!pick) return;
      const lowered = pick.trim().toLowerCase();
      const matched = categories.find(([slug, entry]) =>
        slug.toLowerCase() === lowered || entry.name.toLowerCase() === lowered
      );
      if (!matched) { showToast('Unknown category'); return; }
      const token = `category:${matched[0]}`;
      const input = getActiveRuleInput();
      const val = input.value.trim();
      input.value = val ? `${val} ${token} ` : `${token} `;
      input.focus();
      persistDraftNow();
    });

    addBtn.addEventListener('click', () => {
      const l = leftInput.value.trim();
      const r = rightInput.value.trim();
      if (!l || !r) { showToast('Both fields required'); return; }
      const rule = `${l} ${getSelectedOp()} ${r}`;
      if (rule.includes('category:*')) { showToast('Wildcard categories are not supported'); return; }
      const all = getRelations();
      const editingRule = getEditingRule();
      if (editingRule) {
        const idx = all.indexOf(editingRule);
        if (idx !== -1) all.splice(idx, 1, rule);
        else all.push(rule);
        setEditingRule(null);
        addBtn.textContent = '+ Add';
        cancelBtn.style.display = 'none';
      } else {
        if (all.includes(rule)) { showToast('Rule already exists'); return; }
        all.push(rule);
      }
      saveRelations(all);
      rightInput.value = '';
      persistDraftNow();
      renderRulesList(searchInput.value);
      showToast(editingRule ? 'Rule updated' : 'Rule added');
      rightInput.focus();
    });

    renderRulesList('');
  }