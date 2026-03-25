// POST VIEW HANDLER: `handlePostView()` — on post-view pages: skips auto-open on reload/back-forward navigations, calls `tryOpenEditPanel()` on fresh loads when Quick Edit is active, forces scroll-to-top twice (countering site JS), then polls for the tags textarea and calls `createTagsMirror()` once found. `tryOpenEditPanel()` tries three strategies in order: click `a[href="#edit"]`, show `#edit`/`#edit_form` directly, retry after 600 ms. `scrollToEdit()` smoothly scrolls to the edit form.
  /* ─────────────────────────────────────────────
     POST VIEW — auto-open edit panel
  ───────────────────────────────────────────── */
  function handlePostView() {
    if (!POST_VIEW_RE.test(location.search)) return;

    /* Skip opening the edit panel if this is a page reload (e.g. post-save refresh).
       TYPE_RELOAD = 1; TYPE_BACK_FORWARD = 2. Only open on fresh navigation (0). */
    const navType = (performance.navigation && performance.navigation.type) ||
                    (performance.getEntriesByType && performance.getEntriesByType('navigation')[0] && performance.getEntriesByType('navigation')[0].type);
    const isReload = navType === 1 || navType === 'reload';
    /* Only auto-open the edit panel when Quick Edit mode is active */
    if (isActive && !isReload) tryOpenEditPanel();

    /* Rule34 may scroll the page when initiating editing — force back to top.
       Two timeouts: one early, one after any delayed scroll from site JS. */
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 50);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 400);

    /* Wait for panel to be visible, then attach mirror — stop retrying once created */
    function attachMirror() {
      if (document.getElementById('qem-mirror')) return; // already created
      const ta = document.getElementById('tags');
      if (ta) { createTagsMirror(); return; }
      setTimeout(attachMirror, 400);
    }
    attachMirror();
  }

  function tryOpenEditPanel() {
    /* Strategy 1: click the visible "Edit" tab/link */
    const editLink = (
      document.querySelector('a[href="#edit"]') ||
      document.querySelector('a[onclick*="edit"]') ||
      [...document.querySelectorAll('a')].find(a =>
        /^\s*edit\s*$/i.test(a.textContent)
      )
    );

    if (editLink) {
      editLink.click();
      return;
    }

    /* Strategy 2: directly show the #edit div */
    const editDiv = document.getElementById('edit') || document.getElementById('edit_form');
    if (editDiv) {
      editDiv.style.display = 'block';
      editDiv.style.visibility = 'visible';
      return;
    }

    /* Strategy 3: the panel may be injected late — retry once */
    setTimeout(() => {
      const retryLink = document.querySelector('a[href="#edit"]');
      if (retryLink) { retryLink.click(); }
      else {
        const retryDiv = document.getElementById('edit') || document.getElementById('edit_form');
        if (retryDiv) { retryDiv.style.display = 'block'; }
      }
    }, 600);
  }

  function scrollToEdit() {
    setTimeout(() => {
      const target =
        document.getElementById('edit') ||
        document.getElementById('edit_form') ||
        document.querySelector('form[action*="edit"]');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  }