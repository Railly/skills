import { test, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import React from 'react';
import { writeFileSync } from 'node:fs';
import { createStateStore, applySpecStreamPatch, createSpecStreamCompiler } from '@json-render/core';
import { createStoreAdapter } from '@json-render/core/store-utils';
import { useUIStream } from '/Users/raillyhugo/Programming/vercel/json-render-336-review/packages/react/dist/index.mjs';
import { StateProvider, useStateStore } from '../consumer/index.js';

const variant = process.env.AUDIT_VARIANT || 'head';
const head = variant === 'head';
const output = process.env.AUDIT_TRACE!;
const traces: any[] = [];
const copy = (x: any) => JSON.parse(JSON.stringify(x, (_, v) => v === undefined ? { $undefined: true } : v));
const line = (x: any) => JSON.stringify(x) + '\n';
const initial = () => ({ root: 'main', elements: {}, state: { source: 'keep', items: ['zero', 'one'], count: 0 } });
const badMove = { op: 'move', from: '/state/source', path: '/state/items/01' };
const originalFetch = globalThis.fetch;
function cell(id: string, name: string, body: (trace: any) => Promise<void> | void) {
  test(`${id} ${name}`, async () => {
    const start = performance.now();
    const trace: any = { id, name, variant, observations: [], result: 'preserved invariant' };
    try { await body(trace); trace.test_status = 'pass'; }
    catch (e: any) { trace.test_status = 'fail'; trace.assertion = e.message; throw e; }
    finally { trace.elapsed_ms = performance.now() - start; traces.push(trace); writeFileSync(output, JSON.stringify(traces, null, 2) + '\n'); }
  });
}
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; vi.useRealTimers(); vi.restoreAllMocks(); });

cell('C01', 'invalid immutable writes are allocation and notification no-ops', t => {
  const invalid = ['/items/01', '/items/-1', '/items/1.5', '/items/1e0', '/items/+1', '/items/NaN', '/items/0x1', '/__proto__/auditSentinel'];
  const store = createStateStore({ items: ['a', 'b'], count: 0 });
  let notifications = 0, writes = 0;
  const off = store.subscribe(() => notifications++);
  let snapshot = store.getSnapshot();
  const adapter = createStoreAdapter({ getSnapshot: () => snapshot, setSnapshot: (n: any) => { snapshot = n; writes++; }, subscribe: () => () => {} });
  const before = snapshot;
  for (let round = 0; round < 50; round++) for (const path of invalid) { store.set(path, 'bad'); adapter.set(path, 'bad'); }
  t.observations.push({ attempts: 400, sameStore: store.getSnapshot() === before, sameAdapter: snapshot === before, notifications, writes, state: copy(snapshot), prototype: ({} as any).auditSentinel });
  if (head) { expect(store.getSnapshot()).toBe(before); expect(snapshot).toBe(before); expect(notifications).toBe(0); expect(writes).toBe(0); }
  off(); const n = notifications; store.set('/count', 1); expect(notifications).toBe(n);
  t.cleanup = { owner: 'subscriber', action: 'unsubscribe', deadline: 'before next write', post_unsubscribe_calls: notifications - n };
});

cell('C02', 'progressive batch and immediate identical retry', t => {
  const store = createStateStore({ items: ['a', 'b'], count: 0 });
  let n = 0; const off = store.subscribe(() => n++);
  const update = { '/items/01': 'bad', '/count': 1, '/new': [], '/new/0': 'accepted' };
  const before = copy(store.getSnapshot()); store.update(update); const after = copy(store.getSnapshot());
  const atCommit = n; store.update({ '/items/01': 'bad', '/count': 1 });
  t.observations.push({ before, after, after_retry: copy(store.getSnapshot()), atCommit, afterRetry: n });
  if (head) expect(after).toEqual({ items: ['a', 'b'], count: 1, new: ['accepted'] });
  expect(n).toBe(atCommit); off();
  t.cleanup = { owner: 'subscriber', deadline: 'same turn', unsubscribed: true };
});

cell('C03', 'compound staging rejects source and destination without partial commit', t => {
  const patches = [badMove, { op: 'copy', from: '/state/items/01', path: '/state/copied' }, { op: 'move', from: '/state/items/01', path: '/state/moved' }, { op: 'move', from: '/state/source', path: '/state/__proto__/auditSentinel' }];
  for (const patch of patches) {
    const obj = initial(); const before = copy(obj);
    for (let i = 0; i < 25; i++) applySpecStreamPatch(obj, patch as any);
    t.observations.push({ patch, repeats: 25, before, after: copy(obj), same: JSON.stringify(before) === JSON.stringify(obj) });
    if (head) expect(obj).toEqual(before);
  }
  const obj = initial(); applySpecStreamPatch(obj, badMove as any);
  applySpecStreamPatch(obj, { op: 'move', from: '/state/source', path: '/state/items/1' });
  t.recovery = copy(obj);
  if (head) expect(obj.state.items).toEqual(['zero', 'keep', 'one']);
  t.cleanup = { owner: 'core operation', deadline: 'return', staged_containers: 'no escaped references observable; GC not measured' };
});

