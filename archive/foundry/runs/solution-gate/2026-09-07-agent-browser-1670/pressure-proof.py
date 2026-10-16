import concurrent.futures, http.server, json, os, pathlib, signal, socket, ssl, subprocess, tempfile, threading, time, urllib.request
WT=pathlib.Path('/Users/raillyhugo/Programming/vercel/agent-browser-cli-tls-1670'); RUN=pathlib.Path(__file__).parent; FIX=WT/'cli/tests/fixtures/tls'; BIN=os.environ.get('AB_TLS_TEST_BINARY',str(WT/'cli/target/release/agent-browser'))
entered=threading.Event();release=threading.Event();observations=[]
class Handler(http.server.BaseHTTPRequestHandler):
    protocol_version='HTTP/1.1'
    def log_message(self,*args):pass
    def do_GET(self):
        if self.path=='/hold':entered.set();release.wait(20)
        if self.path=='/disconnect':self.connection.shutdown(socket.SHUT_RDWR);self.connection.close();return
        body=(b'{"data":[{"id":"local-model"}]}' if self.path=='/v1/models' else b'pressure TLS proof\n')
        try:self.send_response(200);self.send_header('Content-Type','text/markdown');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
        except (BrokenPipeError,ConnectionResetError,ssl.SSLError):pass
class Server(http.server.ThreadingHTTPServer):
    daemon_threads=True
    def get_request(self):
        sock,addr=super().get_request();sock.settimeout(5);return self.ctx.wrap_socket(sock,server_side=True),addr
    def handle_error(self,*args):pass
def server(which):
    s=Server(('127.0.0.1',0),Handler);s.ctx=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER);s.ctx.load_cert_chain(FIX/f'server-{which}.pem',FIX/f'server-{which}.key');threading.Thread(target=s.serve_forever,daemon=True).start();return s
a,b=server('a'),server('b')
with tempfile.TemporaryDirectory(prefix='ab-tls-pressure-') as tmp:
    env={k:v for k,v in os.environ.items() if not k.startswith('AGENT_BROWSER_') and k.upper() not in ['SSL_CERT_FILE','SSL_CERT_DIR','HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','NO_PROXY','AI_GATEWAY_API_KEY','AI_GATEWAY_URL']};env.update(HOME=tmp,AGENT_BROWSER_SOCKET_DIR=tmp+'/sockets',AI_GATEWAY_API_KEY='isolated-test-value',AI_GATEWAY_URL=f'https://localhost:{a.server_port}',NO_COLOR='1')
    ca=pathlib.Path(tmp)/'ca.pem';ca.write_bytes((FIX/'ca-a.pem').read_bytes())
    args=[BIN,'--session','pressure','--json']
    def cli(*tail):
        out=subprocess.run(args+list(tail),env=env,cwd=tmp,capture_output=True,text=True,timeout=30);return json.loads(out.stdout)
    def pid():return int(pathlib.Path(tmp+'/sockets/pressure.pid').read_text())
    def resources():
        rss=subprocess.check_output(['ps','-p',str(pid()),'-o','rss='],text=True).strip()
        handles=subprocess.check_output(['lsof','-a','-p',str(pid()),'-F','f'],text=True,stderr=subprocess.DEVNULL)
        return {'rss_kib':int(rss),'open_descriptors':sum(line[1:].isdigit() for line in handles.splitlines() if line.startswith('f'))}
    try:
        assert cli('--ca-cert',str(ca),'read',f'https://localhost:{a.server_port}')['success'];initial_pid=pid()
        stream=cli('stream','status');port=stream['data']['port']
        def models():
            req=urllib.request.Request(f'http://127.0.0.1:{port}/api/models',headers={'Origin':'http://localhost'})
            with urllib.request.urlopen(req,timeout=10) as resp:return json.load(resp)
        def wave():
            with concurrent.futures.ThreadPoolExecutor(max_workers=os.cpu_count()) as pool:
                results=list(pool.map(lambda _:models(),range(os.cpu_count())))
            assert all(x=={'data':[{'id':'local-model'}]} for x in results),results
        wave();before=resources()
        for certificate in ['ca-b.pem','ca-a.pem']:
            ca.write_bytes((FIX/certificate).read_bytes())
            if certificate=='ca-b.pem':
                assert cli('read',f'https://localhost:{b.server_port}')['success'];assert models()=={'data':[]}
            else:
                assert cli('read',f'https://localhost:{a.server_port}')['success'];wave()
        after=resources();observations.append({'case':'concurrent_pool_load_across_rotation','workers':os.cpu_count(),'before':before,'after':after,'same_pid':pid()==initial_pid})
        for mode in ['caller-cancel','read-timeout','peer-disconnect']:
            entered.clear();release.clear()
            if mode=='caller-cancel':
                proc=subprocess.Popen(args+['read',f'https://localhost:{a.server_port}/hold','--timeout','2000'],env=env,cwd=tmp,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
                assert entered.wait(10);proc.terminate();proc.communicate(timeout=5);release.set()
            elif mode=='read-timeout':
                result=cli('read',f'https://localhost:{a.server_port}/hold','--timeout','200');assert not result['success'];release.set()
            else:
                result=cli('read',f'https://localhost:{a.server_port}/disconnect','--timeout','2000');assert not result['success'];release.set()
            assert cli('read',f'https://localhost:{a.server_port}')['success'];assert pid()==initial_pid;observations.append({'case':mode,'immediate_retry':'success','same_pid':True})
        entered.clear();release.clear()
        proc=subprocess.Popen(args+['read',f'https://localhost:{a.server_port}/hold','--timeout','2000'],env=env,cwd=tmp,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        assert entered.wait(10);old_pid=pid();os.kill(old_pid,signal.SIGTERM);release.set();proc.communicate(timeout=10)
        deadline=time.monotonic()+10
        while pathlib.Path(tmp+'/sockets/pressure.pid').exists() and time.monotonic()<deadline:time.sleep(.05)
        assert cli('--ca-cert',str(ca),'read',f'https://localhost:{a.server_port}')['success'];assert pid()!=old_pid;observations.append({'case':'daemon-shutdown-with-active-request','immediate_retry':'success','old_pid':old_pid,'new_pid':pid()})
    finally:
        release.set();cli('close');a.shutdown();b.shutdown();a.server_close();b.server_close()
(RUN/'pressure-proof.json').write_text(json.dumps({'status':'pass','binary':BIN,'observations':observations,'cleanup':'owned sessions/processes closed, local peers stopped, temp HOME removed'},indent=2)+'\n');print(json.dumps(observations,indent=2))
