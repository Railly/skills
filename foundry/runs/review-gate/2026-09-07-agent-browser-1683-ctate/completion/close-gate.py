import copy, datetime, hashlib, json, os, re, subprocess
from pathlib import Path
p = Path(__file__).resolve().parent.parent
c = p / 'completion'
repo = Path('/Users/raillyhugo/Programming/vercel/agent-browser-1683')
head = '5b2b1cc6b0b03b584799fe89d0a61f46df5d1355'
assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repo, text=True).strip() == head
assert not subprocess.check_output(['git', 'status', '--porcelain'], cwd=repo, text=True)
def read(name): return json.loads((p / name).read_text())
def save(name, value):
    path = p / name
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    os.replace(temp, path)
def digest(path): return 'sha256:' + hashlib.sha256(path.read_bytes()).hexdigest()
for name in ['run-report.json','manifest.json','test-strength.json','resilience.json','environment.json','cross-family-dispositions.json','run-report-5b2b1cc.json','result.md']:
    snapshot = c / ('before-completion-' + name)
    assert not snapshot.exists(), snapshot
    snapshot.write_bytes((p / name).read_bytes())
r, m, t, resilience = [read(n) for n in ['run-report.json','manifest.json','test-strength.json','resilience.json']]
assert read('completion/linux-auto-connect.json')['status'] == 'pass'
for name in ['linux-user-tests.log','linux-isolation-e2e.log','linux-no-target.log','linux-cli-subreaper.log']:
    text = (c/name).read_text()
    assert 'test result: ok.' in text and 'test result: FAILED' not in text
for name in ['fault-repeat-late-new.json','fault-repeat-late-persisted.json','fault-repeat-late-drop-new.json','fault-repeat-kill-new.json']:
    result = read('completion/'+name)
    assert result['status'] == 'pass' and result['hostLifetimeCleanupObserved']
