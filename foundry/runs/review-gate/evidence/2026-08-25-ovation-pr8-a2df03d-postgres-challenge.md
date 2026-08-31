# Independent PostgreSQL challenge for Ovation PR #8

Exact head: `a2df03dac1315e975ed320fb6aa7f5f19b482436`

Substrate: PostgreSQL at `127.0.0.1:5433`, disposable database `ovation_factory_20260825_4005777`.

The challenge source was defined from the durable publication contract, not from implementation branches:

1. Starting from one accepted item, two concurrent item publications must leave all three identities visible.
2. A stale issues-page continuation must not overwrite pull-request display fields accepted by a newer page.
3. A calculation from an old reset generation must not publish even if its staging rows remain.
4. A caller failure after a committed item publication must allow an immediate retry with one coherent accepted report.
5. A live GitHub REST item must survive conversion, publication, and report readback.

Observed results:

- Exact implementation: all obligations pass.
- Without the item row lock: 2 rows observed instead of 3.
- Without the page continuation fence: the accepted PR branch becomes undefined.
- Without generation and active-calculation fences: the old calculation publishes.
- Simulated caller failure after commit followed by immediate retry: 1 pass, latest comments value 2, one item returned.
- Live `vercel-labs/ovation` REST item through PostgreSQL: 1 pass.
- Store suite repeated 25 times without a failure.

Mutation and boundary evidence SHA-256:

- Lock red: `4e3e3190126c91682f3e1762a31b8a8b9d7341aeb702e92ec694c1ebab0ff965`
- Lock green: `9f70130b248c5648c6088a4f306d581247bb39d76c48311d3d0d90f843ba2e38`
- Stale red: `9881a0c78dc7df750da3f46687761648971565fa57be6ab4708015bd8e18470c`
- Stale green: `799ab76b49e05232013aca2922cc10df1821ba665b95bbfde03060d889ecae93`
- Authority red: `42edf4c8682b8782e402bb4c09212b9b7f0fbac3dc4cab99b167510dbece0132`
- Authority green: `bf8803c4af1f704046b20d811a7d969ddae704330f20de60f5a9a6592fb60d16`
- Live GitHub fixture: `4667b411260e18334da702473441c8ac88cb05ff949e85dc904674aed96ed253`
- Live producer result: `72af121bdc4cbb1d32d4d3454fb83f73b6700b1a1e939b5ec41ab8d6819f89b2`
