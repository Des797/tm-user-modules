// RELATIONS MANAGER: `createRelationsManager()` — entry point for the full-screen tag manager modal. Guards against duplicate instances, injects styles, builds the DOM shell, wires tabs (Tags and Suggestions are lazy-built on first click; Relations/Blacklisted/Data are eager), locks page scroll, and activates the last-used tab. Replaces the former a_manager_open.js / z_manager_close.js split — no longer needs to span two files since page-builder functions are now module-level globals.

  function createRelationsManager() {
    if (document.getElementById('qem-manager')) return;

    injectManagerStyles();

    const { mgr, tabs, pages } = buildManagerDOM(_unlockScroll);

    const lazyBuilders = {
      tags: () => buildTagsPage(pages.tags),
      sugg: () => buildSuggestionsPage(pages.sugg),
    };

    const { switchTab, navStack, builtPages } = initManagerTabs(tabs, pages, lazyBuilders);

    buildRelationsPage(pages.rel);
    buildBlacklistPage(pages.bl);
    buildDataPage(pages.data);

    document.body.appendChild(mgr);
    _lockScroll();

    const initialTab = navStack[0];
    if (lazyBuilders[initialTab] && !builtPages.has(initialTab)) {
      builtPages.add(initialTab);
      lazyBuilders[initialTab]();
    }
    switchTab(initialTab, false);
  }