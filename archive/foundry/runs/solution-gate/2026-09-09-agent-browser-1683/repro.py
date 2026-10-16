import http.server, threading, tempfile, subprocess, os, json, time, sys
BIN = sys.argv[1]
seen=[]
class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        auth=self.headers.get("Authorization")
        seen.append({"path":self.path,"authorization":auth})
        protected=self.path.startswith("/auth/")
        code=200 if not protected or auth == "Basic YWxpY2U6c2VjcmV0" else 401
        self.send_response(code)
        if code == 401: self.send_header("WWW-Authenticate", 'Basic realm="isolated-repro"')
        body=f"<title>{code}</title><main>{self.path}:{code}</main>".encode()
        self.send_header("Content-Length",str(len(body)))
        self.end_headers(); self.wfile.write(body)
    def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(("127.0.0.1",0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{server.server_port}"
with tempfile.TemporaryDirectory(prefix="ab1683-") as sockets:
    env={k:v for k,v in os.environ.items() if not k.startswith("AGENT_BROWSER_")}
    env.update(AGENT_BROWSER_SOCKET_DIR=sockets,NO_COLOR="1")
    def cli(session,*args,required=True):
        cmd=[BIN,"--session",session,"--json",*args]
        try:
            call_env=dict(env)
            if session=="agent": call_env.update(AGENT_BROWSER_PROXY_USERNAME="alice", AGENT_BROWSER_PROXY_PASSWORD="secret")
            proc=subprocess.run(cmd,env=call_env,text=True,capture_output=True,timeout=35)
            print(json.dumps({"session":session,"args":args,"exit":proc.returncode,"stdout":proc.stdout,"stderr":proc.stderr}),flush=True)
            if required: assert proc.returncode==0,proc.stdout
            return json.loads(proc.stdout) if proc.stdout else {}
        except subprocess.TimeoutExpired:
            print(json.dumps({"session":session,"args":args,"timeout":True}),flush=True)
            if required: raise
            return {}
    try:
        cli("host","--pin-tab","open",base+"/host")
        cdp=cli("host","get","cdp-url")["data"]["cdpUrl"]
        cli("agent","--isolate-context","--cdp",cdp,"open",base+"/agent")
        cli("agent","open",base+"/auth/owned")
        cli("agent","eval","window.continuity = 1683")
        cli("host","tab","new",base+"/foreign-ready")
        cli("agent","eval","window.continuity")
        time.sleep(1)
        cli("host","open",base+"/auth/foreign",required=False)
        cli("host","tab","new",base+"/ordinary",required=False)
        cli("agent","eval","window.continuity")
        cli("agent","get","url")
        print(json.dumps({"server_requests":seen,"leaked":any(x["path"]=="/auth/foreign" and x["authorization"] for x in seen)}),flush=True)
    finally:
        for s in ["agent","host"]: cli(s,"close",required=False)
        server.shutdown()
