#!/bin/sh
set -eu
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends chromium ca-certificates python3
rustc --version
cargo --version
chromium --version
mkdir -p /work
