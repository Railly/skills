import type { APIRoute } from "astro";
import { collectionInstallCommand, release } from "../data/skills";

export const GET: APIRoute = () => {
	const image = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
	<title>Railly Skills, engineering skills with receipts</title>
	<rect width="1200" height="630" fill="#100f0f"/>
	<path d="M103.4 57.7c2.3-1.3 5-1.3 7.2 0l68 39.5c2.2 1.3 3.6 3.7 3.6 6.3v79c0 2.6-1.4 5-3.6 6.3l-68 39.5c-2.2 1.3-5 1.3-7.2 0l-68-39.5c-2.2-1.3-3.6-3.7-3.6-6.3v-79c0-2.6 1.4-5 3.6-6.3l68-39.5Z" fill="none" stroke="#3aa99f" stroke-width="8"/>
	<path d="M106.3 61.5c33.7 28.5 81 101.1 0 163.6M35.8 101.5l68.2 121M35.4 185.9l68.2-121" fill="none" stroke="#3aa99f" stroke-linecap="round" stroke-width="6"/>
	<text x="72" y="320" fill="#cecdc3" font-family="Arial, sans-serif" font-size="82" font-weight="600" letter-spacing="-4">Engineering skills</text>
	<text x="72" y="408" fill="#3aa99f" font-family="Arial, sans-serif" font-size="82" font-weight="600" letter-spacing="-4">with receipts.</text>
	<text x="76" y="468" fill="#878580" font-family="monospace" font-size="22">Source. Method. Evidence. Limit.</text>
	<g transform="translate(72 514)"><rect width="516" height="62" fill="#1c1b1a" stroke="#343331"/><text x="22" y="40" fill="#3aa99f" font-family="monospace" font-size="21">$ ${collectionInstallCommand}</text></g>
	<text x="1005" y="554" fill="#d0a215" font-family="monospace" font-size="20">v${release}</text>
</svg>`;

	return new Response(image, {
		headers: { "Content-Type": "image/svg+xml" },
	});
};
