// === SECTION: bootstrap | filename: bootstrap ===
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