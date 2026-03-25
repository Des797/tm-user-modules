// MANAGER CLOSE: Closes `createRelationsManager()`. Contains the deferred lazy-tab initialisation (immediately builds Tags or Suggestions page if either was the last active tab on open), then the closing `}` of the function. Paired with a_manager_open.js as the bookend of the split function body.
    /* Deferred init for lazy tabs if active on open */
    if (_navStack[0] === 'tags') { _builtPages.add('tags'); buildTagsPage(); }
    if (_navStack[0] === 'sugg') { _builtPages.add('sugg'); buildSuggestionsPage(); }

  } // end createRelationsManager