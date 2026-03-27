// MIRROR SYNC: Wiring helpers that keep the mirror textarea and the site's source textarea in sync, and handle form submission bookkeeping. `syncToSource(sourceTextarea, val)` — writes `val` to the source textarea and dispatches a native `input` event so site listeners (e.g. awesomplete) see the change. `wireTextareaSync(mirrorTA, sourceTextarea, onMirrorInput)` — sets up bidirectional sync: mirror→source on every mirror input event (also calls `onMirrorInput`); source→mirror when source changes while mirror is not focused. `wireSubmitHandler(sourceTextarea, originalTags)` — attaches a one-time submit listener to the nearest form that calls `recordAddedTags` and replaces the history entry to prevent back-stack pollution after Rule34's post-save reload. `wireBackdropObserver(mirror, backdrop)` — uses a MutationObserver to keep `backdrop.visible` in sync with `mirror.visible`.

  function syncToSource(sourceTextarea, val) {
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeSetter) nativeSetter.call(sourceTextarea, val);
    else sourceTextarea.value = val;
    sourceTextarea.dispatchEvent(new Event('input',  { bubbles: true }));
    sourceTextarea.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function wireTextareaSync(mirrorTA, sourceTextarea, onMirrorInput) {
    mirrorTA.addEventListener('input', () => {
      syncToSource(sourceTextarea, mirrorTA.value);
      if (onMirrorInput) onMirrorInput();
    });
    sourceTextarea.addEventListener('input', () => {
      if (document.activeElement !== mirrorTA) mirrorTA.value = sourceTextarea.value;
    });
  }

  function wireSubmitHandler(sourceTextarea, originalTags) {
    const editForm = document.getElementById('edit') || document.getElementById('edit_form') || sourceTextarea.closest('form');
    if (editForm) {
      editForm.addEventListener('submit', () => {
        recordAddedTags(originalTags, parseTags(sourceTextarea.value));
        history.replaceState(null, '', location.href);
      }, { once: true });
    }
  }

  function wireBackdropObserver(mirror, backdrop) {
    const obs = new MutationObserver(() => {
      backdrop.classList.toggle('visible', mirror.classList.contains('visible'));
    });
    obs.observe(mirror, { attributes: true, attributeFilter: ['class'] });
  }