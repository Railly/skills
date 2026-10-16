from pathlib import Path
import subprocess,json,hashlib
out=Path(__file__).parent
base=['agent-browser','--session','issue-graph-pr-gate','--json']
def run(args,script=None):
 p=subprocess.run(base+args,input=script,text=True,capture_output=True,timeout=40)
 if p.returncode: raise RuntimeError(p.stdout+p.stderr)
 return json.loads(p.stdout)['data']
def ev(script): return run(['eval','--stdin'],script).get('result')
def geometry(): return ev("(() => {const p=document.querySelector('.ig-demo-panel:not([hidden])'); return {width:innerWidth,pageWidth:document.documentElement.scrollWidth,id:p.dataset.example,client:p.clientHeight,scroll:p.scrollHeight,overscroll:getComputedStyle(p).overscrollBehavior};})()")
def page_down(expect_movement=True):
 run(['focus','.ig-demo-panel:not([hidden])'])
 ev("document.querySelector('.ig-demo-panel:not([hidden])').scrollIntoView({block:'center'});window.__scrollBefore={page:scrollY,panel:document.querySelector('.ig-demo-panel:not([hidden])').scrollTop}")
 run(['press','PageDown'])
 if expect_movement:
  run(['wait','--fn',"scrollY!==window.__scrollBefore.page || document.querySelector('.ig-demo-panel:not([hidden])').scrollTop!==window.__scrollBefore.panel"])
 else:
  ev("new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))")
 return ev("({before:window.__scrollBefore,after:{page:scrollY,panel:document.querySelector('.ig-demo-panel:not([hidden])').scrollTop}})")
run(['open','http://127.0.0.1:3437'])
run(['wait','.ig-demo'])
results=[]
try:
 for width in [1440,640,390,320]:
  run(['set','viewport',str(width),'1000' if width>=640 else '844'])
  run(['wait','--fn',f'innerWidth === {width}'])
  for identity in ['graph','status','plan']:
   run(['focus',f"[role=tab][aria-controls$='-panel-{identity}']"])
   run(['press','Enter'])
   run(['wait','--fn',f"document.querySelector('.ig-demo-panel:not([hidden])').dataset.example === '{identity}'"])
   green=geometry()
   assert green['pageWidth']==width and green['client']==green['scroll'] and green['overscroll']=='auto',green
   ev("(() => {const s=document.createElement('style');s.id='review-gate-old-scroll';s.textContent='.ig-demo-frame{height:480px!important}.ig-demo-panel{flex:1!important;min-height:0!important;overflow:auto!important;overscroll-behavior:contain!important}';document.head.append(s);})()")
   red=geometry()
   assert red['overscroll']=='contain',red
   bad_input=None
   if width==390 and identity=='graph':
    bad_input=page_down(False)
    assert bad_input['after']['page']==bad_input['before']['page'],bad_input
   ev("document.getElementById('review-gate-old-scroll').remove()")
   restored=geometry()
   assert restored['client']==restored['scroll'] and restored['overscroll']=='auto',restored
   good_input=page_down() if width==390 else None
   if good_input: assert good_input['after']['page']>good_input['before']['page'] and good_input['after']['panel']==0,good_input
   results.append({'green':green,'oldCss':red,'restored':restored,'oldCssInput':bad_input,'restoredInput':good_input})
finally:
 ev("document.getElementById('review-gate-old-scroll')?.remove()")
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
(out/'browser-falsification.json').write_text(json.dumps({'head':head,'mutation':'Restore baseline CSS sizing, overflow, and containment in an ephemeral browser stylesheet, then remove it. Product files unchanged.','cases':results},indent=2)+'\n')
print('PASS 12 green/red/restored CSS cases, old-CSS PageDown failure, restored PageDown in all 3 tabs')
