// TAGS SYNONYMS: `buildSynonymMap(rules)` — groups synonym tags using a union-find structure over all `=` rules with single-tag sides. Returns a Map of `tag -> canonicalTag` where the canonical member is whichever tag in the synonym group has the highest cached post count (ties broken alphabetically). Tags not in any synonym group are absent from the map.

  function buildSynonymMap(rules) {
    const uf = new Map();
    function find(x) { if (!uf.has(x)) uf.set(x, x); return uf.get(x) === x ? x : find(uf.get(x)); }
    function union(a, b) { uf.set(find(a), find(b)); }

    rules.forEach(r => {
      const parsed = parseRule(r);
      if (!parsed || parsed.op !== '=') return;
      const lf = parsed.leftGroups.flat(), rf = parsed.rightGroups.flat();
      if (lf.length === 1 && rf.length === 1) union(lf[0], rf[0]);
    });

    const groups = new Map();
    uf.forEach((_, t) => {
      const root = find(t);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root).push(t);
    });

    const canonical = new Map();
    groups.forEach(members => {
      if (members.length < 2) return;
      members.sort((a, b) => (getCountCache()[b]?.count ?? 0) - (getCountCache()[a]?.count ?? 0) || a.localeCompare(b));
      const canon = members[0];
      members.forEach(m => canonical.set(m, canon));
    });
    return canonical;
  }