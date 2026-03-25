// === SECTION: relation engine | filename: relation_engine ===
  /*
   * buildRelationMaps() — parses stored relations into fast runtime structures.
   * Returns { impliesMap: Map, negatesMap: Map, compoundRules: [], wildcardRules: [] }
   *
   * impliesMap:    tag → [implied tags]   (for single-tag left-sides only)
   * negatesMap:    tag → Set<tag>          (symmetric, single-tag sides only)
   * compoundRules: [{ andTags, op, targets }]  for multi-tag AND left-sides
   * wildcardRules: [{ leftGroups, op, rightGroups }]
   */
  function buildRelationMaps() {
    const impliesMap    = new Map();
    const negatesMap    = new Map();
    const compoundRules = [];
    const wildcardRules = [];

    const rules = getRelations();

    function addImply(from, to) {
      if (!impliesMap.has(from)) impliesMap.set(from, []);
      if (!impliesMap.get(from).includes(to)) impliesMap.get(from).push(to);
    }
    function addNegate(a, b) {
      if (!negatesMap.has(a)) negatesMap.set(a, new Set());
      if (!negatesMap.has(b)) negatesMap.set(b, new Set());
      negatesMap.get(a).add(b);
      negatesMap.get(b).add(a);
    }

    rules.forEach(rule => {
      const parsed = parseRule(rule);
      if (!parsed) return;
      const { leftGroups, op, rightGroups } = parsed;

      const hasWild = [...leftGroups, ...rightGroups].flat().some(tokenHasWildcard);
      if (hasWild) { wildcardRules.push({ leftGroups, op, rightGroups }); return; }

      const leftTags  = leftGroups.flat();
      const rightTags = rightGroups.flat();

      /* Compound AND left-side (multiple tags) — defer to runtime matching */
      if (leftGroups.some(g => g.length > 1)) {
        leftGroups.forEach(andGroup => {
          rightGroups.flat().forEach(rt => {
            compoundRules.push({ andTags: andGroup, op, target: rt });
          });
        });
        if (op === '=') {
          rightGroups.forEach(andGroup => {
            leftTags.forEach(lt => {
              compoundRules.push({ andTags: andGroup, op, target: lt });
            });
          });
        }
        return;
      }

      /* Single-tag left-sides — fast path */
      if (op === '=/=') {
        leftTags.forEach(l => rightTags.forEach(r => addNegate(l, r)));
      } else if (op === '=') {
        leftTags.forEach(l => rightTags.forEach(r => { addImply(l, r); addImply(r, l); }));
      } else if (op === '>') {
        leftTags.forEach(l => rightTags.forEach(r => addImply(l, r)));
      } else if (op === '<') {
        rightTags.forEach(r => leftTags.forEach(l => addImply(r, l)));
      }
    });

    return { impliesMap, negatesMap, compoundRules, wildcardRules };
  }

  /*
   * getRelatedTags — checks impliesMap, compoundRules (AND), and wildcardRules.
   */
  function getRelatedTags(currentTagSet, { impliesMap, compoundRules, wildcardRules }) {
    const suggested = new Set();

    currentTagSet.forEach(tag => {
      if (impliesMap.has(tag)) impliesMap.get(tag).forEach(t => suggested.add(t));
    });

    /* Compound AND rules — fire only when ALL andTags are present */
    compoundRules.forEach(({ andTags, op, target }) => {
      if (op === '=/=') return;
      if (andTags.every(t => currentTagSet.has(t))) suggested.add(target);
    });

    /* Wildcard rules */
    currentTagSet.forEach(tag => {
      wildcardRules.forEach(({ leftGroups, op, rightGroups }) => {
        if (op === '=/=') return;
        const leftMatches = leftGroups.some(andGroup =>
          andGroup.every(tok => tokenHasWildcard(tok) ? wildcardToRegex(tok).test(tag) : tok === tag)
        );
        if (leftMatches && (op === '>' || op === '='))
          rightGroups.flat().filter(t => !tokenHasWildcard(t)).forEach(t => suggested.add(t));
        const rightMatches = rightGroups.some(andGroup =>
          andGroup.every(tok => tokenHasWildcard(tok) ? wildcardToRegex(tok).test(tag) : tok === tag)
        );
        if (rightMatches && (op === '=' || op === '<'))
          leftGroups.flat().filter(t => !tokenHasWildcard(t)).forEach(t => suggested.add(t));
      });
    });

    currentTagSet.forEach(t => suggested.delete(t));
    return [...suggested];
  }

  /*
   * getSuppressedTags — checks negatesMap, compound =/= rules, and wildcard =/= rules.
   */
  function getSuppressedTags(currentTagSet, { negatesMap, compoundRules, wildcardRules }, blacklist) {
    const suppressed = new Set(blacklist);

    currentTagSet.forEach(tag => {
      if (negatesMap.has(tag)) negatesMap.get(tag).forEach(t => suppressed.add(t));
    });

    compoundRules.forEach(({ andTags, op, target }) => {
      if (op !== '=/=') return;
      if (andTags.every(t => currentTagSet.has(t))) suppressed.add(target);
    });

    currentTagSet.forEach(tag => {
      wildcardRules.forEach(({ leftGroups, op, rightGroups }) => {
        if (op !== '=/=') return;
        const leftMatches = leftGroups.some(andGroup =>
          andGroup.every(tok => tokenHasWildcard(tok) ? wildcardToRegex(tok).test(tag) : tok === tag)
        );
        if (leftMatches) rightGroups.flat().filter(t => !tokenHasWildcard(t)).forEach(t => suppressed.add(t));
        const rightMatches = rightGroups.some(andGroup =>
          andGroup.every(tok => tokenHasWildcard(tok) ? wildcardToRegex(tok).test(tag) : tok === tag)
        );
        if (rightMatches) leftGroups.flat().filter(t => !tokenHasWildcard(t)).forEach(t => suppressed.add(t));
      });
    });

    return suppressed;
  }