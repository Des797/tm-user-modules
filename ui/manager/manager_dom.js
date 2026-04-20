// MANAGER DOM: `buildManagerDOM(onClose)` — constructs and returns the manager shell DOM: the root `#qem-manager` div, header with title and close button, tab bar (Tags/Relations/Suggestions/Blacklisted/Data), and five empty `.qem-mgr-page` divs. Returns `{ mgr, tabs, pages }` where `tabs` and `pages` are plain objects keyed by tab name. `onClose` is called when the close button is clicked (after removing the element).

  function buildManagerDOM(onClose) {
    const mgr = document.createElement('div');
    mgr.id = 'qem-manager';

    /* ── Header ── */
    const header = document.createElement('div');
    header.id = 'qem-mgr-header';
    const h2 = document.createElement('h2');
    h2.textContent = '🔗 Tag Relations';
    const closeBtn = document.createElement('button');
    closeBtn.id = 'qem-mgr-close';
    closeBtn.textContent = '✕ Close';
    closeBtn.addEventListener('click', () => { mgr.remove(); onClose(); });
    header.appendChild(h2);
    header.appendChild(closeBtn);

    /* ── Tab bar ── */
    const tabBar = document.createElement('div');
    tabBar.id = 'qem-mgr-tabs';

    const TAB_DEFS = [
      ['tags', 'Tags'],
      ['cat',  'Categories'],
      ['rel',  'Relations'],
      ['sugg', 'Suggestions'],
      ['bl',   'Blacklisted'],
      ['data', 'Data'],
    ];

    const tabs = {};
    const pages = {};

    TAB_DEFS.forEach(([key, label]) => {
      const tab = document.createElement('div');
      tab.className = 'qem-mgr-tab';
      tab.textContent = label;
      tab.dataset.tab = key;
      tabs[key] = tab;
      tabBar.appendChild(tab);

      const page = document.createElement('div');
      page.className = 'qem-mgr-page';
      page.dataset.page = key;
      pages[key] = page;
    });

    mgr.appendChild(header);
    mgr.appendChild(tabBar);
    TAB_DEFS.forEach(([key]) => mgr.appendChild(pages[key]));

    return { mgr, tabs, pages };
  }