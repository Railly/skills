import http.server,json,os,pathlib,ssl,subprocess,tempfile,threading
BIN='/work/cli/target/debug/agent-browser';FIX=pathlib.Path('/work/cli/tests/fixtures/tls');result=[]
class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self,*args):pass
    def do_GET(self):
        body=b'Linux native trust proof\n';self.send_response(200);self.send_header('Content-Type','text/markdown');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
class Server(http.server.ThreadingHTTPServer):
    daemon_threads=True
    def get_request(self):
        sock,addr=super().get_request();sock.settimeout(5);return self.ctx.wrap_socket(sock,server_side=True),addr
    def handle_error(self,*a):pass
def server(which):
    s=Server(('127.0.0.1',0),Handler);s.ctx=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER);s.ctx.load_cert_chain(FIX/f'server-{which}.pem',FIX/f'server-{which}.key');threading.Thread(target=s.serve_forever,daemon=True).start();return s
a,b=server('a'),server('b');root=pathlib.Path('/usr/local/share/ca-certificates/ab1670-proof.crt')
def install(which):
    root.write_bytes((FIX/f'ca-{which}.pem').read_bytes());subprocess.run(['update-ca-certificates','--fresh'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
with tempfile.TemporaryDirectory(prefix='ab1670-native-') as tmp:
    env={k:v for k,v in os.environ.items() if not k.startswith('AGENT_BROWSER_') and k.upper() not in ['SSL_CERT_FILE','SSL_CERT_DIR','HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','NO_PROXY']};env.update(HOME=tmp,AGENT_BROWSER_SOCKET_DIR=tmp+'/sockets',NO_COLOR='1')
    def cli(*args):
        out=subprocess.run([BIN,'--session','native','--json',*args],env=env,cwd=tmp,capture_output=True,text=True,timeout=30);value=json.loads(out.stdout);result.append({'args':args,'response':value});return value
    try:
        assert cli('--executable-path','/usr/bin/chromium','--args','--no-sandbox','--ca-cert',str(FIX/'ca-a.pem'),'open',f'https://localhost:{a.server_port}')['success']
        initial=cli('eval',"globalThis.tlsNssMarker = 'same-page'");assert initial['success'];pid=pathlib.Path(tmp+'/sockets/native.pid').read_text()
        assert cli('--ca-cert',str(FIX/'ca-b.pem'),'read',f'https://localhost:{b.server_port}')['success']
        assert cli('eval','globalThis.tlsNssMarker')['data']['result']=='same-page'
        assert cli('open',f'https://localhost:{a.server_port}')['success']
        assert not cli('open',f'https://localhost:{b.server_port}')['success']
        assert cli('--ca-cert',str(FIX/'ca-b.pem'),'open',f'https://localhost:{b.server_port}')['success']
        assert not cli('open',f'https://localhost:{a.server_port}')['success']
        assert not cli('--no-ca-cert','open',f'https://localhost:{b.server_port}')['success']
        assert pathlib.Path(tmp+'/sockets/native.pid').read_text()==pid
        result.append({'same_pid':pid.strip(),'browser':'Debian Chromium with certutil NSS in disposable container','verified':'read changes only CLI trust; browser A survives until explicit browser transition to B; clear removes B'})
    finally:
        cli('close');root.unlink(missing_ok=True);subprocess.run(['update-ca-certificates','--fresh'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);a.shutdown();b.shutdown();a.server_close();b.server_close()
pathlib.Path('/tmp/linux-nss-proof.json').write_text(json.dumps({'status':'pass','observations':result},indent=2)+'\n');print(json.dumps(result[-2:],indent=2))
