export type Route = { authority: string; target: string };

export function findRoute(routes: Route[], authority: string) {
	const exact = routes.find((route) => route.authority === authority);
	if (exact) return exact;
	const hostname = authority.split(":")[0];
	return routes.find((route) => route.authority.split(":")[0] === hostname);
}
