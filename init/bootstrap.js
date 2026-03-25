// BOOTSTRAP: `init()` — entry point. Calls `createButton()`, then dispatches to `handlePostView()` or `handlePostList()` based on the current URL. Runs immediately if the DOM is ready, otherwise defers to DOMContentLoaded. Closes the outer IIFE.
  /* ─────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────── */
  function init() {
    createButton();

    if (POST_VIEW_RE.test(location.search)) {
      handlePostView();
    } else if (POST_LIST_RE.test(location.search)) {
      handlePostList();
    }
  }

  /* Run after DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();