You are reviewing a pull request to vercel-labs/portless, a local dev reverse proxy (HTTP/2 + TLS in front of HTTP/1.1 dev servers on loopback). Repository checkout is the current working directory at the PR head. Read packages/portless/src/proxy.ts and proxy.test.ts in full as needed.

The change: plain (non-upgrade) proxied requests now use a shared keep-alive http.Agent with a per-backend-port limit on dials in progress; requests that cannot dial wait until a pooled socket is idle or a dial slot frees; bodiless GET/HEAD/OPTIONS requests that fail with ECONNRESET on a reused socket are replayed once.

Find real defects: correctness, hangs or leaks, unhandled errors that could crash the proxy process, ordering/starvation, behavior regressions versus the previous per-request createConnection dialing, and test gaps. For each finding give file:line, a concrete failure scenario, and how to reproduce it. Do not report style nits. Say explicitly if you find nothing material.

Diff:
```diff
diff --git a/packages/portless/src/proxy.test.ts b/packages/portless/src/proxy.test.ts
index 6a254ee..fb6bc3c 100644
--- a/packages/portless/src/proxy.test.ts
+++ b/packages/portless/src/proxy.test.ts
@@ -234,14 +234,16 @@ describe("createProxyServer", () => {
       const res = await request(server, {
         host: "myapp.localhost",
         headers: {
-          connection: "keep-alive",
+          connection: "close",
           "keep-alive": "timeout=5",
           "proxy-connection": "keep-alive",
           upgrade: "h2c",
         },
       });
       expect(res.status).toBe(200);
-      expect(received.connection).toBe("close");
+      // the pooled upstream agent sets its own keep-alive, a forwarded client
+      // value would show up as close
+      expect(received.connection).toBe("keep-alive");
       expect(received["keep-alive"]).toBeUndefined();
       expect(received["proxy-connection"]).toBeUndefined();
       expect(received.upgrade).toBeUndefined();
@@ -784,6 +786,116 @@ describe("createProxyServer", () => {
     });
   });
 
+  describe("upstream connections", () => {
+    it("reuses one upstream connection across requests (issue #370)", async () => {
+      const connections = new Set<net.Socket>();
+      const backend = trackServer(http.createServer((_req, res) => res.end("ok")));
+      backend.on("connection", (socket) => connections.add(socket));
+      await listen(backend);
+      const backendAddr = backend.address();
+      if (!backendAddr || typeof backendAddr === "string") throw new Error("no addr");
+
+      const routes: RouteInfo[] = [{ hostname: "myapp.localhost", port: backendAddr.port }];
+      const server = trackServer(
+        createProxyServer({ getRoutes: () => routes, proxyPort: TEST_PROXY_PORT })
+      );
+      await listen(server);
+
+      for (let i = 0; i < 5; i++) {
+        expect((await request(server, { host: "myapp.localhost" })).status).toBe(200);
+      }
+      expect(connections.size).toBe(1);
+    });
+
+    it("keeps serving requests while many long-lived responses are open", async () => {
+      // SSE and streaming responses hold their upstream socket for good, so a
+      // cap on open sockets would leave every later request waiting forever
+      const backend = trackServer(
+        http.createServer((req, res) => {
+          if (req.url === "/stream") {
+            res.writeHead(200, { "content-type": "text/event-stream" });
+            res.write("data: hi\n\n");
+            return;
+          }
+          res.end("ok");
+        })
+      );
+      await listen(backend);
+      const backendAddr = backend.address();
+      if (!backendAddr || typeof backendAddr === "string") throw new Error("no addr");
+
+      const routes: RouteInfo[] = [{ hostname: "myapp.localhost", port: backendAddr.port }];
+      const server = trackServer(
+        createProxyServer({ getRoutes: () => routes, proxyPort: TEST_PROXY_PORT })
+      );
+      await listen(server);
+      const proxyAddr = server.address();
+      if (!proxyAddr || typeof proxyAddr === "string") throw new Error("no addr");
+
+      const streams = await Promise.all(
+        Array.from(
+          { length: 80 },
+          () =>
+            new Promise<http.ClientRequest>((resolve, reject) => {
+              const req = http.get(
+                {
+                  port: proxyAddr.port,
+                  path: "/stream",
+                  headers: { host: "myapp.localhost" },
+                  agent: false,
+                },
+                (res) => res.once("data", () => resolve(req))
+              );
+              req.on("error", reject);
+            })
+        )
+      );
+
+      const res = await request(server, { host: "myapp.localhost" });
+      expect(res.status).toBe(200);
+      expect(res.body).toBe("ok");
+      for (const stream of streams) stream.destroy();
+    });
+
+    it("replays a request when the backend resets a pooled connection", async () => {
+      // answer the first request on a connection then reset the next one, which
+      // is what an idle close looks like when it crosses our write
+      const handled = new WeakMap<net.Socket, number>();
+      let resets = 0;
+      const backend = trackServer(
+        http.createServer((req, res) => {
+          const count = (handled.get(req.socket) ?? 0) + 1;
+          handled.set(req.socket, count);
+          if (count === 1) return res.end("ok");
+          resets++;
+          req.socket.resetAndDestroy();
+        })
+      );
+      await listen(backend);
+      const backendAddr = backend.address();
+      if (!backendAddr || typeof backendAddr === "string") throw new Error("no addr");
+
+      const errors: string[] = [];
+      const routes: RouteInfo[] = [{ hostname: "myapp.localhost", port: backendAddr.port }];
+      const server = trackServer(
+        createProxyServer({
+          getRoutes: () => routes,
+          proxyPort: TEST_PROXY_PORT,
+          onError: (msg) => errors.push(msg),
+        })
+      );
+      await listen(server);
+
+      for (let i = 0; i < 4; i++) {
+        const res = await request(server, { host: "myapp.localhost" });
+        expect(res.status).toBe(200);
+        expect(res.body).toBe("ok");
+      }
+      expect(resets).toBeGreaterThan(0);
+      expect(errors).toEqual([]);
+    });
+  });
+
   describe("X-Portless header", () => {
     it("includes X-Portless header on 404 responses", async () => {
       const routes: RouteInfo[] = [];
diff --git a/packages/portless/src/proxy.ts b/packages/portless/src/proxy.ts
index 2a9ed06..6b7c6a8 100644
--- a/packages/portless/src/proxy.ts
+++ b/packages/portless/src/proxy.ts
@@ -35,6 +35,15 @@ const HOP_BY_HOP_HEADERS = new Set([
   "upgrade",
 ]);
 
+// HTTP/2 multiplexes a whole cold page load onto one client connection, so
+// without a limit the proxy dials the backend once per request at the same
+// instant and overflows its accept backlog. Only dials in progress are
+// limited, and waiting requests take the next idle pooled socket, so
+// long-lived responses such as SSE never starve other requests.
+const MAX_PENDING_UPSTREAM_DIALS = 16;
+
+const REPLAYABLE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
+
 /**
  * Client hop-by-hop headers dropped before forwarding a plain request.
  * Forwarding `Connection: keep-alive` leaves the backend socket open after
@@ -267,7 +276,55 @@ export function createProxyServer(options: ProxyServerOptions): ProxyServer {
   const tldSuffixes = [...new Set(tlds.length > 0 ? tlds : [tld])].map((value) => `.${value}`);
   const primaryTldSuffix = tldSuffixes[0] ?? ".localhost";
 
-  const handleRequest = (req: http.IncomingMessage, res: http.ServerResponse) => {
+  const upstreamAgent = new http.Agent({ keepAlive: true });
+  const upstream = new Map<number, { dialing: number; waiting: (() => void)[] }>();
+  const upstreamState = (port: number) => {
+    let state = upstream.get(port);
+    if (!state) {
+      state = { dialing: 0, waiting: [] };
+      upstream.set(port, state);
+    }
+    return state;
+  };
+  const hasIdleSocket = (port: number) =>
+    (upstreamAgent.freeSockets[upstreamAgent.getName({ port })]?.length ?? 0) > 0;
+  // Start waiting requests while a pooled socket is idle or a dial slot is open.
+  const drainUpstream = (port: number) => {
+    const state = upstream.get(port);
+    if (!state) return;
+    while (
+      state.waiting.length > 0 &&
+      (hasIdleSocket(port) || state.dialing < MAX_PENDING_UPSTREAM_DIALS)
+    ) {
+      state.waiting.shift()?.();
+    }
+    if (state.dialing === 0 && state.waiting.length === 0) upstream.delete(port);
+  };
+  const whenUpstreamReady = (port: number, send: () => void) => {
+    const state = upstreamState(port);
+    if (hasIdleSocket(port) || state.dialing < MAX_PENDING_UPSTREAM_DIALS) send();
+    else state.waiting.push(send);
+  };
+  // Dial via createLoopbackConnection so ::1-only backends work too.
+  upstreamAgent.createConnection = (options) => {
+    const port = options.port as number;
+    const state = upstreamState(port);
+    state.dialing++;
+    const socket = createLoopbackConnection(port);
+    let settled = false;
+    const settle = () => {
+      if (settled) return;
+      settled = true;
+      state.dialing--;
+      drainUpstream(port);
+    };
+    socket.once("connect", settle);
+    socket.once("close", settle);
+    return socket;
+  };
+  upstreamAgent.on("free", (_socket, options) => drainUpstream(options.port as number));
+
+  const handleRequest = (req: http.IncomingMessage, res: http.ServerResponse, isReplay = false) => {
     const reqTls = isEncrypted(req);
     res.setHeader(PORTLESS_HEADER, "1");
     const rawHost = getRequestHost(req);
@@ -380,70 +437,95 @@ export function createProxyServer(options: ProxyServerOptions): ProxyServer {
       proxyReqHeaders.host = getRequestHost(req);
     }
 
-    const proxyReq = http.request(
-      {
-        // Dial via createLoopbackConnection so ::1-only backends work too.
-        createConnection: () => createLoopbackConnection(route.port),
-        path: req.url,
-        method: req.method,
-        headers: proxyReqHeaders,
-      },
-      (proxyRes) => {
-        const responseHeaders: http.OutgoingHttpHeaders = { ...proxyRes.headers };
-        if (reqTls) {
-          for (const h of HOP_BY_HOP_HEADERS) {
-            delete responseHeaders[h];
+    const send = () => {
+      // The client may have gone away while the request waited for a socket.
+      if (res.destroyed) return;
+      const proxyReq = http.request(
+        {
+          agent: upstreamAgent,
+          port: route.port,
+          path: req.url,
+          method: req.method,
+          headers: proxyReqHeaders,
+        },
+        (proxyRes) => {
+          const responseHeaders: http.OutgoingHttpHeaders = { ...proxyRes.headers };
+          if (reqTls) {
+            for (const h of HOP_BY_HOP_HEADERS) {
+              delete responseHeaders[h];
+            }
           }
+          res.writeHead(proxyRes.statusCode || 502, responseHeaders);
+          proxyRes.on("error", () => {
+            if (!res.headersSent) {
+              res.writeHead(502, { "Content-Type": "text/plain" });
+              res.end();
+            } else {
+              // Headers already sent (mid-stream): destroy instead of end to
+              // send RST_STREAM. Calling res.end() here can cause a
+              // content-length mismatch that Chrome treats as a session error.
+              res.destroy();
+            }
+          });
+          proxyRes.pipe(res);
         }
-        res.writeHead(proxyRes.statusCode || 502, responseHeaders);
-        proxyRes.on("error", () => {
-          if (!res.headersSent) {
-            res.writeHead(502, { "Content-Type": "text/plain" });
-            res.end();
-          } else {
-            // Headers already sent (mid-stream): destroy instead of end to
-            // send RST_STREAM. Calling res.end() here can cause a
-            // content-length mismatch that Chrome treats as a session error.
-            res.destroy();
-          }
-        });
-        proxyRes.pipe(res);
-      }
-    );
+      );
 
-    proxyReq.on("error", (err) => {
-      onError(`Proxy error for ${getRequestHost(req)}: ${err.message}`);
-      if (!res.headersSent) {
+      proxyReq.on("error", (err) => {
         const errWithCode = err as NodeJS.ErrnoException;
-        const detail =
-          errWithCode.code === "ECONNREFUSED"
-            ? "The target app is not responding. It may have crashed."
-            : "The target app may not be running.";
-        res.writeHead(502, { "Content-Type": "text/html" });
-        res.end(
-          renderPage(
-            502,
-            "Bad Gateway",
-            `<div class="content"><p class="desc">${escapeHtml(detail)}</p></div>`
-          )
-        );
-      }
-    });
+        // The backend closed a pooled socket as it was reused: replay once
+        // instead of returning a 502.
+        if (
+          !isReplay &&
+          proxyReq.reusedSocket &&
+          errWithCode.code === "ECONNRESET" &&
+          !res.headersSent &&
+          REPLAYABLE_METHODS.has(req.method || "") &&
+          // The first attempt consumed the body, so only bodiless requests replay.
+          !req.headers["transfer-encoding"] &&
+          !Number(req.headers["content-length"])
+        ) {
+          req.unpipe(proxyReq);
+          handleRequest(req, res, true);
+          return;
+        }
+        onError(`Proxy error for ${getRequestHost(req)}: ${err.message}`);
+        if (!res.headersSent) {
+          const detail =
+            errWithCode.code === "ECONNREFUSED"
+              ? "The target app is not responding. It may have crashed."
+              : "The target app may not be running.";
+          res.writeHead(502, { "Content-Type": "text/html" });
+          res.end(
+            renderPage(
+              502,
+              "Bad Gateway",
+              `<div class="content"><p class="desc">${escapeHtml(detail)}</p></div>`
+            )
+          );
+        }
+      });
 
-    // Abort the outgoing request if the client disconnects
-    res.on("close", () => {
-      if (!proxyReq.destroyed) {
-        proxyReq.destroy();
-      }
-    });
+      // Abort the outgoing request if the client disconnects
+      res.on("close", () => {
+        if (!proxyReq.destroyed) {
+          proxyReq.destroy();
+        }
+      });
 
-    req.on("error", () => {
-      if (!proxyReq.destroyed) {
-        proxyReq.destroy();
-      }
-    });
+      req.on("error", () => {
+        if (!proxyReq.destroyed) {
+          proxyReq.destroy();
+        }
+      });
 
-    req.pipe(proxyReq);
+      if (isReplay) {
+        proxyReq.end();
+      } else {
+        req.pipe(proxyReq);
+      }
+    };
+    whenUpstreamReady(route.port, send);
   };
 
   const handleUpgrade = (req: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
@@ -836,6 +918,7 @@ export function createProxyServer(options: ProxyServerOptions): ProxyServer {
     wrapper.close = function (cb?: (err?: Error) => void) {
       h2Server.close();
       plainServer.close();
+      upstreamAgent.destroy();
       return origClose(cb);
     } as typeof wrapper.close;
 
@@ -844,6 +927,7 @@ export function createProxyServer(options: ProxyServerOptions): ProxyServer {
 
   const httpServer = http.createServer(handleRequest);
   httpServer.on("upgrade", handleUpgrade);
+  httpServer.on("close", () => upstreamAgent.destroy());
 
   return httpServer;
 }
```
