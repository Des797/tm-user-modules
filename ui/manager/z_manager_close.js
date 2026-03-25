// === SECTION: manager close | filename: z_manager_close ===
    /* Deferred init for lazy tabs if active on open */
    if (_navStack[0] === 'tags') { _builtPages.add('tags'); buildTagsPage(); }
    if (_navStack[0] === 'sugg') { _builtPages.add('sugg'); buildSuggestionsPage(); }

  } // end createRelationsManager