cell('C04', 'adapter refusal before commit followed by immediate retry', t => {
  let snapshot: any = { items: ['a'], count: 0 }, calls = 0, fault = true;
  const adapter = createStoreAdapter({ getSnapshot: () => snapshot, setSnapshot: (next: any) => { calls++; if (fault) throw new Error('refused-before-commit'); snapshot = next; }, subscribe: () => () => {} });
  const before = snapshot;
  expect(() => adapter.update({ '/count': 1 })).toThrow('refused-before-commit');
  expect(snapshot).toBe(before); t.observations.push({ partition: 'before external setSnapshot commit', snapshot: copy(snapshot), calls });
  fault = false; adapter.update({ '/count': 1 });
  t.observations.push({ partition: 'immediate retry', snapshot: copy(snapshot), calls });
  expect(snapshot.count).toBe(1); expect(calls).toBe(2);
  t.cleanup = { owner: 'adapter implementer', deadline: 'throw/return', remaining_inflight: 0 };
});

cell('C05', 'adapter ambiguous success partitions replacement versus append', t => {
  for (const mode of ['replace', 'append']) {
    let snapshot: any = { items: [], count: 0 }, calls = 0, fault = true;
    const adapter = createStoreAdapter({ getSnapshot: () => snapshot, setSnapshot: (next: any) => { calls++; snapshot = next; if (fault) throw new Error('failed-after-commit'); }, subscribe: () => () => {} });
    const op = () => mode === 'replace' ? adapter.set('/count', 1) : adapter.set('/items/-', 'x');
    expect(op).toThrow('failed-after-commit'); const committed = copy(snapshot); fault = false; op();
    t.observations.push({ mode, committed, after_retry: copy(snapshot), calls });
    expect(calls).toBe(mode === 'replace' ? 1 : 2);
    if (mode === 'append') expect(snapshot.items).toEqual(['x', 'x']);
  }
  t.result = 'duplicated state for append; replacement retry is idempotent';
  t.attribution = 'baseline comparison required; no idempotency key supplied by API';
  t.cleanup = { owner: 'external adapter', deadline: 'throw/return', pending: 0, rollback: 'not supplied by core' };
});

cell('C06', 'listener throw after state commit cannot be healed by same retry', t => {
  const store = createStateStore({ count: 0 }); let second = 0;
  const off1 = store.subscribe(() => { throw new Error('listener-failed'); });
  const off2 = store.subscribe(() => second++);
  expect(() => store.set('/count', 1)).toThrow('listener-failed');
  const committed = copy(store.getSnapshot()); store.set('/count', 1);
  t.observations.push({ committed, after_retry: copy(store.getSnapshot()), downstream_notifications: second });
  expect(store.get('/count')).toBe(1); expect(second).toBe(0);
  off1(); off2(); store.set('/count', 2);
  t.result = 'recoverable degradation; retry does not redeliver failed notifications';
  t.cleanup = { owner: 'subscriber', deadline: 'before recovery write', detached: true, further_calls: second };
});

cell('C07', 'reentrant conflicting state transition and unsubscribe', t => {
  const store = createStateStore({ count: 0, marker: '' }); const seen: any[] = [];
  const off1 = store.subscribe(() => { seen.push(['first', copy(store.getSnapshot())]); if (store.get('/count') === 1) store.set('/count', 2); });
  const off2 = store.subscribe(() => seen.push(['second', copy(store.getSnapshot())]));
  store.update({ '/count': 1, '/marker': 'committed' });
  t.observations.push({ seen, after: copy(store.getSnapshot()) });
  expect(store.getSnapshot()).toEqual({ count: 2, marker: 'committed' });
  off1(); off2(); const n = seen.length; store.set('/count', 3); expect(seen.length).toBe(n);
  t.cleanup = { owner: 'subscribers', deadline: 'next mutation', post_unsubscribe: 0 };
  t.result = 'preserved final state; synchronous reentrant notifications are not transaction-isolated';
});

