// RELATIONS FORM: `buildRelationsForm(container)` — builds the add/edit area for the Relations tab. Creates dual tag inputs (left/right), operator buttons (= > < =/=), swap button, search input, and add/cancel buttons. Left/right inputs expand to a full-width multiline textarea on focus and collapse on blur. Returns `{ addArea, leftInput, rightInput, searchInput, addBtn, cancelBtn, ops, getSelectedOp, setSelectedOp, loadRuleIntoEditor, getExpandedTA }`.

  function buildRelationsForm(container) {
    const addArea = document.createElement('div');
    addArea.className = 'qem-mgr-add-area';

    const row1 = document.createElement('div');
    row1.className = 'qem-mgr-row';

    const leftInput = document.createElement('input');
    leftInput.className = 'qem-mgr-input';
    leftInput.placeholder = 'Left (space=AND, |=OR)…';
    leftInput.autocomplete = 'off';
    leftInput.spellcheck = false;

    const ops = document.createElement('div');
    ops.className = 'qem-mgr-ops';
    let selectedOp = '=';
    let activeSide = 'left';
    const persistedDraft = loadSingleDraft(RELATIONS_FORM_DRAFT_KEY) || {};
    let persistTimer = null;

    leftInput.value = String(persistedDraft.leftValue || '');

    function setSelectedOp(op) {
      selectedOp = op;
      ops.querySelectorAll('.qem-mgr-op').forEach(x => x.classList.toggle('selected', x.textContent === op));
      schedulePersist();
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
      schedulePersist();
    });

    const rightInput = document.createElement('input');
    rightInput.className = 'qem-mgr-input';
    rightInput.placeholder = 'Right (space=AND, |=OR)…';
    rightInput.autocomplete = 'off';
    rightInput.spellcheck = false;
    rightInput.value = String(persistedDraft.rightValue || '');
    if (['=', '>', '<', '=/='].includes(persistedDraft.selectedOp)) selectedOp = persistedDraft.selectedOp;

    row1.appendChild(leftInput); row1.appendChild(ops); row1.appendChild(swapBtn); row1.appendChild(rightInput);

    /* ── Expand input → full-width textarea on focus ── */
    let _expandTA = null;

    function collectDraftState() {
      return {
        leftValue: leftInput.value,
        rightValue: rightInput.value,
        selectedOp,
        activeSide,
        expandedValue: _expandTA ? _expandTA.value : '',
      };
    }

    function schedulePersist() {
      clearTimeout(persistTimer);
      persistTimer = setTimeout(() => {
        const payload = collectDraftState();
        if (!payload.leftValue.trim() && !payload.rightValue.trim() && !payload.expandedValue.trim()) {
          clearSingleDraft(RELATIONS_FORM_DRAFT_KEY);
          return;
        }
        saveSingleDraft(RELATIONS_FORM_DRAFT_KEY, payload);
      }, 160);
    }

    function persistNow() {
      clearTimeout(persistTimer);
      const payload = collectDraftState();
      if (!payload.leftValue.trim() && !payload.rightValue.trim() && !payload.expandedValue.trim()) {
        clearSingleDraft(RELATIONS_FORM_DRAFT_KEY);
        return;
      }
      saveSingleDraft(RELATIONS_FORM_DRAFT_KEY, payload);
    }

    function expandInput(input) {
      if (_expandTA) return;
      const ta = document.createElement('textarea');
      ta.className = 'qem-mgr-input qem-mgr-expanded-input';
      ta.value = input.value;
      ta.placeholder = input.placeholder;
      ta.autocomplete = 'off';
      ta.spellcheck = false;
      ta.rows = 1;
      ta.wrap = 'soft';
      ta.style.overflowY = 'hidden';
      ta.style.whiteSpace = 'pre-wrap';
      ta.style.wordBreak = 'break-word';
      _expandTA = ta;
      const isRight = input === rightInput;
      activeSide = isRight ? 'right' : 'left';
      if (isRight) {
        rightInput.style.display = 'none';
        addArea.insertBefore(ta, row2);
      } else {
        row1.style.display = 'none';
        addArea.insertBefore(ta, row1);
      }
      ta.focus();
      const len = ta.value.length;
      ta.setSelectionRange(len, len);

      function autoSize() {
        const cs = getComputedStyle(ta);
        const lh = parseFloat(cs.lineHeight) || 16;
        const pt = parseFloat(cs.paddingTop) || 0;
        const pb = parseFloat(cs.paddingBottom) || 0;
        const contentH = Math.max(0, ta.scrollHeight - pt - pb);
        const rows = Math.max(1, Math.ceil(contentH / lh));

        ta.style.height = '';
        ta.rows = rows;
      }
      autoSize();
      ta.addEventListener('input', autoSize);
      ta.addEventListener('input', schedulePersist);
      window.addEventListener('resize', autoSize);

      function collapse() {
        input.value = ta.value.trim();
        window.removeEventListener('resize', autoSize);
        ta.remove();
        if (isRight) rightInput.style.display = '';
        else row1.style.display = '';
        _expandTA = null;
        schedulePersist();
      }
      ta.addEventListener('blur', collapse);
      ta.addEventListener('keydown', e => { if (e.key === 'Escape') ta.blur(); });
    }

    leftInput.addEventListener('focus',  () => { activeSide = 'left'; expandInput(leftInput); schedulePersist(); });
    rightInput.addEventListener('focus', () => { activeSide = 'right'; expandInput(rightInput); schedulePersist(); });
    leftInput.addEventListener('input', schedulePersist);
    rightInput.addEventListener('input', schedulePersist);

    const row2 = document.createElement('div');
    row2.className = 'qem-mgr-row';

    const searchInput = document.createElement('input');
    searchInput.className = 'qem-mgr-input';
    searchInput.placeholder = 'Search rules (either side)…';
    searchInput.autocomplete = 'off';

    const addBtn = document.createElement('button');
    addBtn.className = 'qem-mgr-add-btn';
    addBtn.textContent = '+ Add';

    const categoryBtn = document.createElement('button');
    categoryBtn.className = 'qem-mgr-op';
    categoryBtn.textContent = 'Category';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'qem-mgr-op';
    cancelBtn.textContent = '✕';
    cancelBtn.style.display = 'none';

    row2.appendChild(searchInput); row2.appendChild(categoryBtn); row2.appendChild(cancelBtn); row2.appendChild(addBtn);
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
      schedulePersist();
    }

    if (selectedOp !== '=') setSelectedOp(selectedOp);
    if (persistedDraft.activeSide === 'right' && persistedDraft.expandedValue) {
      rightInput.value = String(persistedDraft.expandedValue || rightInput.value || '');
      expandInput(rightInput);
    } else if (persistedDraft.activeSide === 'left' && persistedDraft.expandedValue) {
      leftInput.value = String(persistedDraft.expandedValue || leftInput.value || '');
      expandInput(leftInput);
    }

    return {
      addArea, leftInput, rightInput, searchInput, addBtn, cancelBtn, ops,
      getSelectedOp: () => selectedOp,
      setSelectedOp,
      loadRuleIntoEditor,
      getExpandedTA: () => _expandTA,
      categoryBtn,
      getActiveRuleInput: () => _expandTA || (document.activeElement === rightInput ? rightInput : leftInput),
      persistDraftNow: persistNow,
      clearDraft: () => clearSingleDraft(RELATIONS_FORM_DRAFT_KEY),
    };
  }