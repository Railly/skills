import * as node_tls from 'node:tls';
import * as http from 'node:http';
import * as net from 'node:net';

/** Route info used by the proxy server to map hostnames to ports. */
interface RouteInfo {
    hostname: string;
    port: number;
    /**
     * Public Tailscale Serve/Funnel URL for this route, when one is active
     * (e.g. "https://my-device.tail1234.ts.net"). Requests whose Host header
     * matches this URL's hostname are routed to the same upstream.
     */
    tailscaleUrl?: string;
}
interface ProxyServerOptions {
    /** Called on each request to get the current route table. */
    getRoutes: () => RouteInfo[];
    /** The port the proxy is listening on (used to build correct URLs). */
    proxyPort: number;
    /** TLD suffix used for hostnames (default: "localhost"). */
    tld?: string;
    /** All TLD suffixes used for hostnames. The first one is used for examples. */
    tlds?: string[];
    /**
     * When true, only exact hostname matches are used. Unregistered subdomain
     * prefixes return 404 instead of falling back to the base service.
     * Defaults to true.
     */
    strict?: boolean;
    /** Optional error logger; defaults to console.error. */
    onError?: (message: string) => void;
    /** Run the daemon-owned hosts sync for the current route table. */
    onHostsSyncRequest?: () => "acted" | "disabled";
    hostsSyncToken?: string;
    /** When provided, enables HTTP/2 over TLS (HTTPS). */
    tls?: {
        cert: Buffer;
        key: Buffer;
        /** CA certificate to include in the chain so clients can verify the leaf. */
        ca?: Buffer;
        /** SNI callback for per-hostname certificate selection. */
        SNICallback?: (servername: string, cb: (err: Error | null, ctx?: node_tls.SecureContext) => void) => void;
    };
}

/** Response header used to identify a portless proxy (for health checks). */
declare const PORTLESS_HEADER = "X-Portless";
declare const HOSTS_SYNC_PATH = "/.portless/hosts-sync";
/** Server type returned by createProxyServer (plain HTTP/1.1 or net.Server TLS wrapper). */
type ProxyServer = http.Server | net.Server;
/**
 * Create an HTTP proxy server that routes requests based on the Host header.
 *
 * Uses Node's built-in http module for proxying (no external dependencies).
 * The `getRoutes` callback is invoked on every request so callers can provide
 * either a static list or a live-updating one.
 *
 * When `tls` is provided, creates an HTTP/2 secure server with HTTP/1.1
 * fallback (`allowHTTP1: true`). This enables HTTP/2 multiplexing for
 * browsers. WebSockets work over both protocol versions: HTTP/1.1 Upgrade
 * requests are forwarded as-is, and HTTP/2 extended CONNECT (RFC 8441) is
 * bridged to an HTTP/1.1 handshake against the backend.
 */
declare function createProxyServer(options: ProxyServerOptions): ProxyServer;
/**
 * Create a minimal HTTP server that 302-redirects every request to HTTPS.
 * Meant to run on port 80 alongside an HTTPS proxy on port 443.
 */
declare function createHttpRedirectServer(httpsPort: number): http.Server;

/** File permission mode for route and state files. */
declare const FILE_MODE = 420;
/** Directory permission mode for the state directory. */
declare const DIR_MODE = 493;
interface RouteMapping extends RouteInfo {
    pid: number;
    tailscaleUrl?: string;
    tailscaleHttpsPort?: number;
    tailscaleFunnel?: boolean;
    ngrokUrl?: string;
    ngrokPid?: number;
}
type RouteMetadataPatch = {
    tailscaleUrl?: string | null;
    tailscaleHttpsPort?: number | null;
    tailscaleFunnel?: boolean | null;
    ngrokUrl?: string | null;
    ngrokPid?: number | null;
};
/**
 * Thrown when a route is already registered by a live process and --force was
 * not specified. With --force, the existing process is killed instead.
 */
declare class RouteConflictError extends Error {
    readonly hostname: string;
    readonly existingPid: number;
    constructor(hostname: string, existingPid: number);
}
/**
 * Manages route mappings stored as a JSON file on disk.
 * Supports file locking and stale-route cleanup.
 */
declare class RouteStore {
    /** The state directory path. */
    readonly dir: string;
    private readonly routesPath;
    private readonly lockPath;
    readonly pidPath: string;
    readonly portFilePath: string;
    private readonly onWarning;
    constructor(dir: string, options?: {
        onWarning?: (message: string) => void;
    });
    ensureDir(): void;
    getRoutesPath(): string;
    private static readonly sleepBuffer;
    private syncSleep;
    private acquireLock;
    private releaseLock;
    private isProcessAlive;
    /**
     * Load routes from disk, filtering out stale entries whose owning process
     * is no longer alive. Stale-route cleanup is only persisted when the caller
     * already holds the lock (i.e. inside addRoute/removeRoute) to avoid
     * unprotected concurrent writes.
     */
    loadRoutes(persistCleanup?: boolean): RouteMapping[];
    private saveRoutes;
    /**
     * Register a route. When `force` is true and the hostname is already claimed
     * by another live process, that process is sent SIGTERM before the route is
     * replaced. Returns the PID of the killed process (if any) so the caller can
     * log it.
     */
    addRoute(hostname: string, port: number, pid: number, force?: boolean): number | undefined;
    /**
     * Load all routes from disk without filtering out dead PIDs. Used by
     * `portless prune` to discover stale entries whose owning CLI is gone
     * but whose dev server may still be holding a port.
     */
    loadRoutesRaw(): RouteMapping[];
    /**
     * Remove all route entries whose owning process is dead and persist the
     * result. Returns the removed stale entries so the caller can act on them.
     */
    pruneStaleRoutes(): RouteMapping[];
    /**
     * Update metadata on an existing route entry. Only provided fields are
     * merged; the route must already exist (matched by hostname).
     */
    updateRoute(hostname: string, fields: RouteMetadataPatch): void;
    /**
     * Remove a route by hostname. When `ownerPid` is provided, the entry is
     * only removed while it is still owned by that pid. Exit cleanups must
     * pass their own pid: after a `--force` takeover the killed process would
     * otherwise deregister the route the new owner just registered.
     */
    removeRoute(hostname: string, ownerPid?: number): void;
}

