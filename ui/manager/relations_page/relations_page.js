// RELATIONS PAGE: `buildRelationsPage(container)` — orchestrates the Relations tab. Composes `buildRelationsForm` and `buildRelationsList`, wires the add/save flow and autocomplete on the left/right inputs.

  function buildRelationsPage(container) {
    const form = buildRelationsForm(container);
    const { addArea, leftInput, rightInput, searchInput, addBtn, cancelBtn, getSelectedOp, setSelectedOp, loadRuleIntoEditor } = form;

    const { renderRulesList, getEditingRule, setEditingRule } = buildRelationsList(container, form);

    cancelBtn.addEventListener('click', () => {
      setEditingRule(null);
      leftInput.value = ''; rightInput.value = '';
      addBtn.textContent = '+ Add';
      cancelBtn.style.display = 'none';
      setSelectedOp('=');
    });

    function acReplaceLastToken(input, tag) {
      const val = input.value;
      const lastSpace = val.lastIndexOf(' ');
      input.value = (lastSpace === -1 ? '' : val.slice(0, lastSpace + 1)) + tag + ' ';
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

    addBtn.addEventListener('click', () => {
      const l = leftInput.value.trim();
      const r = rightInput.value.trim();
      if (!l || !r) { showToast('Both fields required'); return; }
      const rule = `${l} ${getSelectedOp()} ${r}`;
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
      renderRulesList(searchInput.value);
      showToast(editingRule ? 'Rule updated' : 'Rule added');
      rightInput.focus();
    });

    renderRulesList('');
  }