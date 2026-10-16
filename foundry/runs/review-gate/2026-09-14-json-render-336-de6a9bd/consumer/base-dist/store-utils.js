// ../../railly/skills/foundry/runs/review-gate/2026-09-14-json-render-336-de6a9bd/consumer/base-core/types.ts
import { z } from "zod";
var DynamicValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.object({ $state: z.string() })
]);
var DynamicStringSchema = z.union([
  z.string(),
  z.object({ $state: z.string() })
]);
var DynamicNumberSchema = z.union([
  z.number(),
  z.object({ $state: z.string() })
]);
var DynamicBooleanSchema = z.union([
  z.boolean(),
  z.object({ $state: z.string() })
]);
function resolveDynamicValue(value, stateModel) {
  if (value === null || value === undefined) {
    return;
  }
  if (typeof value === "object" && "$state" in value) {
    return getByPath(stateModel, value.$state);
  }
  return value;
}
function unescapeJsonPointer(token) {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}
function parseJsonPointer(path) {
  const raw = path.startsWith("/") ? path.slice(1).split("/") : path.split("/");
  return raw.map(unescapeJsonPointer);
}
function getByPath(obj, path) {
  if (!path || path === "/") {
    return obj;
  }
  const segments = parseJsonPointer(path);
  let current = obj;
  for (const segment of segments) {
    if (current === null || current === undefined) {
      return;
    }
    if (Array.isArray(current)) {
      const index = parseInt(segment, 10);
      current = current[index];
    } else if (typeof current === "object") {
      current = current[segment];
    } else {
      return;
    }
  }
  return current;
}
function resolveRepeatStatePath(statePath, repeatBasePath) {
  if (typeof statePath === "string") {
    return statePath;
  }
  if (repeatBasePath == null) {
    return;
  }
  if (statePath.$item === "" || statePath.$item === "/") {
    return repeatBasePath;
  }
  return joinStatePath(repeatBasePath, statePath.$item);
}
function resolveRepeatItemStatePath(statePath, index) {
  return joinStatePath(statePath, String(index));
}
function joinStatePath(basePath, childPath) {
  const child = childPath.startsWith("/") ? childPath.slice(1) : childPath;
  if (basePath === "" || basePath === "/") {
    return `/${child}`;
  }
  return `${basePath}/${child}`;
}
function isNumericIndex(str) {
  return /^\d+$/.test(str);
}
function setByPath(obj, path, value) {
  const segments = parseJsonPointer(path);
  if (segments.length === 0)
    return;
  let current = obj;
  for (let i = 0;i < segments.length - 1; i++) {
    const segment = segments[i];
    const nextSegment = segments[i + 1];
    const nextIsNumeric = nextSegment !== undefined && (isNumericIndex(nextSegment) || nextSegment === "-");
    if (Array.isArray(current)) {
      const index = parseInt(segment, 10);
      if (current[index] === undefined || typeof current[index] !== "object") {
        current[index] = nextIsNumeric ? [] : {};
      }
      current = current[index];
    } else {
      if (!(segment in current) || typeof current[segment] !== "object") {
        current[segment] = nextIsNumeric ? [] : {};
      }
      current = current[segment];
    }
  }
  const lastSegment = segments[segments.length - 1];
  if (Array.isArray(current)) {
    if (lastSegment === "-") {
      current.push(value);
    } else {
      const index = parseInt(lastSegment, 10);
      current[index] = value;
    }
  } else {
    current[lastSegment] = value;
  }
}
function addByPath(obj, path, value) {
  const segments = parseJsonPointer(path);
  if (segments.length === 0)
    return;
  let current = obj;
  for (let i = 0;i < segments.length - 1; i++) {
    const segment = segments[i];
    const nextSegment = segments[i + 1];
    const nextIsNumeric = nextSegment !== undefined && (isNumericIndex(nextSegment) || nextSegment === "-");
    if (Array.isArray(current)) {
      const index = parseInt(segment, 10);
      if (current[index] === undefined || typeof current[index] !== "object") {
        current[index] = nextIsNumeric ? [] : {};
      }
      current = current[index];
    } else {
      if (!(segment in current) || typeof current[segment] !== "object") {
        current[segment] = nextIsNumeric ? [] : {};
      }
      current = current[segment];
    }
  }
  const lastSegment = segments[segments.length - 1];
  if (Array.isArray(current)) {
    if (lastSegment === "-") {
      current.push(value);
    } else {
      const index = parseInt(lastSegment, 10);
      current.splice(index, 0, value);
    }
  } else {
    current[lastSegment] = value;
  }
}
function removeByPath(obj, path) {
  const segments = parseJsonPointer(path);
  if (segments.length === 0)
    return;
  let current = obj;
  for (let i = 0;i < segments.length - 1; i++) {
    const segment = segments[i];
    if (Array.isArray(current)) {
      const index = parseInt(segment, 10);
      if (current[index] === undefined || typeof current[index] !== "object") {
        return;
      }
      current = current[index];
    } else {
      if (!(segment in current) || typeof current[segment] !== "object") {
        return;
      }
      current = current[segment];
    }
  }
  const lastSegment = segments[segments.length - 1];
  if (Array.isArray(current)) {
    const index = parseInt(lastSegment, 10);
    if (index >= 0 && index < current.length) {
      current.splice(index, 1);
    }
  } else {
    delete current[lastSegment];
  }
}
function deepEqual(a, b) {
  if (a === b)
    return true;
  if (a === null || b === null)
    return false;
  if (typeof a !== typeof b)
    return false;
  if (typeof a !== "object")
    return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b))
      return false;
    if (a.length !== b.length)
      return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  const aObj = a;
  const bObj = b;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length)
    return false;
  return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
}
function findFormValue(fieldName, params, state) {
  if (params?.[fieldName] !== undefined) {
    const val = params[fieldName];
    if (typeof val !== "string" || !val.includes(".")) {
      return val;
    }
  }
  if (params) {
    for (const key of Object.keys(params)) {
      if (key.endsWith(`.${fieldName}`)) {
        const val = params[key];
        if (typeof val !== "string" || !val.includes(".")) {
          return val;
        }
      }
    }
  }
  if (state) {
    for (const key of Object.keys(state)) {
      if (key === fieldName || key.endsWith(`.${fieldName}`)) {
        return state[key];
      }
    }
    const val = getByPath(state, fieldName);
    if (val !== undefined) {
      return val;
    }
  }
  return;
}
function parseSpecStreamLine(line) {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.startsWith("{"))
    return null;
  try {
    const patch = JSON.parse(trimmed);
    if (patch.op && patch.path !== undefined) {
      return patch;
    }
    return null;
  } catch {
    return null;
  }
}
function applySpecStreamPatch(obj, patch) {
  switch (patch.op) {
    case "add":
      addByPath(obj, patch.path, patch.value);
      break;
    case "replace":
      setByPath(obj, patch.path, patch.value);
      break;
    case "remove":
      removeByPath(obj, patch.path);
      break;
    case "move": {
      if (!patch.from)
        break;
      const moveValue = getByPath(obj, patch.from);
      removeByPath(obj, patch.from);
      addByPath(obj, patch.path, moveValue);
      break;
    }
    case "copy": {
      if (!patch.from)
        break;
      const copyValue = getByPath(obj, patch.from);
      addByPath(obj, patch.path, copyValue);
      break;
    }
    case "test": {
      const actual = getByPath(obj, patch.path);
      if (!deepEqual(actual, patch.value)) {
        throw new Error(`Test operation failed: value at "${patch.path}" does not match`);
      }
      break;
    }
  }
  return obj;
}
function applySpecPatch(spec, patch) {
  applySpecStreamPatch(spec, patch);
  return spec;
}
function nestedToFlat(nested) {
  const elements = {};
  let counter = 0;
  function walk(node) {
    const key = `el-${counter++}`;
    const {
      type,
      props,
      children: rawChildren,
      slots: rawSlots,
      ...rest
    } = node;
    const childKeys = [];
    if (Array.isArray(rawChildren)) {
      for (const child of rawChildren) {
        if (child && typeof child === "object" && "type" in child) {
          childKeys.push(walk(child));
        }
      }
    }
    const slots = {};
    if (rawSlots && typeof rawSlots === "object") {
      for (const [slotName, slotChildren] of Object.entries(rawSlots)) {
        if (!Array.isArray(slotChildren))
          continue;
        slots[slotName] = slotChildren.flatMap((child) => child && typeof child === "object" && ("type" in child) ? [walk(child)] : []);
      }
    }
    const element = {
      type: type ?? "unknown",
      props: props ?? {},
      children: childKeys,
      ...Object.keys(slots).length > 0 ? { slots } : {}
    };
    for (const [k, v] of Object.entries(rest)) {
      if (k !== "state" && v !== undefined) {
        element[k] = v;
      }
    }
    elements[key] = element;
    return key;
  }
  const root = walk(nested);
  const spec = { root, elements };
  if (nested.state && typeof nested.state === "object" && !Array.isArray(nested.state)) {
    spec.state = nested.state;
  }
  return spec;
}
function compileSpecStream(stream, initial = {}) {
  const lines = stream.split(`
`);
  const result = { ...initial };
  for (const line of lines) {
    const patch = parseSpecStreamLine(line);
    if (patch) {
      applySpecStreamPatch(result, patch);
    }
  }
  return result;
}
function createSpecStreamCompiler(initial = {}) {
  let result = { ...initial };
  let buffer = "";
  const appliedPatches = [];
  const processedLines = new Set;
  return {
    push(chunk) {
      buffer += chunk;
      const newPatches = [];
      const lines = buffer.split(`
`);
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || processedLines.has(trimmed))
          continue;
        processedLines.add(trimmed);
        const patch = parseSpecStreamLine(trimmed);
        if (patch) {
          applySpecStreamPatch(result, patch);
          appliedPatches.push(patch);
          newPatches.push(patch);
        }
      }
      if (newPatches.length > 0) {
        result = { ...result };
      }
      return { result, newPatches };
    },
    getResult() {
      if (buffer.trim()) {
        const patch = parseSpecStreamLine(buffer);
        if (patch && !processedLines.has(buffer.trim())) {
          processedLines.add(buffer.trim());
          applySpecStreamPatch(result, patch);
          appliedPatches.push(patch);
          result = { ...result };
        }
        buffer = "";
      }
      return result;
    },
    getPatches() {
      return [...appliedPatches];
    },
    reset(newInitial = {}) {
      result = { ...newInitial };
      buffer = "";
      appliedPatches.length = 0;
      processedLines.clear();
    }
  };
}
function createMixedStreamParser(callbacks) {
  let buffer = "";
  let inSpecFence = false;
  function processLine(line) {
    const trimmed = line.trim();
    if (!inSpecFence && trimmed.startsWith("```spec")) {
      inSpecFence = true;
      return;
    }
    if (inSpecFence && trimmed === "```") {
      inSpecFence = false;
      return;
    }
    if (!trimmed)
      return;
    if (inSpecFence) {
      const patch2 = parseSpecStreamLine(trimmed);
      if (patch2) {
        callbacks.onPatch(patch2);
      }
      return;
    }
    const patch = parseSpecStreamLine(trimmed);
    if (patch) {
      callbacks.onPatch(patch);
    } else {
      callbacks.onText(line);
    }
  }
  return {
    push(chunk) {
      buffer += chunk;
      const lines = buffer.split(`
`);
      buffer = lines.pop() || "";
      for (const line of lines) {
        processLine(line);
      }
    },
    flush() {
      if (buffer.trim()) {
        processLine(buffer);
      }
      buffer = "";
    }
  };
}
var SPEC_FENCE_OPEN = "```spec";
var SPEC_FENCE_CLOSE = "```";
function createJsonRenderTransform() {
  let lineBuffer = "";
  let currentTextId = "";
  let buffering = false;
  let inSpecFence = false;
  let inTextBlock = false;
  let textIdCounter = 0;
  function closeTextBlock(controller) {
    if (inTextBlock) {
      controller.enqueue({ type: "text-end", id: currentTextId });
      inTextBlock = false;
    }
  }
  function ensureTextBlock(controller) {
    if (!inTextBlock) {
      textIdCounter++;
      currentTextId = String(textIdCounter);
      controller.enqueue({ type: "text-start", id: currentTextId });
      inTextBlock = true;
    }
  }
  function emitTextDelta(delta, controller) {
    ensureTextBlock(controller);
    controller.enqueue({ type: "text-delta", id: currentTextId, delta });
  }
  function emitPatch(patch, controller) {
    closeTextBlock(controller);
    controller.enqueue({
      type: SPEC_DATA_PART_TYPE,
      data: { type: "patch", patch }
    });
  }
  function flushBuffer(controller) {
    if (!lineBuffer)
      return;
    const trimmed = lineBuffer.trim();
    if (inSpecFence) {
      if (trimmed) {
        const patch = parseSpecStreamLine(trimmed);
        if (patch)
          emitPatch(patch, controller);
      }
      lineBuffer = "";
      buffering = false;
      return;
    }
    if (trimmed) {
      const patch = parseSpecStreamLine(trimmed);
      if (patch) {
        emitPatch(patch, controller);
      } else {
        emitTextDelta(lineBuffer, controller);
      }
    } else {
      emitTextDelta(lineBuffer, controller);
    }
    lineBuffer = "";
    buffering = false;
  }
  function processCompleteLine(line, controller) {
    const trimmed = line.trim();
    if (!inSpecFence && trimmed.startsWith(SPEC_FENCE_OPEN)) {
      inSpecFence = true;
      return;
    }
    if (inSpecFence && trimmed === SPEC_FENCE_CLOSE) {
      inSpecFence = false;
      return;
    }
    if (inSpecFence) {
      if (trimmed) {
        const patch2 = parseSpecStreamLine(trimmed);
        if (patch2)
          emitPatch(patch2, controller);
      }
      return;
    }
    if (!trimmed) {
      emitTextDelta(`
`, controller);
      return;
    }
    const patch = parseSpecStreamLine(trimmed);
    if (patch) {
      emitPatch(patch, controller);
    } else {
      emitTextDelta(line + `
`, controller);
    }
  }
  return new TransformStream({
    transform(chunk, controller) {
      switch (chunk.type) {
        case "text-start": {
          const id = chunk.id;
          const idNum = parseInt(id, 10);
          if (!isNaN(idNum) && idNum >= textIdCounter) {
            textIdCounter = idNum;
          }
          currentTextId = id;
          inTextBlock = true;
          controller.enqueue(chunk);
          break;
        }
        case "text-delta": {
          const delta = chunk;
          const text = delta.delta;
          for (let i = 0;i < text.length; i++) {
            const ch = text.charAt(i);
            if (ch === `
`) {
              if (buffering) {
                processCompleteLine(lineBuffer, controller);
                lineBuffer = "";
                buffering = false;
              } else {
                if (!inSpecFence) {
                  emitTextDelta(`
`, controller);
                }
              }
            } else if (lineBuffer.length === 0 && !buffering) {
              if (inSpecFence || ch === "{" || ch === "`") {
                buffering = true;
                lineBuffer += ch;
              } else {
                emitTextDelta(ch, controller);
              }
            } else if (buffering) {
              lineBuffer += ch;
            } else {
              emitTextDelta(ch, controller);
            }
          }
          break;
        }
        case "text-end": {
          flushBuffer(controller);
          if (inTextBlock) {
            controller.enqueue({ type: "text-end", id: currentTextId });
            inTextBlock = false;
          }
          break;
        }
        default: {
          controller.enqueue(chunk);
          break;
        }
      }
    },
    flush(controller) {
      flushBuffer(controller);
      closeTextBlock(controller);
    }
  });
}
var SPEC_DATA_PART = "spec";
var SPEC_DATA_PART_TYPE = `data-${SPEC_DATA_PART}`;
function pipeJsonRender(stream) {
  return stream.pipeThrough(createJsonRenderTransform());
}

