import subprocess, os, pathlib, json, datetime, time, sys
out = pathlib.Path(__file__).resolve().parent
variant = sys.argv[1]
attempt = sys.argv[2] if len(sys.argv) > 2 else '1'
command = ['node', '/Users/raillyhugo/Programming/vercel/json-render-336-review/node_modules/vitest/vitest.mjs', 'run', '--config', str(out / 'pressure.config.mjs'), '--configLoader', 'runner', '--reporter=json', '--outputFile', str(out / ('vitest-' + variant + '-' + attempt + '.json'))]
env = os.environ.copy()
env['AUDIT_VARIANT'] = variant
env['AUDIT_TRACE'] = str(out / ('traces-' + variant + '.json'))
env['TMPDIR'] = str(out / 'tmp')
(out / 'tmp').mkdir(exist_ok=True)
start = datetime.datetime.now(datetime.timezone.utc).isoformat()
tick = time.monotonic()
p = subprocess.run(command, cwd=out, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
log = out / ('vitest-' + variant + '-' + attempt + '.log')
log.write_bytes(p.stdout)
trace = out / ('traces-' + variant + '.json')
if trace.exists():
    (out / ('traces-' + variant + '-' + attempt + '.json')).write_bytes(trace.read_bytes())
record = {'command': command, 'cwd': str(out), 'environment_overrides': {'AUDIT_VARIANT': variant, 'AUDIT_TRACE': env['AUDIT_TRACE'], 'TMPDIR': env['TMPDIR']}, 'started_at': start, 'finished_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'elapsed_ms': round((time.monotonic() - tick) * 1000), 'exit_code': p.returncode, 'log': str(log)}
(out / ('command-' + variant + '-' + attempt + '.json')).write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps(record, indent=2))
print(p.stdout.decode(errors='replace')[-7000:])
sys.exit(p.returncode)