cell('C08', 'compiler partial commit then throwing test and immediate replay', t => {
  const compiler = createSpecStreamCompiler();
  const chunk = line({ op: 'add', path: '/count', value: 1 }) + line({ op: 'test', path: '/count', value: 999 }) + line({ op: 'add', path: '/later', value: true });
  expect(() => compiler.push(chunk)).toThrow('Test operation failed');
  const partial = copy(compiler.getResult()); const patchesAtFault = compiler.getPatches().length;
  compiler.push(chunk);
  t.observations.push({ partial, patchesAtFault, after_retry: copy(compiler.getResult()), patchesAfterRetry: compiler.getPatches().length });
  expect(partial).toEqual({ count: 1 }); expect(compiler.getResult()).toEqual({ count: 1, later: true });
  compiler.reset(); expect(compiler.getPatches()).toHaveLength(0); expect(compiler.getResult()).toEqual({});
  t.result = 'recoverable partial commit; failed test is deduplicated on identical replay, not transaction rollback';
  t.cleanup = { owner: 'compiler caller', action: 'reset', deadline: 'before next logical stream', patches: 0, result: {} };
});

cell('C09', 'compiler fragmented malformed input and reconnect/reset', t => {
  const compiler = createSpecStreamCompiler(initial());
  const payload = 'not-json\n{broken}\n' + line(badMove) + line({ op: 'add', path: '/state/later', value: 'accepted' });
  for (let i = 0; i < payload.length; i += 3) compiler.push(payload.slice(i, i + 3));
  const first = copy(compiler.getResult()); compiler.push(payload); const replay = copy(compiler.getResult());
  if (head) expect(first.state.source).toBe('keep'); expect(replay).toEqual(first);
  compiler.reset(initial()); compiler.push(line({ op: 'add', path: '/state/later', value: 'accepted' }));
  t.observations.push({ chunk_bytes: 3, first, replay, reset_then_reconnect: copy(compiler.getResult()) });
  compiler.reset(); expect(compiler.getPatches()).toHaveLength(0);
  t.cleanup = { owner: 'compiler caller', deadline: 'synchronous reset', retained_patch_count: 0 };
});

cell('C10', 'bounded overload experiment plus repeated cleanup cycles', t => {
  const compiler = createSpecStreamCompiler({ items: [] }); const sizes: any[] = [];
  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    compiler.push(line({ op: 'add', path: '/items/01', value: i }));
    if ([99, 499, 999].includes(i)) sizes.push({ inputs: i + 1, retained_patches: compiler.getPatches().length, array_length: (compiler.getResult() as any).items.length });
  }
  for (let round = 0; round < 30; round++) { compiler.reset({ items: [] }); compiler.push(line({ op: 'add', path: '/items/01', value: round })); compiler.reset({ items: [] }); expect(compiler.getPatches()).toHaveLength(0); }
  t.observations.push({ sizes, elapsed_ms: performance.now() - start, cycles: 30, after_reset: copy(compiler.getResult()), retained_patches: compiler.getPatches().length });
  expect(sizes[2].retained_patches).toBe(1000);
  t.result = 'growth proportional to distinct input retained until reset; no built-in queue or byte cap verified';
  t.cleanup = { owner: 'compiler caller', deadline: 'end of each logical stream', action: 'reset', retained_patches: 0, heap_and_gc: 'gap' };
});

function response(text: string) { return { ok: true, body: { getReader: () => { let done = false; return { read: async () => done ? { done: true } : (done = true, { done: false, value: new TextEncoder().encode(text) }) }; } } }; }
async function settle() { for (let i = 0; i < 8; i++) await Promise.resolve(); }
function controlled() {
  const stats = { readers: 0, reads: 0, active: 0, aborts: 0, release: 0, cancel: 0, completions: 0 };
  let resolve: any, reject: any;
  const pending: any[] = [];
  let ended = false;
  const reader = {
    read: () => { stats.reads++; if (pending.length) return Promise.resolve(pending.shift()); if (ended) return Promise.resolve({ done: true }); stats.active++; return new Promise((a, b) => { resolve = a; reject = b; }); },
    releaseLock: () => stats.release++, cancel: async () => { stats.cancel++; finish(); }
  };
  function deliver(value: any) { if (resolve) { const f = resolve; resolve = reject = null; stats.active--; f(value); } else pending.push(value); }
  function finish() { ended = true; stats.completions++; deliver({ done: true }); }
  function fail(e: Error) { ended = true; if (reject) { const f = reject; resolve = reject = null; stats.active--; f(e); } }
  return { stats, emit: (s: string) => deliver({ done: false, value: new TextEncoder().encode(s) }), finish, fail,
    fetch: async (_: any, options: any) => { options.signal.addEventListener('abort', () => { stats.aborts++; fail(Object.assign(new Error('cancelled'), { name: 'AbortError' })); }, { once: true }); return { ok: true, body: { getReader: () => { stats.readers++; return reader; } } }; }
  };
}