// ../../railly/skills/foundry/runs/review-gate/2026-09-14-json-render-336-de6a9bd/consumer/base-core/state-store.ts
function immutableSetByPath(root, path, value) {
  const segments = parseJsonPointer(path);
  if (segments.length === 0)
    return root;
  const result = { ...root };
  let current = result;
  for (let i = 0;i < segments.length - 1; i++) {
    const seg = segments[i];
    const child = current[seg];
    if (Array.isArray(child)) {
      current[seg] = [...child];
    } else if (child !== null && typeof child === "object") {
      current[seg] = { ...child };
    } else {
      const nextSeg = segments[i + 1];
      current[seg] = nextSeg !== undefined && /^\d+$/.test(nextSeg) ? [] : {};
    }
    current = current[seg];
  }
  const lastSeg = segments[segments.length - 1];
  if (Array.isArray(current)) {
    if (lastSeg === "-") {
      current.push(value);
    } else {
      current[parseInt(lastSeg, 10)] = value;
    }
  } else {
    current[lastSeg] = value;
  }
  return result;
}
function createStateStore(initialState = {}) {
  let state = { ...initialState };
  const listeners = new Set;
  function notify() {
    for (const listener of listeners) {
      listener();
    }
  }
  return {
    get(path) {
      return getByPath(state, path);
    },
    set(path, value) {
      if (getByPath(state, path) === value)
        return;
      state = immutableSetByPath(state, path, value);
      notify();
    },
    update(updates) {
      let changed = false;
      let next = state;
      for (const [path, value] of Object.entries(updates)) {
        if (getByPath(next, path) !== value) {
          next = immutableSetByPath(next, path, value);
          changed = true;
        }
      }
      if (!changed)
        return;
      state = next;
      notify();
    },
    getSnapshot() {
      return state;
    },
    getServerSnapshot() {
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}
function createStoreAdapter(config) {
  return {
    get(path) {
      return getByPath(config.getSnapshot(), path);
    },
    set(path, value) {
      const current = config.getSnapshot();
      if (getByPath(current, path) === value)
        return;
      config.setSnapshot(immutableSetByPath(current, path, value));
    },
    update(updates) {
      let next = config.getSnapshot();
      let changed = false;
      for (const [path, value] of Object.entries(updates)) {
        if (getByPath(next, path) !== value) {
          next = immutableSetByPath(next, path, value);
          changed = true;
        }
      }
      if (!changed)
        return;
      config.setSnapshot(next);
    },
    getSnapshot: config.getSnapshot,
    getServerSnapshot: config.getSnapshot,
    subscribe: config.subscribe
  };
}
var MAX_FLATTEN_DEPTH = 20;
function flattenToPointers(obj, prefix = "", _depth = 0, _seen, _warned) {
  const seen = _seen ?? new Set;
  const warned = _warned ?? { current: false };
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const pointer = `${prefix}/${key}`;
    if (_depth < MAX_FLATTEN_DEPTH && value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype && !seen.has(value)) {
      seen.add(value);
      Object.assign(result, flattenToPointers(value, pointer, _depth + 1, seen, warned));
    } else {
      if (!warned.current && _depth >= MAX_FLATTEN_DEPTH && value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype && !seen.has(value)) {
        warned.current = true;
        console.warn(`flattenToPointers: depth limit (${MAX_FLATTEN_DEPTH}) reached. Nested state beyond this depth will be treated as a leaf value.`);
      }
      result[pointer] = value;
    }
  }
  return result;
}
export {
  immutableSetByPath,
  flattenToPointers,
  createStoreAdapter
};
