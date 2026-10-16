import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const target = '/Users/raillyhugo/Programming/vercel/json-render-336-review';
const require = createRequire(target + '/package.json');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>');
const originals = new Map();
for (const [key, value] of Object.entries({window:dom.window, document:dom.window.document, navigator:dom.window.navigator, HTMLElement:dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT:true})) {
  originals.set(key, Object.getOwnPropertyDescriptor(globalThis,key));
  Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
}
const { renderHook, act, cleanup } = require('@testing-library/react');
const { useUIStream } = await import('./hooks.resolved-head.ts');
const originalFetch = globalThis.fetch;
const marker = '__json336_renderer_local_marker__';
const protos = [Object.prototype,Array.prototype,Function.prototype].map(p=>[p,Object.getOwnPropertyDescriptors(p)]);
const cases = [
  {id:'state-prototype-write', patch:{op:'add',path:'/state/__proto__/' + marker,value:true}},
  {id:'state-constructor-write', patch:{op:'replace',path:'/state/constructor/prototype/' + marker,value:true}},
  {id:'reserved-move-destination', patch:{op:'move',from:'/state/source',path:'/state/__proto__/' + marker}},
  {id:'reserved-copy-source', patch:{op:'copy',from:'/state/constructor',path:'/state/copied'}},
  {id:'element-dictionary-prototype', patch:{op:'add',path:'/elements/__proto__',value:{[marker]:{type:'Text',props:{text:'local'}}}}},
  {id:'equivalent-own-element-control', patch:{op:'add',path:'/elements/' + marker,value:{type:'Text',props:{text:'local'}}}}
];
const observations = [];
try {
  for (const c of cases) {
    let requests = 0;
    const wire = [JSON.stringify({op:'add',path:'/state',value:{source:'keep'}}), JSON.stringify(c.patch)].join('\n') + '\n';
    globalThis.fetch = async () => { requests++; return new Response(wire,{headers:{'Content-Type':'application/jsonl'}}); };
    const {result,unmount} = renderHook(()=>useUIStream({api:'/in-process-only'}));
    try {
      await act(async()=>{await result.current.send('local synthetic input');});
      assert.equal(requests,1); assert.equal(result.current.error,null);
      const spec = result.current.spec;
      for (const [p,descriptors] of protos) assert.deepEqual(Object.getOwnPropertyDescriptors(p),descriptors);
      assert.equal(({})[marker],undefined);
      if (c.id === 'state-prototype-write' || c.id === 'state-constructor-write') assert.deepEqual(spec.state,{source:'keep'});
      if (c.id === 'reserved-move-destination') assert.equal(Object.hasOwn(spec.state,'source'),false);
      if (c.id === 'reserved-copy-source') {assert.equal(Object.hasOwn(spec.state,'copied'),true); assert.equal(spec.state.copied,undefined);}
      if (c.id === 'element-dictionary-prototype') {assert.equal(Object.getPrototypeOf(spec.elements)[marker].type,'Text'); assert.equal(Object.hasOwn(spec.elements,marker),false);}
      if (c.id === 'equivalent-own-element-control') {assert.equal(spec.elements[marker].type,'Text'); assert.equal(Object.hasOwn(spec.elements,marker),true);}
      observations.push({id:c.id, state:spec.state, state_keys:Object.keys(spec.state), element_prototype_changed:Object.getPrototypeOf(spec.elements)!==Object.prototype, local_marker_present:marker in spec.elements, global_prototypes_unchanged:true, mocked_requests:requests});
    } finally {unmount(); cleanup();}
  }

  const output = {status:'pass',meaning:'All characterization assertions matched; not a claim that legacy renderer rejects every reserved token.',head_sha:'de6a9bdbc0100ac778dff1ad48ab2f732b7d181e',core_resolution:'explicit exact-head source import in import-only copy; see renderer-resolved-identity.json', observations, network_used:false};
  writeFileSync(new URL('./renderer-boundary-results.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
  console.log(JSON.stringify(output));
} finally {
  globalThis.fetch = originalFetch; dom.window.close();
  for (const [key,descriptor] of originals) {if(descriptor) Object.defineProperty(globalThis,key,descriptor); else delete globalThis[key];}
}