cell('H01', 'F1 repeated rejected move and immediate corrective retry through public hook', async t => {
  const h = renderHook(() => useUIStream({ api: '/audit-local' }));
  globalThis.fetch = vi.fn(async () => response(line(badMove) + line(badMove))) as any;
  await act(async () => { await h.result.current.send('move', { previousSpec: initial() }); });
  const rejected = copy(h.result.current.spec);
  globalThis.fetch = vi.fn(async () => response(line({ op: 'move', from: '/state/source', path: '/state/items/1' }))) as any;
  await act(async () => { await h.result.current.send('retry corrected destination', { previousSpec: h.result.current.spec }); });
  const retried = copy(h.result.current.spec);
  globalThis.fetch = vi.fn(async () => response(line({ op: 'add', path: '/state', value: initial().state }))) as any;
  await act(async () => { await h.result.current.send('fresh recovery'); });
  const recovery = copy(h.result.current.spec);
  t.observations.push({ before: initial(), rejected, retried, recovery, error: h.result.current.error, streaming: h.result.current.isStreaming });
  h.unmount(); t.cleanup = { owner: 'hook unmount effect', deadline: 'unmount', reader_cleanup: 'simple response mock has no resource lease' };
  t.result = head ? 'corrupted state; F1 source lost, corrected retry cannot recover source' : 'baseline accepts noncanonical token; repeated move not idempotent';
  if (head) expect(rejected.state.source, 'F1 rejected move must preserve source').toBe('keep');
});

cell('H02', 'dependency refusal/no-body/malformed stream with immediate retry', async t => {
  const faults = [
    { name: 'fetch-refusal', fetch: async () => { throw new Error('offline'); } },
    { name: 'http-503', fetch: async () => ({ ok: false, status: 503, json: async () => { throw new Error('malformed-error-body'); } }) },
    { name: 'no-body', fetch: async () => ({ ok: true, body: null }) },
    { name: 'malformed-jsonl', fetch: async () => response('{broken}\nnoise\n' + line({ op: 'add', path: '/state/count', value: 1 })) }
  ];
  for (const f of faults) {
    const errors: string[] = [], completed: any[] = [];
    const h = renderHook(() => useUIStream({ api: '/audit-local', onError: e => errors.push(e.message), onComplete: s => completed.push(copy(s)) }));
    globalThis.fetch = f.fetch as any; await act(async () => { await h.result.current.send('fault'); });
    const afterFault = { state: copy(h.result.current.spec), error: h.result.current.error?.message, errors: [...errors], complete: completed.length, streaming: h.result.current.isStreaming };
    globalThis.fetch = (async () => response(line({ op: 'add', path: '/state/count', value: 2 }))) as any;
    await act(async () => { await h.result.current.send('immediate retry'); });
    t.observations.push({ fault: f.name, afterFault, retry: copy(h.result.current.spec), retryError: h.result.current.error });
    expect(h.result.current.error).toBeNull(); expect(h.result.current.spec?.state?.count).toBe(2); expect(h.result.current.isStreaming).toBe(false); h.unmount();
  }
  t.cleanup = { owner: 'hook finally/unmount', deadline: 'send settles, then unmount', active_mock_operations: 0 };
});

for (const partition of ['before-patch', 'after-first-patch', 'after-last-patch-before-eof']) {
  cell(`H03-${partition}`, 'forced deadline while reader pending, then immediate retry', async t => {
    const source = controlled(); const errors: string[] = [];
    globalThis.fetch = source.fetch as any;
    const h = renderHook(() => useUIStream({ api: '/audit-local', onError: e => errors.push(e.message) }));
    let pending: Promise<void>;
    await act(async () => { pending = h.result.current.send('stalled'); await settle(); });
    if (partition !== 'before-patch') await act(async () => { source.emit(line({ op: 'add', path: '/state/count', value: 1 })); await settle(); });
    if (partition === 'after-last-patch-before-eof') await act(async () => { source.emit(line({ op: 'add', path: '/state/done', value: true })); await settle(); });
    const during = { spec: copy(h.result.current.spec), streaming: h.result.current.isStreaming, stats: { ...source.stats } };
    await act(async () => { source.fail(new Error('external-deadline')); await pending!; });
    const fault = { spec: copy(h.result.current.spec), error: h.result.current.error?.message, streaming: h.result.current.isStreaming, stats: { ...source.stats } };
    globalThis.fetch = (async () => response(line({ op: 'add', path: '/state/recovered', value: true }))) as any;
    await act(async () => { await h.result.current.send('immediate retry'); });
    t.observations.push({ partition, during, fault, after_retry: copy(h.result.current.spec), errors });
    expect(during.streaming).toBe(true); expect(fault.streaming).toBe(false); expect(fault.error).toBe('external-deadline'); expect(source.stats.active).toBe(0); expect(h.result.current.spec?.state?.recovered).toBe(true);
    h.unmount(); t.cleanup = { owner: 'transport mock settles pending read; hook clears flag', deadline: 'send settlement', stats: source.stats, lock_release: 'not called by hook', real_fetch_timeout: 'gap; no built-in deadline' };
    t.result = 'recoverable partial state; external deadline required; no rollback promised for full stream';
  });
}

