// EAGER CALLS: Immediately invokes `buildRelationsPage()`, `buildBlacklistPage()`, and `buildDataPage()` inside `createRelationsManager`. These three tabs are always built on manager open; Tags and Suggestions are lazy (built on first click). Positioned here to match source order — all three build functions are hoisted and available regardless of definition order.
  buildRelationsPage(pageRel);
  buildBlacklistPage(pageBl);
  buildDataPage(pageData);
    /* Suggestions and Tags are lazy — built on first tab click, or immediately if active */