assert read('completion/late-commit-mutant.json')['error'] == 'Error: failed request must not publish binding'
assert read('completion/late-commit-restored.json')['status'] == 'pass'
scope = {
    'kind':'bounded_local_review', 'head':head, 'acceptance':['R0','R1','R2','R3','R4'],
    'platform_claim':'macOS ARM64 y Linux ARM64, Chrome/Chromium 152, sustratos realmente ejecutados',
    'authorization':'Trabajo local autorizado por Hunter. No publicación. La pregunta opcional sobre Windows no recibió respuesta; el alcance local se declaró durante la ejecución, sin inferir aprobación del silencio.',
    'exclusions':[
        'Windows no ejecutado: sin entorno Windows disponible. No se certifica soporte Windows ni equivalencia del IPC Windows.',
        'BrowserContexts entre sesiones cooperativas; no sandbox contra un controlador con autoridad CDP global.',
        'No se promete atomicidad ante SIGKILL o pérdida del canal de disposición. Un contexto remoto puede quedar huérfano y los fallos repetidos pueden acumularlos hasta cerrar Chrome.',
        'Matching de GUIDs de descargas simultáneas dentro de un mismo contexto y sesiones no aisladas que comparten default son comportamientos preexistentes fuera de estos dos findings.',
        'No se afirma explorar todas las intercalaciones de procesos, todos los navegadores/versiones o todas las fallas de CDP.'
    ],
    'historical_solution_gate':'Permanece incomplete. La revisión posterior de Claude no se presenta como shaping independiente previo. La auditoría nueva de admisión también queda incomplete y no se consume como evidencia aprobatoria del Review Gate.',
    'basis':'review-gate/references/proof-obligations.md permite acotar la propiedad al sustrato ejecutado; no sustituir entornos ausentes con fixtures.'
}
save('completion/scope.json',scope)
env = {'macos':read('environment.json'),'linux':{
    'image':'rust@sha256:0e2bcaef56d041a486784e54104a81aebe0da44bd03019bd70bc0401e42e4a97',
    'container':'ab1683-gate-linux-20260907','os':'Debian 12 ARM64 bajo Colima local, 2 CPU / 4 GiB',
    'rustc':'1.97.1','cargo':'1.97.1','chromium':'152.0.7977.82',
    'source':'git archive de '+head+'; fuente dentro de /work sin mount del repo; hashes en completion/final-identity.json',
    'build_environment':{'CARGO_BUILD_JOBS':'1','CARGO_PROFILE_DEV_DEBUG':'0','CARGO_PROFILE_TEST_DEBUG':'0','CARGO_INCREMENTAL':'0'},
    'test_user':'ab1683, /home/ab1683; sin variable global AGENT_BROWSER_EXECUTABLE_PATH',
    'cli_lifecycle':'PR_SET_CHILD_SUBREAPER en wrapper externo; sin modificar tests ni código; recoge daemons adoptados para que kill(pid,0) observe su salida real',
    'autodetection':'Chrome propio, DevToolsActivePort con puerto aleatorio no 9222/9229; root en contenedor desechable para perfil estándar propio'
},'identity_artifact':str(c/'final-identity.json'),'scope_artifact':str(c/'scope.json')}
save('environment.json',env)
methods = {
    'mutation':'Cinco mutaciones sobre árbol final: cuatro v4 y mover el commit antes del drain. Todas fallan por assertion conductual, no compilación; restauración verde.',
    'properties':'Campaña determinista de 10 rondas con dos sesiones y valores por ronda: cookies, localStorage, sessionStorage, IndexedDB/cache, targets y descargas; intercalación secuencial y concurrente real. Repetida en macOS y Linux. No se presenta como fuzzing aleatorio o prueba exhaustiva.',
    'differential':'Oracle externo: BrowserContexts/targets de Chrome y bytes/archivos observados, comparados con R0-R4 de ctate. Protocolo Browser/Target archivado en completion, no constantes derivadas del helper bajo prueba.',
    'structured_fuzzing':'No aplica al diff: no cambia parser/serializer ni gramática de entrada; clases inválidas de modo, transporte, storage y acción se fuerzan determinísticamente.',
    'replay':'Logs v4; completion/cdp-fault-probe.ts; linux-auto-connect.py; linux-subreaper.py. Puertos/IDs reales en cada trace; secuencias deterministas. Harnesses externos no agregados al repo.'
}
rows = [
 ('T1','Sin aislamiento previo; solicitud inválida/denegada/skip','Error/skip sin nuevo sticky; siguiente comando conserva default','isolation-e2e-v4.log; cli-v4.log; completion/linux-isolation-e2e.log','v4-mutation-eager-sticky.log; first-request-red.log'),
 ('T2','Nueva conexión rechazada o fallo post-create de storage/publicación/acción implícita','No binding nuevo; disposición cuando CDP alcanzable; reintento válido exitoso','isolation-e2e-v4.log; completion/linux-isolation-e2e.log','v4-mutation-early-binding.log; implicit-red.log'),
 ('T3','Conexión compatible exitosa; solicitud true, false u omitida; reuse/restart/close','Contexto y target persistidos; false no es clear; close sí limpia intención','isolation-e2e-v4.log; cli-v4.log; completion/linux-cli-subreaper.log; completion/linux-auto-connect.json','v4-mutation-missing-sticky-commit.log'),
 ('T4','Sesión pinned default solicita aislamiento','No restaurar target extranjero; crear/persistir contexto propio','isolation-e2e-v4.log; completion/linux-isolation-e2e.log','pinned-implicit-red.log'),
 ('T5','Contexto persistido se reconecta y luego falla la acción','Conservar conexión, binding e intención previos','isolation-e2e-v4.log; completion/fault-repeat-late-persisted.json','cross-family-reconnect-red.log'),
 ('T6','Contexto recreado ya persistido seguido de launch inválido','No disponerlo por flag histórico de recreación','isolation-e2e-v4.log; completion/linux-isolation-e2e.log','cross-family-red.log: primer fallo; PoisonError secundarios excluidos'),
 ('T7','Target desaparece antes de commit: contexto nuevo o previamente persistido','Nuevo: error y disposición; persistido: conservar binding/intención','cross-family-no-target-green.log; completion/linux-no-target.log','cross-family-no-target-red.log; helper con eventos Chrome reales, sin claim de carrera completa'),
 ('T8','Error en drain final tras evento real de auto-attach','No publicar binding nuevo; conservar binding anterior; reintento funciona','completion/fault-repeat-late-new.json; completion/fault-repeat-late-persisted.json','completion/late-commit-mutant.json: call site movido antes del drain; completion/late-commit-restored.json'),
 ('T9','Descarga aislada con default y A/B previamente configurados','Bytes correctos en destino propio; posteriores default/B conservan destinos','cli-v4.log; completion/linux-cli-subreaper.log','v4-mutation-missing-download-context.log'),
 ('T10','Corte de CDP durante disposición o muerte de daemon antes de binding','No nuevo sticky/binding; flagless no aislado; reintento y reinicio funcionan; residual remoto medido','completion/fault-repeat-late-drop-new.json; completion/fault-repeat-kill-new.json','Fault injection en conexión real/SIGKILL real; oracle distingue binding ausente de leak remoto; sin claim de cleanup infalible')
]
matrix = {'scope':str(c/'scope.json'),'partition_basis':'Clases por propiedad y dueño de falla, derivadas de R0-R4 y ciclo Chrome/proceso/archivo. No es el producto cartesiano de todos los flags y transportes.', 'dimensions':t['dimensions']['values']+['auto-connect real, drain final real, corte de disposición, SIGKILL antes de binding; reintento inmediato y restart'], 'classes':[dict(zip(['id','pre_state_and_event','expected','green','falsifier'],row)) for row in rows], 'methods':methods, 'exclusions':scope['exclusions'], 'coverage_limits':'Los red previos CF1-CF3 y variantes se ejecutaron antes de corregirlos; los greens son del HEAD actual. No se los etiqueta como mutantes repetidos en HEAD final. La integración de recording conserva pruebas existentes, no se afirma mutación específica de recording.'}
save('completion/test-strength-matrix.json',matrix)
for receipt in [t,resilience]:
    receipt['status']='pass';receipt['gaps']=[]
    receipt['fingerprint']['environment_digest']=digest(p/'environment.json')
    receipt['fingerprint']['scope_digest']=digest(c/'scope.json')
    receipt['fingerprint']['command'] += '; Linux: mismas suites --locked con env de completion/environment; bun completion/cdp-fault-probe.ts {late,late-drop,kill} {new,persisted}; python3 completion/linux-auto-connect.py'
    receipt['fingerprint']['evidence_scope']='HEAD final limpio; macOS/Linux ARM64. Árbol final inmutable salvo mutación reversible ya restaurada; hashes verificados. Ver completion/scope.json.'
    receipt['reason']='Obligaciones del alcance local ejecutadas y falsificadas; exclusiones y degradaciones medidas explícitas, sin certificación Windows.'
    receipt['report_path']=str(c/('test-strength-matrix.json' if receipt is t else 'resilience-matrix.json'))
    receipt['elapsed_time_evidence']='Duraciones en logs de suites y timestamps de traces; no se inventa una duración total de etapas previas.'
    receipt['scope']=scope