cell('H04', 'unmount cancellation before and after visible commit', async t => {
  for (const committed of [false, true]) {
    const source = controlled(); const completions: any[] = [], errors: any[] = [];
    globalThis.fetch = source.fetch as any;
    const h = renderHook(() => useUIStream({ api: '/audit-local', onComplete: s => completions.push(s), onError: e => errors.push(e) }));
    let pending: Promise<void>;
    await act(async () => { pending = h.result.current.send('cancel'); await settle(); });
    if (committed) await act(async () => { source.emit(line({ op: 'add', path: '/state/count', value: 1 })); await settle(); });
    const before = copy(h.result.current.spec);
    await act(async () => { h.unmount(); await pending!; });
    t.observations.push({ committed, before, stats: { ...source.stats }, completions: completions.length, errors: errors.length });
    expect(source.stats.aborts).toBe(1); expect(source.stats.active).toBe(0); expect(completions).toHaveLength(0); expect(errors).toHaveLength(0);
    const retry = renderHook(() => useUIStream({ api: '/audit-local' }));
    globalThis.fetch = (async () => response(line({ op: 'add', path: '/state/retry', value: true }))) as any;
    await act(async () => { await retry.result.current.send('remount retry'); });
    expect(retry.result.current.spec?.state?.retry).toBe(true); retry.unmount();
  }
  t.cleanup = { owner: 'hook effect aborts; transport mock rejects read', deadline: 'unmount and pending promise settlement', active_reads: 0, real_reader_release: 'gap' };
});

cell('H05', 'superseding request conflict and immediate retry while old cancellation settles', async t => {
  const a = controlled(), b = controlled(); let request = 0;
  globalThis.fetch = ((...args: any[]) => (++request === 1 ? a : b).fetch(...args as [any, any])) as any;
  const h = renderHook(() => useUIStream({ api: '/audit-local' })); let p1: Promise<void>, p2: Promise<void>;
  await act(async () => { p1 = h.result.current.send('first'); await settle(); });
  await act(async () => { p2 = h.result.current.send('supersede'); await settle(); });
  const during = { streaming: h.result.current.isStreaming, a: { ...a.stats }, b: { ...b.stats } };
  await act(async () => { b.emit(line({ op: 'add', path: '/state/winner', value: 'second' })); b.finish(); await Promise.all([p1!, p2!]); });
  t.observations.push({ during, after: copy(h.result.current.spec), final_streaming: h.result.current.isStreaming });
  expect(h.result.current.spec?.state?.winner).toBe('second'); expect(a.stats.active + b.stats.active).toBe(0); h.unmount();
  t.result = during.streaming ? 'preserved invariant' : 'stale streaming flag during supersession; baseline attribution required';
  t.cleanup = { owner: 'hook abort + transport', deadline: 'both sends settled', active_reads: 0 };
});

cell('H06', '8 concurrent independent hooks over 10 failure/recovery cycles', async t => {
  const rounds: any[] = []; const heapStart = process.memoryUsage().heapUsed;
  for (let round = 0; round < 10; round++) {
    const sources = Array.from({ length: 8 }, () => controlled());
    globalThis.fetch = ((url: string, options: any) => sources[Number(url.split('/').pop())].fetch(url, options)) as any;
    const hooks = sources.map((_, i) => renderHook(() => useUIStream({ api: `/audit/${i}` })));
    const promises: Promise<void>[] = [];
    await act(async () => { for (const h of hooks) promises.push(h.result.current.send('parallel')); await settle(); });
    await act(async () => {
      sources.forEach((s, i) => { s.emit(line({ op: 'add', path: '/state/owner', value: i })); }); await settle();
      hooks.forEach((h, i) => { if (i % 2 === 0) h.unmount(); else sources[i].finish(); }); await Promise.all(promises);
    });
    hooks.forEach((h, i) => { if (i % 2) { expect(h.result.current.spec?.state?.owner).toBe(i); h.unmount(); } });
    const active = sources.reduce((n, s) => n + s.stats.active, 0); expect(active).toBe(0);
    rounds.push({ round, active_reads: active, readers: sources.reduce((n, s) => n + s.stats.readers, 0), abort_signals: sources.reduce((n, s) => n + s.stats.aborts, 0) });
  }
  t.observations.push({ rounds, mounts: 80, heap_start: heapStart, heap_end: process.memoryUsage().heapUsed, heap_note: 'diagnostic only, GC not forced, not proof of leak freedom' });
  t.cleanup = { owner: 'hook unmount and mock transport', deadline: 'each round', active_reads_bound: 0, listeners: 'mock signal objects dropped each round', process_and_fd: 'real transport gap' };
});

