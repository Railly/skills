// packages/react-state/src/index.tsx
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore
} from "react";
import {
  getByPath,
  createStateStore
} from "/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-14-json-render-336-de6a9bd/base-typecheck/packages/core/src/index.ts";
import { flattenToPointers } from "/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-14-json-render-336-de6a9bd/base-typecheck/packages/core/src/store-utils.ts";
import { jsxDEV } from "react/jsx-dev-runtime";
"use client";
var StateContext = createContext(null);
function computeInitialFlat(isControlled, initialState) {
  if (isControlled)
    return null;
  if (Object.keys(initialState).length === 0)
    return {};
  return flattenToPointers(initialState);
}
function StateProvider({
  store: externalStore,
  initialState = {},
  onStateChange,
  children
}) {
  const internalStoreRef = useRef(undefined);
  if (!externalStore && !internalStoreRef.current) {
    internalStoreRef.current = createStateStore(initialState);
  }
  const store = externalStore ?? internalStoreRef.current;
  const storeRef = useRef(store);
  storeRef.current = store;
  const isControlledRef = useRef(!!externalStore);
  isControlledRef.current = !!externalStore;
  const initialModeRef = useRef(externalStore ? "controlled" : "uncontrolled");
  const modeWarnedRef = useRef(false);
  if (true) {
    const currentMode = externalStore ? "controlled" : "uncontrolled";
    if (currentMode !== initialModeRef.current && !modeWarnedRef.current) {
      modeWarnedRef.current = true;
      console.warn(`StateProvider: switching from ${initialModeRef.current} to ${currentMode} mode is not supported.`);
    }
  }
  const prevInitialStateRef = useRef(initialState);
  const prevFlatRef = useRef(computeInitialFlat(!!externalStore, initialState));
  useEffect(() => {
    if (externalStore)
      return;
    if (initialState === prevInitialStateRef.current)
      return;
    prevInitialStateRef.current = initialState;
    const nextFlat = initialState && Object.keys(initialState).length > 0 ? flattenToPointers(initialState) : {};
    const prevFlat = prevFlatRef.current ?? {};
    const allKeys = new Set([
      ...Object.keys(prevFlat),
      ...Object.keys(nextFlat)
    ]);
    const updates = {};
    for (const key of allKeys) {
      if (prevFlat[key] !== nextFlat[key]) {
        updates[key] = key in nextFlat ? nextFlat[key] : undefined;
      }
    }
    prevFlatRef.current = nextFlat;
    if (Object.keys(updates).length > 0) {
      store.update(updates);
    }
  }, [externalStore, initialState, store]);
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot ?? store.getSnapshot);
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;
  const set = useCallback((path, value2) => {
    const s = storeRef.current;
    const prev = s.getSnapshot();
    s.set(path, value2);
    if (!isControlledRef.current && s.getSnapshot() !== prev) {
      onStateChangeRef.current?.([{ path, value: value2 }]);
    }
  }, []);
  const update = useCallback((updates) => {
    const s = storeRef.current;
    const prev = s.getSnapshot();
    s.update(updates);
    if (!isControlledRef.current && s.getSnapshot() !== prev) {
      const changes = [];
      for (const [path, value2] of Object.entries(updates)) {
        if (getByPath(prev, path) !== value2) {
          changes.push({ path, value: value2 });
        }
      }
      if (changes.length > 0) {
        onStateChangeRef.current?.(changes);
      }
    }
  }, []);
  const get = useCallback((path) => storeRef.current.get(path), []);
  const getSnapshot = useCallback(() => storeRef.current.getSnapshot(), []);
  const value = useMemo(() => ({ state, get, set, update, getSnapshot }), [state, get, set, update, getSnapshot]);
  return /* @__PURE__ */ jsxDEV(StateContext.Provider, {
    value,
    children
  }, undefined, false, undefined, this);
}
function useStateStore() {
  const ctx = useContext(StateContext);
  if (!ctx) {
    throw new Error("useStateStore must be used within a StateProvider");
  }
  return ctx;
}
function useStateValue(path) {
  const { state } = useStateStore();
  return getByPath(state, path);
}
function useStateBinding(path) {
  const { state, set } = useStateStore();
  const value = getByPath(state, path);
  const setValue = useCallback((newValue) => set(path, newValue), [path, set]);
  return [value, setValue];
}
export {
  useStateValue,
  useStateStore,
  useStateBinding,
  StateProvider
};
