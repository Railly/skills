# Independent PostgreSQL challenge for Ovation PR #8

Exact head: `297e5a14179e6e20d482121340aad219554d1d5f`

Base: `99e0364b518a12c1abb7216930ec9c81bf8bcccb`

Substrate: PostgreSQL 16 at `127.0.0.1:5433`, disposable databases named `ovation_pr8_*_20260825`.

The challenge source came from durable publication and coverage properties rather than production branches:

1. Starting from one accepted item, two concurrent item publications must leave all three identities visible.
2. A stale issues-page continuation must not overwrite pull-request display fields accepted by a newer page.
3. A calculation from an old reset generation must not publish.
4. A partial report must not be presented as every open issue and pull request.
5. A caller failure after committed publication must allow immediate retry with one coherent report.
6. A live GitHub pull request must survive conversion, publication, and report readback.

Observed results:

- Exact implementation: all obligations pass.
- Without the item row lock: 1 item observed instead of 3.
- Without the stale-page continuation fence: accepted PR branch becomes undefined.
- Without generation and active-calculation fences: old generation publishes.
- Without the partial UI branch: the UI contract test fails.
- Simulated caller failure after commit followed by immediate retry: pass, one partial pull-request report returned.
- Live `vercel-labs/ovation` PR #8 through PostgreSQL: pass.
- Store suite repeated 25 times at exact head: pass.

Evidence SHA-256:

- Lock red: `f8075da04685396faef1d3d5aef2b14f0061c3c7da914bd2d6b23316e6f9e3f8`
- Lock green: `d006d06b812ab8f6f3710a4a7a08721a73177ce995d328298387e84c0d2d5764`
- Stale red: `148795264ffa5bab5a4e75b1804b01e1db495be72ed880ef657a62e16a69d5b0`
- Stale green: `2b46b2a16846792fe8dfd2b928334410ffdd1abdd1e6399717f469ce360f9e08`
- Authority red: `75d681419c5bede82f03d7d338184b48a583a7524d6fdb732c46f0657d13f141`
- Authority green: `6d77748ae1197b515c6758e8a574e30ec52dbefc95bac3bcec39701b758bcecd`
- Partial-copy red: `f6e8428f186fff92efaf958c7f5bdb7dfc226c8e161f5c7b10081885e34fbc65`
- Partial-copy green: `de3217aac130821a5d1df41f7958a7f1b5abe5ebb21f94051ceddb4c14f45486`
- Live GitHub issue fixture: `ceb4a56713f3ca8c46abb5e236c2b1e96ca1843ed706b9bd5b8fe3647b45d152`
- Live GitHub pull fixture: `a67618a48932e717101f7198be7e52ad8001d843bfceba35edfbe53696c45256`
- Live boundary result: `3b349b56d8cf6157fc2ee21dda6a9fb868b3ced548ac0a4f6cb75b4ce450ff91`
- Full web suite: `a56500bd3147c24fbe38c0b5dfaff0caeaeb4aac4e12fe8c6ff47501c1bd5fd0`
- Production build: `cc705cbc71960682e56aedfffb191f0b846655b051f9f41efa7da4c4d7f1eb40`
