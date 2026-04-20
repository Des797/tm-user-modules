// MIRROR STYLES: `injectMirrorStyles()` — injects the `#qem-mirror-styles` stylesheet on first call (guarded by id check). Contains all CSS for the fixed bottom mirror panel: shell, backdrop, titlebar buttons, body layout, collapsible textarea section, chip rows (recent/favorites/related), and the quick-rule bar.

  function injectMirrorStyles() {
    if (document.getElementById('qem-mirror-styles')) return;
    const style = document.createElement('style');
    style.id = 'qem-mirror-styles';
    style.textContent = `
      #qem-mirror {
        position: fixed;
        inset: 0;
        width: 100%;
        max-width: none;
        z-index: 1000001;
        background: #1a1a24;
        border-top: 2px solid #e84040;
        display: none;
        flex-direction: column;
        box-shadow: none;
        box-sizing: border-box;
        overflow: hidden;
        will-change: transform;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-y;
        pointer-events: all;
      }
      #qem-mirror-backdrop {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 999989;
        pointer-events: none;
        touch-action: auto;
        background: transparent;
      }
      #qem-mirror-backdrop.visible { display: block; }
      #qem-mirror.visible { display: flex; }
      #qem-mirror-titlebar {
        display: flex;
        align-items: center;
        padding: 12px 14px;
        border-bottom: 1px solid #2a2a3a;
        flex-shrink: 0;
        position: relative;
      }
      #qem-mirror-title { display: block; color: #e0e0e0; font-size: 16px; font-weight: 700; }
      #qem-tbar-scroll { flex-shrink: 0; margin-left: auto; }
      #qem-tbar-min {
        margin-left: 6px;
      }
      .qem-tbar-btn {
        background: none;
        border: none;
        color: #555;
        cursor: pointer;
        padding: 3px 7px;
        font-size: 15px;
        line-height: 1;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .qem-tbar-btn:active { color: #fff; background: #333; }
      #qem-mirror-body {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 8px;
        flex: 1;
        min-height: 0;
        overflow: hidden;
        touch-action: pan-x pan-y;
        overscroll-behavior: contain;
      }
      #qem-mirror-pages {
        display: flex;
        gap: 6px;
        padding: 0 0 2px;
        overflow-x: auto;
        flex-shrink: 0;
      }
      .qem-mirror-page-btn {
        background: #0f1320;
        border: 1px solid #2a2a3a;
        border-radius: 6px;
        color: #8a8faa;
        font-size: 11px;
        font-weight: 700;
        padding: 8px 12px;
        cursor: pointer;
        min-height: 40px;
        flex-shrink: 0;
      }
      .qem-mirror-page-btn.active {
        border-color: #46a;
        color: #8af;
      }
      .qem-mirror-page { display: none; flex-direction: column; gap: 4px; flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding-bottom: 10px; }
      .qem-mirror-page.active { display: flex; }
      #qem-mirror-textarea-canonical { touch-action: pan-x pan-y; font-family: verdana; }
      #qem-mirror-tags-wrap.collapsed #qem-mirror-textarea-canonical { display: none; }
      #qem-mirror-tags-wrap.collapsed #qem-mirror-editor-helpers { display: none; }
      #qem-mirror-tags-wrap.collapsed #qem-mirror-label::after { content: '▸'; }
      #qem-mirror-tags-wrap { display: flex; flex-direction: column; flex: 1; min-height: 0; }
      #qem-mirror-label { cursor: pointer; display: flex; align-items: center; gap: 4px; color: #666; font-size: 10px; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; width: 100%; margin-bottom: 1px; }
      #qem-mirror-label::after { content: '▾'; font-size: 10px; margin-left: auto; transition: transform 0.15s; }
      #qem-mirror-textarea-canonical {
        width: 100%;
        flex: 1;
        min-height: 220px;
        box-sizing: border-box;
        background: #0e0e18;
        color: #e0e0e0;
        border: 1px solid #333;
        border-radius: 6px;
        font-size: 13px;
        padding: 8px;
        resize: none;
        outline: none;
        line-height: 1.5;
      }
      #qem-mirror-textarea-canonical:focus {
        border-color: #e84040;
      }
      #qem-mirror-editor-helpers {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .qem-mirror-editor-label {
        color: #666;
        font-size: 10px;
        font-family: system-ui, sans-serif;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      #qem-mirror-added-textarea,
      #qem-mirror-removed-textarea {
        width: 100%;
        box-sizing: border-box;
        background: #0e0e18;
        color: #e0e0e0;
        border: 1px solid #333;
        border-radius: 6px;
        font-size: 13px;
        padding: 8px;
        resize: none;
        min-height: 72px;
        outline: none;
        line-height: 1.5;
      }
      #qem-mirror-added-textarea { min-height: 84px; }
      #qem-mirror-removed-textarea {
        min-height: 80px;
        color: #b28f8f;
        border-color: #4a2e2e;
        background: #181019;
      }
      .qem-chips {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 2px 0;
      }
      .qem-chips.collapsed .qem-chip { display: none !important; }
      .qem-chips.collapsed .qem-chip-scroller { display: none; }
      .qem-chips.collapsed .qem-chip-expand-btn { display: none; }
      .qem-chips-label {
        color: #666;
        font-size: 10px;
        font-family: system-ui, sans-serif;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        width: 100%;
        margin-bottom: 1px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .qem-chips-label::after { content: '▾'; font-size: 10px; margin-left: auto; transition: transform 0.15s; }
      .qem-chips.collapsed .qem-chips-label::after { content: '▸'; }
      .qem-recommended-categories-header {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        margin-bottom: 1px;
      }
      .qem-recommended-categories-header .qem-chips-label {
        flex: 1;
        min-width: 0;
        margin-bottom: 0;
        cursor: default;
      }
      .qem-recommended-categories-header .qem-chips-label::after { content: none; }
      .qem-recommended-refresh-order {
        background: #0f1320;
        border: 1px solid #2a2a3a;
        border-radius: 8px;
        color: #8a8faa;
        font-size: 10px;
        font-weight: 700;
        padding: 4px 8px;
        cursor: pointer;
        flex-shrink: 0;
        line-height: 1.2;
      }
      .qem-mirror-refresh-btn {
        background: #0f1320;
        border: 1px solid #2a2a3a;
        border-radius: 8px;
        color: #8a8faa;
        font-size: 10px;
        font-weight: 700;
        padding: 4px 8px;
        cursor: pointer;
        flex-shrink: 0;
        line-height: 1.2;
      }
      .qem-recommended-refresh-order:active {
        background: rgba(70, 170, 255, 0.12);
        color: #cde;
        border-color: #46a;
      }
      .qem-mirror-refresh-btn:active {
        background: rgba(70, 170, 255, 0.12);
        color: #cde;
        border-color: #46a;
      }
      .qem-recommended-restore-hidden {
        background: #0f1320;
        border: 1px solid #3a3a4a;
        border-radius: 8px;
        color: #9a9eaa;
        font-size: 10px;
        font-weight: 700;
        padding: 4px 8px;
        cursor: pointer;
        flex-shrink: 0;
        line-height: 1.2;
      }
      .qem-recommended-restore-hidden:active {
        background: rgba(255, 200, 120, 0.12);
        color: #ecb;
        border-color: #864;
      }
      .qem-recommended-restore-hidden.qem-showing-hidden {
        background: rgba(120, 120, 255, 0.14);
        border-color: #6670aa;
        color: #ccd3ff;
      }
      .qem-recommended-hide-menu {
        position: fixed;
        z-index: 1000002;
        background: #1a1a24;
        border: 1px solid #333;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.55);
        padding: 4px;
        min-width: 140px;
      }
      .qem-recommended-hide-menu-item {
        display: block;
        width: 100%;
        box-sizing: border-box;
        text-align: left;
        background: none;
        border: none;
        border-radius: 8px;
        color: #ddd;
        font-size: 13px;
        padding: 10px 12px;
        cursor: pointer;
        font-family: system-ui, sans-serif;
      }
      .qem-recommended-hide-menu-item:hover,
      .qem-recommended-hide-menu-item:active {
        background: #2a2a38;
        color: #fff;
      }
      .qem-chip.qem-chip-recommended-hidden {
        border-style: dashed;
        border-color: #8066b3;
        color: #b7a6d7;
        background: rgba(86, 62, 126, 0.24);
        opacity: 0.9;
      }
      .qem-chip-scroller {
        width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-x;
        padding: 2px 0;
      }
      .qem-chip-rows {
        display: flex;
        flex-direction: column;
        gap: 5px;
        align-items: flex-start;
        justify-content: flex-start;
        padding: 2px 0;
        width: max-content;
      }
      .qem-chip-row {
        display: flex;
        flex-direction: row;
        gap: 5px;
        align-items: flex-start;
        justify-content: flex-start;
        flex-wrap: nowrap;
        flex-shrink: 0;
        min-width: max-content;
      }
      .qem-chip-expand-btn {
        background: none;
        border: 1px solid #46a;
        color: #8af;
        cursor: pointer;
        padding: 0;
        width: 44px;
        height: 20px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        align-self: center;
        margin-top: -2px;
        flex-shrink: 0;
      }
      .qem-chip-expand-btn::before {
        content: '▾';
        font-size: 14px;
        line-height: 1;
        transition: transform 0.15s;
        transform: rotate(0deg);
      }
      .qem-chips.expanded .qem-chip-expand-btn::before { transform: rotate(180deg); }
      .qem-chip-expand-btn:active { background: rgba(70, 170, 255, 0.15); color: #fff; border-color: #46a; }
      .qem-chip {
        background: #2a2a38;
        color: #ccc;
        border: 1px solid #444;
        border-radius: 20px;
        padding: 8px 10px;
        font-size: 11px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        user-select: none;
        transition: background 0.15s, color 0.15s;
      }
      .qem-chip:active { background: #e84040; color: #fff; border-color: #e84040; }
      .qem-chip.qem-chip-recent  { border-color: #555; }
      .qem-chip.qem-chip-fav     { border-color: #7a4; color: #9c6; }
      .qem-chip.qem-chip-related { border-color: #46a; color: #8af; }
      .qem-chip.qem-chip-blacklist {
        border-color: #7b3f3f;
        color: #f0baba;
      }
      .qem-chip.qem-chip-blacklist.active {
        background: #3a2228;
        border-color: #b06060;
        color: #ffe0e0;
      }
      .qem-chip.qem-chip-conflict {
        border-color: #756aa7;
        color: #c2bcf3;
      }
      .qem-chip.qem-chip-conflict.active {
        background: #2a2446;
        border-color: #9085d8;
        color: #ece8ff;
      }
      .qem-conflicts-details {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 100%;
        margin-top: 2px;
        border: 1px solid #2b2b3b;
        border-radius: 8px;
        padding: 8px;
        box-sizing: border-box;
        background: #111523;
      }
      .qem-conflicts-details-label,
      .qem-conflicts-empty {
        color: #7f8498;
        font-size: 10px;
        font-family: system-ui, sans-serif;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .qem-conflicts-empty {
        color: #6e7286;
      }
      .qem-conflict-partner-row {
        width: 100%;
        text-align: left;
        background: #181b2b;
        border: 1px solid #2f3346;
        border-radius: 8px;
        color: #d2d6eb;
        font-size: 12px;
        padding: 10px 12px;
        cursor: pointer;
      }
      .qem-conflict-partner-row:active {
        background: #283552;
        border-color: #46618e;
        color: #fff;
      }
      .qem-conflicts-remove-btn {
        width: 100%;
        box-sizing: border-box;
        margin-top: 4px;
        background: #2e1a1f;
        border: 1px solid #6a3036;
        border-radius: 8px;
        color: #f5c4c4;
        font-size: 12px;
        font-weight: 700;
        padding: 10px 12px;
        cursor: pointer;
        font-family: system-ui, sans-serif;
      }
      .qem-conflicts-remove-btn:active {
        background: #452428;
        border-color: #c04848;
        color: #fff;
      }
      .qem-chip.qem-chip-category-toggle {
        border-color: #768;
        color: #bbc;
        border-radius: 8px;
        padding: 7px 12px;
        font-weight: 700;
        letter-spacing: 0.02em;
        min-height: 36px;
      }
      .qem-chip.qem-chip-category-toggle.active {
        border-color: #8af;
        color: #d8ecff;
        background: #1c2b45;
      }
      .qem-chip.qem-chip-suppressed {
        opacity: 0.45;
      }
      .qem-chip.qem-chip-suppressed.qem-chip-confirm {
        opacity: 1;
        border-color: #e8a45a;
        color: #ffd4a8;
      }
      #qem-rule-bar {
        display: flex;
        gap: 6px;
        align-items: center;
        padding: 0 0 2px 0;
      }
      #qem-rule-input {
        flex: 1;
        background: #0e0e18;
        border: 1px solid #333;
        border-radius: 6px;
        color: #e0e0e0;
        font-size: 12px;
        padding: 5px 8px;
        outline: none;
        min-width: 0;
      }
      #qem-rule-input:focus { border-color: #46a; }
      #qem-rule-input::placeholder { color: #444; }
      #qem-rule-add {
        background: none;
        border: 1px solid #46a;
        border-radius: 6px;
        color: #8af;
        font-size: 12px;
        font-weight: 700;
        padding: 5px 10px;
        cursor: pointer;
        flex-shrink: 0;
        white-space: nowrap;
      }
      #qem-rule-add:active { background: #46a; color: #fff; }
    `;
    document.head.appendChild(style);
  }