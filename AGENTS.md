# NDB Idle agent instructions

Before changing this project, read [`docs/AGENT_GUIDE.md`](docs/AGENT_GUIDE.md).
It records the architectural boundaries, file philosophy, writing voice, visual rules,
progression terminology, testing expectations, and release workflow for NDB Idle.

An explicit user request overrides the guide. Otherwise, treat the guide as the default
for implementation and review. Treat current code and tests as more authoritative than
older descriptive documentation when they disagree.

## Progression tree maintenance

[`docs/PROGRESSION_TREE.md`](docs/PROGRESSION_TREE.md) is the canonical development map
for progression branching. Any change that adds, removes, renames, or retimes a Battle
unlock, quest prerequisite or reward, activity, NPC, special-room gate, material
dependency, system navigation item, convergence requirement, or progression endpoint
must update that tree in the same change.
