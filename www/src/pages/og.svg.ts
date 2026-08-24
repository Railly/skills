import type { APIRoute } from "astro";
import { collectionInstallCommand, release } from "../data/skills";

export const GET: APIRoute = () => {
	const image = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
	<title>Railly Skills, engineering skills with receipts</title>
	<rect width="1200" height="630" fill="#111111"/>
	<defs><linearGradient id="mark" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f6c85f"/><stop offset=".45" stop-color="#f06b4f"/><stop offset="1" stop-color="#63d7c7"/></linearGradient></defs>
	<rect x="72" y="66" width="52" height="52" rx="14" fill="url(#mark)"/><circle cx="121" cy="115" r="7" fill="#22c55e" stroke="#111111" stroke-width="4"/>
	<text x="144" y="103" fill="#fafafa" font-family="Arial, sans-serif" font-size="30" font-weight="600">Railly Skills</text>
	<line x1="72" y1="146" x2="1128" y2="146" stroke="#262626"/>
	<text x="72" y="280" fill="#fafafa" font-family="Arial, sans-serif" font-size="72" font-weight="600" letter-spacing="-4">Engineering skills</text>
	<text x="72" y="358" fill="#a3a3a3" font-family="Arial, sans-serif" font-size="72" font-weight="600" letter-spacing="-4">with receipts.</text>
	<text x="76" y="420" fill="#525252" font-family="monospace" font-size="21">SOURCE / METHOD / EVIDENCE / LIMIT</text>
	<g transform="translate(72 480)"><rect width="516" height="58" rx="6" fill="#171717" stroke="#262626"/><text x="20" y="37" fill="#a3a3a3" font-family="monospace" font-size="20">$ ${collectionInstallCommand}</text></g>
	<text x="1035" y="516" fill="#a3a3a3" font-family="monospace" font-size="18">v${release}</text>
</svg>`;

	return new Response(image, {
		headers: { "Content-Type": "image/svg+xml" },
	});
};