cell('H07', 'completion callback failure after commit with immediate previousSpec retry', async t => {
  let callbacks = 0, fail = true;
  globalThis.fetch = (async () => response(line({ op: 'add', path: '/state/items/-', value: 'x' }))) as any;
  const h = renderHook(() => useUIStream({ api: '/audit-local', onComplete: () => { callbacks++; if (fail) throw new Error('completion-sink-failed'); } }));
  await act(async () => { await h.result.current.send('append', { previousSpec: initial() }); });
  const committed = copy(h.result.current.spec); const error = h.result.current.error?.message; fail = false;
  await act(async () => { await h.result.current.send('same operation', { previousSpec: h.result.current.spec }); });
  t.observations.push({ committed, error, after_retry: copy(h.result.current.spec), callbacks });
  expect(error).toBe('completion-sink-failed'); expect(h.result.current.spec?.state?.items).toEqual(['zero', 'one', 'x', 'x']); h.unmount();
  t.result = 'duplicated append after ambiguous callback success; no stream idempotency key';
  t.cleanup = { owner: 'hook finally/unmount; callback owner for sink compensation', deadline: 'send settlement', streaming: false };
});

function provider(onChange: (changes: any) => void) {
  const state = { items: ['a', 'b'], count: 0 };
  return renderHook(() => useStateStore(), { wrapper: ({ children }: any) => React.createElement(StateProvider, { initialState: state, onStateChange: onChange }, children) });
}

cell('P01', 'F2 mixed rejected callbacks, repeated updates and exact immediate retry', async t => {
  const events: any[] = []; const h = provider(changes => events.push(copy(changes)));
  const rounds: any[] = [];
  for (let i = 1; i <= 25; i++) {
    const update = { '/items/01': 'rejected', '/count': i };
    await act(async () => { h.result.current.update(update); });
    const count = events.length; const state = copy(h.result.current.getSnapshot());
    await act(async () => { h.result.current.update(update); });
    rounds.push({ i, state, callback: events[count - 1], events_before_retry: count, events_after_retry: events.length });
    expect(events.length).toBe(count);
  }
  t.observations.push({ rounds }); h.unmount();
  t.cleanup = { owner: 'StateProvider/useSyncExternalStore', deadline: 'unmount', callbacks_after_exact_retry: 0, external_sink_rollback: 'not supplied' };
  t.result = head ? 'F2 callback claims rejected path was written; persists across repetition' : 'baseline callback matches coerced write';
  if (head) expect(events[0], 'F2 rejected entry must not escape to persistence callback').toEqual([{ path: '/count', value: 1 }]);
});

cell('P02', 'provider callback sink fails before/after its own commit, then same retry', async t => {
  for (const stage of ['before-sink', 'after-sink']) {
    let calls = 0, sink: any[] = [], fault = true;
    const h = provider(changes => { calls++; if (fault && stage === 'before-sink') throw new Error(stage); sink.push(copy(changes)); if (fault) throw new Error(stage); });
    let caught: string | undefined;
    await act(async () => { try { h.result.current.update({ '/count': 1 }); } catch (e: any) { caught = e.message; } });
    const committed = copy(h.result.current.getSnapshot()); fault = false;
    await act(async () => { h.result.current.update({ '/count': 1 }); });
    t.observations.push({ stage, caught, committed, after_retry: copy(h.result.current.getSnapshot()), callback_calls: calls, sink });
    expect(committed.count).toBe(1); expect(calls).toBe(1); expect(sink.length).toBe(stage === 'before-sink' ? 0 : 1); h.unmount();
  }
  t.result = 'caller-level persistence gap after local commit; identical retry suppresses callback instead of rolling back/redelivering';
  t.cleanup = { owner: 'application callback sink', deadline: 'application-defined; absent from library contract', pending: 0, automatic_compensation: false };
});

