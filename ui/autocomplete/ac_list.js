// === SECTION: autocomplete list and styles | filename: ac_list ===
  /* Shared dropdown list element — one instance reused across all callers */
  let _acList = null;
  function getAcList() {
    if (_acList) return _acList;
    if (!document.getElementById('qem-ac-styles')) {
      const style = document.createElement('style');
      style.id = 'qem-ac-styles';
      style.textContent = `
        #qem-ac-list {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 680px;
          z-index: 1000002;
          background: #111118;
          border: 1px solid #2a2a3a;
          max-height: 180px;
          overflow-y: auto;
          display: none;
          box-sizing: border-box;
        }
        #qem-ac-list.visible { display: block; }
        .qem-ac-item {
          padding: 9px 14px;
          font-size: 13px;
          font-family: monospace;
          color: #ddd;
          cursor: pointer;
          border-bottom: 1px solid #1e1e2a;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .qem-ac-item:active { background: #2a2a40; }
        .qem-ac-item-count {
          color: #555;
          font-size: 11px;
          margin-left: 8px;
          flex-shrink: 0;
        }
      `;
      document.head.appendChild(style);
    }
    _acList = document.createElement('div');
    _acList.id = 'qem-ac-list';
    document.body.appendChild(_acList);
    return _acList;
  }