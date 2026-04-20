// STORAGE KEYS: GM storage key constants (`RECENT_KEY`, `FREQ_KEY`, `COUNT_KEY`, `RELATIONS_KEY`, `BLACKLIST_KEY`) and `COUNT_TTL` (7-day ms value). Also includes draft keys and `DRAFT_TTL` for persisted manager input drafts.
  const RECENT_KEY  = 'r34_recent_tags';
  const FREQ_KEY    = 'r34_tag_freq';
  const COUNT_KEY   = 'r34_tag_counts'; // {tag: {count, ts}}
  const COUNT_TTL      = 7 * 24 * 60 * 60 * 1000; // 7 days
  const DRAFT_TTL      = 7 * 24 * 60 * 60 * 1000; // 7 days
  const RELATIONS_KEY  = 'r34_relations';   // string[] of rule strings
  const BLACKLIST_KEY  = 'r34_blocked_tags'; // string[]
  const CATEGORIES_KEY = 'r34_categories'; // {slug: {name, createdAt, updatedAt}}
  const CATEGORY_MEMBERSHIP_KEY = 'r34_category_membership'; // {tag: string[]}
  const CATEGORY_HIERARCHY_KEY = 'r34_category_hierarchy'; // {parentSlug: string[]childSlugs}
  const CATEGORY_ADD_DRAFTS_KEY = 'r34_category_add_drafts';
  const RELATIONS_FORM_DRAFT_KEY = 'r34_relations_form_draft';
  const BLACKLIST_ADD_DRAFT_KEY = 'r34_blacklist_add_draft';