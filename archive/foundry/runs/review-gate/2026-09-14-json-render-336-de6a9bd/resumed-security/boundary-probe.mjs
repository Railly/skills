import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import * as source from '/Users/raillyhugo/Programming/vercel/json-render-336-review/packages/core/src/types.ts';
import * as sourceStore from '/Users/raillyhugo/Programming/vercel/json-render-336-review/packages/core/src/state-store.ts';
import * as esm from '/Users/raillyhugo/Programming/vercel/json-render-336-review/packages/core/dist/index.mjs';
import * as esmStore from '/Users/raillyhugo/Programming/vercel/json-render-336-review/packages/core/dist/store-utils.mjs';
const require = createRequire(import.meta.url);
const cjs = require('/Users/raillyhugo/Programming/vercel/json-render-336-review/packages/core/dist/index.js');
const cjsStore = require('/Users/raillyhugo/Programming/vercel/json-render-336-review/packages/core/dist/store-utils.js');
const marker = '__json336_security_local_marker__';
const originalPrototypes = [Object.prototype, Array.prototype, Function.prototype].map(p => [p, Object.getOwnPropertyDescriptors(p)]);
const fixture = () => JSON.parse('{"source":"keep","items":[{"ok":1}],"safe":{},"a/b~c":{},"__proto__":{"local":1},"constructor":{"prototype":{"local":2}},"prototype":{"local":3}}');
const paths = ['__proto__','constructor','prototype'].flatMap(token => [`/${token}`, `/${token}/${marker}`, `/safe/${token}/${marker}`, `/items/0/${token}/${marker}`, `/a~1b~0c/${token}/${marker}`, `${token}/${marker}`]);
const results = [];
let checks = 0;
function check(name, fn) {
  try { fn(); checks++; }
  catch (error) { throw new Error(name, { cause: error }); }
}
function unchanged(obj, before) {
  assert.deepEqual(obj, before);
  for (const [p, descriptors] of originalPrototypes) assert.deepEqual(Object.getOwnPropertyDescriptors(p), descriptors);
  assert.equal(({})[marker], undefined);
  assert.equal([][marker], undefined);
}
for (const [format, core, stores] of [['exact-head-source', {...source, ...sourceStore}, sourceStore], ['built-esm', esm, esmStore], ['built-cjs', cjs, cjsStore]]) {
  const started = checks;
  for (const path of paths) {
    check(`${format}:read:${path}`, () => assert.equal(core.getByPath(fixture(), path), undefined));
    for (const operation of ['setByPath','addByPath','removeByPath']) check(`${format}:${operation}:${path}`, () => {
      const obj = fixture(); const before = structuredClone(obj);
      core[operation](obj, path, marker); unchanged(obj, before);
    });
    check(`${format}:immutable:${path}`, () => {
      const obj = fixture(); const before = structuredClone(obj);
      assert.equal(stores.immutableSetByPath(obj, path, marker), obj); unchanged(obj, before);
    });
    check(`${format}:store:${path}`, () => {
      const store = core.createStateStore(fixture()); const before = store.getSnapshot(); const copy = structuredClone(before);
      let calls = 0; const unsubscribe = store.subscribe(() => calls++);
      assert.equal(store.get(path), undefined); store.set(path, marker); store.update({[path]: marker});
      assert.equal(store.getSnapshot(), before); assert.equal(calls, 0); unchanged(before, copy); unsubscribe();
    });
    check(`${format}:adapter:${path}`, () => {
      let snapshot = fixture(); const before = snapshot; const copy = structuredClone(before); let writes = 0;
      const adapter = stores.createStoreAdapter({getSnapshot: () => snapshot, setSnapshot: next => {snapshot = next; writes++;}, subscribe: () => () => {}});
      assert.equal(adapter.get(path), undefined); adapter.set(path, marker); adapter.update({[path]: marker});
      assert.equal(snapshot, before); assert.equal(writes, 0); unchanged(snapshot, copy);
    });
    const patches = ['add','replace','remove','test'].map(op => ({op, path, value: marker}));
    for (const op of ['move','copy']) patches.push({op, from: '/source', path}, {op, from: path, path: '/copied'});
    for (const patch of patches) {
      check(`${format}:patch:${JSON.stringify(patch)}`, () => {
        const obj = fixture(); const before = structuredClone(obj);
        assert.equal(core.applySpecStreamPatch(obj, patch), obj); unchanged(obj, before);
      });
      check(`${format}:wire:${JSON.stringify(patch)}`, () => {
        const obj = fixture(); const before = structuredClone(obj);
        const wire = JSON.stringify(patch) + '\n' + JSON.stringify({op: 'add', path: '/after', value: 'accepted'});
        const expected = {...before, after: 'accepted'};
        assert.deepEqual(core.compileSpecStream(wire, obj), expected); unchanged(obj, before);
        const compiler = core.createSpecStreamCompiler(fixture());
        for (let i = 0; i < wire.length; i += 7) compiler.push(wire.slice(i, i + 7));
        assert.deepEqual(compiler.getResult(), expected);
        for (const [p, descriptors] of originalPrototypes) assert.deepEqual(Object.getOwnPropertyDescriptors(p), descriptors);
      });
    }
  }
  check(`${format}:JSON-escaped-token`, () => {
    const wire = '{"op":"add","path":"/\\u005f\\u005fproto\\u005f\\u005f/' + marker + '","value":true}\n';
    assert.deepEqual(core.compileSpecStream(wire), {}); unchanged({}, {});
  });
  check(`${format}:positive-controls`, () => {
    const obj = {items: ['a'], literal: {}};
    core.setByPath(obj, '/literal/01', 'ok'); core.addByPath(obj, '/items/-', 'b');
    core.setByPath(obj, '/literal/a~1b~0c', 'escaped');
    assert.equal(core.getByPath(obj, '/literal/a~1b~0c'), 'escaped');
    assert.equal(core.getByPath(obj, '/literal/01'), 'ok');
    core.setByPath(obj, '/literal/__proto__~1suffix', 'literal');
    assert.equal(obj.literal['__proto__/suffix'], 'literal');
    core.applySpecStreamPatch(obj, {op:'move', from:'/items/0', path:'/items/1'});
    core.applySpecStreamPatch(obj, {op:'copy', from:'/items/0', path:'/items/-'});
    assert.deepEqual(obj.items, ['b','a','b']);
    const store = core.createStateStore({items:['a']}); let calls = 0; const unsubscribe = store.subscribe(() => calls++);
    store.update({'/constructor/no':1, '/items/-':'b', '/items/01':'bad'});
    assert.deepEqual(store.getSnapshot(), {items:['a','b']}); assert.equal(calls, 1); unsubscribe();
  });
  check(`${format}:allowed-value-does-not-promote-prototype`, () => {
    const payload = JSON.parse('{"__proto__":{"probe":1},"constructor":{"prototype":{"probe":2}}}');
    const result = core.compileSpecStream(JSON.stringify({op:'add',path:'/payload',value:payload}));
    assert.equal(Object.getPrototypeOf(result.payload), Object.prototype);
    assert.equal(Object.hasOwn(result.payload,'__proto__'), true);
    assert.equal(core.getByPath(result,'/payload/__proto__/probe'), undefined); unchanged({}, {});
  });
  results.push({format, status:'pass', cases:checks-started, blocked_path_variants:paths.length});
}
const result = {status:'pass', head_sha:'de6a9bdbc0100ac778dff1ad48ab2f732b7d181e', cases:checks, results, prototype_descriptors_unchanged:true, network_used:false, limits:['Plain JSON objects/arrays only; no accessors, proxies, live service, tenants, large allocations or exhaustive resource exhaustion.', 'Renderer-specific dispatch is traced separately; this is the real core public wire/store boundary, not only its validation helper.']};
writeFileSync(new URL('./boundary-results.json', import.meta.url), JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
