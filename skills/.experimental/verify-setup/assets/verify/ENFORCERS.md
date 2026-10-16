# Enforcers

Every rule an agent must follow in this repo, and the script that fails when it is broken. A rule with no enforcer is a wish.

| Rule | Enforcer | Origin |
|---|---|---|
| A change is done only after its feature is observed on the real surface | `fresh.sh` (Stop hook) | verify-setup |
