// TAGS GRAPH: Pure graph-building and traversal helpers used by the Tags page.
//
// `buildTagGraph(rules)` — parses all relation rules into a Map of `tag -> { parents, children, synonyms, antonyms, compound[] }`. Compound rules (multi-tag AND sides) are stored by reference on every involved tag rather than as graph edges.
//
// `transitiveReach(tag, graph, dir)` — BFS over `dir` ('parents' or 'children'), crossing synonym edges so that synonyms share the same transitive closure.
//
// `tagRelCount(tag, graph)` — sum of all direct relation set sizes for a tag (used for sort ordering).
//
// `getAllTagsFromRules(rules)` — returns a Set of every tag token mentioned in any rule.

  function buildTagGraph(rules) {
    const g = new Map();
    function ensure(t) {
      if (!g.has(t)) g.set(t, { parents: new Set(), children: new Set(), synonyms: new Set(), antonyms: new Set(), compound: [] });
      return g.get(t);
    }
    rules.forEach(rule => {
      const parsed = parseRule(rule);
      if (!parsed) return;
      const { leftGroups, op, rightGroups } = parsed;
      const isCompound = leftGroups.some(gr => gr.length > 1) || rightGroups.some(gr => gr.length > 1);
      if (isCompound) {
        const allTags = [...leftGroups.flat(), ...rightGroups.flat()];
        allTags.forEach(t => ensure(t).compound.push({ rule, leftGroups, op, rightGroups }));
        return;
      }
      const lt = leftGroups.flat();
      const rt = rightGroups.flat();
      lt.forEach(l => { rt.forEach(r => {
        if (op === '=')   { ensure(l).synonyms.add(r); ensure(r).synonyms.add(l); }
        if (op === '=/=') { ensure(l).antonyms.add(r); ensure(r).antonyms.add(l); }
        if (op === '>')   { ensure(l).parents.add(r);  ensure(r).children.add(l); }
        if (op === '<')   { ensure(r).parents.add(l);  ensure(l).children.add(r); }
      }); });
      lt.concat(rt).forEach(t => ensure(t));
    });
    return g;
  }

  function transitiveReach(tag, graph, dir) {
    const visited = new Set();
    const q = [tag];
    while (q.length) {
      const cur = q.shift();
      const node = graph.get(cur);
      if (!node) continue;
      node[dir].forEach(p => { if (!visited.has(p)) { visited.add(p); q.push(p); } });
      node.synonyms.forEach(s => {
        const sn = graph.get(s);
        if (!sn) return;
        sn[dir].forEach(p => { if (!visited.has(p)) { visited.add(p); q.push(p); } });
      });
    }
    return visited;
  }

  function tagRelCount(tag, graph) {
    const n = graph.get(tag);
    if (!n) return 0;
    return n.parents.size + n.children.size + n.synonyms.size + n.antonyms.size + n.compound.length;
  }

  function getAllTagsFromRules(rules) {
    const tags = new Set();
    rules.forEach(rule => {
      const parsed = parseRule(rule);
      if (!parsed) return;
      [...parsed.leftGroups.flat(), ...parsed.rightGroups.flat()].forEach(t => tags.add(t));
    });
    return tags;
  }