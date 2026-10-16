import os, subprocess, json, time
from pathlib import Path
run = Path('/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-09-agent-browser-1770-323449d')
binary = '/Users/raillyhugo/Programming/vercel/agent-browser-1770-review/cli/target/debug/agent-browser'
env = dict(os.environ, AGENT_BROWSER_NAMESPACE='rg1770-independent-20260909', AGENT_BROWSER_SESSION='independent', AGENT_BROWSER_DEFAULT_TIMEOUT='700')
records = []
def call(*args, script=None):
    start=time.monotonic()
    p=subprocess.run([binary, '--json', *args],input=script,text=True,env=env,capture_output=True,timeout=12)
    row=dict(args=args,script=script,elapsed=round(time.monotonic()-start,3),exit=p.returncode,stdout=p.stdout,stderr=p.stderr)
    records.append(row)
    print(json.dumps(row))
    run.joinpath('independent-dogfood.json').write_text(json.dumps(records,indent=2)+'\n')
    return row
try:
    call('eval','--stdin',script='''document.body.innerHTML = `<input id="combo" role="combobox" aria-expanded="false" aria-controls="popup" autocomplete="off" value="Red"><div id="popup" role="listbox" hidden></div>`;
    window.commits=[]; window.inputs=[];
    const combo=document.getElementById('combo'), popup=document.getElementById('popup');
    function render(){ inputs.push(combo.value); popup.hidden=false; popup.innerHTML=combo.value==='Blue'? '<div role="option" value="blue" aria-selected="false">Blue</div>':''; const option=popup.firstElementChild; if(option) option.onclick=()=>{commits.push('blue');option.setAttribute('aria-selected','true');combo.setAttribute('aria-expanded','false')}; }
    combo.onclick=()=>{combo.setAttribute('aria-expanded','true');render()};combo.oninput=render; true''')
    call('select','#combo','Blue')
    call('eval','--stdin',script='({value:combo.value,commits,inputs})')
    call('eval','--stdin',script='''document.body.innerHTML = `<input id="filtered" role="combobox" aria-expanded="false" aria-controls="filtered-popup" autocomplete="off"><div id="filtered-popup" role="listbox" hidden></div>`;
    window.filteredCommits=[];
    const filtered=document.getElementById('filtered'), fp=document.getElementById('filtered-popup');
    function filteredRender(){fp.hidden=false; fp.innerHTML=filtered.value==='Blue'? '<div role="option" value="blue" aria-selected="false">Blue</div>':'';const option=fp.firstElementChild;if(option)option.onclick=()=>{filteredCommits.push('blue'); filtered.value=option.textContent; filtered.setAttribute('aria-expanded','false');fp.replaceChildren();fp.hidden=true};}
    filtered.onclick=()=>{filtered.setAttribute('aria-expanded','true');filteredRender()}; filtered.oninput=filteredRender;true''')
    call('select','#filtered','Blue')
    call('eval','--stdin',script='({value:filtered.value,commits:filteredCommits,expanded:filtered.getAttribute("aria-expanded"),options:document.getElementById("filtered-popup").children.length})')
finally:
    call('close')
