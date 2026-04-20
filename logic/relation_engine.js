// RELATION ENGINE: Builds runtime lookup structures from stored rules and queries them. `buildRelationMaps()` returns `{impliesMap, negatesMap, compoundRules, wildcardRules}` — fast-path Maps for single-tag sides, arrays for compound AND and wildcard rules. `getRelatedTags(tagSet, maps)` returns tags implied by the current set. `getSuppressedTags(tagSet, maps, blacklist)` returns tags that should be hidden (negated or blacklisted).
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
    const selectorRules = [];
    const categoryTagsMap = getCategoryTagsMap();

    const rules = getRelations();

    function addImply(from, to) {
      if (!impliesMap.has(from)) impliesMap.set(from, new Set());
      impliesMap.get(from).add(to);
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
      const hasCategorySelector = [...leftGroups, ...rightGroups].flat().some(tokenIsCategorySelector);
      if (hasCategorySelector) { selectorRules.push({ leftGroups, op, rightGroups }); return; }

      const leftTags  = leftGroups.flat();
      const rightTags = rightGroups.flat();

      /* Compound AND left-side (multiple tags) — defer to runtime matching */
      if (leftGroups.some(g => g.length > 1)) {
        leftGroups.forEach(andGroup => {
          rightGroups.flat().filter(rt => !andGroup.includes(rt)).forEach(rt => {
            compoundRules.push({ andTags: andGroup, op, target: rt });
          });
        });
        if (op === '=') {
          rightGroups.forEach(andGroup => {
            leftTags.filter(lt => !andGroup.includes(lt)).forEach(lt => {
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

    return { impliesMap, negatesMap, compoundRules, wildcardRules, selectorRules, categoryTagsMap };
  }

  /*
   * getRelatedTags — checks impliesMap, compoundRules (AND), and wildcardRules.
   */
  function getRelatedTags(currentTagSet, { impliesMap, compoundRules, wildcardRules, selectorRules, categoryTagsMap }) {
    const suggested = new Set();
    function expandSelectorToken(tok) {
      if (!tokenIsCategorySelector(tok)) return [tok];
      const slug = tokenCategorySlug(tok);
      return (categoryTagsMap?.[slug] || []).filter(Boolean);
    }
    function groupMatches(andGroup) {
      return andGroup.every(tok => {
        if (tokenIsCategorySelector(tok)) {
          const tags = expandSelectorToken(tok);
          return tags.some(t => currentTagSet.has(t));
        }
        return currentTagSet.has(tok);
      });
    }

    currentTagSet.forEach(tag => {
      if (impliesMap.has(tag)) impliesMap.get(tag).forEach(t => suggested.add(t));
    });

    /* Compound AND rules — fire only when ALL andTags are present */
    compoundRules.forEach(({ andTags, op, target }) => {
      if (op === '=/=') return;
      if (andTags.every(t => currentTagSet.has(t))) suggested.add(target);
    });

    /* Category selector rules */
    (selectorRules || []).forEach(({ leftGroups, op, rightGroups }) => {
      if (op === '=/=') return;
      const leftMatches = leftGroups.some(groupMatches);
      const rightMatches = rightGroups.some(groupMatches);
      if (leftMatches && (op === '>' || op === '=')) {
        rightGroups.flat().forEach(tok => expandSelectorToken(tok).forEach(t => suggested.add(t)));
      }
      if (rightMatches && (op === '<' || op === '=')) {
        leftGroups.flat().forEach(tok => expandSelectorToken(tok).forEach(t => suggested.add(t)));
      }
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
  function getSuppressedTags(currentTagSet, { negatesMap, compoundRules, wildcardRules, selectorRules, categoryTagsMap }, blacklist) {
    const suppressed = new Set(blacklist);
    selectorRules = selectorRules || [];
    categoryTagsMap = categoryTagsMap || {};
    function expandSelectorToken(tok) {
      if (!tokenIsCategorySelector(tok)) return [tok];
      const slug = tokenCategorySlug(tok);
      return (categoryTagsMap[slug] || []).filter(Boolean);
    }
    function groupMatches(andGroup) {
      return andGroup.every(tok => {
        if (tokenIsCategorySelector(tok)) {
          const tags = expandSelectorToken(tok);
          return tags.some(t => currentTagSet.has(t));
        }
        return currentTagSet.has(tok);
      });
    }

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

    selectorRules.forEach(({ leftGroups, op, rightGroups }) => {
      if (op !== '=/=') return;
      if (leftGroups.some(groupMatches)) {
        rightGroups.flat().forEach(tok => expandSelectorToken(tok).forEach(t => suppressed.add(t)));
      }
      if (rightGroups.some(groupMatches)) {
        leftGroups.flat().forEach(tok => expandSelectorToken(tok).forEach(t => suppressed.add(t)));
      }
    });

    return suppressed;
  }

  function listConflictPartners(targetTag, currentTagSet, maps) {
    if (!targetTag || !currentTagSet || !maps) return [];
    const {
      negatesMap,
      compoundRules,
      wildcardRules,
      selectorRules,
      categoryTagsMap,
    } = maps;
    const partners = new Set();
    const selectorRulesSafe = selectorRules || [];
    const categoryTagsMapSafe = categoryTagsMap || {};
    function addPartner(tag) {
      if (!tag || tag === targetTag || !currentTagSet.has(tag)) return;
      partners.add(tag);
    }
    function expandSelectorToken(tok) {
      if (!tokenIsCategorySelector(tok)) return [tok];
      const slug = tokenCategorySlug(tok);
      return (categoryTagsMapSafe[slug] || []).filter(Boolean);
    }
    function groupMatches(andGroup) {
      return andGroup.every(tok => {
        if (tokenIsCategorySelector(tok)) {
          const tags = expandSelectorToken(tok);
          return tags.some(t => currentTagSet.has(t));
        }
        return currentTagSet.has(tok);
      });
    }
    function collectGroupPartners(andGroup) {
      andGroup.forEach(tok => {
        expandSelectorToken(tok).forEach(addPartner);
      });
    }

    if (negatesMap && negatesMap.has(targetTag)) {
      negatesMap.get(targetTag).forEach(addPartner);
    }

    (compoundRules || []).forEach(({ andTags, op, target }) => {
      if (op !== '=/=' || target !== targetTag) return;
      if (andTags.every(t => currentTagSet.has(t))) andTags.forEach(addPartner);
    });

    currentTagSet.forEach(tag => {
      (wildcardRules || []).forEach(({ leftGroups, op, rightGroups }) => {
        if (op !== '=/=') return;
        const leftMatches = leftGroups.some(andGroup =>
          andGroup.every(tok => tokenHasWildcard(tok) ? wildcardToRegex(tok).test(tag) : tok === tag)
        );
        const rightMatches = rightGroups.some(andGroup =>
          andGroup.every(tok => tokenHasWildcard(tok) ? wildcardToRegex(tok).test(tag) : tok === tag)
        );
        if (leftMatches && rightGroups.flat().some(t => !tokenHasWildcard(t) && t === targetTag)) addPartner(tag);
        if (rightMatches && leftGroups.flat().some(t => !tokenHasWildcard(t) && t === targetTag)) addPartner(tag);
      });
    });

    selectorRulesSafe.forEach(({ leftGroups, op, rightGroups }) => {
      if (op !== '=/=') return;
      if (leftGroups.some(groupMatches)) {
        const rightHasTarget = rightGroups.flat().some(tok => expandSelectorToken(tok).includes(targetTag));
        if (rightHasTarget) leftGroups.forEach(group => collectGroupPartners(group));
      }
      if (rightGroups.some(groupMatches)) {
        const leftHasTarget = leftGroups.flat().some(tok => expandSelectorToken(tok).includes(targetTag));
        if (leftHasTarget) rightGroups.forEach(group => collectGroupPartners(group));
      }
    });

    return [...partners].sort((a, b) => a.localeCompare(b));
  }

  function getConflictPartnerCount(targetTag, currentTagSet, maps) {
    return listConflictPartners(targetTag, currentTagSet, maps).length;
  }