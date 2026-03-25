// === SECTION: manager open | filename: a_manager_open ===
  /* ─────────────────────────────────────────────
     RELATIONS MANAGER
  ───────────────────────────────────────────── */
  function createRelationsManager() {
    if (document.getElementById('qem-manager')) return;

    /* ── Styles ── */
    if (!document.getElementById('qem-mgr-styles')) {
      const s = document.createElement('style');
      s.id = 'qem-mgr-styles';
      s.textContent = `
        #qem-manager {
          position: fixed; inset: 0; z-index: 1000001;
          background: #0a0f0c; display: flex; flex-direction: column;
          font-family: system-ui, sans-serif; box-sizing: border-box;
        }
        #qem-mgr-header {
          display: flex; align-items: center; padding: 14px 16px;
          border-bottom: 2px solid #2d9e5f; flex-shrink: 0; gap: 12px;
        }
        #qem-mgr-header h2 {
          margin: 0; font-size: 18px; color: #e8f5ee; flex: 1;
          font-weight: 700; letter-spacing: 0.04em;
        }
        #qem-mgr-close {
          background: #1a3327; border: 2px solid #2d9e5f; color: #2d9e5f;
          font-size: 20px; font-weight: 700; cursor: pointer;
          padding: 4px 12px; line-height: 1; border-radius: 8px;
          transition: background 0.15s, color 0.15s;
        }
        #qem-mgr-close:active { background: #2d9e5f; color: #fff; }
        #qem-mgr-tabs {
          display: flex; flex-shrink: 0;
          border-bottom: 1px solid #1a2e22;
        }
        .qem-mgr-tab {
          flex: 1; padding: 12px; font-size: 15px; font-weight: 600;
          text-align: center; cursor: pointer; color: #4a6e58;
          border-bottom: 2px solid transparent; transition: color 0.15s;
          letter-spacing: 0.03em;
        }
        .qem-mgr-tab.active { color: #2d9e5f; border-bottom-color: #2d9e5f; }
        .qem-mgr-page { display: none; flex: 1; flex-direction: column; overflow: hidden; }
        .qem-mgr-page.active { display: flex; }
        .qem-mgr-add-area {
          padding: 12px 14px; border-bottom: 1px solid #1a2e22;
          display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;
        }
        .qem-mgr-row { display: flex; gap: 8px; align-items: center; }
        .qem-mgr-input {
          flex: 1; background: #0e1a13; border: 1px solid #2a3e30;
          border-radius: 8px; color: #d0ead8; font-size: 15px;
          font-family: monospace; padding: 9px 12px; outline: none;
          min-width: 0;
        }
        .qem-mgr-input:focus { border-color: #2d9e5f; }
        .qem-mgr-ops {
          display: flex; gap: 4px; flex-shrink: 0;
        }
        .qem-mgr-op {
          background: #0e1a13; border: 1px solid #2a3e30; border-radius: 8px;
          color: #4a7a58; font-size: 13px; font-weight: 700; padding: 8px 11px;
          cursor: pointer; transition: all 0.1s; white-space: nowrap;
        }
        .qem-mgr-op.selected { background: #2d9e5f; border-color: #2d9e5f; color: #fff; }
        .qem-mgr-add-btn {
          background: #2d9e5f; border: none; border-radius: 8px; color: #fff;
          font-size: 15px; font-weight: 700; padding: 9px 18px;
          cursor: pointer; flex-shrink: 0; transition: background 0.15s;
        }
        .qem-mgr-add-btn:active { background: #1a7a45; }
        .qem-mgr-search {
          padding: 10px 14px; border-bottom: 1px solid #1a2e22; flex-shrink: 0;
        }
        .qem-mgr-list {
          flex: 1; overflow-y: auto; padding: 4px 0;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }
        .qem-mgr-rule {
          display: flex; align-items: center; padding: 11px 16px;
          border-bottom: 1px solid #0e1a13; gap: 8px; font-size: 15px;
        }
        .qem-mgr-rule:hover { background: #0d1710; }
        .qem-mgr-rule-left  { color: #8ab89a; font-family: monospace; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: rtl; text-align: right; }
        .qem-mgr-rule-op    { color: #2d9e5f; font-weight: 700; font-size: 14px; flex-shrink: 0; padding: 0 6px; }
        .qem-mgr-rule-right { color: #8ab89a; font-family: monospace; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .qem-mgr-del {
          background: none; border: none; color: #2a4035; font-size: 18px;
          cursor: pointer; padding: 0 4px; flex-shrink: 0; line-height: 1;
          transition: color 0.15s;
        }
        .qem-mgr-del:active { color: #e84040; }
        .qem-mgr-empty {
          padding: 40px 32px; text-align: center; color: #2a4035; font-size: 15px;
        }
        .qem-mgr-tag-chip-preview {
          font-size: 12px; color: #3a6048; font-family: monospace;
        }
        /* ── Suggestions tab ── */
        #qem-sugg-list { flex: 1; overflow-y: auto; padding: 8px 0; overscroll-behavior: contain; }
        .qem-sugg-card {
          margin: 8px 14px; background: #0e1a13; border: 1px solid #1e3528;
          border-radius: 10px; padding: 14px 16px;
        }
        .qem-sugg-desc {
          font-size: 15px; color: #c0ddc8; margin-bottom: 10px; line-height: 1.5;
        }
        .qem-sugg-desc code {
          background: #1a3327; color: #4ece88; border-radius: 4px;
          padding: 1px 6px; font-family: monospace; font-size: 14px;
        }
        .qem-sugg-chain {
          font-size: 13px; color: #3a7a52; margin-bottom: 12px; font-family: monospace;
        }
        .qem-sugg-btns { display: flex; gap: 8px; }
        .qem-sugg-accept {
          background: #2d9e5f; border: none; border-radius: 8px; color: #fff;
          font-size: 14px; font-weight: 700; padding: 8px 16px; cursor: pointer;
          transition: background 0.15s;
        }
        .qem-sugg-accept:active { background: #1a7a45; }
        .qem-sugg-dismiss {
          background: #0e1a13; border: 1px solid #2a3e30; border-radius: 8px;
          color: #4a6e58; font-size: 14px; padding: 8px 14px; cursor: pointer;
        }
        .qem-sugg-refresh {
          margin: 10px 14px; background: #0e1a13; border: 1px solid #2a3e30;
          border-radius: 8px; color: #4a7a58; font-size: 14px; padding: 9px;
          cursor: pointer; width: calc(100% - 28px);
        }
        /* ── Tags tab ── */
        #qem-tags-stats { display: flex; gap: 8px; padding: 10px 14px; flex-shrink: 0; border-bottom: 1px solid #1a2e22; }
        .qem-tags-stat { flex: 1; background: #0e1a13; border-radius: 8px; padding: 8px; text-align: center; }
        .qem-tags-stat-val { font-size: 18px; font-weight: 700; color: #2d9e5f; }
        .qem-tags-stat-lbl { font-size: 11px; color: #3a6048; margin-top: 2px; }
        #qem-tags-search-row { display: flex; gap: 8px; padding: 10px 14px; flex-shrink: 0; border-bottom: 1px solid #1a2e22; }
        #qem-tags-list { flex: 1; overflow-y: auto; overscroll-behavior: contain; }
        .qem-tag-row { display: flex; align-items: center; padding: 10px 16px; gap: 10px; cursor: pointer; border-bottom: 0.5px solid #0e1a13; }
        .qem-tag-row:active { background: #0d1710; }
        .qem-tag-rel-badge { min-width: 26px; height: 26px; padding: 0 6px; border-radius: 13px; background: rgba(45,158,95,0.2); color: #2d9e5f; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .qem-tag-name { flex: 1; font-size: 15px; font-weight: 500; color: #d0ead8; word-break: break-all; }
        .qem-tag-meta { font-size: 11px; color: #3a6048; text-align: right; line-height: 1.5; flex-shrink: 0; }
        .qem-chip-canon { font-size: 10px; background: rgba(255,180,0,0.15); color: #f5c842; border-radius: 4px; padding: 1px 5px; margin-left: 4px; }
        .qem-chip-alias { font-size: 10px; background: rgba(255,255,255,0.05); color: #4a6e58; border-radius: 4px; padding: 1px 5px; margin-left: 4px; }
        /* detail view */
        #qem-tags-detail { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 12px 16px 24px; display: none; }
        #qem-tags-detail.visible { display: block; }
        .qem-detail-back { background: rgba(45,158,95,0.15); border: 1px solid #2a3e30; color: #2d9e5f; border-radius: 8px; padding: 7px 14px; font-size: 14px; cursor: pointer; margin-bottom: 14px; }
        .qem-detail-title { font-size: 20px; font-weight: 700; color: #e8f5ee; margin-bottom: 4px; word-break: break-all; }
        .qem-detail-count { font-size: 12px; color: #3a6048; margin-bottom: 14px; }
        .qem-detail-section-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #3a6048; margin: 12px 0 6px; }
        .qem-detail-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .qem-detail-chip { border-radius: 20px; padding: 5px 12px; font-size: 13px; cursor: pointer; border: 1px solid; transition: opacity 0.1s; }
        .qem-detail-chip:active { opacity: 0.7; }
        .qem-detail-chip.parent    { border-color: rgba(100,180,255,0.35); color: #7ec8ff; background: rgba(100,180,255,0.06); }
        .qem-detail-chip.child     { border-color: rgba(45,158,95,0.35);   color: #4ece88; background: rgba(45,158,95,0.06); }
        .qem-detail-chip.synonym   { border-color: rgba(255,180,0,0.35);   color: #f5c842; background: rgba(255,180,0,0.06); }
        .qem-detail-chip.antonym   { border-color: rgba(232,64,64,0.35);   color: #ff8080; background: rgba(232,64,64,0.06); }
        .qem-detail-chip.transitive { opacity: 0.6; font-style: italic; }
        .qem-compound-block { background: rgba(45,158,95,0.07); border-radius: 8px; padding: 8px 10px; font-size: 13px; margin-bottom: 4px; color: #c0ddc8; }
        .qem-compound-block code { background: rgba(45,158,95,0.15); color: #4ece88; border-radius: 3px; padding: 1px 5px; font-family: monospace; }
      `;
      document.head.appendChild(s);
    }

    /* ── DOM Shell ── */
    const mgr = document.createElement('div');
    mgr.id = 'qem-manager';

    const _navStack = [GM_getValue('qem_last_tab', 'rel')];

    const header = document.createElement('div');
    header.id = 'qem-mgr-header';
    const h2 = document.createElement('h2');
    h2.textContent = '🔗 Tag Relations';
    const closeBtn = document.createElement('button');
    closeBtn.id = 'qem-mgr-close';
    closeBtn.textContent = '✕ Close';
    closeBtn.addEventListener('click', () => { mgr.remove(); _unlockScroll(); });
    header.appendChild(h2); header.appendChild(closeBtn);

    const tabs = document.createElement('div');
    tabs.id = 'qem-mgr-tabs';
    const tabTags = document.createElement('div');
    tabTags.className = 'qem-mgr-tab';
    tabTags.textContent = 'Tags';
    tabTags.dataset.tab = 'tags';
    const tabRel = document.createElement('div');
    tabRel.className = 'qem-mgr-tab';
    tabRel.textContent = 'Relations';
    tabRel.dataset.tab = 'rel';
    const tabSugg = document.createElement('div');
    tabSugg.className = 'qem-mgr-tab';
    tabSugg.textContent = 'Suggestions';
    tabSugg.dataset.tab = 'sugg';
    const tabBl = document.createElement('div');
    tabBl.className = 'qem-mgr-tab';
    tabBl.textContent = 'Blacklisted';
    tabBl.dataset.tab = 'bl';
    const tabData = document.createElement('div');
    tabData.className = 'qem-mgr-tab';
    tabData.textContent = 'Data';
    tabData.dataset.tab = 'data';
    tabs.appendChild(tabTags); tabs.appendChild(tabRel); tabs.appendChild(tabSugg); tabs.appendChild(tabBl); tabs.appendChild(tabData);

    const pageTags = document.createElement('div');
    pageTags.className = 'qem-mgr-page';
    pageTags.dataset.page = 'tags';
    const pageRel  = document.createElement('div');
    pageRel.className  = 'qem-mgr-page';
    pageRel.dataset.page = 'rel';
    const pageSugg = document.createElement('div');
    pageSugg.className = 'qem-mgr-page';
    pageSugg.dataset.page = 'sugg';
    const pageBl   = document.createElement('div');
    pageBl.className   = 'qem-mgr-page';
    pageBl.dataset.page = 'bl';
    const pageData = document.createElement('div');
    pageData.className = 'qem-mgr-page';
    pageData.dataset.page = 'data';

    const _builtPages = new Set();

    function switchTab(name, push = true) {
      if (push) _navStack.push(name);
      GM_setValue('qem_last_tab', name);
      [tabTags, tabRel, tabSugg, tabBl, tabData].forEach(t => t.classList.toggle('active', t.dataset.tab === name));
      [pageTags, pageRel, pageSugg, pageBl, pageData].forEach(p => p.classList.toggle('active', p.dataset.page === name));
    }

    tabTags.addEventListener('click', () => { switchTab('tags'); if (!_builtPages.has('tags')) { _builtPages.add('tags'); buildTagsPage(); } });
    tabRel.addEventListener('click',  () => switchTab('rel'));
    tabSugg.addEventListener('click', () => { switchTab('sugg'); if (!_builtPages.has('sugg')) { _builtPages.add('sugg'); buildSuggestionsPage(); } });
    tabBl.addEventListener('click',   () => switchTab('bl'));
    tabData.addEventListener('click', () => switchTab('data'));

    mgr.appendChild(header);
    mgr.appendChild(tabs);
    mgr.appendChild(pageTags);
    mgr.appendChild(pageRel);
    mgr.appendChild(pageSugg);
    mgr.appendChild(pageBl);
    mgr.appendChild(pageData);
    document.body.appendChild(mgr);
    _lockScroll();

    switchTab(_navStack[0], false);