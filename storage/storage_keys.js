// STORAGE KEYS: GM storage key constants (`RECENT_KEY`, `FREQ_KEY`, `COUNT_KEY`, `RELATIONS_KEY`, `BLACKLIST_KEY`) and `COUNT_TTL` (7-day ms value). Centralises all GM key strings so they are never hardcoded elsewhere.
  const RECENT_KEY  = 'r34_recent_tags';
  const FREQ_KEY    = 'r34_tag_freq';
  const COUNT_KEY   = 'r34_tag_counts'; // {tag: {count, ts}}
  const COUNT_TTL      = 7 * 24 * 60 * 60 * 1000; // 7 days
  const RELATIONS_KEY  = 'r34_relations';   // string[] of rule strings
  const BLACKLIST_KEY  = 'r34_blocked_tags'; // string[]