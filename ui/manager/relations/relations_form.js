// RELATIONS FORM: `buildRelationsForm(container)` — builds the add/edit area for the Relations tab. Creates dual tag inputs (left/right), operator buttons (= > < =/=), swap button, search input, and add/cancel buttons. Returns `{ addArea, leftInput, rightInput, searchInput, addBtn, cancelBtn, ops, getSelectedOp, setSelectedOp, loadRuleIntoEditor }`.

  function buildRelationsForm(container) {
    const addArea = document.createElement('div');
    addArea.className = 'qem-mgr-add-area';

    const row1 = document.createElement('div');
    row1.className = 'qem-mgr-row';

    const leftInput = document.createElement('input');
    leftInput.className = 'qem-mgr-input';
    leftInput.placeholder = 'Left (space=AND, |=OR)…';
    leftInput.autocomplete = 'off';

    const ops = document.createElement('div');
    ops.className = 'qem-mgr-ops';
    let selectedOp = '=';

    function setSelectedOp(op) {
      selectedOp = op;
      ops.querySelectorAll('.qem-mgr-op').forEach(x => x.classList.toggle('selected', x.textContent === op));
    }

    ['=', '>', '<', '=/='].forEach(op => {
      const b = document.createElement('button');
      b.className = 'qem-mgr-op' + (op === '=' ? ' selected' : '');
      b.textContent = op;
      b.addEventListener('click', () => setSelectedOp(op));
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

    row2.appendChild(searchInput); row2.appendChild(cancelBtn); row2.appendChild(addBtn);
    addArea.appendChild(row1); addArea.appendChild(row2);
    container.appendChild(addArea);

    function loadRuleIntoEditor(rule) {
      const m = rule.match(/^(.+?)\s*(=\/=|=|>|<)\s*(.+)$/);
      if (!m) return;
      const [, left, op, right] = m;
      leftInput.value = left.trim();
      rightInput.value = right.trim();
      setSelectedOp(op);
      addBtn.textContent = '✓ Save';
      cancelBtn.style.display = '';
      addArea.scrollIntoView({ block: 'nearest' });
      leftInput.focus();
    }

    return {
      addArea, leftInput, rightInput, searchInput, addBtn, cancelBtn, ops,
      getSelectedOp: () => selectedOp,
      setSelectedOp,
      loadRuleIntoEditor,
    };
  }