cell('H08', 'fetch stalls before response and external logical deadline fires', async t => {
  let rejectFetch: any, signals: AbortSignal[] = [];
  globalThis.fetch = ((_: any, options: any) => { signals.push(options.signal); return new Promise((_, reject) => { rejectFetch = reject; }); }) as any;
  const h = renderHook(() => useUIStream({ api: '/audit-local' })); let pending: Promise<void>;
  await act(async () => { pending = h.result.current.send('no-response'); await settle(); });
  const during = { streaming: h.result.current.isStreaming, spec: copy(h.result.current.spec), requests: signals.length };
  await act(async () => { rejectFetch(new Error('fetch-external-deadline')); await pending!; });
  const failed = { error: h.result.current.error?.message, streaming: h.result.current.isStreaming };
  globalThis.fetch = (async () => response(line({ op: 'add', path: '/state/recovered', value: true }))) as any;
  await act(async () => { await h.result.current.send('immediate retry'); });
  t.observations.push({ during, failed, after_retry: copy(h.result.current.spec), first_signal_aborted_on_retry: signals[0].aborted });
  expect(during.streaming).toBe(true); expect(failed.streaming).toBe(false); expect(h.result.current.error).toBeNull(); h.unmount();
  t.result = 'recoverable rejection under externally supplied deadline; no hook timeout';
  t.cleanup = { owner: 'fetch implementation rejects; hook aborts old signal on retry', deadline: 'external deadline and next send', pending_fetches: 0 };
});

cell('H09', 'onError throws at last fallible stage after a committed patch', async t => {
  const source = controlled(); globalThis.fetch = source.fetch as any;
  const h = renderHook(() => useUIStream({ api: '/audit-local', onError: () => { throw new Error('error-sink-failed'); } }));
  let pending: Promise<void>, caught: any;
  await act(async () => { pending = h.result.current.send('callback-error'); await settle(); });
  await act(async () => { source.emit(line({ op: 'add', path: '/state/count', value: 1 })); await settle(); });
  await act(async () => { source.fail(new Error('disconnect')); try { await pending!; } catch (e: any) { caught = e.message; } });
  const afterFault = { spec: copy(h.result.current.spec), streaming: h.result.current.isStreaming, error: h.result.current.error?.message, rejected_send: caught };
  globalThis.fetch = (async () => response(line({ op: 'add', path: '/state/count', value: 2 }))) as any;
  await act(async () => { await h.result.current.send('retry'); });
  t.observations.push({ afterFault, retry: copy(h.result.current.spec), stats: source.stats });
  expect(caught).toBe('error-sink-failed'); expect(afterFault.streaming).toBe(false); expect(h.result.current.error).toBeNull(); h.unmount();
  t.result = 'error callback exception propagates but finally clears streaming';
  t.cleanup = { owner: 'hook finally + caller catch', deadline: 'send promise settlement', active_reads: source.stats.active, callback_sink: 'application-owned' };
});

cell('H10', 'malformed upstream patch shape is signaled and retry recovers', async t => {
  for (const patch of [{ op: 'add', path: 17, value: 1 }, { op: 'move', from: 17, path: '/state/moved' }]) {
    globalThis.fetch = (async () => response(line(patch))) as any;
    const h = renderHook(() => useUIStream({ api: '/audit-local' }));
    await act(async () => { await h.result.current.send('malformed shape', { previousSpec: initial() }); });
    const afterFault = { spec: copy(h.result.current.spec), error: h.result.current.error?.message, streaming: h.result.current.isStreaming };
    globalThis.fetch = (async () => response(line({ op: 'add', path: '/state/recovered', value: true }))) as any;
    await act(async () => { await h.result.current.send('retry'); });
    t.observations.push({ patch, afterFault, after_retry: copy(h.result.current.spec) });
    expect(afterFault.streaming).toBe(false); expect(h.result.current.error).toBeNull(); expect(h.result.current.spec?.state?.recovered).toBe(true); h.unmount();
  }
  t.result = 'malformed schema is rejected at runtime, stream error signaled, retry recovers';
  t.cleanup = { owner: 'hook finally/unmount', deadline: 'send settles', mock_requests_pending: 0 };
});

cell('H11', 'burst growth and explicit fresh-send cleanup of raw lines', async t => {
  const source = controlled(); globalThis.fetch = source.fetch as any;
  const h = renderHook(() => useUIStream({ api: '/audit-local' })); let pending: Promise<void>;
  await act(async () => { pending = h.result.current.send('burst'); await settle(); });
  const sizes: any[] = [];
  for (let batch = 0; batch < 4; batch++) {
    const burst = Array.from({ length: 128 }, (_, i) => line({ op: 'add', path: '/state/count', value: batch * 128 + i })).join('');
    await act(async () => { source.emit(burst); await settle(); });
    sizes.push({ delivered: (batch + 1) * 128, retained_raw_lines: h.result.current.rawLines.length, state: copy(h.result.current.spec) });
  }
  await act(async () => { source.finish(); await pending!; });
  await act(async () => { h.result.current.clear(); });
  const afterClear = { spec: h.result.current.spec, raw_lines: h.result.current.rawLines.length };
  globalThis.fetch = (async () => response(line({ op: 'add', path: '/state/count', value: 0 }))) as any;
  await act(async () => { await h.result.current.send('fresh retry'); });
  t.observations.push({ sizes, afterClear, after_fresh_send: { raw_lines: h.result.current.rawLines.length, state: copy(h.result.current.spec) }, stats: source.stats });
  expect(sizes[3].retained_raw_lines).toBe(512); expect(h.result.current.rawLines).toHaveLength(1); h.unmount();
  t.result = 'raw line retention grows with input and survives clear; fresh send resets, no built-in overload cap';
  t.cleanup = { owner: 'hook next send/unmount, application caps ingress', deadline: 'new send', active_reads: source.stats.active, retained_raw_lines_after_new_send: 1, maximum_supported_load: 'gap' };
});