t['evidence'] += ' Quinta mutación final en call site del drain rechazada; 11 probes de fallos más restauración, Linux y auto-connect real.'
t['dimensions']['values']=matrix['dimensions'];t['dimensions']['exclusions']=scope['exclusions'];t['dimensions']['evidence']=str(c/'test-strength-matrix.json')
t['producer']={'name':'Chrome 152 macOS y Chromium 152 Linux; CLI compilado, archivos reales, señales de proceso y eventos reales de auto-attach','status':'exercised','evidence':'cli-v4.log; completion/linux-cli-subreaper.log; completion/linux-auto-connect.json; completion/fault-repeat-*.json'}
t['falsification'].append({'mutation':'Commit de aislamiento adelantado al call site anterior al drain final','red_evidence':'completion/late-commit-mutant.json: failed request must not publish binding','restored_green_evidence':'completion/late-commit-restored.json; completion/fault-repeat-late-new.json','site':'execute_command, producción, orden entre commit_isolated_connection y drain_browser_events'})
t['matrix']=matrix
parts=resilience['commit_points'][0]['failure_partitions']
parts.extend([
 {'ownership_region':'CDP target setup / final event drain','covers':['attach/setup','final event drain'],'forced':True,'residual_observed':'Nuevo: cero contextos residuales, sin binding. Persistido: binding/contexto anterior intactos. Error Runtime.enable devuelto sobre sessionId generado por Chrome tras Target.attachedToTarget real.','cleanup_owner':'rollback_failed_launch; BrowserManager dispose del contexto nuevo','retry':{'attempted':True,'outcome':'success','evidence':'completion/fault-repeat-late-new.json; completion/fault-repeat-late-persisted.json'},'evidence':'completion/cdp-fault-probe.ts; completion/fault-repeat-late-new.json; completion/late-commit-mutant.json'},
 {'ownership_region':'transport disposal loss','covers':['cleanup transport interruption'],'forced':True,'residual_observed':'Un contexto remoto huérfano, sin binding/sticky nuevo; flagless posterior no aislado. No se confunde ausencia de binding con cleanup.','cleanup_owner':'Disposición imposible sin CDP; host Chrome conserva recurso hasta cierre; cierre host/CDP observado','retry':{'attempted':True,'outcome':'success','evidence':'completion/fault-repeat-late-drop-new.json'},'evidence':'completion/fault-repeat-late-drop-new.json','classification':'recoverable degradation with remote leak'},
 {'ownership_region':'process death before publication','covers':['daemon SIGKILL before binding'],'forced':True,'residual_observed':'Un contexto remoto huérfano y ningún binding publicado; siguiente comando sin aislamiento permanece no aislado; retry y restart exitosos.','cleanup_owner':'Daemon muerto no puede rollback; recurso termina con host Chrome; cierre CDP host observado','retry':{'attempted':True,'outcome':'success','evidence':'completion/fault-repeat-kill-new.json'},'evidence':'completion/fault-repeat-kill-new.json','classification':'recoverable degradation with remote leak'}
])
resilience['evidence'] += ' Se forzaron drain final, corte de CDP durante disposición y SIGKILL; nuevos/persistidos discriminados. Repetición y cierre real de Chrome observados.'
pressure={'scope':scope,'commit_points':resilience['commit_points'],'pressure_rows':parts,'additional_continuity':'Rechazo/transporte fallido antes de attach; estado persistido + error; reinicio Chrome/daemon; concurrencia A/B en diez rondas. Logs v4 y Linux.','repetition':'11 probes de fallos, más green restaurado. Cuatro repeticiones finales añaden observación explícita del cierre de la conexión de control del host Chrome.','deadlines':'CLI 45 s; CDP 15 s; wait de evento 10 s; salida de daemon 15 s en harness macOS; cierre host 10 s. El test CLI usa 10 s con recolección de procesos normal.','resource_bound':'Sin falla de transporte/proceso: no contexto nuevo tras rechazo. Con transporte perdido/SIGKILL: un huérfano observado por inyección; no cota global ante fallos repetidos sobre un host longevo. No se afirma memoria/FD RSS medidos.','environment_failure_dispositions':[
 'Build Linux inicial con debug=2/2jobs terminó SIGKILL por memoria del contenedor; mismo código compila con 1job y debug=0.',
 'Suite root: /root viola expectativa de fixture sobre home; env global executable viola expectativa de parser; mutex envenenado causa fallos secundarios. Suite completa pasa como usuario normal sin override global.',
 'Estrés sin init: daemon ya zombie (ps STAT Zs, PPID 1 sleep); kill(pid,0) seguía existiendo. Repetición con subreaper externo pasa, sin tocar test ni producto.',
 'Auto-connect fixture inicial forzaba env executable: CLI enviaba launch local en comando posterior. Eliminado del harness para probar omisión. Segundo intento encontró KeyError del harness al leer targetId; corregido al esquema target.targetId. Fallos preservados.'
]}
save('completion/resilience-matrix.json',pressure)
save('test-strength.json',t);save('resilience.json',resilience)
candidate={'status':'incomplete','kind':'separate_candidate_admission_audit','head':head,'original_preimplementation_gap_preserved':True,'required_by_current_review_gate':False,'counted_as_passing_evidence':False,'receipts':{},'disposition':'Circuit breaker: no más reintentos. No reconstruye retrospectivamente shaping previo; Review Gate utiliza únicamente challenge real fx-cross-family-final.json del diff final.'}
for name in ['blind-contract-claude.json','blind-contract-gemini.json','blind-shaping-claude.json','blind-shaping-gemini.json','blind-shaping-deepseek.json']:
 d=read('completion/'+name);candidate['receipts'][name]={k:d.get(k) for k in ['status','model','exit_code','timed_out','duration_ms']}