type UserHomeOptions = {
    platform?: NodeJS.Platform;
    env?: NodeJS.ProcessEnv;
    homedir?: string;
    passwdHome?: (username: string) => string | null;
};
/**
 * Resolve the home directory that owns portless state. When sudo changes the
 * effective user to root, retain the invoking user's home so elevated proxy
 * processes and unprivileged app processes share the same route store.
 */
declare function resolveUserHome(options?: UserHomeOptions): string;
/**
 * Open a TCP connection to a local app port, trying both loopback families
 * instead of hardcoding IPv4. Uses Node's Happy Eyeballs implementation
 * (`autoSelectFamily`) with a fixed address list, so no DNS lookup happens:
 * 127.0.0.1 is attempted first and `::1` is tried when it fails (issue #320).
 */
declare function createLoopbackConnection(port: number): net.Socket;
/**
 * When running under sudo, fix file ownership so the real user can
 * read/write the file later without sudo. No-op on Windows or when not
 * running as root.
 */
declare function fixOwnership(...paths: string[]): void;
/** Type guard for Node.js system errors with an error code. */
declare function isErrnoException(err: unknown): err is NodeJS.ErrnoException;
/** Return whether a process exists, treating permission denial as alive. */
declare function isProcessAlive(pid: number): boolean;
/**
 * Escape HTML special characters to prevent XSS.
 */
declare function escapeHtml(str: string): string;
/**
 * Format a URL for the given hostname. Omits the port when it matches the
 * protocol default (80 for HTTP, 443 for HTTPS).
 */
declare function formatUrl(hostname: string, proxyPort: number, tls?: boolean): string;
/**
 * Parse and normalize a hostname input for use as a subdomain of the
 * configured TLD. Strips protocol prefixes, validates characters, and
 * appends the TLD suffix if needed.
 */
declare function parseHostname(input: string, tld?: string): string;
/**
 * Parse a hostname input for every configured TLD. If the input already ends
 * with one of those TLDs, use the stripped base name for the full set.
 */
declare function parseHostnames(input: string, tlds?: readonly string[]): string[];

/**
 * Extract the portless-managed block from /etc/hosts content.
 * Returns the lines between the markers (exclusive), or an empty array
 * if no managed block exists.
 */
declare function extractManagedBlock(content: string): string[];
/**
 * Remove the portless-managed block from /etc/hosts content and return
 * the cleaned content with trailing newlines normalized.
 */
declare function removeBlock(content: string): string;
/**
 * Build a portless-managed block for the given hostnames.
 */
declare function buildBlock(hostnames: string[]): string;
/**
 * Whether the proxy should write route hostnames to the hosts file.
 * Disabled only when `PORTLESS_SYNC_HOSTS` is `0` or `false` (opt-out).
 */
declare function shouldAutoSyncHosts(syncVal: string | undefined): boolean;
/**
 * Whether the managed block is exactly these hostnames, no others, each on
 * loopback. Exactness, not coverage: a superset means a removed route's entry is
 * still resolving. Pure so it is testable without the hosts path.
 */
declare function blockMatchesHostnames(content: string, hostnames: string[]): boolean;
/**
 * Rewrite the managed block to exactly these hostnames. Needs privilege.
 *
 * Returns whether the block matches afterwards, which is the writer's question.
 * Whether some hostname resolves is a weaker, different question: use
 * `checkHostResolution`, since a hosts entry is only one reason a name resolves.
 *
 * Skips the write when the block already matches, so a no-op reload does not
 * rewrite the file.
 */
declare function syncHostsFile(hostnames: string[]): boolean;
/**
 * Remove the portless-managed block from /etc/hosts.
 * Returns true on success, false on failure.
 */
declare function cleanHostsFile(): boolean;
/**
 * Return the current portless-managed hostnames from /etc/hosts.
 * A read failure returns an empty array for best-effort callers; it does not
 * prove that the hosts file is empty or was read successfully.
 */
declare function getManagedHostnames(): string[];
/**
 * Check whether the system DNS resolver selects an address where the local
 * proxy listens.
 */
declare function checkHostResolution(hostname: string): Promise<boolean>;

export { DIR_MODE, FILE_MODE, HOSTS_SYNC_PATH, PORTLESS_HEADER, type ProxyServer, type ProxyServerOptions, RouteConflictError, type RouteInfo, type RouteMapping, RouteStore, blockMatchesHostnames, buildBlock, checkHostResolution, cleanHostsFile, createHttpRedirectServer, createLoopbackConnection, createProxyServer, escapeHtml, extractManagedBlock, fixOwnership, formatUrl, getManagedHostnames, isErrnoException, isProcessAlive, parseHostname, parseHostnames, removeBlock, resolveUserHome, shouldAutoSyncHosts, syncHostsFile };
