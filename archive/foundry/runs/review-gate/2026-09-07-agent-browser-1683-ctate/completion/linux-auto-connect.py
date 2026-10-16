import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import tempfile
import time

root = Path(tempfile.mkdtemp(prefix="ab1683-auto-"))
profile = Path("/root/.config/google-chrome")
binary = "/work/cli/target/debug/agent-browser"
sessions = ["auto-failed", "auto-isolated", "auto-default"]
events = []
chrome = None
result = {}
assert not profile.exists(), "discovery profile must be owned exclusively by this probe"


def command(session, args, success=True):
    env = {key: value for key, value in os.environ.items() if not key.startswith("AGENT_BROWSER_")}
    env["AGENT_BROWSER_SOCKET_DIR"] = str(root)
    env["NO_COLOR"] = "1"
    proc = subprocess.run(
        [binary, "--session", session, *args, "--json"],
        env=env, cwd="/work", capture_output=True, text=True, timeout=45,
    )
    response = json.loads(proc.stdout) if proc.stdout.strip() else {}
    events.append({"session": session, "args": args, "exit": proc.returncode, "response": response, "stderr": proc.stderr})
    if success:
        assert proc.returncode == 0 and response.get("success"), events[-1]
    return proc.returncode, response


def binding(session):
    path = root / (session + ".target")
    return json.loads(path.read_text()) if path.exists() else None


def stop_daemon(session):
    pid = int((root / (session + ".pid")).read_text())
    os.kill(pid, signal.SIGTERM)
    deadline = time.monotonic() + 10
    while (root / (session + ".pid")).exists():
        assert time.monotonic() < deadline, "daemon shutdown deadline"
        time.sleep(0.05)


try:
    status, response = command("auto-failed", ["--auto-connect", "--isolate-context", "open", "about:blank"], False)
    assert status != 0 and "No running Chrome" in response.get("error", ""), response
    assert binding("auto-failed") is None
    profile.mkdir(parents=True)
    log = open(root / "chrome.log", "w")
    chrome = subprocess.Popen(
        ["/usr/bin/chromium", "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
         "--remote-debugging-port=0", "--user-data-dir=" + str(profile), "about:blank"],
        stdout=log, stderr=log,
    )
    deadline = time.monotonic() + 15
    while not (profile / "DevToolsActivePort").exists():
        assert chrome.poll() is None, (root / "chrome.log").read_text()
        assert time.monotonic() < deadline
        time.sleep(0.05)
    active_port = (profile / "DevToolsActivePort").read_text().splitlines()
    assert int(active_port[0]) not in [9222, 9229], "must exercise profile discovery, not common-port fallback"
    command("auto-failed", ["--auto-connect", "--pin-tab", "open", "about:blank"])
    assert "browserContextId" not in binding("auto-failed"), binding("auto-failed")
    stop_daemon("auto-failed")
    command("auto-failed", ["--auto-connect", "open", "about:blank"])
    assert "browserContextId" not in binding("auto-failed"), binding("auto-failed")

    command("auto-isolated", ["--auto-connect", "--isolate-context", "open", "about:blank"])
    original = binding("auto-isolated")
    assert original.get("browserContextId"), original
    command("auto-isolated", ["eval", "globalThis.autoProbe = 'retained'"])
    command("auto-isolated", ["get", "url"])
    assert binding("auto-isolated")["browserContextId"] == original["browserContextId"]
    stop_daemon("auto-isolated")
    command("auto-isolated", ["--auto-connect", "open", "about:blank"])
    restored = binding("auto-isolated")
    assert restored["browserContextId"] == original["browserContextId"]
    assert restored["target"]["targetId"] == original["target"]["targetId"]
    command("auto-isolated", ["close"])
    assert binding("auto-isolated") is None
    command("auto-isolated", ["--auto-connect", "--pin-tab", "open", "about:blank"])
    assert "browserContextId" not in binding("auto-isolated")
    result = {"status": "pass", "producer": "Chromium real DevToolsActivePort", "port": int(active_port[0]), "isolated_binding": original, "restored_binding": restored}
except Exception as error:
    result = {"status": "fail", "error": repr(error)}
finally:
    for session in sessions:
        try:
            command(session, ["close"], False)
        except Exception:
            pass
    if chrome is not None:
        chrome.terminate()
        try:
            chrome.wait(timeout=10)
        except subprocess.TimeoutExpired:
            chrome.kill()
            chrome.wait()
    shutil.rmtree(profile, ignore_errors=True)
    Path("/evidence/linux-auto-connect.json").write_text(json.dumps({**result, "events": events}, indent=2) + "\n")
    shutil.rmtree(root, ignore_errors=True)
print(json.dumps(result))
raise SystemExit(0 if result.get("status") == "pass" else 1)
