// MIRROR CHIPS: Chip row factory functions for the mirror panel.
//
// `makeChipRow(tags, extraClass, labelText, mirrorTA, suppressed, onChipAdded)` — builds a `.qem-chips` div with a label and one chip per visible tag (filtered by `suppressed` Set). Chips already present in `mirrorTA` are hidden. Each chip tap appends the tag to the textarea, hides all matching chips, and calls `onChipAdded()`. Lazily fetches post counts via `fetchTagCountPermanent`.
//
// `makeCollapsibleChipRow(tags, extraClass, labelText, collapseKey, mirrorTA, suppressed, onChipAdded)` — wraps `makeChipRow` with GM-persisted collapse state toggled by clicking the label.

  function makeChipRow(tags, extraClass, labelText, mirrorTA, suppressed, onChipAdded) {
    suppressed = suppressed || new Set();
    const visibleTags = tags.filter(t => !suppressed.has(t));
    if (!visibleTags.length) return null;
    const currentTags = () => new Set(parseTags(mirrorTA.value));

    const wrap = document.createElement('div');
    wrap.className = 'qem-chips';

    const lbl = document.createElement('span');
    lbl.className = 'qem-chips-label';
    lbl.textContent = labelText;
    wrap.appendChild(lbl);

    visibleTags.forEach(tag => {
      const chip = document.createElement('span');
      chip.className = `qem-chip ${extraClass}`;
      chip.textContent = tag;
      chip.dataset.tag = tag;

      if (currentTags().has(tag)) chip.style.display = 'none';

      fetchTagCountPermanent(tag, count => {
        if (count !== null) {
          chip.textContent = `${tag} (${Number(count).toLocaleString()})`;
          chip.dataset.tag = tag;
        }
      });

      let _downX, _downY;
      chip.addEventListener('pointerdown', e => {
        e.preventDefault();
        e.stopPropagation();
        _downX = e.clientX; _downY = e.clientY;
      });
      chip.addEventListener('pointerup', e => {
        if (Math.abs(e.clientX - _downX) > 8 || Math.abs(e.clientY - _downY) > 8) return;
        suppressNextClick();
        let val = mirrorTA.value;
        if (val && !val.endsWith(' ')) val += ' ';
        val += tag + ' ';
        mirrorTA.value = val;
        mirrorTA.scrollTop = mirrorTA.scrollHeight;
        document.querySelectorAll('.qem-chip').forEach(c => {
          if ((c.dataset.tag || c.textContent) === tag) c.style.display = 'none';
        });
        if (onChipAdded) onChipAdded(val);
      });

      wrap.appendChild(chip);
    });

    return wrap;
  }

  function makeCollapsibleChipRow(tags, extraClass, labelText, collapseKey, mirrorTA, suppressed, onChipAdded) {
    const wrap = makeChipRow(tags, extraClass, labelText, mirrorTA, suppressed, onChipAdded);
    if (!wrap) return null;
    if (GM_getValue(collapseKey, false)) wrap.classList.add('collapsed');
    wrap.querySelector('.qem-chips-label').addEventListener('click', e => {
      e.stopPropagation();
      wrap.classList.toggle('collapsed');
      GM_setValue(collapseKey, wrap.classList.contains('collapsed'));
    });
    return wrap;
  }