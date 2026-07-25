if (process.env.CI_SIM === "1") {
	console.error("spawn npm ENOENT");
	process.exit(1);
}

console.log("ready");
