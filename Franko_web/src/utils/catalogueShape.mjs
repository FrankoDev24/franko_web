// Accept known Lambda/API wrappers, but never pass error objects to array consumers.
export function catalogueRows(value, key) {
  for (let depth = 0; depth < 4; depth++) {
    if (typeof value === 'string') {
      try { value = JSON.parse(value); } catch { return null; }
    }
    if (Array.isArray(value)) return value.filter(row => row && typeof row === 'object' && !Array.isArray(row));
    if (!value || typeof value !== 'object') return null;
    value = value[key] ?? value.data ?? value.body;
  }
  return null;
}

export function sanitizePersistedCatalogue(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return undefined;
  const next = { ...state };
  for (const [slice, fields] of [
    ['categories', ['categories']], ['brands', ['brands']],
    ['showrooms', ['showrooms', 'homePageShowrooms']],
    ['advertisment', ['advertisments']],
  ]) {
    const saved = state[slice];
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) { delete next[slice]; continue; }
    next[slice] = { ...saved, loading: false, error: null };
    for (const field of fields) next[slice][field] = catalogueRows(saved[field], field) || [];
    if (slice === 'brands') next[slice].lastFetched = 0;
  }
  return next;
}
