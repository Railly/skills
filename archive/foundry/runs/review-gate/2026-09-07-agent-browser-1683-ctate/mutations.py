from pathlib import Path
import subprocess, json
repo=Path("/Users/raillyhugo/Programming/vercel/agent-browser-1683")
out=Path("/tmp/ab-1683-review")
a=repo/"cli/src/native/actions.rs"
b=repo/"cli/src/native/browser.rs"
originals={a:a.read_text(),b:b.read_text()}
base=["cargo","test","--manifest-path","cli/Cargo.toml"]
cases=[
("eager-sticky",a,"    let skip_launch = skip_launch_action(action);","    state.isolate_context |= cmd.get(\"isolateContext\").and_then(Value::as_bool) == Some(true);\n    let skip_launch = skip_launch_action(action);",["test_isolation_invalid_launch_does_not_change_sticky_state","--","--test-threads=1"]),
("early-binding",a,"    if established && !isolated {","    if established {",["e2e_isolation_commits_only_after_successful_connection","--","--ignored","--nocapture","--test-threads=1"]),
("missing-sticky-commit",a,"        state.isolate_context = true;","",["e2e_isolation_commits_only_after_successful_connection","--","--ignored","--nocapture","--test-threads=1"]),
("missing-download-context",b,'        if let Some(context_id) = self.isolated_context_id() {\n            params["browserContextId"] = json!(context_id);\n        }',"",["--test","isolate_context_cli","isolated_downloads_preserve_other_context_destinations","--","--ignored","--nocapture","--test-threads=1"])
]
results=[]
try:
 for name,path,old,new,args in cases:
  assert originals[path].count(old)==1,(name,originals[path].count(old))
  path.write_text(originals[path].replace(old,new,1))
  try:
   with (out/("mutation-"+name+".log")).open("w") as log:
    result=subprocess.run(base+args,cwd=repo,stdout=log,stderr=subprocess.STDOUT,timeout=180)
   results.append({"mutation":name,"exit_code":result.returncode})
   print(name,result.returncode,flush=True)
  finally:
   path.write_text(originals[path])
finally:
 for path,text in originals.items(): path.write_text(text)
 (out/"mutations.json").write_text(json.dumps(results,indent=2)+"\n")
