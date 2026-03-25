// === SECTION: api client | filename: api_client ===
  /* Fetch post count for a single tag via dapi; calls back with count string or null */
  function fetchTagCount(tag, cb) {
    const cache = getCountCache();
    const entry = cache[tag];
    if (entry && (Date.now() - entry.ts) < COUNT_TTL) { cb(entry.count); return; }

    const url = `https://api.rule34.xxx/index.php?page=dapi&s=tag&q=index&name=${encodeURIComponent(tag)}&api_key=${AC_API_KEY}&user_id=${AC_USER_ID}`;
    GM_xmlhttpRequest({
      method: 'GET',
      url,
      onload(res) {
        try {
          /* Response is XML: <tags><tag count="..." .../></tags> */
          const match = res.responseText.match(/count="(\d+)"/);
          if (!match) { cb(null); return; }
          const count = Number(match[1]);
          const c = getCountCache();
          c[tag] = { count, ts: Date.now() };
          saveCountCache(c);
          cb(count);
        } catch { cb(null); }
      },
      onerror() { cb(null); },
    });
  }

  /* Like fetchTagCount but no TTL — good enough forever for relation/blacklist tags */
  function fetchTagCountPermanent(tag, cb) {
    const cache = getCountCache();
    const entry = cache[tag];
    if (entry) { cb(entry.count); return; } // cached forever, no TTL check
    fetchTagCount(tag, cb); // falls through to normal fetch which will cache it
  }