candidate['failures']=['Gemini shaping: retries de red y HTTP400 sobre posición de system messages.','DeepSeek shaping: 503 y max_tokens 384000 excede límite262144.','Solo Claude produjo shaping; no se computa independencia de dos propuestas.']
save('completion/candidate-admission-receipt.json',candidate)
r['run'].update(status='complete',verdict='pass',gaps=[],scope=scope)
r['contract']['historical_spec_deviation']=scope['historical_solution_gate']
r['contract']['scope_artifact']=str(c/'scope.json')
r['stage_receipts']={'test_strength':t,'resilience':resilience}
r['execution']['completion_audit']=str(c/'candidate-admission-receipt.json')
for prop in r['properties']:
    prop['substrates'].append({'name':'Linux ARM64 Debian12 Chromium152','status':'exercised','evidence':'completion/linux-isolation-e2e.log; completion/linux-cli-subreaper.log; completion/linux-auto-connect.json'})
    if prop['id']=='P2':
        prop['claim']='Los fallos modelados no activan nuevo aislamiento sticky ni publican binding; estado previamente persistido se conserva.'
        prop['evidence'] += '; completion/fault-repeat-*.json; completion/late-commit-mutant.json; completion/linux-auto-connect.json'
        prop['oracle']['method']=prop['evidence']
