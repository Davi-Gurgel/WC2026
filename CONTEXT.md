# World Cup 2026 Simulator

Domain language for the 2026 FIFA World Cup simulator: 48 teams, 12 groups, a
group stage, and a single-elimination knockout decided through to the final.
This file names the concepts the tournament engine (`lib/tournament/`) is built
around so that code, tests, and future refactors use one vocabulary.

## Language

### Knockout

**Bracket**:
The whole single-elimination structure that runs after the group stage — the
ordered winners' rounds plus the third-place playoff. Owns round progression
(which round is current, what comes next, when it is complete).
_Avoid_: knockout tree, mata-mata fields, the six match arrays.

**Knockout round**:
One stage of the bracket and its matches as a unit — Round of 32, Round of 16,
Quarter-finals, Semi-finals, Final. Each round holds half the matches of the
one before it. Modeled as `{ round: KnockoutRound; matches: Match[] }`.
_Avoid_: phase (phase is the tournament-wide state, not a single stage), level, tier.

**Third-place playoff**:
The consolation match between the two semi-final losers. Structurally a sibling
of the Final, not a link in the winners' chain — it lives beside the rounds,
never inside them.
_Avoid_: third-place round, bronze match.

**Round advancement**:
Producing the next knockout round from the played one: the winners are paired in
seeded order and assigned their FIFA match numbers. The first round (Round of 32)
is seeded from group results, not advanced from a prior round.
_Avoid_: next phase, generate bracket (too broad).
