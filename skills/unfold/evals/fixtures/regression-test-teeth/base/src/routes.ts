export type Route = { authority: string; target: string };

export function findRoute(routes: Route[], authority: string) {
	const hostname = authority.split(":")[0];
	return routes.find((route) => route.authority.split(":")[0] === hostname);
}
