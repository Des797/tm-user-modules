// MANAGER TABS: `initManagerTabs(tabs, pages, pages_content)` — wires tab click handlers and returns `switchTab(name, push?)`. Maintains a nav stack (persisted to GM) so the last active tab is restored on next open. Tags and Suggestions pages are lazy-built on first click; the builder callbacks are supplied via `lazyBuilders`. Eager pages (Relations, Blacklisted, Data) are pre-built by the caller before this is invoked.
//
// `switchTab(name, push?)` — activates the named tab/page, persists the choice, and optionally pushes to the nav stack.
// Returns `{ switchTab, navStack }`.

  function initManagerTabs(tabs, pages, lazyBuilders) {
    const navStack = [GM_getValue('qem_last_tab', 'rel')];
    const builtPages = new Set();

    function switchTab(name, push = true) {
      if (push) navStack.push(name);
      GM_setValue('qem_last_tab', name);
      Object.values(tabs).forEach(t => t.classList.toggle('active', t.dataset.tab === name));
      Object.values(pages).forEach(p => p.classList.toggle('active', p.dataset.page === name));
    }

    Object.keys(tabs).forEach(key => {
      tabs[key].addEventListener('click', () => {
        switchTab(key);
        if (lazyBuilders[key] && !builtPages.has(key)) {
          builtPages.add(key);
          lazyBuilders[key]();
        }
      });
    });

    return { switchTab, navStack, builtPages };
  }