// MIRROR STYLES: `injectMirrorStyles()` — injects the `#qem-mirror-styles` stylesheet on first call (guarded by id check). Contains all CSS for the fixed bottom mirror panel: shell, backdrop, titlebar buttons, body layout, collapsible textarea section, chip rows (recent/favorites/related), and the quick-rule bar.

  function injectMirrorStyles() {
    if (document.getElementById('qem-mirror-styles')) return;
    const style = document.createElement('style');
    style.id = 'qem-mirror-styles';
    style.textContent = `
      #qem-mirror {
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 680px;
        z-index: 999990;
        background: #1a1a24;
        border-top: 2px solid #e84040;
        border-left: 1px solid #2a2a3a;
        border-right: 1px solid #2a2a3a;
        border-radius: 10px 10px 0 0;
        display: none;
        flex-direction: column;
        box-shadow: 0 -4px 24px rgba(0,0,0,0.7);
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
        padding: 4px 8px;
        border-bottom: 1px solid #2a2a3a;
        flex-shrink: 0;
        position: relative;
      }
      #qem-mirror-title { display: none; }
      #qem-tbar-scroll { flex-shrink: 0; }
      #qem-tbar-min {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
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
        touch-action: pan-x pan-y;
        overscroll-behavior: contain;
      }
      #qem-mirror.minimized #qem-mirror-body { display: none; }
      #qem-mirror.minimized #qem-mirror-titlebar { border-bottom: none; }
      #qem-mirror-textarea { touch-action: pan-x pan-y; }
      #qem-mirror-tags-wrap.collapsed #qem-mirror-textarea { display: none; }
      #qem-mirror-tags-wrap.collapsed #qem-mirror-label::after { content: '▸'; }
      #qem-mirror-label { cursor: pointer; display: flex; align-items: center; gap: 4px; color: #666; font-size: 10px; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; width: 100%; margin-bottom: 1px; }
      #qem-mirror-label::after { content: '▾'; font-size: 10px; margin-left: auto; transition: transform 0.15s; }
      #qem-mirror-textarea {
        width: 100%;
        box-sizing: border-box;
        background: #0e0e18;
        color: #e0e0e0;
        border: 1px solid #333;
        border-radius: 6px;
        font-size: 13px;
        font-family: monospace;
        padding: 8px;
        resize: none;
        min-height: 120px;
        outline: none;
        line-height: 1.5;
      }
      #qem-mirror-textarea:focus { border-color: #e84040; }
      .qem-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        padding: 2px 0;
      }
      .qem-chips.collapsed .qem-chip { display: none !important; }
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
      .qem-chip {
        background: #2a2a38;
        color: #ccc;
        border: 1px solid #444;
        border-radius: 20px;
        padding: 8px 10px;
        font-size: 13px;
        font-family: monospace;
        cursor: pointer;
        white-space: nowrap;
        user-select: none;
        transition: background 0.15s, color 0.15s;
      }
      .qem-chip:active { background: #e84040; color: #fff; border-color: #e84040; }
      .qem-chip.qem-chip-recent  { border-color: #555; }
      .qem-chip.qem-chip-fav     { border-color: #7a4; color: #9c6; }
      .qem-chip.qem-chip-related { border-color: #46a; color: #8af; }
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
        font-family: monospace;
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