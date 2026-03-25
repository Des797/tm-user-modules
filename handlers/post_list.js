// === SECTION: post list handler | filename: post_list ===
  /* ─────────────────────────────────────────────
     POST LIST — intercept thumbnail clicks
  ───────────────────────────────────────────── */
  function handlePostList() {
    if (!POST_LIST_RE.test(location.search)) return;

    document.addEventListener('click', onThumbnailClick, true);
  }

  function onThumbnailClick(e) {
    if (!isActive) return;

    /* Walk up from the clicked element to find a post link */
    let el = e.target;
    let postLink = null;

    while (el && el !== document.body) {
      if (el.tagName === 'A' && el.href && /[?&]id=\d+/.test(el.href) && /page=post/.test(el.href)) {
        postLink = el;
        break;
      }
      el = el.parentElement;
    }

    if (!postLink) return;

    /* Only intercept post view links, not other site links */
    if (!/s=view/.test(postLink.href) && !/[?&]id=\d+/.test(postLink.href)) return;

    /* Let the navigation happen naturally — the view page handler will open edit.
       No interception needed; quick edit is handled on the destination page. */
    /* Optionally you could rewrite href to include a hash: */
    // e.preventDefault();
    // location.href = postLink.href + (postLink.href.includes('#') ? '' : '#edit');
  }