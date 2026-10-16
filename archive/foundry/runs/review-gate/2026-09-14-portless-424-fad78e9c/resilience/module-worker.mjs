const mod = await import(process.env.AUDIT_MODULE);
const names = JSON.parse(process.env.AUDIT_NAMES);
const ok = process.env.AUDIT_COMMAND === 'clean' ? mod.cleanHostsFile() : mod.syncHostsFile(names);
console.log(JSON.stringify({ ok }));
process.exitCode = ok ? 0 : 1;
