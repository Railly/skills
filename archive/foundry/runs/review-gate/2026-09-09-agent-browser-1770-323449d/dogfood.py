import subprocess,os,json,time
from pathlib import Path
root=Path(__file__).parent
binary='/Users/raillyhugo/Programming/vercel/agent-browser-1770-review/cli/target/debug/agent-browser'
env={**os.environ,'AGENT_BROWSER_NAMESPACE':'rg1770-323449d','AGENT_BROWSER_DEFAULT_TIMEOUT':'500'}
records=[]
def run(args,stdin=None,timeout=10):
 start=time.monotonic()
 try:
  p=subprocess.run([binary,'--session','review','--json',*args],env=env,input=stdin,text=True,capture_output=True,timeout=timeout)
  rec={'args':args,'elapsed':round(time.monotonic()-start,3),'exit':p.returncode,'stdout':p.stdout,'stderr':p.stderr}
 except subprocess.TimeoutExpired as e:
  rec={'args':args,'elapsed':round(time.monotonic()-start,3),'timeout':True,'stdout':str(e.stdout),'stderr':str(e.stderr)}
 records.append(rec);print(json.dumps(rec),flush=True);(root/'dogfood.json').write_text(json.dumps(records,indent=2))
 return rec
def setup(html):return run(['eval','--stdin'],'document.body.innerHTML='+json.dumps(html)+'; window.commits=0; window.enters=0; true')
setup('''<select id="native"><option value="us">United States</option><option value="ca">Canada</option></select>''')
run(['select','#native','Canada']);run(['eval','--stdin'],'({value:document.querySelector("#native").value})')
setup('''<input id="combo" role="combobox" aria-expanded="true" aria-controls="popup" aria-activedescendant="opt" value="C"><ul id="popup" role="listbox"><li id="opt" role="option" aria-selected="true">Canada</li></ul>''')
run(['eval','--stdin'],'''document.querySelector('#combo').onkeydown=e=>{if(e.key==='Enter'){window.commits++;e.target.value='Canada';e.target.setAttribute('aria-expanded','false');document.querySelector('#popup').hidden=true}}; document.querySelector('#combo').focus(); true''')
run(['select','#combo','Canada']);run(['eval','--stdin'],'''({value:document.querySelector('#combo').value, commits:window.commits, expanded:document.querySelector('#combo').getAttribute('aria-expanded')})''')
setup('''<button id="alias" role="combobox" aria-expanded="true" aria-controls="popup">Choose country</button><ul id="popup" role="listbox"><li id="opt" role="option" value="ca" aria-selected="false">Canada</li></ul>''')
run(['eval','--stdin'],'''document.querySelector('#opt').onclick=()=>{window.commits++;document.querySelector('#alias').textContent='Canada';document.querySelector('#alias').setAttribute('aria-expanded','false');document.querySelector('#popup').remove()}; true''')
run(['select','#alias','ca']);run(['eval','--stdin'],'''({text:document.querySelector('#alias').textContent,commits:window.commits})''')
setup('''<input id="combo" role="combobox" aria-expanded="true" aria-controls="popup" aria-activedescendant="opt" value=""><ul id="popup" role="listbox"><li id="opt" role="option" aria-selected="false">Canada</li></ul>''')
run(['eval','--stdin'],'''document.querySelector('#combo').onkeydown=e=>{if(e.key==='Enter')window.enters++}; setTimeout(()=>document.querySelector('#opt')?.remove(),2500);true''')
run(['select','#combo','Canada']);run(['eval','--stdin'],'({enters:window.enters,value:document.querySelector("#combo").value})')
run(['close'])
