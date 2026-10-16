import concurrent.futures, http.server, json, os, pathlib, ssl, subprocess, tempfile, threading, urllib.request
WT=pathlib.Path('/Users/raillyhugo/Programming/vercel/agent-browser-cli-tls-1670')
RUN=pathlib.Path(__file__).parent
FIX=WT/'cli/tests/fixtures/tls'
BIN=str(WT/'cli/target/debug/agent-browser')
entered=threading.Event(); release=threading.Event(); count=0
class Server(http.server.ThreadingHTTPServer):
    daemon_threads=True
    def get_request(self):
        sock, addr=super().get_request(); sock.settimeout(10)
        return self.context.wrap_socket(sock,server_side=True),addr
class Handler(http.server.BaseHTTPRequestHandler):
    protocol_version='HTTP/1.1'
    def log_message(self,*args): pass
    def do_GET(self):
        global count
        if self.path=='/v1/models':
            count+=1
            if count==1:
                entered.set(); assert release.wait(20)
            body=json.dumps({'data':[{'id':'local-model'}]}).encode()
        else: body=b'local TLS proof\n'
        self.send_response(200);self.send_header('Content-Type','text/markdown');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
def ctx(which):
    c=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER);c.load_cert_chain(FIX/f'server-{which}.pem',FIX/f'server-{which}.key');return c
def server(which):
    s=Server(('127.0.0.1',0),Handler);s.context=ctx(which);t=threading.Thread(target=s.serve_forever,daemon=True);t.start();return s,t
a,ta=server('a');b,tb=server('b'); observations=[]
with tempfile.TemporaryDirectory(prefix='ab-tls-pool-') as tmp:
    ca=pathlib.Path(tmp)/'ca.pem';ca.write_bytes((FIX/'ca-a.pem').read_bytes())
    env={k:v for k,v in os.environ.items() if not k.startswith('AGENT_BROWSER_') and k.upper() not in ['SSL_CERT_FILE','SSL_CERT_DIR','HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','NO_PROXY','AI_GATEWAY_API_KEY','AI_GATEWAY_URL']}
    env.update(HOME=tmp,AGENT_BROWSER_SOCKET_DIR=tmp+'/sockets',AI_GATEWAY_API_KEY='isolated-test-value',AI_GATEWAY_URL=f'https://localhost:{a.server_port}',NO_COLOR='1')
    def cli(*args):
        out=subprocess.run([BIN,'--session','pool','--json',*args],env=env,cwd=tmp,capture_output=True,text=True,timeout=30)
        result=json.loads(out.stdout);observations.append({'command':list(args),'response':result});return result
    try:
        assert cli('--ca-cert',str(ca),'read',f'https://localhost:{a.server_port}')['success']
        stream=cli('stream','status');print(json.dumps(stream),flush=True);assert stream['success']
        port=stream['data'].get('port') or stream['data'].get('streamPort')
        if not port:
            raise ValueError('inspect stream port shape')
        pid=pathlib.Path(tmp+'/sockets/pool.pid').read_text()
        def models():
            req=urllib.request.Request(f'http://127.0.0.1:{port}/api/models',headers={'Origin':'http://localhost'})
            with urllib.request.urlopen(req,timeout=25) as resp:return json.load(resp)
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            pending=pool.submit(models);assert entered.wait(10),'old TLS operation not admitted'
            ca.write_bytes((FIX/'ca-b.pem').read_bytes())
            assert cli('read',f'https://localhost:{b.server_port}')['success']
            release.set();old=pending.result(timeout=10);assert old['data']==[{'id':'local-model'}],old
        denied=models();assert denied=={'data':[]},denied;assert count==1,count
        a.context=ctx('b')
        accepted=models();assert accepted['data']==[{'id':'local-model'}],accepted;assert count==2,count
        assert pathlib.Path(tmp+'/sockets/pool.pid').read_text()==pid
        observations.append({'old_inflight_after_rotation':old,'new_acquisition_against_old_issuer':denied,'new_acquisition_after_server_rotates':accepted,'requests_reaching_gateway':count,'same_pid':pid.strip()})
    finally:
        release.set();cli('close');a.shutdown();b.shutdown();a.server_close();b.server_close();ta.join();tb.join()
(RUN/'pool-proof.json').write_text(json.dumps({'status':'pass','observations':observations,'cleanup':'isolated daemon closed, local servers stopped, temporary HOME removed'},indent=2)+'\n')
print(json.dumps(observations[-2:],indent=2))
