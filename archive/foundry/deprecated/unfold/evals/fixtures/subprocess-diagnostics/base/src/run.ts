import { spawn } from "node:child_process";

export function runChild(env: Record<string, string>) {
	return new Promise<string>((resolve, reject) => {
		const child = spawn(process.execPath, ["run", "src/child.ts"], {
			env: { ...process.env, ...env },
			stdio: ["ignore", "pipe", "ignore"],
		});

		let stdout = "";
		child.stdout.on("data", (chunk) => {
			stdout += chunk;
		});
		child.on("close", (code) => {
			if (code === 0) resolve(stdout.trim());
			else reject(new Error("child failed"));
		});
	});
}
