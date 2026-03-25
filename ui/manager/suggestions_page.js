// === SECTION: suggestions page | filename: suggestions_page ===
    /* ══════════════════════════════════════════
       SUGGESTIONS PAGE
    ══════════════════════════════════════════ */
    function buildSuggestionsPage() {
      const _dismissed = new Set();

      function getAncestors(tag, parentGraph) {
        const visited = new Set();
        const q = [tag];
        while (q.length) {
          const cur = q.shift();
          (parentGraph.get(cur) || new Set()).forEach(p => {
            if (!visited.has(p)) { visited.add(p); q.push(p); }
          });
        }
        return visited;
      }

      function findSuggestions(rules) {
        const suggestions = [];
        const seen = new Set();

        /* Build parent graph: tag -> Set of direct parents */
        const pg = new Map();
        function ensurePG(t) { if (!pg.has(t)) pg.set(t, new Set()); return pg.get(t); }
        rules.forEach(rule => {
          const m = rule.match(/^(.+?)\s*(=\/=|=|>|<)\s*(.+)$/);
          if (!m) return;
          const [, ls, op, rs] = m;
          if (op === '=/=') return;
          const lt = ls.trim().split(/\s+/);
          if (lt.length !== 1) return;
          rs.trim().split(/\s*\|\s*/).forEach(rt => {
            rt = rt.trim();
            if (op === '>' || op === '=') { ensurePG(lt[0]).add(rt); if (op === '=') ensurePG(rt).add(lt[0]); }
            else if (op === '<') { ensurePG(rt).add(lt[0]); ensurePG(lt[0]); }
          });
        });

        /* Type 1: transitive redundancy — A > C exists but A > B > C also exists */
        rules.forEach(rule => {
          if (_dismissed.has(rule)) return;
          const m = rule.match(/^(.+?)\s*(=\/=|=|>|<)\s*(.+)$/);
          if (!m) return;
          const [, ls, op, rs] = m;
          if (op === '=/=' || op === '=') return;
          const lt = ls.trim().split(/\s+/);
          if (lt.length !== 1) return;
          const tag = lt[0];
          rs.trim().split(/\s*\|\s*/).forEach(rtRaw => {
            const rt = rtRaw.trim();
            const directSet = pg.get(tag);
            if (!directSet || !directSet.has(rt)) return;
            directSet.delete(rt);
            const ancestors = getAncestors(tag, pg);
            directSet.add(rt);
            if (!ancestors.has(rt)) return;
            const via = [];
            (pg.get(tag) || new Set()).forEach(mid => {
              if (mid !== rt && getAncestors(mid, pg).has(rt)) via.push(mid);
            });
            const key = rule + '||' + rt;
            if (seen.has(key)) return;
            seen.add(key);
            suggestions.push({
              rule,
              explanation: `<code>${tag}</code> already implies <code>${rt}</code> transitively`,
              chain: 'chain: ' + (via.length ? `${tag} → ${via[0]} → ${rt}` : `${tag} → … → ${rt}`),
              action: 'remove'
            });
          });
        });

        /* Type 2: mirror duplicates — A > B and B < A both exist */
        const ruleSet = new Set(rules);
        rules.forEach(rule => {
          if (_dismissed.has(rule)) return;
          const m = rule.match(/^(.+?)\s*(>|<)\s*(.+)$/);
          if (!m) return;
          const [, ls, op, rs] = m;
          const flipped = `${rs.trim()} ${op === '>' ? '<' : '>'} ${ls.trim()}`;
          if (!ruleSet.has(flipped)) return;
          const key = [rule, flipped].sort().join('|||');
          if (seen.has(key)) return;
          seen.add(key);
          suggestions.push({
            rule,
            explanation: `<code>${rule}</code> is the mirror of <code>${flipped}</code> — one is redundant`,
            chain: 'both encode the same parent relationship',
            action: 'remove',
            alsoRemove: flipped
          });
        });

        return suggestions;
      }

      function renderSuggestions() {
        pageSugg.innerHTML = '';
        const all = findSuggestions(getRelations());
        const batch = all.slice(0, 5);

        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'qem-sugg-refresh';
        refreshBtn.textContent = `↻ Refresh  (${all.length} suggestion${all.length !== 1 ? 's' : ''} found)`;
        refreshBtn.addEventListener('click', renderSuggestions);
        pageSugg.appendChild(refreshBtn);

        const listEl = document.createElement('div');
        listEl.id = 'qem-sugg-list';

        if (!batch.length) {
          const empty = document.createElement('div');
          empty.className = 'qem-mgr-empty';
          empty.textContent = all.length ? 'All current suggestions dismissed.' : '✓ No redundancies found.';
          listEl.appendChild(empty);
        } else {
          batch.forEach(s => {
            const card = document.createElement('div');
            card.className = 'qem-sugg-card';
            const desc = document.createElement('div');
            desc.className = 'qem-sugg-desc';
            desc.innerHTML = s.explanation;
            const chain = document.createElement('div');
            chain.className = 'qem-sugg-chain';
            chain.textContent = s.chain;
            const btns = document.createElement('div');
            btns.className = 'qem-sugg-btns';
            const accept = document.createElement('button');
            accept.className = 'qem-sugg-accept';
            accept.textContent = '✓ Remove rule';
            accept.addEventListener('click', () => {
              const cur = getRelations();
              [s.rule, s.alsoRemove].filter(Boolean).forEach(r => {
                const i = cur.indexOf(r); if (i !== -1) cur.splice(i, 1);
              });
              saveRelations(cur);
              showToast('Rule removed');
              renderSuggestions();
            });
            const dismiss = document.createElement('button');
            dismiss.className = 'qem-sugg-dismiss';
            dismiss.textContent = 'Dismiss';
            dismiss.addEventListener('click', () => { _dismissed.add(s.rule); renderSuggestions(); });
            btns.appendChild(accept); btns.appendChild(dismiss);
            card.appendChild(desc); card.appendChild(chain); card.appendChild(btns);
            listEl.appendChild(card);
          });
        }
        pageSugg.appendChild(listEl);
      }

      /* Render immediately if this tab is active on open */
      renderSuggestions();
    }