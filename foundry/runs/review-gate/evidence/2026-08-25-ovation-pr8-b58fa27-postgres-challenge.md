# Independent PostgreSQL challenge for Ovation PR #8

Exact head: `b58fa273ab0de0a5f6c7248dae080c325375a2af`

Substrate: PostgreSQL at `127.0.0.1:5433`, disposable database `ovation_factory_20260825_b58fa27`.

The challenge source was defined from the durable publication contract, not implementation branches:

1. Starting from one accepted item, two concurrent item publications must leave all three identities visible.
2. A stale issues-page continuation must not overwrite pull-request display fields accepted by a newer page.
3. A calculation from an old reset generation must not publish even if its staging rows remain.
4. A caller failure after committed item publication must allow an immediate retry with one coherent accepted report.
5. A live GitHub REST pull request must survive conversion, publication, and report readback.

Observed results:

- Exact implementation: all obligations pass.
- Without the item row lock: one row observed instead of three under the bad interleaving.
- Without the page continuation fence: the accepted PR branch becomes undefined.
- Without generation and active-calculation fences: the old calculation publishes.
- Simulated caller failure after commit followed by immediate retry: pass, latest comments value retained, one item returned.
- Live `vercel-labs/ovation` PR #8 through PostgreSQL: pass.
- Store suite repeated 25 times without failure.

Mutation and boundary evidence SHA-256:

- Lock red: `5970fe53e36bda43933ca5face8463cceb5744c741c7827e143a7e8a17cc7555`
- Lock green: `dd8e8bc8811a4be6eaf5783c233daca0f03783b9278c41aed275c419c1c36136`
- Stale red: `8f5023bfcf0d83eb5d93d5fa94502bc5d3301480b87500515005dab7e12729bb`
- Stale green: `635405397fef0db1c3dad5096321a5890feb9423d26da7105fe8585c492b8a1c`
- Authority red: `207353af537442e189d011c8c2ed26101c68d320ca4774ecc9cd83e393462650`
- Authority green: `4e7a79a34877619f0eab8d21bc9310de06e3f5c037cd3f02a57f956fd0c1c057`
- Live GitHub issue fixture: `bb824aea0ae419b282ae3b2c76bdf78c8ea71ef7809c71a54c33de983e392767`
- Live GitHub pull fixture: `a489841bf5206f3ecefc48207d87985d512db37c1ae62c315b0e580a4d643aee`
- Live boundary result: `b5b776605de3b2ff5cb5e7820066509649fa3c55205d3e729cd7f192f759ad05`
