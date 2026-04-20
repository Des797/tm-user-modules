// RULE PARSER: Parses relation rule strings into structured data. `parseRuleTokens(str)` splits a side into OR-groups of AND-sets. `parseRule(str)` handles both standard (`A OP B`) and parenthesised prefix form (`prefix ( A OP B )`), returns `{leftGroups, op, rightGroups}` or null. `opDisplay(op)` maps `>/<` to arrows. `wildcardToRegex(tok)` converts a glob token to a RegExp. `tokenHasWildcard(tok)` tests for `*`.
  /*
   * parseRuleTokens(str) — splits a tag group string into OR-groups of AND-sets.
   * "1girl | 2girls"   → [['1girl'], ['2girls']]
   * "1girl solo"       → [['1girl', 'solo']]
   * "brown_hair*"      → [['brown_hair*']]
   */
  function parseRuleTokens(str) {
    return str.trim().split(/\s*\|\s*/).map(group => group.trim().split(/\s+/).filter(Boolean));
  }

  /*
   * parseRule(str) — parse a full rule string, supporting optional AND-expansion parenthesis syntax:
   *   "solo ( red_hair =/= blonde_hair )"
   *   → { leftGroups: [['solo','red_hair']], op: '=/=', rightGroups: [['solo','blonde_hair']] }
   *
   * For the paren form "PREFIX ( A OP B )" the PREFIX tags are prepended to both sides as AND conditions.
   * Standard form "A OP B" is parsed normally.
   *
   * Returns { leftGroups, op, rightGroups } or null if unparseable.
   */
  function parseRule(str) {
    str = str.trim();
    function hasInvalidCategoryWildcard(groups) {
      return groups.flat().some(tokenHasCategoryWildcard);
    }

    /* Paren form: "prefix1 prefix2 ( left OP right )" */
    const parenM = str.match(/^(.*?)\(\s*(.+?)\s*(=\/=|=|>|<)\s*(.+?)\s*\)\s*$/);
    if (parenM) {
      const [, prefixStr, leftStr, op, rightStr] = parenM;
      const prefix = prefixStr.trim().split(/\s+/).filter(Boolean);
      const leftGroups  = parseRuleTokens(leftStr).map(g => [...prefix, ...g]);
      const rightGroups = parseRuleTokens(rightStr).map(g => [...prefix, ...g]);
      if (hasInvalidCategoryWildcard(leftGroups) || hasInvalidCategoryWildcard(rightGroups)) return null;
      return { leftGroups, op, rightGroups };
    }

    /* Standard form */
    const m = str.match(/^(.+?)\s*(=\/=|=|>|<)\s*(.+)$/);
    if (!m) return null;
    const [, leftStr, op, rightStr] = m;
    const leftGroups = parseRuleTokens(leftStr);
    const rightGroups = parseRuleTokens(rightStr);
    if (hasInvalidCategoryWildcard(leftGroups) || hasInvalidCategoryWildcard(rightGroups)) return null;
    return { leftGroups, op, rightGroups };
  }

  function opDisplay(op) {
    if (op === '>') return '→';
    if (op === '<') return '←';
    return op; // = and =/= unchanged
  }

  function tokenIsCategorySelector(tok) {
    return /^category:[a-z0-9_]+$/.test(String(tok || '').trim().toLowerCase());
  }

  function tokenCategorySlug(tok) {
    if (!tokenIsCategorySelector(tok)) return null;
    return String(tok).trim().toLowerCase().slice('category:'.length);
  }

  function tokenHasCategoryWildcard(tok) {
    const str = String(tok || '').trim().toLowerCase();
    return str.startsWith('category:') && str.includes('*');
  }

  function tokenHasWildcard(tok) {
    return !tokenIsCategorySelector(tok) && String(tok || '').includes('*');
  }

  function wildcardToRegex(tok) {
    const escaped = tok.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp('^' + escaped + '$');
  }