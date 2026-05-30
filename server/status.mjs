/**
 * Classify an installed skill copy. Pure function over three hashes.
 * @returns {'synced'|'source-updated'|'drift'|'conflict'|'unknown'}
 */
export function computeStatus({ hInst, hSrc, hBase }) {
  if (hInst === hSrc) return 'synced';
  if (hBase == null) return 'unknown';
  const instChanged = hInst !== hBase;
  const srcChanged = hSrc !== hBase;
  if (srcChanged && !instChanged) return 'source-updated';
  if (instChanged && !srcChanged) return 'drift';
  return 'conflict';
}
