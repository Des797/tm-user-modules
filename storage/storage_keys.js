// === SECTION: storage keys | filename: storage_keys ===
  const RECENT_KEY  = 'r34_recent_tags';
  const FREQ_KEY    = 'r34_tag_freq';
  const COUNT_KEY   = 'r34_tag_counts'; // {tag: {count, ts}}
  const COUNT_TTL      = 7 * 24 * 60 * 60 * 1000; // 7 days
  const RELATIONS_KEY  = 'r34_relations';   // string[] of rule strings
  const BLACKLIST_KEY  = 'r34_blocked_tags'; // string[]