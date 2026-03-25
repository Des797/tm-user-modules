// MIRROR RULE BAR: `buildRuleBar()` — constructs the `#qem-rule-bar` element containing a text input and "+ Rule" button. Parses the input on submit (Enter or button click), validates the rule format, deduplicates against existing relations, and saves via `saveRelations`. Returns `{ ruleBar, ruleInput }` so the caller can attach autocomplete to `ruleInput`.

  function buildRuleBar() {
    const ruleBar = document.createElement('div');
    ruleBar.id = 'qem-rule-bar';

    const ruleInput = document.createElement('input');
    ruleInput.id = 'qem-rule-input';
    ruleInput.placeholder = 'e.g. princess_peach > nintendo';
    ruleInput.autocomplete = 'off';
    ruleInput.spellcheck = false;

    const ruleAddBtn = document.createElement('button');
    ruleAddBtn.id = 'qem-rule-add';
    ruleAddBtn.textContent = '+ Rule';

    function commitRule() {
      const raw = ruleInput.value.trim();
      if (!raw) return;
      const m = raw.match(/^(.+?)\s*(=\/=|=|>|<)\s*(.+)$/);
      if (!m) { showToast('⚠️ Use: left = > < =/= right'); return; }
      const rule = `${m[1].trim()} ${m[2]} ${m[3].trim()}`;
      const all = getRelations();
      if (all.includes(rule)) { showToast('Rule already exists'); return; }
      all.push(rule);
      saveRelations(all);
      ruleInput.value = '';
      showToast('🔗 Rule added');
    }

    ruleAddBtn.addEventListener('click', commitRule);
    ruleInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commitRule(); } });

    ruleBar.appendChild(ruleInput);
    ruleBar.appendChild(ruleAddBtn);

    return { ruleBar, ruleInput };
  }