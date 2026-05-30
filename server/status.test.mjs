import { describe, it, expect } from 'vitest';
import { computeStatus } from './status.mjs';

describe('computeStatus', () => {
  it('synced when installed matches current source', () => {
    expect(computeStatus({ hInst: 'A', hSrc: 'A', hBase: 'A' })).toBe('synced');
    // identical content even if base differs (both edited the same way)
    expect(computeStatus({ hInst: 'X', hSrc: 'X', hBase: 'A' })).toBe('synced');
  });

  it('source-updated when only the source moved', () => {
    expect(computeStatus({ hInst: 'A', hSrc: 'B', hBase: 'A' })).toBe('source-updated');
  });

  it('drift when only the installed copy changed', () => {
    expect(computeStatus({ hInst: 'B', hSrc: 'A', hBase: 'A' })).toBe('drift');
  });

  it('conflict when both changed and differ', () => {
    expect(computeStatus({ hInst: 'B', hSrc: 'C', hBase: 'A' })).toBe('conflict');
  });

  it('unknown fallback when no baseline and copies differ', () => {
    expect(computeStatus({ hInst: 'A', hSrc: 'B', hBase: null })).toBe('unknown');
  });

  it('synced when no baseline but copies match', () => {
    expect(computeStatus({ hInst: 'A', hSrc: 'A', hBase: null })).toBe('synced');
  });
});
