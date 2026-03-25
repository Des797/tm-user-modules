// === SECTION: rule parser | filename: parse_rules ===
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

    /* Paren form: "prefix1 prefix2 ( left OP right )" */
    const parenM = str.match(/^(.*?)\(\s*(.+?)\s*(=\/=|=|>|<)\s*(.+?)\s*\)\s*$/);
    if (parenM) {
      const [, prefixStr, leftStr, op, rightStr] = parenM;
      const prefix = prefixStr.trim().split(/\s+/).filter(Boolean);
      const leftGroups  = parseRuleTokens(leftStr).map(g => [...prefix, ...g]);
      const rightGroups = parseRuleTokens(rightStr).map(g => [...prefix, ...g]);
      return { leftGroups, op, rightGroups };
    }

    /* Standard form */
    const m = str.match(/^(.+?)\s*(=\/=|=|>|<)\s*(.+)$/);
    if (!m) return null;
    const [, leftStr, op, rightStr] = m;
    return { leftGroups: parseRuleTokens(leftStr), op, rightGroups: parseRuleTokens(rightStr) };
  }

  function opDisplay(op) {
    if (op === '>') return '→';
    if (op === '<') return '←';
    return op; // = and =/= unchanged
  }

  function wildcardToRegex(tok) {
    const escaped = tok.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp('^' + escaped + '$');
  }

  function tokenHasWildcard(tok) {
    return tok.includes('*');
  }