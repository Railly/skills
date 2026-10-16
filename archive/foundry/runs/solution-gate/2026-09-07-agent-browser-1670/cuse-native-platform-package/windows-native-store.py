import argparse
import base64
import hashlib
import http.server
import json
import os
from pathlib import Path
import ssl
import subprocess
import sys
import tempfile
import threading


def powershell(script):
    encoded = base64.b64encode(script.encode('utf-16le')).decode()
    return subprocess.run(['powershell.exe', '-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], check=True, capture_output=True, text=True, timeout=30).stdout.strip()


def store(der, operation):
    encoded = base64.b64encode(der).decode()
    return powershell(f"""
$ErrorActionPreference = 'Stop'
$cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new([Convert]::FromBase64String('{encoded}'))
$store = [System.Security.Cryptography.X509Certificates.X509Store]::new('Root', 'CurrentUser')
$store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
try {{
  $matches = $store.Certificates.Find([System.Security.Cryptography.X509Certificates.X509FindType]::FindByThumbprint, $cert.Thumbprint, $false)
  if ('{operation}' -eq 'add') {{
    if ($matches.Count -ne 0) {{ throw 'Fixture root already exists; refusing to alter it' }}
    $store.Add($cert)
  }} elseif ('{operation}' -eq 'remove') {{
    foreach ($match in $matches) {{ $store.Remove($match) }}
  }}
  $store.Certificates.Find([System.Security.Cryptography.X509Certificates.X509FindType]::FindByThumbprint, $cert.Thumbprint, $false).Count
}} finally {{ $store.Close() }}
""")


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_GET(self):
        self.server.requests += 1
        body = b'Windows native trust proof\n'
        self.send_response(200)
        self.send_header('Content-Type', 'text/markdown')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class Server(http.server.ThreadingHTTPServer):
    daemon_threads = True

    def get_request(self):
        sock, address = super().get_request()
        sock.settimeout(5)
        return self.context.wrap_socket(sock, server_side=True), address

    def handle_error(self, *args):
        pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--binary', required=True)
    parser.add_argument('--fixtures', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--allow-disposable-runner', action='store_true')
    args = parser.parse_args()
    output = Path(args.output).resolve()
    receipt = {'status': 'not_run', 'platform': sys.platform, 'observations': [], 'cleanup_errors': []}
    if sys.platform != 'win32' or not args.allow_disposable_runner or os.environ.get('GITHUB_ACTIONS') != 'true' or os.environ.get('RUNNER_ENVIRONMENT') != 'github-hosted':
        receipt.update(status='blocked', reason='Requires an explicitly selected disposable GitHub-hosted Windows runner; no certificate store was changed')
        output.write_text(json.dumps(receipt, indent=2) + '\n')
        print(json.dumps(receipt))
        return 4
    binary = Path(args.binary).resolve()
    fixtures = Path(args.fixtures).resolve()
    receipt['binary_sha256'] = hashlib.sha256(binary.read_bytes()).hexdigest()
    roots = {key: ssl.PEM_cert_to_DER_cert((fixtures / f'ca-{key}.pem').read_text()) for key in ('a', 'b')}
    receipt['root_sha256'] = {key: hashlib.sha256(der).hexdigest() for key, der in roots.items()}
    installed = set()
    servers = []
    with tempfile.TemporaryDirectory(prefix='ab1670-native-') as tmp:
        env = {k: v for k, v in os.environ.items() if not k.upper().startswith('AGENT_BROWSER_') and k.upper() not in {'SSL_CERT_FILE', 'SSL_CERT_DIR', 'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'NO_PROXY', 'NODE_EXTRA_CA_CERTS'}}
        env.update(HOME=tmp, USERPROFILE=tmp, AGENT_BROWSER_SOCKET_DIR=str(Path(tmp) / 'sockets'), NO_COLOR='1')
        def cli(*argv):
            completed = subprocess.run([str(binary), '--session', 'native', '--json', *argv], env=env, cwd=tmp, capture_output=True, text=True, timeout=30)
            value = json.loads(completed.stdout)
            receipt['observations'].append({'args': argv, 'exit_code': completed.returncode, 'response': value})
            return value
        def read(key, expected, *options):
            response = cli(*options, 'read', f'https://localhost:{servers[ord(key)-ord("a")].server_port}', '--timeout', '2000')
            assert response['success'] is expected, response
            if expected:
                assert response['data']['lifecycle']['effectiveLaunch']['browserLaunched'] is False, response
        def pid():
            return (Path(tmp) / 'sockets/native.pid').read_text().strip()
        try:
            for der in roots.values():
                assert store(der, 'inspect') == '0', 'Fixture root already present; refusing to alter existing trust'
            for key in ('a', 'b'):
                server = Server(('127.0.0.1', 0), Handler)
                server.requests = 0
                server.context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
                server.context.load_cert_chain(fixtures / f'server-{key}.pem', fixtures / f'server-{key}.key')
                threading.Thread(target=server.serve_forever, daemon=True).start()
                servers.append(server)
            read('a', False, '--use-system-ca')
            original_pid = pid()
            installed.add('a')
            assert store(roots['a'], 'add') == '1'
            read('a', True)
            read('b', False)
            assert store(roots['a'], 'remove') == '0'
            installed.remove('a')
            installed.add('b')
            assert store(roots['b'], 'add') == '1'
            read('b', True)
            read('a', False)
            read('b', False, '--use-system-ca', 'false')
            read('b', True, '--use-system-ca')
            assert pid() == original_pid
            receipt.update(status='passed', same_pid=original_pid, store='CurrentUser/Root', native_loader_overrides='unset', peer_requests=[server.requests for server in servers])
        except Exception as error:
            receipt.update(status='failed', error=str(error))
        finally:
            try:
                cli('close')
            except Exception as error:
                receipt['cleanup_errors'].append('daemon: ' + str(error))
            for key in installed:
                try:
                    assert store(roots[key], 'remove') == '0'
                except Exception as error:
                    receipt['cleanup_errors'].append('root ' + key + ': ' + str(error))
            for server in servers:
                server.shutdown()
                server.server_close()
            if receipt['cleanup_errors']:
                receipt['status'] = 'cleanup_failed'
            output.write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({'status': receipt['status'], 'receipt': str(output)}))
    return 0 if receipt['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
