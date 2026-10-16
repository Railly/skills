// ../../../../../../../../../../private/var/folders/t_/srzvjq016kn2zdmpxsr841b00000gn/Tjson-render-336-strength-lWF3oO/src/types.ts
import { z } from "zod";

// ../../../../../../../../../../private/var/folders/t_/srzvjq016kn2zdmpxsr841b00000gn/Tjson-render-336-strength-lWF3oO/src/path-utils.ts
function parseArrayIndex(token) {
  if (!/^(?:0|[1-9]\d*)$/.test(token)) {
    return;
  }
  const index = Number(token);
  if (!Number.isInteger(index) || index < 0 || index > 4294967294 || String(index) !== token) {
    return;
  }
  return index;
}

// ../../../../../../../../../../private/var/folders/t_/srzvjq016kn2zdmpxsr841b00000gn/Tjson-render-336-strength-lWF3oO/src/types.ts
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
var blockedJsonPointerTokens = new Set([
  "__proto__",
  "constructor",
  "prototype"
]);
function hasBlockedJsonPointerToken(segments) {
  return segments.some((segment) => blockedJsonPointerTokens.has(segment));
}
function isSafeJsonPointerPath(path) {
  return !hasBlockedJsonPointerToken(parseJsonPointer(path));
}
function getByPath(obj, path) {
  const result = readByPath(obj, path);
  return result.exists ? result.value : undefined;
}
function readByPath(obj, path) {
  if (!path || path === "/") {
    return { valid: true, exists: true, value: obj };
  }
  const segments = parseJsonPointer(path);
  if (hasBlockedJsonPointerToken(segments)) {
    return { valid: false, exists: false };
  }
  let current = obj;
  for (const segment of segments) {
    if (current === null || current === undefined) {
      return { valid: true, exists: false };
    }
    if (Array.isArray(current)) {
      const index = parseArrayIndex(segment);
      if (index === undefined) {
        return { valid: false, exists: false };
      }
      if (!(index in current)) {
        return { valid: true, exists: false };
      }
      current = current[index];
    } else if (typeof current === "object") {
      if (!(segment in current)) {
        return { valid: true, exists: false };
      }
      current = current[segment];
    } else {
      return { valid: true, exists: false };
    }
  }
  return { valid: true, exists: true, value: current };
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
function isContainer(value) {
  return value !== null && typeof value === "object";
}
function createMissingContainer(nextSegment, nextIsTerminal) {
  return parseArrayIndex(nextSegment) !== undefined || nextIsTerminal && nextSegment === "-" ? [] : {};
}
function canWriteBySegments(root, segments) {
  if (hasBlockedJsonPointerToken(segments))
    return false;
  let current = root;
  for (let i = 0;i < segments.length - 1; i++) {
    const segment = segments[i];
    const nextSegment = segments[i + 1];
    const nextIsTerminal = i + 1 === segments.length - 1;
    if (Array.isArray(current)) {
      const index = parseArrayIndex(segment);
      if (index === undefined)
        return false;
      const child = current[index];
      current = isContainer(child) ? child : createMissingContainer(nextSegment, nextIsTerminal);
    } else if (isContainer(current)) {
      const object = current;
      const child = object[segment];
      current = isContainer(child) ? child : createMissingContainer(nextSegment, nextIsTerminal);
    } else {
      return false;
    }
  }
  if (Array.isArray(current)) {
    const lastSegment = segments[segments.length - 1];
    return lastSegment === "-" || parseArrayIndex(lastSegment) !== undefined;
  }
  return isContainer(current);
}
function getWritableParent(root, segments) {
  if (!canWriteBySegments(root, segments))
    return;
  let current = root;
  for (let i = 0;i < segments.length - 1; i++) {
    const segment = segments[i];
    const nextSegment = segments[i + 1];
    const nextIsTerminal = i + 1 === segments.length - 1;
    if (Array.isArray(current)) {
      const index = parseArrayIndex(segment);
      const child = current[index];
      if (!isContainer(child)) {
        current[index] = createMissingContainer(nextSegment, nextIsTerminal);
      }
      current = current[index];
    } else {
      const object = current;
      const child = object[segment];
      if (!isContainer(child)) {
        object[segment] = createMissingContainer(nextSegment, nextIsTerminal);
      }
      current = object[segment];
    }
  }
  return current;
}
function setByPathInternal(obj, path, value) {
  const segments = parseJsonPointer(path);
  if (segments.length === 0)
    return false;
  const current = getWritableParent(obj, segments);
  if (!current)
    return false;
  const lastSegment = segments[segments.length - 1];
  if (Array.isArray(current)) {
    if (lastSegment === "-") {
      current.push(value);
    } else {
      current[parseArrayIndex(lastSegment)] = value;
    }
  } else {
    current[lastSegment] = value;
  }
  return true;
}
function addByPathInternal(obj, path, value) {
  const segments = parseJsonPointer(path);
  if (segments.length === 0)
    return false;
  const current = getWritableParent(obj, segments);
  if (!current)
    return false;
  const lastSegment = segments[segments.length - 1];
  if (Array.isArray(current)) {
    if (lastSegment === "-") {
      current.push(value);
    } else {
      current.splice(parseArrayIndex(lastSegment), 0, value);
    }
  } else {
    current[lastSegment] = value;
  }
  return true;
}
function setByPath(obj, path, value) {
  setByPathInternal(obj, path, value);
}
function addByPath(obj, path, value) {
  addByPathInternal(obj, path, value);
}
function removeByPath(obj, path) {
  removeByPathInternal(obj, path);
}
function removeByPathInternal(obj, path, stageObjectRemoval = false) {
  const segments = parseJsonPointer(path);
  if (segments.length === 0 || hasBlockedJsonPointerToken(segments)) {
    return false;
  }
  let current = obj;
  for (let i = 0;i < segments.length - 1; i++) {
    const segment = segments[i];
    if (Array.isArray(current)) {
      const index = parseArrayIndex(segment);
      if (index === undefined || !isContainer(current[index])) {
        return false;
      }
      current = current[index];
    } else {
      const object = current;
      if (!(segment in object) || !isContainer(object[segment])) {
        return false;
      }
      current = object[segment];
    }
  }
  const lastSegment = segments[segments.length - 1];
  if (Array.isArray(current)) {
    const index = parseArrayIndex(lastSegment);
    if (index !== undefined && index < current.length) {
      current.splice(index, 1);
      return true;
    }
  } else {
    if (stageObjectRemoval) {
      const source = Object.getPrototypeOf(current);
      if (Object.hasOwn(current, lastSegment) || source !== null && Object.hasOwn(source, lastSegment)) {
        current[lastSegment] = undefined;
      }
    } else {
      delete current[lastSegment];
    }
    return true;
  }
  return false;
}
function clonePatchContainer(value) {
  if (Array.isArray(value)) {
    const copy = new Array(value.length);
    for (const key of Object.keys(value)) {
      copy[key] = value[key];
    }
    return copy;
  }
  return Object.create(value);
}
function stagePathContainers(root, segments, clones, stagedContainers) {
  let current = root;
  for (let i = 0;i < segments.length - 1; i++) {
    const segment = segments[i];
    let child;
    let arrayIndex;
    if (Array.isArray(current)) {
      arrayIndex = parseArrayIndex(segment);
      if (arrayIndex === undefined)
        return true;
      child = current[arrayIndex];
    } else {
      child = current[segment];
    }
    if (!isContainer(child))
      return true;
    let stagedChild;
    if (stagedContainers.has(child)) {
      stagedChild = child;
    } else {
      stagedChild = clones.get(child) ?? clonePatchContainer(child);
      clones.set(child, stagedChild);
      stagedContainers.add(stagedChild);
    }
    if (stagedChild === current)
      return false;
    if (stagedChild !== child) {
      if (Array.isArray(current)) {
        current[arrayIndex] = stagedChild;
      } else {
        current[segment] = stagedChild;
      }
    }
    current = stagedChild;
  }
  return true;
}
function canMoveByPath(obj, from, path, value) {
  const staged = clonePatchContainer(obj);
  const clones = new WeakMap([[obj, staged]]);
  const stagedContainers = new WeakSet([staged]);
  if (!stagePathContainers(staged, parseJsonPointer(from), clones, stagedContainers)) {
    return false;
  }
  if (!removeByPathInternal(staged, from, true))
    return false;
  if (!stagePathContainers(staged, parseJsonPointer(path), clones, stagedContainers)) {
    return false;
  }
  return addByPathInternal(staged, path, value);
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
  if (!isSafeJsonPointerPath(patch.path))
    return obj;
  if ((patch.op === "move" || patch.op === "copy") && patch.from !== undefined && !isSafeJsonPointerPath(patch.from)) {
    return obj;
  }
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
      const source = readByPath(obj, patch.from);
      if (!source.valid || !source.exists)
        break;
      if (!canMoveByPath(obj, patch.from, patch.path, source.value)) {
        break;
      }
      removeByPathInternal(obj, patch.from);
      addByPathInternal(obj, patch.path, source.value);
      break;
    }
    case "copy": {
      if (!patch.from)
        break;
      const source = readByPath(obj, patch.from);
      addByPathInternal(obj, patch.path, source.value);
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
// ../../../../../../../../../../private/var/folders/t_/srzvjq016kn2zdmpxsr841b00000gn/Tjson-render-336-strength-lWF3oO/src/state-store.ts
function isContainer2(value) {
  return value !== null && typeof value === "object";
}
function createMissingContainer2(nextSegment, nextIsTerminal) {
  return parseArrayIndex(nextSegment) !== undefined || nextIsTerminal && nextSegment === "-" ? [] : {};
}
function canImmutableSetBySegments(root, segments) {
  let current = root;
  for (let i = 0;i < segments.length - 1; i++) {
    const segment = segments[i];
    const nextSegment = segments[i + 1];
    const nextIsTerminal = i + 1 === segments.length - 1;
    if (Array.isArray(current)) {
      const index = parseArrayIndex(segment);
      if (index === undefined)
        return false;
      const child = current[index];
      current = isContainer2(child) ? child : createMissingContainer2(nextSegment, nextIsTerminal);
    } else if (isContainer2(current)) {
      const object = current;
      const child = object[segment];
      current = isContainer2(child) ? child : createMissingContainer2(nextSegment, nextIsTerminal);
    } else {
      return false;
    }
  }
  if (Array.isArray(current)) {
    const lastSegment = segments[segments.length - 1];
    return lastSegment === "-" || parseArrayIndex(lastSegment) !== undefined;
  }
  return isContainer2(current);
}
function immutableSetByPath(root, path, value) {
  if (!isSafeJsonPointerPath(path))
    return root;
  const segments = parseJsonPointer(path);
  if (segments.length === 0)
    return root;
  if (!canImmutableSetBySegments(root, segments))
    return root;
  const result = { ...root };
  let current = result;
  for (let i = 0;i < segments.length - 1; i++) {
    const seg = segments[i];
    const nextSegment = segments[i + 1];
    const nextIsTerminal = i + 1 === segments.length - 1;
    if (Array.isArray(current)) {
      const index = parseArrayIndex(seg);
      const child = current[index];
      current[index] = Array.isArray(child) ? [...child] : isContainer2(child) ? { ...child } : createMissingContainer2(nextSegment, nextIsTerminal);
      current = current[index];
    } else {
      const object = current;
      const child = object[seg];
      object[seg] = Array.isArray(child) ? [...child] : isContainer2(child) ? { ...child } : createMissingContainer2(nextSegment, nextIsTerminal);
      current = object[seg];
    }
  }
  const lastSeg = segments[segments.length - 1];
  if (Array.isArray(current)) {
    if (lastSeg === "-") {
      current.push(value);
    } else {
      current[parseArrayIndex(lastSeg)] = value;
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
      if (!isSafeJsonPointerPath(path))
        return;
      if (getByPath(state, path) === value)
        return;
      const next = immutableSetByPath(state, path, value);
      if (next === state)
        return;
      state = next;
      notify();
    },
    update(updates) {
      let changed = false;
      let next = state;
      for (const [path, value] of Object.entries(updates)) {
        if (!isSafeJsonPointerPath(path))
          continue;
        if (getByPath(next, path) !== value) {
          const updated = immutableSetByPath(next, path, value);
          if (updated !== next) {
            next = updated;
            changed = true;
          }
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
// ../../../../../../../../../../private/var/folders/t_/srzvjq016kn2zdmpxsr841b00000gn/Tjson-render-336-strength-lWF3oO/src/visibility.ts
import { z as z2 } from "zod";
var numericOrStateRef = z2.union([
  z2.number(),
  z2.object({ $state: z2.string() })
]);
var comparisonOps = {
  eq: z2.unknown().optional(),
  neq: z2.unknown().optional(),
  gt: numericOrStateRef.optional(),
  gte: numericOrStateRef.optional(),
  lt: numericOrStateRef.optional(),
  lte: numericOrStateRef.optional(),
  not: z2.literal(true).optional()
};
var StateConditionSchema = z2.object({
  $state: z2.string(),
  ...comparisonOps
});
var ItemConditionSchema = z2.object({
  $item: z2.string(),
  ...comparisonOps
});
var IndexConditionSchema = z2.object({
  $index: z2.literal(true),
  ...comparisonOps
});
var SingleConditionSchema = z2.union([
  StateConditionSchema,
  ItemConditionSchema,
  IndexConditionSchema
]);
var VisibilityConditionSchema = z2.lazy(() => z2.union([
  z2.boolean(),
  SingleConditionSchema,
  z2.array(SingleConditionSchema),
  z2.object({ $and: z2.array(VisibilityConditionSchema) }),
  z2.object({ $or: z2.array(VisibilityConditionSchema) })
]));
var StrictSingleConditionSchema = z2.union([
  z2.strictObject({ $state: z2.string(), ...comparisonOps }),
  z2.strictObject({ $item: z2.string(), ...comparisonOps }),
  z2.strictObject({ $index: z2.literal(true), ...comparisonOps })
]);
function conditionUsesItemScope(condition) {
  if (condition === undefined || typeof condition === "boolean")
    return false;
  if (Array.isArray(condition))
    return condition.some(conditionUsesItemScope);
  if (typeof condition !== "object" || condition === null)
    return false;
  if ("$item" in condition || "$index" in condition)
    return true;
  if ("$and" in condition)
    return condition.$and.some(conditionUsesItemScope);
  if ("$or" in condition)
    return condition.$or.some(conditionUsesItemScope);
  return false;
}
function splitRepeatVisibility(condition) {
  if (condition === undefined || !conditionUsesItemScope(condition)) {
    return { container: condition, itemFilter: undefined };
  }
  const partition = (parts) => {
    const container = parts.filter((part) => !conditionUsesItemScope(part));
    const item = parts.filter((part) => conditionUsesItemScope(part));
    return {
      container: container.length > 0 ? { $and: container } : undefined,
      itemFilter: item.length > 0 ? { $and: item } : undefined
    };
  };
  if (Array.isArray(condition))
    return partition(condition);
  if (typeof condition === "object" && condition !== null && "$and" in condition) {
    return partition(condition.$and);
  }
  return { container: undefined, itemFilter: condition };
}
var VisibilityConditionStrictSchema = z2.lazy(() => z2.union([
  z2.boolean(),
  StrictSingleConditionSchema,
  z2.array(StrictSingleConditionSchema),
  z2.strictObject({ $and: z2.array(VisibilityConditionStrictSchema) }),
  z2.strictObject({ $or: z2.array(VisibilityConditionStrictSchema) })
]));
function resolveComparisonValue(value, ctx) {
  if (typeof value === "object" && value !== null) {
    if ("$state" in value && typeof value.$state === "string") {
      return getByPath(ctx.stateModel, value.$state);
    }
  }
  return value;
}
function isItemCondition(cond) {
  return "$item" in cond;
}
function isIndexCondition(cond) {
  return "$index" in cond;
}
function resolveConditionValue(cond, ctx) {
  if (isIndexCondition(cond)) {
    return ctx.repeatIndex;
  }
  if (isItemCondition(cond)) {
    if (ctx.repeatItem === undefined)
      return;
    return cond.$item === "" ? ctx.repeatItem : getByPath(ctx.repeatItem, cond.$item);
  }
  return getByPath(ctx.stateModel, cond.$state);
}
function evaluateCondition(cond, ctx) {
  const value = resolveConditionValue(cond, ctx);
  let result;
  if (cond.eq !== undefined) {
    const rhs = resolveComparisonValue(cond.eq, ctx);
    result = value === rhs;
  } else if (cond.neq !== undefined) {
    const rhs = resolveComparisonValue(cond.neq, ctx);
    result = value !== rhs;
  } else if (cond.gt !== undefined) {
    const rhs = resolveComparisonValue(cond.gt, ctx);
    result = typeof value === "number" && typeof rhs === "number" ? value > rhs : false;
  } else if (cond.gte !== undefined) {
    const rhs = resolveComparisonValue(cond.gte, ctx);
    result = typeof value === "number" && typeof rhs === "number" ? value >= rhs : false;
  } else if (cond.lt !== undefined) {
    const rhs = resolveComparisonValue(cond.lt, ctx);
    result = typeof value === "number" && typeof rhs === "number" ? value < rhs : false;
  } else if (cond.lte !== undefined) {
    const rhs = resolveComparisonValue(cond.lte, ctx);
    result = typeof value === "number" && typeof rhs === "number" ? value <= rhs : false;
  } else {
    result = Boolean(value);
  }
  return cond.not === true ? !result : result;
}
function isAndCondition(condition) {
  return typeof condition === "object" && condition !== null && !Array.isArray(condition) && "$and" in condition;
}
function isOrCondition(condition) {
  return typeof condition === "object" && condition !== null && !Array.isArray(condition) && "$or" in condition;
}
function evaluateVisibility(condition, ctx) {
  if (condition === undefined) {
    return true;
  }
  if (typeof condition === "boolean") {
    return condition;
  }
  if (Array.isArray(condition)) {
    return condition.every((c) => evaluateCondition(c, ctx));
  }
  if (isAndCondition(condition)) {
    return condition.$and.every((child) => evaluateVisibility(child, ctx));
  }
  if (isOrCondition(condition)) {
    return condition.$or.some((child) => evaluateVisibility(child, ctx));
  }
  return evaluateCondition(condition, ctx);
}
var visibility = {
  always: true,
  never: false,
  when: (path) => ({ $state: path }),
  unless: (path) => ({ $state: path, not: true }),
  eq: (path, value) => ({
    $state: path,
    eq: value
  }),
  neq: (path, value) => ({
    $state: path,
    neq: value
  }),
  gt: (path, value) => ({
    $state: path,
    gt: value
  }),
  gte: (path, value) => ({
    $state: path,
    gte: value
  }),
  lt: (path, value) => ({
    $state: path,
    lt: value
  }),
  lte: (path, value) => ({
    $state: path,
    lte: value
  }),
  and: (...conditions) => ({
    $and: conditions
  }),
  or: (...conditions) => ({
    $or: conditions
  })
};
// ../../../../../../../../../../private/var/folders/t_/srzvjq016kn2zdmpxsr841b00000gn/Tjson-render-336-strength-lWF3oO/src/directives.ts
var BUILT_IN_KEYS = new Set([
  "$state",
  "$item",
  "$index",
  "$bindState",
  "$bindItem",
  "$cond",
  "$computed",
  "$template"
]);
function defineDirective(definition) {
  if (!definition.name.startsWith("$")) {
    throw new Error(`Directive name must start with "$": got "${definition.name}"`);
  }
  if (BUILT_IN_KEYS.has(definition.name)) {
    throw new Error(`Directive name "${definition.name}" conflicts with a built-in prop expression key`);
  }
  return definition;
}
function createDirectiveRegistry(directives) {
  const registry = new Map;
  for (const d of directives) {
    registry.set(d.name, d);
  }
  return registry;
}
function findDirective(value, directives) {
  if (!directives || directives.size === 0)
    return;
  let match;
  for (const [key, def] of directives) {
    if (key in value) {
      if (match) {
        throw new Error(`Ambiguous directive: object has multiple directive keys ("${match.name}" and "${key}")`);
      }
      match = def;
    }
  }
  return match;
}

// ../../../../../../../../../../private/var/folders/t_/srzvjq016kn2zdmpxsr841b00000gn/Tjson-render-336-strength-lWF3oO/src/props.ts
function isStateExpression(value) {
  return typeof value === "object" && value !== null && "$state" in value && typeof value.$state === "string";
}
function isItemExpression(value) {
  return typeof value === "object" && value !== null && "$item" in value && typeof value.$item === "string";
}
function isIndexExpression(value) {
  return typeof value === "object" && value !== null && "$index" in value && value.$index === true;
}
function isBindStateExpression(value) {
  return typeof value === "object" && value !== null && "$bindState" in value && typeof value.$bindState === "string";
}
function isBindItemExpression(value) {
  return typeof value === "object" && value !== null && "$bindItem" in value && typeof value.$bindItem === "string";
}
function isCondExpression(value) {
  return typeof value === "object" && value !== null && "$cond" in value && "$then" in value && "$else" in value;
}
function isComputedExpression(value) {
  return typeof value === "object" && value !== null && "$computed" in value && typeof value.$computed === "string";
}
function isTemplateExpression(value) {
  return typeof value === "object" && value !== null && "$template" in value && typeof value.$template === "string";
}
var WARNED_COMPUTED_MAX = 100;
var warnedComputedFns = new Set;
function resolveBindItemPath(itemPath, ctx) {
  if (ctx.repeatBasePath == null) {
    console.warn(`$bindItem used outside repeat scope: "${itemPath}"`);
    return;
  }
  if (itemPath === "")
    return ctx.repeatBasePath;
  return ctx.repeatBasePath + "/" + itemPath;
}
function resolvePropValue(value, ctx) {
  if (value === null || value === undefined) {
    return value;
  }
  if (isStateExpression(value)) {
    return getByPath(ctx.stateModel, value.$state);
  }
  if (isItemExpression(value)) {
    if (ctx.repeatItem === undefined)
      return;
    return value.$item === "" ? ctx.repeatItem : getByPath(ctx.repeatItem, value.$item);
  }
  if (isIndexExpression(value)) {
    return ctx.repeatIndex;
  }
  if (isBindStateExpression(value)) {
    return getByPath(ctx.stateModel, value.$bindState);
  }
  if (isBindItemExpression(value)) {
    const resolvedPath = resolveBindItemPath(value.$bindItem, ctx);
    if (resolvedPath === undefined)
      return;
    return getByPath(ctx.stateModel, resolvedPath);
  }
  if (isCondExpression(value)) {
    const result = evaluateVisibility(value.$cond, ctx);
    return resolvePropValue(result ? value.$then : value.$else, ctx);
  }
  if (isComputedExpression(value)) {
    const fn = ctx.functions?.[value.$computed];
    if (!fn) {
      if (!warnedComputedFns.has(value.$computed)) {
        if (warnedComputedFns.size < WARNED_COMPUTED_MAX) {
          warnedComputedFns.add(value.$computed);
        }
        console.warn(`Unknown $computed function: "${value.$computed}"`);
      }
      return;
    }
    const resolvedArgs = {};
    if (value.args) {
      for (const [key, arg] of Object.entries(value.args)) {
        resolvedArgs[key] = resolvePropValue(arg, ctx);
      }
    }
    return fn(resolvedArgs);
  }
  if (isTemplateExpression(value)) {
    return value.$template.replace(/\$\{([^}]+)\}/g, (_match, rawPath) => {
      if (rawPath.startsWith("/")) {
        const resolved2 = getByPath(ctx.stateModel, rawPath);
        return resolved2 != null ? String(resolved2) : "";
      }
      if (ctx.repeatItem !== undefined) {
        const fromItem = getByPath(ctx.repeatItem, rawPath);
        if (fromItem != null)
          return String(fromItem);
      }
      const resolved = getByPath(ctx.stateModel, "/" + rawPath);
      return resolved != null ? String(resolved) : "";
    });
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolvePropValue(item, ctx));
  }
  if (typeof value === "object") {
    const directive = findDirective(value, ctx.directives);
    if (directive) {
      return directive.resolve(value, ctx);
    }
    const resolved = {};
    for (const [key, val] of Object.entries(value)) {
      resolved[key] = resolvePropValue(val, ctx);
    }
    return resolved;
  }
  return value;
}
function resolveElementProps(props, ctx) {
  const resolved = {};
  for (const [key, value] of Object.entries(props)) {
    resolved[key] = resolvePropValue(value, ctx);
  }
  return resolved;
}
function resolveBindings(props, ctx) {
  let bindings;
  for (const [key, value] of Object.entries(props)) {
    if (isBindStateExpression(value)) {
      if (!bindings)
        bindings = {};
      bindings[key] = value.$bindState;
    } else if (isBindItemExpression(value)) {
      const resolved = resolveBindItemPath(value.$bindItem, ctx);
      if (resolved !== undefined) {
        if (!bindings)
          bindings = {};
        bindings[key] = resolved;
      }
    }
  }
  return bindings;
}
function resolveActionParam(value, ctx) {
  if (isItemExpression(value)) {
    return resolveBindItemPath(value.$item, ctx);
  }
  if (isIndexExpression(value)) {
    return ctx.repeatIndex;
  }
  return resolvePropValue(value, ctx);
}
// ../../../../../../../../../../private/var/folders/t_/srzvjq016kn2zdmpxsr841b00000gn/Tjson-render-336-strength-lWF3oO/src/action-observer.ts
var observers = new Set;
function registerActionObserver(observer) {
  observers.add(observer);
  return () => {
    observers.delete(observer);
  };
}
function notifyActionDispatch(evt) {
  for (const o of observers) {
    const fn = o.onDispatch;
    if (!fn)
      continue;
    try {
      fn(evt);
    } catch (err) {
      if (true) {
        console.error("[json-render] action observer threw in onDispatch:", err);
      }
    }
  }
}
function notifyActionSettle(evt) {
  for (const o of observers) {
    const fn = o.onSettle;
    if (!fn)
      continue;
    try {
      fn(evt);
    } catch (err) {
      if (true) {
        console.error("[json-render] action observer threw in onSettle:", err);
      }
    }
  }
}
var dispatchCounter = 0;
function nextActionDispatchId() {
  dispatchCounter += 1;
  return `${Date.now()}-${dispatchCounter}`;
}
// ../../../../../../../../../../private/var/folders/t_/srzvjq016kn2zdmpxsr841b00000gn/Tjson-render-336-strength-lWF3oO/src/devtools-flag.ts
var activeCount = 0;
var listeners = new Set;
function markDevtoolsActive() {
  activeCount += 1;
  notifyDevtoolsActiveChange();
  let released = false;
  return () => {
    if (released)
      return;
    released = true;
    activeCount = Math.max(0, activeCount - 1);
    notifyDevtoolsActiveChange();
  };
}
function isDevtoolsActive() {
  return activeCount > 0;
}
function subscribeDevtoolsActive(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function notifyDevtoolsActiveChange() {
  for (const l of listeners) {
    try {
      l();
    } catch (err) {
      if (true) {
        console.error("[json-render] devtools-active listener threw:", err);
      }
    }
  }
}
// ../../../../../../../../../../private/var/folders/t_/srzvjq016kn2zdmpxsr841b00000gn/Tjson-render-336-strength-lWF3oO/src/actions.ts
import { z as z3 } from "zod";
var ActionConfirmSchema = z3.object({
  title: z3.string(),
  message: z3.string(),
  confirmLabel: z3.string().optional(),
  cancelLabel: z3.string().optional(),
  variant: z3.enum(["default", "danger"]).optional()
});
var ActionOnSuccessSchema = z3.union([
  z3.object({ navigate: z3.string() }),
  z3.object({ set: z3.record(z3.string(), z3.unknown()) }),
  z3.object({
    action: z3.string(),
    params: z3.record(z3.string(), DynamicValueSchema).optional()
  })
]);
var ActionOnErrorSchema = z3.union([
  z3.object({ set: z3.record(z3.string(), z3.unknown()) }),
  z3.object({
    action: z3.string(),
    params: z3.record(z3.string(), DynamicValueSchema).optional()
  })
]);
var ActionBindingSchema = z3.object({
  action: z3.string(),
  params: z3.record(z3.string(), DynamicValueSchema).optional(),
  confirm: ActionConfirmSchema.optional(),
  onSuccess: ActionOnSuccessSchema.optional(),
  onError: ActionOnErrorSchema.optional(),
  preventDefault: z3.boolean().optional()
});
var ActionSchema = ActionBindingSchema;
function resolveAction(binding, stateModel) {
  const resolvedParams = {};
  if (binding.params) {
    for (const [key, value] of Object.entries(binding.params)) {
      resolvedParams[key] = resolveDynamicValue(value, stateModel);
    }
  }
  let confirm = binding.confirm;
  if (confirm) {
    confirm = {
      ...confirm,
      message: interpolateString(confirm.message, stateModel),
      title: interpolateString(confirm.title, stateModel)
    };
  }
  return {
    action: binding.action,
    params: resolvedParams,
    confirm,
    onSuccess: binding.onSuccess,
    onError: binding.onError
  };
}
function interpolateString(template, stateModel) {
  return template.replace(/\$\{([^}]+)\}/g, (_, path) => {
    const value = resolveDynamicValue({ $state: path }, stateModel);
    return String(value ?? "");
  });
}
async function executeAction(ctx) {
  const { action, handler, setState, navigate, executeAction: executeAction2 } = ctx;
  try {
    await handler(action.params);
    if (action.onSuccess) {
      if ("navigate" in action.onSuccess && navigate) {
        navigate(action.onSuccess.navigate);
      } else if ("set" in action.onSuccess) {
        for (const [path, value] of Object.entries(action.onSuccess.set)) {
          setState(path, value);
        }
      } else if ("action" in action.onSuccess && executeAction2) {
        await executeAction2(action.onSuccess);
      }
    }
  } catch (error) {
    if (action.onError) {
      if ("set" in action.onError) {
        for (const [path, value] of Object.entries(action.onError.set)) {
          const resolvedValue = typeof value === "string" && value === "$error.message" ? error.message : value;
          setState(path, resolvedValue);
        }
      } else if ("action" in action.onError && executeAction2) {
        await executeAction2(action.onError);
      }
    } else {
      throw error;
    }
  }
}
var actionBinding = {
  simple: (actionName, params) => ({
    action: actionName,
    params
  }),
  withConfirm: (actionName, confirm, params) => ({
    action: actionName,
    params,
    confirm
  }),
  withSuccess: (actionName, onSuccess, params) => ({
    action: actionName,
    params,
    onSuccess
  })
};
var action = actionBinding;
// ../../../../../../../../../../private/var/folders/t_/srzvjq016kn2zdmpxsr841b00000gn/Tjson-render-336-strength-lWF3oO/src/validation.ts
import { z as z4 } from "zod";
var ValidationCheckSchema = z4.object({
  type: z4.string(),
  args: z4.record(z4.string(), DynamicValueSchema).optional(),
  message: z4.string()
});
var ValidationConfigSchema = z4.object({
  checks: z4.array(ValidationCheckSchema).optional(),
  validateOn: z4.enum(["change", "blur", "submit"]).optional(),
  enabled: VisibilityConditionSchema.optional()
});
var matchesImpl = (value, args) => {
  const other = args?.other;
  return value === other;
};
var builtInValidationFunctions = {
  required: (value) => {
    if (value === null || value === undefined)
      return false;
    if (typeof value === "string")
      return value.trim().length > 0;
    if (Array.isArray(value))
      return value.length > 0;
    return true;
  },
  email: (value) => {
    if (typeof value !== "string")
      return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },
  minLength: (value, args) => {
    if (typeof value !== "string")
      return false;
    const min = args?.min;
    if (typeof min !== "number")
      return false;
    return value.length >= min;
  },
  maxLength: (value, args) => {
    if (typeof value !== "string")
      return false;
    const max = args?.max;
    if (typeof max !== "number")
      return false;
    return value.length <= max;
  },
  pattern: (value, args) => {
    if (typeof value !== "string")
      return false;
    const pattern = args?.pattern;
    if (typeof pattern !== "string")
      return false;
    try {
      return new RegExp(pattern).test(value);
    } catch {
      return false;
    }
  },
  min: (value, args) => {
    if (typeof value !== "number")
      return false;
    const min = args?.min;
    if (typeof min !== "number")
      return false;
    return value >= min;
  },
  max: (value, args) => {
    if (typeof value !== "number")
      return false;
    const max = args?.max;
    if (typeof max !== "number")
      return false;
    return value <= max;
  },
  numeric: (value) => {
    if (typeof value === "number")
      return !isNaN(value);
    if (typeof value === "string")
      return !isNaN(parseFloat(value));
    return false;
  },
  url: (value) => {
    if (typeof value !== "string")
      return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  matches: matchesImpl,
  equalTo: matchesImpl,
  lessThan: (value, args) => {
    const other = args?.other;
    if (value == null || other == null || value === "" || other === "")
      return false;
    if (typeof value === "number" && typeof other === "number")
      return value < other;
    if (typeof value === "string" && typeof other === "string")
      return value < other;
    const numVal = Number(value);
    const numOther = Number(other);
    if (!isNaN(numVal) && !isNaN(numOther))
      return numVal < numOther;
    return false;
  },
  greaterThan: (value, args) => {
    const other = args?.other;
    if (value == null || other == null || value === "" || other === "")
      return false;
    if (typeof value === "number" && typeof other === "number")
      return value > other;
    if (typeof value === "string" && typeof other === "string")
      return value > other;
    const numVal = Number(value);
    const numOther = Number(other);
    if (!isNaN(numVal) && !isNaN(numOther))
      return numVal > numOther;
    return false;
  },
  requiredIf: (value, args) => {
    const condition = args?.field;
    if (!condition)
      return true;
    if (value === null || value === undefined)
      return false;
    if (typeof value === "string")
      return value.trim().length > 0;
    if (Array.isArray(value))
      return value.length > 0;
    return true;
  }
};
function runValidationCheck(check, ctx) {
  const { value, stateModel, customFunctions } = ctx;
  const resolvedArgs = {};
  if (check.args) {
    for (const [key, argValue] of Object.entries(check.args)) {
      resolvedArgs[key] = resolvePropValue(argValue, { stateModel });
    }
  }
  const validationFn = builtInValidationFunctions[check.type] ?? customFunctions?.[check.type];
  if (!validationFn) {
    console.warn(`Unknown validation function: ${check.type}`);
    return {
      type: check.type,
      valid: true,
      message: check.message
    };
  }
  const valid = validationFn(value, resolvedArgs);
  return {
    type: check.type,
    valid,
    message: check.message
  };
}
function runValidation(config, ctx) {
  const checks = [];
  const errors = [];
  if (config.enabled) {
    const enabled = evaluateVisibility(config.enabled, {
      stateModel: ctx.stateModel
    });
    if (!enabled) {
      return { valid: true, errors: [], checks: [] };
    }
  }
  if (config.checks) {
    for (const check of config.checks) {
      const result = runValidationCheck(check, ctx);
      checks.push(result);
      if (!result.valid) {
        errors.push(result.message);
      }
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    checks
  };
}
var check = {
  required: (message = "This field is required") => ({
    type: "required",
    message
  }),
  email: (message = "Invalid email address") => ({
    type: "email",
    message
  }),
  minLength: (min, message) => ({
    type: "minLength",
    args: { min },
    message: message ?? `Must be at least ${min} characters`
  }),
  maxLength: (max, message) => ({
    type: "maxLength",
    args: { max },
    message: message ?? `Must be at most ${max} characters`
  }),
  pattern: (pattern, message = "Invalid format") => ({
    type: "pattern",
    args: { pattern },
    message
  }),
  min: (min, message) => ({
    type: "min",
    args: { min },
    message: message ?? `Must be at least ${min}`
  }),
  max: (max, message) => ({
    type: "max",
    args: { max },
    message: message ?? `Must be at most ${max}`
  }),
  url: (message = "Invalid URL") => ({
    type: "url",
    message
  }),
  numeric: (message = "Must be a number") => ({
    type: "numeric",
    message
  }),
  matches: (otherPath, message = "Fields must match") => ({
    type: "matches",
    args: { other: { $state: otherPath } },
    message
  }),
  equalTo: (otherPath, message = "Fields must match") => ({
    type: "equalTo",
    args: { other: { $state: otherPath } },
    message
  }),
  lessThan: (otherPath, message) => ({
    type: "lessThan",
    args: { other: { $state: otherPath } },
    message: message ?? "Must be less than the compared field"
  }),
  greaterThan: (otherPath, message) => ({
    type: "greaterThan",
    args: { other: { $state: otherPath } },
    message: message ?? "Must be greater than the compared field"
  }),
  requiredIf: (fieldPath, message = "This field is required") => ({
    type: "requiredIf",
    args: { field: { $state: fieldPath } },
    message
  })
};
// ../../../../../../../../../../private/var/folders/t_/srzvjq016kn2zdmpxsr841b00000gn/Tjson-render-336-strength-lWF3oO/src/spec-validator.ts
function validateSpec(spec, options = {}) {
  const { checkOrphans = false } = options;
  const issues = [];
  if (!spec.root) {
    issues.push({
      severity: "error",
      message: "Spec has no root element defined.",
      code: "missing_root"
    });
    return { valid: false, issues };
  }
  if (!spec.elements[spec.root]) {
    issues.push({
      severity: "error",
      message: `Root element "${spec.root}" not found in elements map.`,
      code: "root_not_found"
    });
  }
  if (Object.keys(spec.elements).length === 0) {
    issues.push({
      severity: "error",
      message: "Spec has no elements.",
      code: "empty_spec"
    });
    return { valid: false, issues };
  }
  for (const [key, element] of Object.entries(spec.elements)) {
    if (element.children) {
      for (const childKey of element.children) {
        if (!spec.elements[childKey]) {
          issues.push({
            severity: "error",
            message: `Element "${key}" references child "${childKey}" which does not exist in the elements map.`,
            elementKey: key,
            code: "missing_child"
          });
        }
      }
    }
    if (element.slots) {
      for (const [slotName, childKeys] of Object.entries(element.slots)) {
        for (const childKey of childKeys) {
          if (!spec.elements[childKey]) {
            issues.push({
              severity: "error",
              message: `Element "${key}" references child "${childKey}" in slot "${slotName}" which does not exist in the elements map.`,
              elementKey: key,
              code: "missing_child"
            });
          }
        }
      }
    }
    if (element.repeat !== undefined) {
      if (!element.children || element.children.length === 0) {
        issues.push({
          severity: "error",
          message: `Element "${key}" has "repeat" but no children. The repeated template must be a child element: add a child that renders one item (it may read fields with {"$item": "field"}).`,
          elementKey: key,
          code: "repeat_without_children"
        });
      }
    }
    if (element.visible !== undefined && !VisibilityConditionStrictSchema.safeParse(element.visible).success) {
      issues.push({
        severity: "error",
        message: `Element "${key}" has an invalid "visible" condition: ${JSON.stringify(element.visible)}. Valid forms: true, false, {"$state":"/path","eq":value}, {"$item":"field","eq":value}, {"$index":true,"eq":n}, an array of those (AND), or {"$and":[...]} / {"$or":[...]}. Use exactly one of $state, $item, or $index per condition object.`,
        elementKey: key,
        code: "invalid_visible"
      });
    }
    const props = element.props;
    if (props && "visible" in props && props.visible !== undefined) {
      issues.push({
        severity: "error",
        message: `Element "${key}" has "visible" inside "props". It should be a top-level field on the element (sibling of type/props/children).`,
        elementKey: key,
        code: "visible_in_props"
      });
    }
    if (props && "on" in props && props.on !== undefined) {
      issues.push({
        severity: "error",
        message: `Element "${key}" has "on" inside "props". It should be a top-level field on the element (sibling of type/props/children).`,
        elementKey: key,
        code: "on_in_props"
      });
    }
    if (props && "repeat" in props && props.repeat !== undefined) {
      issues.push({
        severity: "error",
        message: `Element "${key}" has "repeat" inside "props". It should be a top-level field on the element (sibling of type/props/children).`,
        elementKey: key,
        code: "repeat_in_props"
      });
    }
    if (props && "watch" in props && props.watch !== undefined) {
      issues.push({
        severity: "error",
        message: `Element "${key}" has "watch" inside "props". It should be a top-level field on the element (sibling of type/props/children).`,
        elementKey: key,
        code: "watch_in_props"
      });
    }
  }
  const repeatValidatedKeys = new Set;
  const repeatValidatedContexts = new Set;
  const validateRepeatPaths = (key, repeatBasePath, sampleAvailable, ancestors) => {
    if (ancestors.has(key))
      return;
    const element = spec.elements[key];
    if (!element)
      return;
    repeatValidatedKeys.add(key);
    const contextKey = `${key}\x00${repeatBasePath ?? ""}\x00${sampleAvailable}`;
    if (repeatValidatedContexts.has(contextKey))
      return;
    repeatValidatedContexts.add(contextKey);
    let childRepeatBasePath = repeatBasePath;
    let childSampleAvailable = sampleAvailable;
    if (element.repeat !== undefined) {
      const statePath = resolveRepeatStatePath(element.repeat.statePath, repeatBasePath);
      const displayPath = typeof element.repeat.statePath === "string" ? element.repeat.statePath : JSON.stringify(element.repeat.statePath);
      if (statePath === undefined) {
        issues.push({
          severity: "error",
          message: `Element "${key}" uses relative repeat statePath ${displayPath} outside a repeat scope.`,
          elementKey: key,
          code: "repeat_item_outside_scope"
        });
        childRepeatBasePath = undefined;
        childSampleAvailable = false;
      } else {
        const canCheckSample = spec.state !== undefined && (typeof element.repeat.statePath === "string" || sampleAvailable);
        const value = canCheckSample ? getByPath(spec.state, statePath) : undefined;
        if (canCheckSample && !Array.isArray(value)) {
          issues.push({
            severity: "error",
            message: `Element "${key}" repeats over "${statePath}" but state${value === undefined ? " has no value there" : ` has a ${typeof value} there`}. Repeat statePath must reference an array in state; add sample items to state at that path.`,
            elementKey: key,
            code: "repeat_state_mismatch"
          });
        }
        childRepeatBasePath = resolveRepeatItemStatePath(statePath, 0);
        childSampleAvailable = canCheckSample && Array.isArray(value) && value.length > 0;
      }
    }
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(key);
    for (const childKey of element.children ?? []) {
      validateRepeatPaths(childKey, childRepeatBasePath, childSampleAvailable, nextAncestors);
    }
    for (const childKeys of Object.values(element.slots ?? {})) {
      for (const childKey of childKeys) {
        validateRepeatPaths(childKey, repeatBasePath, sampleAvailable, nextAncestors);
      }
    }
  };
  if (spec.elements[spec.root]) {
    validateRepeatPaths(spec.root, undefined, true, new Set);
  }
  for (const key of Object.keys(spec.elements)) {
    if (!repeatValidatedKeys.has(key)) {
      validateRepeatPaths(key, undefined, true, new Set);
    }
  }
  if (checkOrphans) {
    const reachable = new Set;
    const walk = (key) => {
      if (reachable.has(key))
        return;
      reachable.add(key);
      const el = spec.elements[key];
      if (el?.children) {
        for (const childKey of el.children) {
          if (spec.elements[childKey]) {
            walk(childKey);
          }
        }
      }
      if (el?.slots) {
        for (const childKeys of Object.values(el.slots)) {
          for (const childKey of childKeys) {
            if (spec.elements[childKey]) {
              walk(childKey);
            }
          }
        }
      }
    };
    if (spec.elements[spec.root]) {
      walk(spec.root);
    }
    for (const key of Object.keys(spec.elements)) {
      if (!reachable.has(key)) {
        issues.push({
          severity: "warning",
          message: `Element "${key}" is not reachable from root "${spec.root}".`,
          elementKey: key,
          code: "orphaned_element"
        });
      }
    }
  }
  const hasErrors = issues.some((i) => i.severity === "error");
  return { valid: !hasErrors, issues };
}
function autoFixSpec(spec, options = {}) {
  const applyLossy = options.lossy !== false;
  const fixDetails = [];
  const fixes = {
    push(message, lossy = false) {
      fixDetails.push({ message, lossy });
    }
  };
  const fixedElements = {};
  for (const [key, element] of Object.entries(spec.elements)) {
    const props = element.props;
    let fixed = element;
    if (props && "visible" in props && props.visible !== undefined) {
      const { visible, ...restProps } = fixed.props;
      fixed = {
        ...fixed,
        props: restProps,
        visible
      };
      fixes.push(`Moved "visible" from props to element level on "${key}".`);
    }
    let currentProps = fixed.props;
    if (currentProps && "on" in currentProps && currentProps.on !== undefined) {
      const { on, ...restProps } = currentProps;
      fixed = {
        ...fixed,
        props: restProps,
        on
      };
      fixes.push(`Moved "on" from props to element level on "${key}".`);
    }
    currentProps = fixed.props;
    if (currentProps && "repeat" in currentProps && currentProps.repeat !== undefined) {
      const { repeat, ...restProps } = currentProps;
      fixed = {
        ...fixed,
        props: restProps,
        repeat
      };
      fixes.push(`Moved "repeat" from props to element level on "${key}".`);
    }
    currentProps = fixed.props;
    if (currentProps && "watch" in currentProps && currentProps.watch !== undefined) {
      const { watch, ...restProps } = currentProps;
      fixed = {
        ...fixed,
        props: restProps,
        watch
      };
      fixes.push(`Moved "watch" from props to element level on "${key}".`);
    }
    fixedElements[key] = fixed;
  }
  if (applyLossy)
    for (const [key, element] of Object.entries(fixedElements)) {
      if (!element.children || element.children.length === 0)
        continue;
      const present = element.children.filter((child) => (child in fixedElements));
      if (present.length === element.children.length)
        continue;
      if (element.repeat !== undefined && present.length === 0) {
        continue;
      }
      for (const child of element.children) {
        if (!(child in fixedElements)) {
          fixes.push(`Removed reference to undefined element "${child}" from children of "${key}".`, true);
        }
      }
      fixedElements[key] = { ...element, children: present };
    }
  if (applyLossy)
    for (const [key, element] of Object.entries(fixedElements)) {
      if (!element.slots)
        continue;
      let changed = false;
      const slots = Object.fromEntries(Object.entries(element.slots).map(([slotName, childKeys]) => {
        const present = childKeys.filter((child) => (child in fixedElements));
        if (present.length !== childKeys.length) {
          changed = true;
          for (const child of childKeys) {
            if (!(child in fixedElements)) {
              fixes.push(`Removed reference to undefined element "${child}" from slot "${slotName}" of "${key}".`, true);
            }
          }
        }
        return [slotName, present];
      }));
      if (changed) {
        fixedElements[key] = { ...element, slots };
      }
    }
  return {
    spec: { root: spec.root, elements: fixedElements, state: spec.state },
    fixes: fixDetails.map((fix) => fix.message),
    fixDetails
  };
}
function formatSpecIssues(issues) {
  const errors = issues.filter((i) => i.severity === "error");
  if (errors.length === 0)
    return "";
  const lines = ["The generated UI spec has the following errors:"];
  for (const issue of errors) {
    lines.push(`- ${issue.message}`);
  }
  return lines.join(`
`);
}
// ../../../../../../../../../../private/var/folders/t_/srzvjq016kn2zdmpxsr841b00000gn/Tjson-render-336-strength-lWF3oO/src/schema.ts
import { z as z5 } from "zod";

// ../../../../../../../../../../private/var/folders/t_/srzvjq016kn2zdmpxsr841b00000gn/Tjson-render-336-strength-lWF3oO/src/edit-modes.ts
var DEFAULT_MODES = ["patch"];
function normalizeModes(config) {
  if (!config?.modes?.length)
    return DEFAULT_MODES;
  return config.modes;
}
function jsonPatchInstructions() {
  return [
    "PATCH MODE (RFC 6902 JSON Patch):",
    "Output one JSON object per line. Each line is a patch operation.",
    '- Add: {"op":"add","path":"/elements/new-key","value":{...}}',
    '- Replace: {"op":"replace","path":"/elements/existing-key","value":{...}}',
    '- Remove: {"op":"remove","path":"/elements/old-key"}',
    "Only output patches for what needs to change."
  ].join(`
`);
}
function jsonMergeInstructions() {
  return [
    "MERGE MODE (RFC 7396 JSON Merge Patch):",
    "Output a single JSON object on one line with __json_edit set to true.",
    "Include only the keys that changed. Unmentioned keys are preserved.",
    "Set a key to null to delete it.",
    "",
    "Example (update a title and add an element):",
    '{"__json_edit":true,"elements":{"main":{"props":{"title":"New Title"}},"new-el":{"type":"Card","props":{},"children":[]}}}',
    "",
    "Example (delete an element):",
    '{"__json_edit":true,"elements":{"old-widget":null}}'
  ].join(`
`);
}
function jsonDiffInstructions() {
  return [
    "DIFF MODE (unified diff):",
    "Output a unified diff inside a ```diff code fence.",
    "The diff applies against the JSON-serialized current spec.",
    "",
    "Example:",
    "```diff",
    "--- a/spec.json",
    "+++ b/spec.json",
    "@@ -3,1 +3,1 @@",
    '-      "title": "Login"',
    '+      "title": "Welcome Back"',
    "```"
  ].join(`
`);
}
function yamlPatchInstructions() {
  return [
    "PATCH MODE (RFC 6902 JSON Patch):",
    "Output RFC 6902 JSON Patch lines inside a ```yaml-patch code fence.",
    "Each line is one JSON patch operation.",
    "",
    "Example:",
    "```yaml-patch",
    '{"op":"replace","path":"/elements/main/props/title","value":"New Title"}',
    '{"op":"add","path":"/elements/new-el","value":{"type":"Card","props":{},"children":[]}}',
    "```"
  ].join(`
`);
}
function yamlMergeInstructions() {
  return [
    "MERGE MODE (RFC 7396 JSON Merge Patch):",
    "Output only the changed parts in a ```yaml-edit code fence.",
    "Uses deep merge semantics: only keys you include are updated. Unmentioned elements and props are preserved.",
    "Set a key to null to delete it.",
    "",
    "Example edit (update title, add a new element):",
    "```yaml-edit",
    "elements:",
    "  main:",
    "    props:",
    "      title: Updated Title",
    "  new-chart:",
    "    type: Card",
    "    props: {}",
    "    children: []",
    "```",
    "",
    "Example deletion:",
    "```yaml-edit",
    "elements:",
    "  old-widget: null",
    "```"
  ].join(`
`);
}
function yamlDiffInstructions() {
  return [
    "DIFF MODE (unified diff):",
    "Output a unified diff inside a ```diff code fence.",
    "The diff applies against the YAML-serialized current spec.",
    "",
    "Example:",
    "```diff",
    "--- a/spec.yaml",
    "+++ b/spec.yaml",
    "@@ -6,1 +6,1 @@",
    "-      title: Login",
    "+      title: Welcome Back",
    "```"
  ].join(`
`);
}
function modeSelectionGuidance(modes) {
  if (modes.length === 1)
    return "";
  const parts = ["Choose the best edit strategy for the requested change:"];
  if (modes.includes("patch")) {
    parts.push("- PATCH: best for precise, targeted single-field updates");
  }
  if (modes.includes("merge")) {
    parts.push("- MERGE: best for structural changes (add/remove elements, reparent children, update multiple props at once)");
  }
  if (modes.includes("diff")) {
    parts.push("- DIFF: best for small text-level changes when you can see the exact lines to change");
  }
  return parts.join(`
`);
}
function buildEditInstructions(config, format) {
  const modes = normalizeModes(config);
  const sections = [];
  sections.push("EDITING EXISTING SPECS:");
  sections.push("");
  const guidance = modeSelectionGuidance(modes);
  if (guidance) {
    sections.push(guidance);
    sections.push("");
  }
  for (const mode of modes) {
    if (format === "json") {
      switch (mode) {
        case "patch":
          sections.push(jsonPatchInstructions());
          break;
        case "merge":
          sections.push(jsonMergeInstructions());
          break;
        case "diff":
          sections.push(jsonDiffInstructions());
          break;
      }
    } else {
      switch (mode) {
        case "patch":
          sections.push(yamlPatchInstructions());
          break;
        case "merge":
          sections.push(yamlMergeInstructions());
          break;
        case "diff":
          sections.push(yamlDiffInstructions());
          break;
      }
    }
    sections.push("");
  }
  return sections.join(`
`);
}
function addLineNumbers(text) {
  const lines = text.split(`
`);
  const width = String(lines.length).length;
  return lines.map((line, i) => `${String(i + 1).padStart(width)}| ${line}`).join(`
`);
}
function isNonEmptySpec(spec) {
  if (!spec || typeof spec !== "object")
    return false;
  const s = spec;
  return typeof s.root === "string" && typeof s.elements === "object" && s.elements !== null && Object.keys(s.elements).length > 0;
}
function buildEditUserPrompt(options) {
  const { prompt, currentSpec, config, format, maxPromptLength, serializer } = options;
  let userText = String(prompt || "");
  if (maxPromptLength !== undefined && maxPromptLength > 0) {
    userText = userText.slice(0, maxPromptLength);
  }
  if (!isNonEmptySpec(currentSpec)) {
    return userText;
  }
  const modes = normalizeModes(config);
  const showLineNumbers = modes.includes("diff");
  const serialize = serializer ?? ((s) => JSON.stringify(s, null, 2));
  const specText = serialize(currentSpec);
  const parts = [];
  if (showLineNumbers) {
    parts.push("CURRENT UI STATE (line numbers for reference):");
    parts.push("```");
    parts.push(addLineNumbers(specText));
    parts.push("```");
  } else {
    parts.push("CURRENT UI STATE (already loaded, DO NOT recreate existing elements):");
    parts.push("```");
    parts.push(specText);
    parts.push("```");
  }
  parts.push("");
  parts.push(`USER REQUEST: ${userText}`);
  parts.push("");
  if (modes.length === 1) {
    const mode = modes[0];
    switch (mode) {
      case "patch":
        parts.push(format === "yaml" ? "Output ONLY the patches in a ```yaml-patch fence." : "Output ONLY the JSON Patch lines needed for the change.");
        break;
      case "merge":
        parts.push(format === "yaml" ? "Output ONLY the changes in a ```yaml-edit fence. Include only keys that need to change." : "Output ONLY a single JSON merge line with __json_edit set to true. Include only keys that need to change.");
        break;
      case "diff":
        parts.push("Output ONLY the unified diff in a ```diff fence.");
        break;
    }
  } else {
    const modeNames = modes.map((m) => {
      switch (m) {
        case "patch":
          return format === "yaml" ? "```yaml-patch fence" : "JSON Patch lines";
        case "merge":
          return format === "yaml" ? "```yaml-edit fence" : "JSON merge line (__json_edit)";
        case "diff":
          return "```diff fence";
      }
    });
    parts.push(`Choose the best edit strategy and output using one of: ${modeNames.join(", ")}`);
  }
  return parts.join(`
`);
}

// ../../../../../../../../../../private/var/folders/t_/srzvjq016kn2zdmpxsr841b00000gn/Tjson-render-336-strength-lWF3oO/src/schema.ts
function createBuilder() {
  return {
    string: () => ({ kind: "string" }),
    number: () => ({ kind: "number" }),
    boolean: () => ({ kind: "boolean" }),
    array: (item) => ({ kind: "array", inner: item }),
    object: (shape) => ({ kind: "object", inner: shape }),
    record: (value) => ({ kind: "record", inner: value }),
    any: () => ({ kind: "any" }),
    zod: () => ({ kind: "zod" }),
    ref: (path) => ({ kind: "ref", inner: path }),
    propsOf: (path) => ({ kind: "propsOf", inner: path }),
    map: (entryShape) => ({ kind: "map", inner: entryShape }),
    optional: () => ({ optional: true })
  };
}
function defineSchema(builder, options) {
  const s = createBuilder();
  const definition = builder(s);
  return {
    definition,
    promptTemplate: options?.promptTemplate,
    defaultRules: options?.defaultRules,
    builtInActions: options?.builtInActions,
    createCatalog(catalog) {
      return createCatalogFromSchema(this, catalog);
    }
  };
}
function createCatalogFromSchema(schema, catalogData) {
  const components = catalogData.components;
  const actions = catalogData.actions;
  const componentNames = components ? Object.keys(components) : [];
  const actionNames = actions ? Object.keys(actions) : [];
  const zodSchema = buildZodSchemaFromDefinition(schema.definition, catalogData);
  return {
    schema,
    data: catalogData,
    componentNames,
    actionNames,
    prompt(options = {}) {
      return generatePrompt(this, options);
    },
    jsonSchema(options = {}) {
      return zodToJsonSchema(zodSchema, options.strict ?? false);
    },
    validate(spec) {
      const result = zodSchema.safeParse(spec);
      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      }
      return { success: false, error: result.error };
    },
    zodSchema() {
      return zodSchema;
    },
    get _specType() {
      throw new Error("_specType is only for type inference");
    }
  };
}
function buildZodSchemaFromDefinition(definition, catalogData) {
  return buildZodType(definition.spec, catalogData);
}
function buildZodType(schemaType, catalogData) {
  switch (schemaType.kind) {
    case "string":
      return z5.string();
    case "number":
      return z5.number();
    case "boolean":
      return z5.boolean();
    case "any":
      return z5.any();
    case "array": {
      const inner = buildZodType(schemaType.inner, catalogData);
      return z5.array(inner);
    }
    case "object": {
      const shape = schemaType.inner;
      const zodShape = {};
      for (const [key, value] of Object.entries(shape)) {
        let zodType = buildZodType(value, catalogData);
        if (value.optional) {
          zodType = zodType.optional();
        }
        zodShape[key] = zodType;
      }
      return z5.object(zodShape);
    }
    case "record": {
      const inner = buildZodType(schemaType.inner, catalogData);
      return z5.record(z5.string(), inner);
    }
    case "ref": {
      const path = schemaType.inner;
      const keys = getKeysFromPath(path, catalogData);
      if (keys.length === 0) {
        return z5.string();
      }
      if (keys.length === 1) {
        return z5.literal(keys[0]);
      }
      return z5.enum(keys);
    }
    case "propsOf": {
      const path = schemaType.inner;
      const propsSchemas = getPropsFromPath(path, catalogData);
      if (propsSchemas.length === 0) {
        return z5.record(z5.string(), z5.unknown());
      }
      if (propsSchemas.length === 1) {
        return propsSchemas[0];
      }
      return z5.record(z5.string(), z5.unknown());
    }
    default:
      return z5.unknown();
  }
}
function getKeysFromPath(path, catalogData) {
  const parts = path.split(".");
  let current = { catalog: catalogData };
  for (const part of parts) {
    if (current && typeof current === "object") {
      current = current[part];
    } else {
      return [];
    }
  }
  if (current && typeof current === "object") {
    return Object.keys(current);
  }
  return [];
}
function getPropsFromPath(path, catalogData) {
  const parts = path.split(".");
  let current = { catalog: catalogData };
  for (const part of parts) {
    if (current && typeof current === "object") {
      current = current[part];
    } else {
      return [];
    }
  }
  if (current && typeof current === "object") {
    return Object.values(current).map((entry) => entry.props).filter((props) => props !== undefined);
  }
  return [];
}
function generatePrompt(catalog, options) {
  if (catalog.schema.promptTemplate) {
    const context = {
      catalog: catalog.data,
      componentNames: catalog.componentNames,
      actionNames: catalog.actionNames,
      options,
      formatZodType
    };
    return catalog.schema.promptTemplate(context);
  }
  const {
    system = "You are a UI generator that outputs JSON.",
    customRules = [],
    mode: rawMode = "standalone"
  } = options;
  const mode = rawMode === "chat" ? (console.warn('[json-render] mode "chat" is deprecated, use "inline" instead'), "inline") : rawMode === "generate" ? (console.warn('[json-render] mode "generate" is deprecated, use "standalone" instead'), "standalone") : rawMode;
  const lines = [];
  lines.push(system);
  lines.push("");
  if (mode === "inline") {
    lines.push("OUTPUT FORMAT (text + JSONL, RFC 6902 JSON Patch):");
    lines.push("You respond conversationally. When generating UI, first write a brief explanation (1-3 sentences), then output JSONL patch lines wrapped in a ```spec code fence.");
    lines.push("The JSONL lines use RFC 6902 JSON Patch operations to build a UI tree. Always wrap them in a ```spec fence block:");
    lines.push("  ```spec");
    lines.push('  {"op":"add","path":"/root","value":"main"}');
    lines.push('  {"op":"add","path":"/elements/main","value":{"type":"Card","props":{"title":"Hello"},"children":[]}}');
    lines.push("  ```");
    lines.push("If the user's message does not require a UI (e.g. a greeting or clarifying question), respond with text only — no JSONL.");
  } else {
    lines.push("OUTPUT FORMAT (JSONL, RFC 6902 JSON Patch):");
    lines.push("Output JSONL (one JSON object per line) using RFC 6902 JSON Patch operations to build a UI tree.");
  }
  lines.push("Each line is a JSON patch operation (add, remove, replace). Start with /root, then stream /elements and /state patches interleaved so the UI fills in progressively as it streams.");
  lines.push("");
  lines.push("Example output (each line is a separate JSON object):");
  lines.push("");
  const allComponents = catalog.data.components;
  const specDefinition = catalog.schema.definition.spec;
  const specShape = specDefinition.kind === "object" ? specDefinition.inner : undefined;
  const elementsDefinition = specShape?.elements;
  const elementDefinition = elementsDefinition?.kind === "record" ? elementsDefinition.inner : undefined;
  const elementShape = elementDefinition?.kind === "object" ? elementDefinition.inner : undefined;
  const supportsNamedSlots = elementShape?.slots !== undefined;
  const cn = catalog.componentNames;
  const comp1 = cn[0] || "Component";
  const comp2 = cn.length > 1 ? cn[1] : comp1;
  const comp1Def = allComponents?.[comp1];
  const comp2Def = allComponents?.[comp2];
  const comp1Props = comp1Def ? getExampleProps(comp1Def) : {};
  const comp2Props = comp2Def ? getExampleProps(comp2Def) : {};
  const dynamicPropName = comp2Def?.props ? findFirstStringProp(comp2Def.props) : null;
  const dynamicProps = dynamicPropName ? { ...comp2Props, [dynamicPropName]: { $item: "title" } } : comp2Props;
  const exampleOutput = [
    JSON.stringify({ op: "add", path: "/root", value: "main" }),
    JSON.stringify({
      op: "add",
      path: "/elements/main",
      value: {
        type: comp1,
        props: comp1Props,
        children: ["child-1", "list"]
      }
    }),
    JSON.stringify({
      op: "add",
      path: "/elements/child-1",
      value: { type: comp2, props: comp2Props, children: [] }
    }),
    JSON.stringify({
      op: "add",
      path: "/elements/list",
      value: {
        type: comp1,
        props: comp1Props,
        repeat: { statePath: "/items", key: "id" },
        children: ["item"]
      }
    }),
    JSON.stringify({
      op: "add",
      path: "/elements/item",
      value: { type: comp2, props: dynamicProps, children: [] }
    }),
    JSON.stringify({ op: "add", path: "/state/items", value: [] }),
    JSON.stringify({
      op: "add",
      path: "/state/items/0",
      value: { id: "1", title: "First Item" }
    }),
    JSON.stringify({
      op: "add",
      path: "/state/items/1",
      value: { id: "2", title: "Second Item" }
    })
  ].join(`
`);
  lines.push(`${exampleOutput}

Note: state patches appear right after the elements that use them, so the UI fills in as it streams. ONLY use component types from the AVAILABLE COMPONENTS list below.`);
  lines.push("");
  lines.push("INITIAL STATE:");
  lines.push("Specs include a /state field to seed the state model. Components with { $bindState } or { $bindItem } read from and write to this state, and $state expressions read from it.");
  lines.push("CRITICAL: You MUST include state patches whenever your UI displays data via $state, $bindState, $bindItem, $item, or $index expressions, or uses repeat to iterate over arrays. Without state, these references resolve to nothing and repeat lists render zero items.");
  lines.push("Output state patches right after the elements that reference them, so the UI fills in progressively as it streams.");
  lines.push("Stream state progressively - output one patch per array item instead of one giant blob:");
  lines.push('  For arrays: {"op":"add","path":"/state/posts/0","value":{"id":"1","title":"First Post",...}} then /state/posts/1, /state/posts/2, etc.');
  lines.push('  For scalars: {"op":"add","path":"/state/newTodoText","value":""}');
  lines.push('  Initialize the array first if needed: {"op":"add","path":"/state/posts","value":[]}');
  lines.push('When content comes from the state model, use { "$state": "/some/path" } dynamic props to display it instead of hardcoding the same value in both state and props. The state model is the single source of truth.');
  lines.push("Include realistic sample data in state. For blogs: 3-4 posts with titles, excerpts, authors, dates. For product lists: 3-5 items with names, prices, descriptions. Never leave arrays empty.");
  lines.push("");
  lines.push("DYNAMIC LISTS (repeat field):");
  lines.push('Any element can have a top-level "repeat" field to render its children once per item in a state array: { "repeat": { "statePath": "/arrayPath", "key": "id" } }.');
  lines.push('The element itself renders once (as the container), and its children are expanded once per array item. "statePath" is the state array path. "key" is an optional field name on each item for stable React keys.');
  lines.push('For nested lists, an inner repeat can read an array from the enclosing item with { "statePath": { "$item": "field" } }. This form is valid only inside another repeat. Use an empty field to repeat over the enclosing item itself.');
  lines.push(`Example: ${JSON.stringify({ type: comp1, props: comp1Props, repeat: { statePath: "/todos", key: "id" }, children: ["todo-item"] })}`);
  lines.push('Inside children of a repeated element, use { "$item": "field" } to read a field from the current item, and { "$index": true } to get the current array index. For two-way binding to an item field use { "$bindItem": "completed" } on the appropriate prop.');
  lines.push("ALWAYS use the repeat field for lists backed by state arrays. NEVER hardcode individual elements for each array item.");
  lines.push('IMPORTANT: "repeat" is a top-level field on the element (sibling of type/props/children), NOT inside props.');
  lines.push("");
  lines.push("ARRAY STATE ACTIONS:");
  lines.push('Use action "pushState" to append items to arrays. Params: { statePath: "/arrayPath", value: { ...item }, clearStatePath: "/inputPath" }.');
  lines.push('Values inside pushState can contain { "$state": "/statePath" } references to read current state (e.g. the text from an input field).');
  lines.push('Use "$id" inside a pushState value to auto-generate a unique ID.');
  lines.push('Example: on: { "press": { "action": "pushState", "params": { "statePath": "/todos", "value": { "id": "$id", "title": { "$state": "/newTodoText" }, "completed": false }, "clearStatePath": "/newTodoText" } } }');
  lines.push(`Use action "removeState" to remove items from arrays by index. Params: { statePath: "/arrayPath", index: N }. Inside a repeated element's children, use { "$index": true } for the current item index. Action params support the same expressions as props: { "$item": "field" } resolves to the absolute state path, { "$index": true } resolves to the index number, and { "$state": "/path" } reads a value from state.`);
  lines.push("For lists where users can add/remove items (todos, carts, etc.), use pushState and removeState instead of hardcoding with setState.");
  lines.push("");
  lines.push('IMPORTANT: State paths use RFC 6901 JSON Pointer syntax (e.g. "/todos/0/title"). Do NOT use JavaScript-style dot notation (e.g. "/todos.length" is WRONG). To generate unique IDs for new items, use "$id" instead of trying to read array length.');
  lines.push("");
  const components = allComponents;
  if (components) {
    lines.push(`AVAILABLE COMPONENTS (${catalog.componentNames.length}):`);
    lines.push("");
    for (const [name, def] of Object.entries(components)) {
      const propsStr = def.props ? formatZodType(def.props) : "{}";
      const slotNames = def.slots ?? [];
      const namedSlotNames = slotNames.filter((slot) => slot !== "default");
      const acceptsChildren = slotNames.includes("default");
      const slotsStr = supportsNamedSlots ? [
        acceptsChildren ? "accepts children" : "",
        namedSlotNames.length > 0 ? `slots: ${namedSlotNames.join(", ")}` : ""
      ].filter(Boolean).join("; ") : slotNames.length > 0 ? "accepts children" : "";
      const slotsSuffix = slotsStr ? ` [${slotsStr}]` : "";
      const eventsStr = def.events && def.events.length > 0 ? ` [events: ${def.events.join(", ")}]` : "";
      const descStr = def.description ? ` - ${def.description}` : "";
      lines.push(`- ${name}: ${propsStr}${descStr}${slotsSuffix}${eventsStr}`);
    }
    lines.push("");
  }
  const actions = catalog.data.actions;
  const builtInActions = catalog.schema.builtInActions ?? [];
  const hasCustomActions = actions && catalog.actionNames.length > 0;
  const hasBuiltInActions = builtInActions.length > 0;
  if (hasCustomActions || hasBuiltInActions) {
    lines.push("AVAILABLE ACTIONS:");
    lines.push("");
    for (const action2 of builtInActions) {
      lines.push(`- ${action2.name}: ${action2.description} [built-in]`);
    }
    if (hasCustomActions) {
      for (const [name, def] of Object.entries(actions)) {
        lines.push(`- ${name}${def.description ? `: ${def.description}` : ""}`);
      }
    }
    lines.push("");
  }
  lines.push("EVENTS (the `on` field):");
  lines.push("Elements can have an optional `on` field to bind events to actions. The `on` field is a top-level field on the element (sibling of type/props/children), NOT inside props.");
  lines.push('Each key in `on` is an event name (from the component\'s supported events), and the value is an action binding: `{ "action": "<actionName>", "params": { ... } }`.');
  lines.push("");
  lines.push("Example:");
  lines.push(`  ${JSON.stringify({ type: comp1, props: comp1Props, on: { press: { action: "setState", params: { statePath: "/saved", value: true } } }, children: [] })}`);
  lines.push("");
  lines.push('Action params can use dynamic references to read from state: { "$state": "/statePath" }.');
  lines.push("IMPORTANT: Do NOT put action/actionParams inside props. Always use the `on` field for event bindings.");
  lines.push("");
  lines.push("VISIBILITY CONDITIONS:");
  lines.push("Elements can have an optional `visible` field to conditionally show/hide based on state. IMPORTANT: `visible` is a top-level field on the element object (sibling of type/props/children), NOT inside props.");
  lines.push(`Correct: ${JSON.stringify({ type: comp1, props: comp1Props, visible: { $state: "/activeTab", eq: "home" }, children: ["..."] })}`);
  lines.push('- `{ "$state": "/path" }` - visible when state at path is truthy');
  lines.push('- `{ "$state": "/path", "not": true }` - visible when state at path is falsy');
  lines.push('- `{ "$state": "/path", "eq": "value" }` - visible when state equals value');
  lines.push('- `{ "$state": "/path", "neq": "value" }` - visible when state does not equal value');
  lines.push('- `{ "$state": "/path", "gt": N }` / `gte` / `lt` / `lte` - numeric comparisons');
  lines.push("- Use ONE operator per condition (eq, neq, gt, gte, lt, lte). Do not combine multiple operators.");
  lines.push('- Any condition can add `"not": true` to invert its result');
  lines.push("- `[condition, condition]` - all conditions must be true (implicit AND)");
  lines.push('- `{ "$and": [condition, condition] }` - explicit AND (use when nesting inside $or)');
  lines.push('- `{ "$or": [condition, condition] }` - at least one must be true (OR)');
  lines.push("- `true` / `false` - always visible/hidden");
  lines.push("");
  lines.push("Use a component with on.press bound to setState to update state and drive visibility.");
  lines.push(`Example: A ${comp1} with on: { "press": { "action": "setState", "params": { "statePath": "/activeTab", "value": "home" } } } sets state, then a container with visible: { "$state": "/activeTab", "eq": "home" } shows only when that tab is active.`);
  lines.push("");
  lines.push('For tab patterns where the first/default tab should be visible when no tab is selected yet, use $or to handle both cases: visible: { "$or": [{ "$state": "/activeTab", "eq": "home" }, { "$state": "/activeTab", "not": true }] }. This ensures the first tab is visible both when explicitly selected AND when /activeTab is not yet set.');
  lines.push("");
  lines.push("DYNAMIC PROPS:");
  lines.push("Any prop value can be a dynamic expression that resolves based on state. Three forms are supported:");
  lines.push("");
  lines.push('1. Read-only state: `{ "$state": "/statePath" }` - resolves to the value at that state path (one-way read).');
  lines.push('   Example: `"color": { "$state": "/theme/primary" }` reads the color from state.');
  lines.push("");
  lines.push('2. Two-way binding: `{ "$bindState": "/statePath" }` - resolves to the value at the state path AND enables write-back. Use on form input props (value, checked, pressed, etc.).');
  lines.push('   Example: `"value": { "$bindState": "/form/email" }` binds the input value to /form/email.');
  lines.push('   Inside repeat scopes: `"checked": { "$bindItem": "completed" }` binds to the current item\'s completed field.');
  lines.push("");
  lines.push('3. Conditional: `{ "$cond": <condition>, "$then": <value>, "$else": <value> }` - evaluates the condition (same syntax as visibility conditions) and picks the matching value.');
  lines.push('   Example: `"color": { "$cond": { "$state": "/activeTab", "eq": "home" }, "$then": "#007AFF", "$else": "#8E8E93" }`');
  lines.push("");
  lines.push("Use $bindState for form inputs (text fields, checkboxes, selects, sliders, etc.) and $state for read-only data display. Inside repeat scopes, use $bindItem for form inputs bound to the current item. Use dynamic props instead of duplicating elements with opposing visible conditions when only prop values differ.");
  lines.push("");
  lines.push('4. Template: `{ "$template": "Hello, ${/name}!" }` - interpolates references in the string. Absolute paths like `${/path}` resolve against the state model. Bare names like `${field}` resolve against the current repeat item first, then fall back to the state model at `/<field>`.');
  lines.push('   Example: `"label": { "$template": "Items: ${/cart/count} | Total: ${/cart/total}" }` renders "Items: 3 | Total: 42.00" when /cart/count is 3 and /cart/total is 42.00. Inside a repeat, `{ "$template": "${name} - ${email}" }` reads name and email from each item.');
  lines.push("");
  const catalogFunctions = catalog.data.functions;
  if (catalogFunctions && Object.keys(catalogFunctions).length > 0) {
    lines.push('5. Computed: `{ "$computed": "<functionName>", "args": { "key": <expression> } }` - calls a registered function with resolved args and returns the result.');
    lines.push('   Example: `"value": { "$computed": "fullName", "args": { "first": { "$state": "/form/firstName" }, "last": { "$state": "/form/lastName" } } }`');
    lines.push("   Available functions:");
    for (const name of Object.keys(catalogFunctions)) {
      lines.push(`   - ${name}`);
    }
    lines.push("");
  }
  const directives = options.directives;
  if (directives && directives.length > 0) {
    lines.push("CUSTOM DYNAMIC VALUES:");
    lines.push("");
    for (const d of directives) {
      const desc = d.description ? ` (${d.description})` : "";
      lines.push(`- ${d.name}${desc}: ${formatZodType(d.schema)}`);
    }
    lines.push("");
    lines.push("Directives compose: any value field can contain another directive or a $state expression, resolved inside-out.");
    lines.push("");
  }
  const hasChecksComponents = allComponents ? Object.entries(allComponents).some(([, def]) => {
    if (!def.props)
      return false;
    const formatted = formatZodType(def.props);
    return formatted.includes("checks");
  }) : false;
  if (hasChecksComponents) {
    lines.push("VALIDATION:");
    lines.push("Form components that accept a `checks` prop support client-side validation.");
    lines.push('Each check is an object: { "type": "<name>", "message": "...", "args": { ... } }');
    lines.push("");
    lines.push("Built-in validation types:");
    lines.push("  - required — value must be non-empty");
    lines.push("  - email — valid email format");
    lines.push('  - minLength — minimum string length (args: { "min": N })');
    lines.push('  - maxLength — maximum string length (args: { "max": N })');
    lines.push('  - pattern — match a regex (args: { "pattern": "regex" })');
    lines.push('  - min — minimum numeric value (args: { "min": N })');
    lines.push('  - max — maximum numeric value (args: { "max": N })');
    lines.push("  - numeric — value must be a number");
    lines.push("  - url — valid URL format");
    lines.push('  - matches — must equal another field (args: { "other": { "$state": "/path" } })');
    lines.push('  - equalTo — alias for matches (args: { "other": { "$state": "/path" } })');
    lines.push('  - lessThan — value must be less than another field (args: { "other": { "$state": "/path" } })');
    lines.push('  - greaterThan — value must be greater than another field (args: { "other": { "$state": "/path" } })');
    lines.push('  - requiredIf — required only when another field is truthy (args: { "field": { "$state": "/path" } })');
    lines.push("");
    lines.push("Example:");
    lines.push('  "checks": [{ "type": "required", "message": "Email is required" }, { "type": "email", "message": "Invalid email" }]');
    lines.push("");
    lines.push("IMPORTANT: When using checks, the component must also have a { $bindState } or { $bindItem } on its value/checked prop for two-way binding.");
    lines.push("Always include validation checks on form inputs for a good user experience (e.g. required, email, minLength).");
    lines.push("");
  }
  if (hasCustomActions || hasBuiltInActions) {
    lines.push("STATE WATCHERS:");
    lines.push("Elements can have an optional `watch` field to react to state changes and trigger actions. The `watch` field is a top-level field on the element (sibling of type/props/children), NOT inside props.");
    lines.push("Maps state paths (JSON Pointers) to action bindings. When the value at a watched path changes, the bound actions fire automatically.");
    lines.push("");
    lines.push("Example (cascading select — country changes trigger city loading):");
    lines.push(`  ${JSON.stringify({ type: "Select", props: { value: { $bindState: "/form/country" }, options: ["US", "Canada", "UK"] }, watch: { "/form/country": { action: "loadCities", params: { country: { $state: "/form/country" } } } }, children: [] })}`);
    lines.push("");
    lines.push("Use `watch` for cascading dependencies where changing one field should trigger side effects (loading data, resetting dependent fields, computing derived values).");
    lines.push("IMPORTANT: `watch` is a top-level field on the element (sibling of type/props/children), NOT inside props. Watchers only fire when the value changes, not on initial render.");
    lines.push("");
  }
  const editModes = options.editModes;
  if (editModes && editModes.length > 0) {
    lines.push(buildEditInstructions({ modes: editModes }, "json"));
  }
  lines.push("RULES:");
  const baseRules = mode === "inline" ? [
    "When generating UI, wrap all JSONL patches in a ```spec code fence - one JSON object per line inside the fence",
    "Write a brief conversational response before any JSONL output",
    'First set root: {"op":"add","path":"/root","value":"<root-key>"}',
    'Then add each element: {"op":"add","path":"/elements/<key>","value":{...}}',
    "Output /state patches right after the elements that use them, one per array item for progressive loading. REQUIRED whenever using $state, $bindState, $bindItem, $item, $index, or repeat.",
    "ONLY use components listed above",
    "Each element value needs: type, props, children (array of child keys)",
    "Use unique keys for the element map entries (e.g., 'header', 'metric-1', 'chart-revenue')"
  ] : [
    "Output ONLY JSONL patches - one JSON object per line, no markdown, no code fences",
    'First set root: {"op":"add","path":"/root","value":"<root-key>"}',
    'Then add each element: {"op":"add","path":"/elements/<key>","value":{...}}',
    "Output /state patches right after the elements that use them, one per array item for progressive loading. REQUIRED whenever using $state, $bindState, $bindItem, $item, $index, or repeat.",
    "ONLY use components listed above",
    "Each element value needs: type, props, children (array of child keys)",
    "Use unique keys for the element map entries (e.g., 'header', 'metric-1', 'chart-revenue')"
  ];
  const schemaRules = catalog.schema.defaultRules ?? [];
  const allRules = [...baseRules, ...schemaRules, ...customRules];
  allRules.forEach((rule, i) => {
    lines.push(`${i + 1}. ${rule}`);
  });
  return lines.join(`
`);
}
function getExampleProps(def) {
  if (def.example && Object.keys(def.example).length > 0) {
    return def.example;
  }
  if (def.props) {
    return generateExamplePropsFromZod(def.props);
  }
  return {};
}
function generateExamplePropsFromZod(schema) {
  if (!schema || !schema._def)
    return {};
  const def = schema._def;
  const typeName = getZodTypeName(schema);
  if (typeName !== "ZodObject" && typeName !== "object")
    return {};
  const shape = typeof def.shape === "function" ? def.shape() : def.shape;
  if (!shape)
    return {};
  const result = {};
  for (const [key, value] of Object.entries(shape)) {
    const innerTypeName = getZodTypeName(value);
    if (innerTypeName === "ZodOptional" || innerTypeName === "optional" || innerTypeName === "ZodNullable" || innerTypeName === "nullable") {
      continue;
    }
    result[key] = generateExampleValue(value);
  }
  return result;
}
function generateExampleValue(schema) {
  if (!schema || !schema._def)
    return "...";
  const def = schema._def;
  const typeName = getZodTypeName(schema);
  switch (typeName) {
    case "ZodString":
    case "string":
      return "example";
    case "ZodNumber":
    case "number":
      return 0;
    case "ZodBoolean":
    case "boolean":
      return true;
    case "ZodLiteral":
    case "literal":
      return def.value;
    case "ZodEnum":
    case "enum": {
      if (Array.isArray(def.values) && def.values.length > 0)
        return def.values[0];
      if (def.entries && typeof def.entries === "object") {
        const values = Object.values(def.entries);
        return values.length > 0 ? values[0] : "example";
      }
      return "example";
    }
    case "ZodOptional":
    case "optional":
    case "ZodNullable":
    case "nullable":
    case "ZodDefault":
    case "default": {
      const inner = def.innerType ?? def.wrapped;
      return inner ? generateExampleValue(inner) : null;
    }
    case "ZodArray":
    case "array":
      return [];
    case "ZodObject":
    case "object":
      return generateExamplePropsFromZod(schema);
    case "ZodUnion":
    case "union": {
      const options = def.options;
      return options && options.length > 0 ? generateExampleValue(options[0]) : "...";
    }
    default:
      return "...";
  }
}
function findFirstStringProp(schema) {
  if (!schema || !schema._def)
    return null;
  const def = schema._def;
  const typeName = getZodTypeName(schema);
  if (typeName !== "ZodObject" && typeName !== "object")
    return null;
  const shape = typeof def.shape === "function" ? def.shape() : def.shape;
  if (!shape)
    return null;
  for (const [key, value] of Object.entries(shape)) {
    const innerTypeName = getZodTypeName(value);
    if (innerTypeName === "ZodOptional" || innerTypeName === "optional" || innerTypeName === "ZodNullable" || innerTypeName === "nullable") {
      continue;
    }
    if (innerTypeName === "ZodString" || innerTypeName === "string") {
      return key;
    }
  }
  return null;
}
function getZodTypeName(schema) {
  if (!schema || !schema._def)
    return "";
  const def = schema._def;
  return def.typeName ?? def.type ?? "";
}
function formatZodType(schema) {
  if (!schema || !schema._def)
    return "unknown";
  const def = schema._def;
  const typeName = getZodTypeName(schema);
  switch (typeName) {
    case "ZodString":
    case "string":
      return "string";
    case "ZodNumber":
    case "number":
      return "number";
    case "ZodBoolean":
    case "boolean":
      return "boolean";
    case "ZodLiteral":
    case "literal": {
      const litValues = def.values;
      const litValue = litValues?.[0] ?? def.value;
      return JSON.stringify(litValue);
    }
    case "ZodEnum":
    case "enum": {
      let values;
      if (Array.isArray(def.values)) {
        values = def.values;
      } else if (def.entries && typeof def.entries === "object") {
        values = Object.values(def.entries);
      } else {
        return "enum";
      }
      return values.map((v) => `"${v}"`).join(" | ");
    }
    case "ZodArray":
    case "array": {
      const inner = typeof def.element === "object" ? def.element : typeof def.type === "object" ? def.type : undefined;
      return inner ? `Array<${formatZodType(inner)}>` : "Array<unknown>";
    }
    case "ZodObject":
    case "object": {
      const shape = typeof def.shape === "function" ? def.shape() : def.shape;
      if (!shape)
        return "object";
      const props = Object.entries(shape).map(([key, value]) => {
        const innerTypeName = getZodTypeName(value);
        const isOptional = innerTypeName === "ZodOptional" || innerTypeName === "ZodNullable" || innerTypeName === "optional" || innerTypeName === "nullable";
        return `${key}${isOptional ? "?" : ""}: ${formatZodType(value)}`;
      }).join(", ");
      return `{ ${props} }`;
    }
    case "ZodOptional":
    case "optional":
    case "ZodNullable":
    case "nullable": {
      const inner = def.innerType ?? def.wrapped;
      return inner ? formatZodType(inner) : "unknown";
    }
    case "ZodUnion":
    case "union": {
      const options = def.options;
      return options ? options.map((opt) => formatZodType(opt)).join(" | ") : "unknown";
    }
    case "ZodRecord":
    case "record": {
      const keyType = def.keyType ?? undefined;
      const valueType = def.valueType ?? def.element ?? undefined;
      const keyStr = keyType ? formatZodType(keyType) : "string";
      const valueStr = valueType ? formatZodType(valueType) : "unknown";
      return `Record<${keyStr}, ${valueStr}>`;
    }
    case "ZodDefault":
    case "default": {
      const inner = def.innerType ?? def.wrapped;
      return inner ? formatZodType(inner) : "unknown";
    }
    default:
      return "unknown";
  }
}
function zodTypeName(def) {
  if (typeof def.type === "string")
    return def.type;
  if (typeof def.typeName === "string")
    return def.typeName;
  return "";
}
function normalizeTypeName(raw) {
  if (raw.startsWith("Zod")) {
    return raw.slice(3).toLowerCase();
  }
  return raw.toLowerCase();
}
function zodToJsonSchema(schema, strict = false) {
  const def = schema._def;
  const kind = normalizeTypeName(zodTypeName(def));
  switch (kind) {
    case "string":
      return { type: "string" };
    case "number":
      return { type: "number" };
    case "boolean":
      return { type: "boolean" };
    case "literal": {
      const values = def.values;
      const value = values ? values[0] : def.value;
      return { const: value };
    }
    case "enum": {
      const entries = def.entries;
      const values = entries ? Object.values(entries) : def.values;
      return { enum: values ?? [] };
    }
    case "array": {
      const inner = def.element ?? def.type;
      return {
        type: "array",
        items: inner ? zodToJsonSchema(inner, strict) : {}
      };
    }
    case "object": {
      const rawShape = def.shape;
      const shape = typeof rawShape === "function" ? rawShape() : rawShape;
      if (!shape) {
        if (strict) {
          return {
            type: "object",
            properties: {},
            required: [],
            additionalProperties: false
          };
        }
        return { type: "object" };
      }
      const properties = {};
      const required = [];
      for (const [key, value] of Object.entries(shape)) {
        const innerDef = value._def;
        const innerKind = normalizeTypeName(zodTypeName(innerDef));
        const isOptional = innerKind === "optional" || innerKind === "nullable";
        if (strict) {
          required.push(key);
          if (isOptional) {
            const unwrapped = zodToJsonSchema(value, strict);
            properties[key] = { anyOf: [unwrapped, { type: "null" }] };
          } else {
            properties[key] = zodToJsonSchema(value, strict);
          }
        } else {
          properties[key] = zodToJsonSchema(value);
          if (!isOptional) {
            required.push(key);
          }
        }
      }
      return {
        type: "object",
        properties,
        required: required.length > 0 ? required : undefined,
        additionalProperties: false
      };
    }
    case "record": {
      const valueType = def.valueType;
      if (strict) {
        return {
          type: "object",
          properties: {},
          required: [],
          additionalProperties: false
        };
      }
      return {
        type: "object",
        additionalProperties: valueType ? zodToJsonSchema(valueType) : true
      };
    }
    case "optional":
    case "nullable": {
      const inner = def.innerType;
      return inner ? zodToJsonSchema(inner, strict) : {};
    }
    case "union": {
      const options = def.options;
      return options ? { anyOf: options.map((o) => zodToJsonSchema(o, strict)) } : {};
    }
    case "any":
    case "unknown":
      if (strict) {
        return {
          type: "object",
          properties: {},
          required: [],
          additionalProperties: false
        };
      }
      return {};
    default:
      return {};
  }
}
function defineCatalog(schema, catalog) {
  return schema.createCatalog(catalog);
}
// ../../../../../../../../../../private/var/folders/t_/srzvjq016kn2zdmpxsr841b00000gn/Tjson-render-336-strength-lWF3oO/src/prompt.ts
function buildUserPrompt(options) {
  const {
    prompt,
    currentSpec,
    state,
    maxPromptLength,
    editModes,
    format,
    serializer
  } = options;
  let userText = String(prompt || "");
  if (maxPromptLength !== undefined && maxPromptLength > 0) {
    userText = userText.slice(0, maxPromptLength);
  }
  if (isNonEmptySpec(currentSpec)) {
    const editPrompt = buildEditUserPrompt({
      prompt: userText,
      currentSpec,
      config: { modes: editModes ?? ["patch"] },
      format: format ?? "json",
      serializer
    });
    if (state && Object.keys(state).length > 0) {
      return `${editPrompt}

AVAILABLE STATE:
${JSON.stringify(state, null, 2)}`;
    }
    return editPrompt;
  }
  const parts = [userText];
  if (state && Object.keys(state).length > 0) {
    parts.push(`
AVAILABLE STATE:
${JSON.stringify(state, null, 2)}`);
  }
  if (format === "yaml") {
    parts.push(`
Output the full spec in a \`\`\`yaml-spec fence. Stream progressively — output elements one at a time.`);
  } else {
    parts.push(`
Remember: Output /root first, then interleave /elements and /state patches so the UI fills in progressively as it streams. Output each state patch right after the elements that use it, one per array item.`);
  }
  return parts.join(`
`);
}
// ../../../../../../../../../../private/var/folders/t_/srzvjq016kn2zdmpxsr841b00000gn/Tjson-render-336-strength-lWF3oO/src/merge.ts
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function deepMergeSpec(base, patch) {
  const result = { ...base };
  for (const key of Object.keys(patch)) {
    const patchVal = patch[key];
    if (patchVal === null) {
      delete result[key];
      continue;
    }
    const baseVal = result[key];
    if (isPlainObject(patchVal) && isPlainObject(baseVal)) {
      result[key] = deepMergeSpec(baseVal, patchVal);
    } else {
      result[key] = patchVal;
    }
  }
  return result;
}
// ../../../../../../../../../../private/var/folders/t_/srzvjq016kn2zdmpxsr841b00000gn/Tjson-render-336-strength-lWF3oO/src/diff.ts
function escapeToken(token) {
  return token.replace(/~/g, "~0").replace(/\//g, "~1");
}
function buildPath(basePath, key) {
  return `${basePath}/${escapeToken(key)}`;
}
function isPlainObject2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function arraysEqual(a, b) {
  if (a.length !== b.length)
    return false;
  for (let i = 0;i < a.length; i++) {
    if (a[i] !== b[i])
      return false;
  }
  return true;
}
function diffToPatches(oldObj, newObj, basePath = "") {
  const patches = [];
  for (const key of Object.keys(newObj)) {
    const path = buildPath(basePath, key);
    const oldVal = oldObj[key];
    const newVal = newObj[key];
    if (!(key in oldObj)) {
      patches.push({ op: "add", path, value: newVal });
      continue;
    }
    if (isPlainObject2(oldVal) && isPlainObject2(newVal)) {
      patches.push(...diffToPatches(oldVal, newVal, path));
    } else if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      if (!arraysEqual(oldVal, newVal)) {
        patches.push({ op: "replace", path, value: newVal });
      }
    } else if (oldVal !== newVal) {
      patches.push({ op: "replace", path, value: newVal });
    }
  }
  for (const key of Object.keys(oldObj)) {
    if (!(key in newObj)) {
      patches.push({ op: "remove", path: buildPath(basePath, key) });
    }
  }
  return patches;
}
export {
  visibility,
  validateSpec,
  subscribeDevtoolsActive,
  splitRepeatVisibility,
  setByPath,
  runValidationCheck,
  runValidation,
  resolveRepeatStatePath,
  resolveRepeatItemStatePath,
  resolvePropValue,
  resolveElementProps,
  resolveDynamicValue,
  resolveBindings,
  resolveActionParam,
  resolveAction,
  removeByPath,
  registerActionObserver,
  pipeJsonRender,
  parseSpecStreamLine,
  notifyActionSettle,
  notifyActionDispatch,
  nextActionDispatchId,
  nestedToFlat,
  markDevtoolsActive,
  isNonEmptySpec,
  isDevtoolsActive,
  interpolateString,
  getByPath,
  formatSpecIssues,
  findFormValue,
  findDirective,
  executeAction,
  evaluateVisibility,
  diffToPatches,
  defineSchema,
  defineDirective,
  defineCatalog,
  deepMergeSpec,
  createStateStore,
  createSpecStreamCompiler,
  createMixedStreamParser,
  createJsonRenderTransform,
  createDirectiveRegistry,
  conditionUsesItemScope,
  compileSpecStream,
  check,
  builtInValidationFunctions,
  buildUserPrompt,
  buildEditUserPrompt,
  buildEditInstructions,
  autoFixSpec,
  applySpecStreamPatch,
  applySpecPatch,
  addByPath,
  actionBinding,
  action,
  VisibilityConditionStrictSchema,
  VisibilityConditionSchema,
  ValidationConfigSchema,
  ValidationCheckSchema,
  SPEC_DATA_PART_TYPE,
  SPEC_DATA_PART,
  DynamicValueSchema,
  DynamicStringSchema,
  DynamicNumberSchema,
  DynamicBooleanSchema,
  ActionSchema,
  ActionOnSuccessSchema,
  ActionOnErrorSchema,
  ActionConfirmSchema,
  ActionBindingSchema
};