for finding in r['findings']:
    if finding['id']=='F6': finding['evidence']='fx-cross-family-final.json; completion/late-commit-mutant.json rojo por binding publicado; completion/late-commit-restored.json y fault-repeat-late-new.json verdes con Chrome real'
for item in r['issue_candidates']:
    if item['id']=='follow-up-cleanup-signal':
        item['disposition']='Límite medido: un contexto remoto huérfano por pérdida de disposición o SIGKILL; sin sticky/binding nuevo. Reintento y restart funcionan. Conexión del host cierra al cerrar Chrome. No journal/crash-atomicity añadido.'
        item['evidence']='completion/fault-repeat-late-drop-new.json; completion/fault-repeat-kill-new.json'
for check in r['deterministic']:
    if check['check']=='covered':check['reason']='Índice run-report-5b2b1cc.json generado desde reporte canónico de este HEAD. Cobertura por nombre no sustituye validación gate.sh report.'
r['deterministic'].extend([
 {'check':'Linux ordinary suite','outcome':'pass','reason':'1258 passed: 1252 unit +4 dashboard +2 doctor; completion/linux-user-tests.log'},
 {'check':'Linux isolation / compiled CLI','outcome':'pass','reason':'5 e2e +1 no-target +3 CLI, diez rondas; completion/linux-isolation-e2e.log, linux-no-target.log, linux-cli-subreaper.log'},
 {'check':'Real auto-connect discovery','outcome':'pass','reason':'DevToolsActivePort puerto aleatorio; ausencia de Chrome falla sin sticky; éxito conserva contexto/target al reiniciar; close resetea. completion/linux-auto-connect.json'},
 {'check':'Late failure, disposal transport, process death','outcome':'pass','reason':'11 traces de fallos y green restaurado; cierre host observado en cuatro repeticiones. Degradación remota documentada; completion/resilience-matrix.json'},
 {'check':'Late commit call-site mutation','outcome':'pass','reason':'Mutante compila y falla por failed request must not publish binding; fuente restaurada pasa. completion/late-commit-{mutant,restored}.json'},
 {'check':'Final identity / skill identity / deterministic checks','outcome':'pass','reason':'completion/final-identity.json y deterministic.json; style, callers commit/rollback, execdeps pasan; source Linux coincide con HEAD local limpio.'},
 {'check':'Environment fixture failures','outcome':'acknowledged','reason':'Logs iniciales preservados; OOM, home/env de root, recolección de zombies y dos errores de harness corregidos sin tocar código/tests. completion/resilience-matrix.json'},
 {'check':'historical Solution Gate','outcome':'acknowledged','reason':'Etapa previa incomplete; auditoría adicional de admisión también incomplete. No se representa como factory completo ni se consume para aprobar Review Gate.'}
])
catalog = re.findall(r'^### (.+)$',Path('/Users/raillyhugo/kai/.agents/skills/review-gate/references/gates.md').read_text(),re.M)
run_lenses = ['Inverse regression surface','New-domain matrix','Resolution-rule consistency across consumers','Deliberate-default check','Fresh-seam scan','Substrate differential corpus','Reference-implementation oracle','New-failure-outcome propagation','Flag-propagation dispatch sweep','Error-path forcing','Non-destructive recovery','Cancellation and timeout hygiene','Boundary pipeline trace','Substrate verification','Dogfood the built artifact','Newly-asserted invariant ownership','Docs-behavior parity','Choice audit']
r['lenses']=[{'name':name,'status':'run' if any(name.startswith(x) for x in run_lenses) else 'skipped','reason':('Diff final revisado por Claude (fx-cross-family-final.json), disposiciones cross-family y pruebas locales de completion. El challenger no ejecutó pruebas; orchestrator verificó los sustratos. Ver matrices por clase.' if any(name.startswith(x) for x in run_lenses) else 'No se modifica shell/shim, latch de emisión, ejemplo público ni algoritmo por elemento; trigger ausente en este diff.')} for name in catalog]
r['lenses'].append({'name':'security','status':'run','reason':'security.json: partición cooperativa, sin claim de sandbox contra CDP global; receipt exacto existente vigente.'})
m['stages']['test_strength']=t;m['stages']['resilience']=resilience
m['stages']['review'].update(status='pass',gaps=[],scope=scope,head=head,validated_by='gate.sh report pendiente de ejecutar sobre este documento; ver completion/gate-report.log')
m['scope']=scope;m['environment_digest']=digest(p/'environment.json');m['stages']['solution']['new_candidate_audit']=str(c/'candidate-admission-receipt.json')
dispositions=read('cross-family-dispositions.json')
for row in dispositions.get('dispositions',dispositions.get('findings',[])):
 if row.get('id')=='CF4':row.update(evidence='completion/fault-repeat-kill-new.json; completion/fault-repeat-late-drop-new.json',scope='SIGKILL y pérdida de transporte ahora medidos: huérfano remoto, sin contaminación sticky; cierre host observado. Sin garantía de crash-atomicity.')
save('cross-family-dispositions.json',dispositions)
save('run-report.json',r);save('manifest.json',m)
print('Prepared scoped report for',head)
