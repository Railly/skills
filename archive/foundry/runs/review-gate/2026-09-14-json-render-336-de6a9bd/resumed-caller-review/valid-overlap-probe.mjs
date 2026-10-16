import { JSDOM } from "jsdom";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { StateProvider, useStateStore } from "../consumer/index.js";
import { writeFileSync } from "node:fs";

const dom = new JSDOM("<div id='root'></div>");
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let store;
const events = [];
function Consumer() {
  store = useStateStore();
  return React.createElement("output", null, JSON.stringify(store.state));
}
const root = createRoot(document.getElementById("root"));
await act(async () => {
  root.render(
    React.createElement(
      StateProvider,
      {
        initialState: { user: { name: "a" } },
        onStateChange: (changes) => events.push(changes),
      },
      React.createElement(Consumer),
    ),
  );
});
const before = structuredClone(store.getSnapshot());
await act(async () => {
  store.update({ "/user": { name: "b" }, "/user/name": "a" });
});
const mixed = {
  before,
  after: store.getSnapshot(),
  callbacks: structuredClone(events),
  dom: document.querySelector("output").textContent,
};
events.length = 0;
const beforeInvalid = store.getSnapshot();
await act(async () => {
  store.update({ "/user/name": "a" });
});
const invalidOnly = {
  sameSnapshot: beforeInvalid === store.getSnapshot(),
  callbacks: structuredClone(events),
};
await act(async () => root.unmount());
const output = { mixed, invalidOnly };
writeFileSync(new URL("./result.json", import.meta.url), JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
