// MIRROR DOM: `buildMirrorDOM(sourceTextarea)` — constructs the mirror panel shell and returns all interactive elements needed by other mirror modules. Creates: the root `#qem-mirror` div, titlebar with scroll-down and minimize buttons, the `#qem-mirror-body` div, the mirrored `<textarea>` (pre-filled from source), and the collapsible tags-wrap label. Also creates the transparent `#qem-mirror-backdrop` div. Returns `{ mirror, body, mirrorTA, minBtn, backdrop }`.

  function buildMirrorDOM(sourceTextarea, onClose) {
    const mirror = document.createElement('div');
    mirror.id = 'qem-mirror';

    /* ── Titlebar ── */
    const titlebar = document.createElement('div');
    titlebar.id = 'qem-mirror-titlebar';

    const titleSpan = document.createElement('span');
    titleSpan.id = 'qem-mirror-title';
    titleSpan.textContent = 'Tags';

    const minBtn = document.createElement('button');
    minBtn.className = 'qem-tbar-btn';
    minBtn.id = 'qem-tbar-min';
    minBtn.title = 'Close';
    minBtn.innerHTML = '&#x00d7;';
    minBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (onClose) onClose();
    });

    titlebar.addEventListener('click', () => {
      if (onClose) onClose();
    });

    titlebar.appendChild(titleSpan);
    titlebar.appendChild(minBtn);
    mirror.appendChild(titlebar);

    /* ── Body ── */
    const body = document.createElement('div');
    body.id = 'qem-mirror-body';
    mirror.appendChild(body);

    /* ── Textarea ── */
    const mirrorTA = document.createElement('textarea');
    mirrorTA.id = 'qem-mirror-textarea';
    mirrorTA.value = sourceTextarea.value;
    mirrorTA.rows = 4;
    mirrorTA.spellcheck = false;
    mirrorTA.autocomplete = 'off';

    /* ── Backdrop ── */
    const backdrop = document.createElement('div');
    backdrop.id = 'qem-mirror-backdrop';

    return { mirror, body, mirrorTA, minBtn, backdrop };
  }