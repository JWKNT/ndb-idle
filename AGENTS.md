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

## Original technical writing

Use ASD-STE100 Issue 9 for original explanatory text, instructions, and interface text.
Read `../site-theme/docs/WRITING-STYLE.md` before a prose change.
Preserve imported reader text, translations, quotations, proper titles, and legal text.
Preserve formulas, formal statements, identifiers, data, and technical meaning.
Preserve NDB fictional dialogue, story text, and item descriptions.
Edit the source of generated pages, then rebuild and test them.
Report the checks performed. Do not claim full compliance without a dictionary and rule review.
