import ctypes, os, subprocess, sys
assert ctypes.CDLL(None, use_errno=True).prctl(36, 1, 0, 0, 0) == 0
child = subprocess.Popen(sys.argv[1:])
while True:
    pid, status = os.waitpid(-1, 0)
    if pid == child.pid:
        raise SystemExit(os.waitstatus_to_exitcode(status))
