import concurrent.futures, http.server, json, os, pathlib, socket, ssl, subprocess, tempfile, threading
WT=pathlib.Path('/Users/raillyhugo/Programming/vercel/agent-browser-cli-tls-1670'); RUN=pathlib.Path(__file__).parent; FIX=WT/'cli/tests/fixtures/tls';BIN=os.environ.get('AB_TLS_TEST_BINARY',str(WT/'cli/target/debug/agent-browser'))
class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self,*a):pass
    def do_GET(self):
        self.server.requests+=1;body=b'protocol TLS proof\n';self.send_response(200);self.send_header('Content-Type','text/markdown');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
class Server(http.server.ThreadingHTTPServer):
    daemon_threads=True
    def get_request(self):
        sock,addr=super().get_request();sock.settimeout(5);return self.ctx.wrap_socket(sock,server_side=True),addr
    def handle_error(self,*a):pass
def server(which):
    s=Server(('127.0.0.1',0),Handler);s.requests=0;s.ctx=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER);s.ctx.load_cert_chain(FIX/f'server-{which}.pem',FIX/f'server-{which}.key');t=threading.Thread(target=s.serve_forever,daemon=True);t.start();return s,t
servers=[server('a'),server('b')];a,b=[x[0] for x in servers];observations=[]
with tempfile.TemporaryDirectory(prefix='ab-tls-protocol-') as tmp:
    env={k:v for k,v in os.environ.items() if not k.startswith('AGENT_BROWSER_') and k.upper() not in ['SSL_CERT_FILE','SSL_CERT_DIR','HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','NO_PROXY']};env.update(HOME=tmp,AGENT_BROWSER_SOCKET_DIR=tmp+'/sockets',NO_COLOR='1')
    ca=pathlib.Path(tmp)/'ca.pem';ca.write_bytes((FIX/'ca-a.pem').read_bytes())
    ca_b=pathlib.Path(tmp)/'ca-b.pem';ca_b.write_bytes((FIX/'ca-b.pem').read_bytes())
    def cli(*args):
        out=subprocess.run([BIN,'--session','protocol','--json',*args],env=env,cwd=tmp,capture_output=True,text=True,timeout=20);return json.loads(out.stdout)
    def wire(value):
        with socket.socket(socket.AF_UNIX) as sock:
            sock.settimeout(10);sock.connect(tmp+'/sockets/protocol.sock');sock.sendall(json.dumps(value).encode()+b'\n');return json.loads(sock.makefile('rb').readline())
    def request(update=None,peer=a):
        cmd={'id':'proof','action':'read','url':f'https://localhost:{peer.server_port}','timeout':2000}
        if update is not None:cmd['tlsOptions']=update
        return wire(cmd)
    try:
        assert cli('--ca-cert',str(ca),'read',f'https://localhost:{a.server_port}')['success']
        pid=pathlib.Path(tmp+'/sockets/protocol.pid').read_text()
        fields={'caCert':([False,1,[],{}]),'caCertIsImplicit':([None,1,'true',[],{}]),'clearCaCert':([None,1,'true',[],{}]),'useSystemCa':([1,'true',[],{}])}
        malformed=[(field,{field:value}) for field,values in fields.items() for value in values]+[('unknown-field',{'unknown':True}),('set-and-clear',{'caCert':str(ca),'clearCaCert':True})]
        for label,update in malformed:
            before=a.requests;result=request(update);assert not result['success'],(label,update,result);assert a.requests==before,(label,'reached peer');assert request()['success'];observations.append({'class':label,'input':update,'rejected':True,'selection_preserved':True})
        for update in [{},{'caCert':None},{'useSystemCa':None},{'clearCaCert':False}]:
            assert request(update)['success'];observations.append({'class':'omission-equivalent','input':update,'accepted':True})
        invalid=pathlib.Path(tmp)/'invalid.pem';invalid.write_text('invalid certificate')
        before=a.requests;failed=request({'caCert':str(invalid)});assert not failed['success'];assert a.requests==before;assert request()['success'];observations.append({'class':'invalid-replacement','rejected':True,'prior_selection_preserved':True})
        assert request({'caCert':str(ca_b),'caCertIsImplicit':True})['success'];assert not request(peer=b)['success']
        assert not request({'clearCaCert':True})['success'];assert not request({'caCert':str(ca),'caCertIsImplicit':True})['success']
        assert request({'caCert':str(ca)})['success'];observations.append({'class':'ambient-precedence','explicit_and_clear_resist_ambient':True,'explicit_replacement_recovers':True})
        byte_fields=[b'',b'\x00',b'not a certificate',b'-----BEGIN CERTIFICATE-----\n!bad\n-----END CERTIFICATE-----', (FIX/'ca-a.pem').read_bytes()[:64],(FIX/'ca-a.pem').read_bytes()[:-32]]
        for body in byte_fields:
            invalid.write_bytes(body);result=request({'caCert':str(invalid)});assert not result['success'],(body,result);assert request()['success'];observations.append({'class':'certificate-parser','bytes':len(body),'rejected':True,'selection_preserved':True})
        assert pathlib.Path(tmp+'/sockets/protocol.pid').read_text()==pid
    finally:
        cli('close')
        for s,t in servers:s.shutdown();s.server_close();t.join()
(RUN/'protocol-proof.json').write_text(json.dumps({'status':'pass','binary':BIN,'method':'deterministic JSON type partitions and certificate grammar truncation corpus at real daemon boundary','cases':observations,'cleanup':'isolated daemon and servers closed; temp HOME removed'},indent=2)+'\n');print('PASS:',len(observations),'protocol and parser classes')