cell('C11', 'accessor refuses read before immutable commit and retry succeeds', t => {
  let fault = true, writes = 0;
  const items = ['a'];
  let snapshot: any = Object.defineProperty({ count: 0 }, 'items', { enumerable: true, get: () => { if (fault) throw new Error('accessor-refused'); return items; } });
  const before = snapshot;
  const adapter = createStoreAdapter({ getSnapshot: () => snapshot, setSnapshot: n => { snapshot = n; writes++; }, subscribe: () => () => {} });
  expect(() => adapter.set('/items/0', 'b')).toThrow('accessor-refused');
  const atFault = { same_snapshot: snapshot === before, writes, original_array: [...items] };
  fault = false; adapter.set('/items/0', 'b');
  t.observations.push({ atFault, after_retry: copy(snapshot), writes, original_array: [...items] });
  expect(atFault.same_snapshot).toBe(true); expect(atFault.writes).toBe(0); expect(writes).toBe(1); expect(items).toEqual(['a']);
  t.cleanup = { owner: 'accessor/adapter owner', deadline: 'before immediate retry', fault_disabled: true, pending: 0 };
});

cell('C12', 'frozen destination throws after source removal, then immediate retry', t => {
  for (const mode of ['frozen', 'throwing-setter', 'commit-only-setter']) {
    let obj: any = { source: 'keep', locked: { value: 'before' } };
    const destination = obj.locked;
    if (mode === 'frozen') Object.freeze(obj.locked);
    else Object.defineProperty(obj.locked, 'value', { enumerable: true, configurable: true, get: () => 'before', set: function () { if (mode === 'throwing-setter' || this === destination) throw new Error('setter-refused'); } });
    const before = copy(obj); let error: any;
    try { applySpecStreamPatch(obj, { op: 'move', from: '/source', path: '/locked/value' }); } catch (e: any) { error = e.message; }
    const afterFault = copy(obj); const sourceGone = !Object.hasOwn(obj, 'source');
    obj.locked = { value: 'before' };
    applySpecStreamPatch(obj, { op: 'move', from: '/source', path: '/locked/value' });
    const retried = copy(obj);
    obj.source = before.source;
    applySpecStreamPatch(obj, { op: 'move', from: '/source', path: '/locked/value' });
    t.observations.push({ mode, before, error, afterFault, sourceGone, after_immediate_retry: retried, explicit_compensation: copy(obj) });
    expect(error).toBeTruthy(); expect(sourceGone).toBe(!head || mode === 'commit-only-setter'); expect(obj.locked.value).toBe('keep');
  }
  t.result = head ? 'frozen and always-throwing setter fail safely in staging; commit-only setter still corrupts source, outside plain JSON' : 'all three non-JSON destination failures occur after source removal';
  t.cleanup = { owner: 'caller supplying non-JSON object', deadline: 'before safe retry', action: 'replace failing destination and restore source from independent snapshot', automatic_rollback: false };
});

cell('C13', 'unrelated cyclic branch survives repeated rejected move without traversal', t => {
  const cycle: any = { label: 'cycle' }; cycle.self = cycle;
  const obj: any = { source: 'keep', items: ['a', 'b'], unrelated: cycle };
  for (let i = 0; i < 100; i++) applySpecStreamPatch(obj, { op: 'move', from: '/source', path: '/items/01' });
  t.observations.push({ repeats: 100, same_cycle: obj.unrelated === cycle, cycle_intact: obj.unrelated.self === cycle, source_present: Object.hasOwn(obj, 'source'), items: copy(obj.items) });
  expect(obj.unrelated).toBe(cycle); expect(obj.unrelated.self).toBe(cycle);
  if (head) expect(obj.source).toBe('keep');
  t.cleanup = { owner: 'caller drops graph after operation', deadline: 'test return', garbage_collection: 'gap; identity invariant only' };
});
