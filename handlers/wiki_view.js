// WIKI VIEW HANDLER: `handleWikiView()` mounts wiki controls on wiki view pages.
  function handleWikiView() {
    if (!WIKI_VIEW_RE.test(location.search)) return;
    if (document.getElementById('qem-wiki-panel')) return;
    const wikiTag = getCurrentWikiTagName();
    if (!wikiTag) return;
    createWikiPanel(wikiTag);
  }
