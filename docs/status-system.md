# Status System

## Status flow

```
locked → [auto] unlocked → in_progress → completed → mastered
```

| Status | Stored | How |
|---|---|---|
| `locked` | ✅ | Default; prerequisites not met |
| `unlocked` | ❌ computed | All prerequisites are `completed` or `mastered` |
| `in_progress` | ✅ | User manually started |
| `completed` | ✅ | All progressions done (or manual) |
| `mastered` | ✅ | Confirmed mastery via double-click modal |

`unlocked` is **never stored** — it is derived at runtime from the prerequisite graph.

---

## `isSkillUnlocked(skillId)` — `useSkillStore`

```ts
skillStore.isSkillUnlocked('front-lever') // → true | false
```

Rules:
- Skill not found → `false`
- `skill.requires` is empty/null → `true` (no prerequisites)
- `progressGetter` not set yet → `false`
- Otherwise: every `reqId` in `requires` must have status `completed` or `mastered`

The `UNLOCKED_PREREQ_STATUSES = ['completed', 'mastered']` constant is exported from `useProgressStore` to keep the definition in one place.

---

## Guard modal (SkillDetail)

When a user tries to set a **locked** skill (prerequisites not met) to `in_progress`:

1. `onStatusChange` detects: `val === 'in_progress' && stored === 'locked' && !isUnlocked`
2. `showGuardModal = true` — lists unmet prerequisites with their current statuses
3. **Confirm** → `setStatus('in_progress')` + toast (proceeds despite missing prereqs)
4. **Cancel** → reverts `<select>` via `selectKey++`

Note: When a skill IS unlocked (all prereqs met), going to `in_progress` requires no confirmation.

---

## Visual representation

### Status badge (SkillDetail header)

`displayStatusKey` computed provides the visual alias:

```ts
stored === 'locked' && isUnlocked → display as 'unlocked' (teal badge, lock-open icon)
otherwise                          → display stored status
```

### SkillNode (graph)

| Condition | `borderColor` | `bgColor` tint | `opacity` | glow |
|---|---|---|---|---|
| `locked` (default) | `--status-locked` | locked 12% | 0.6 | none |
| `locked` + `isUnlocked` | `--status-unlocked` | unlocked 8% | 0.85 | teal |
| `in_progress` | `--status-in-progress` | blue 12% | 1.0 | blue |
| `completed` | `--status-completed` | green 12% | 1.0 | green |
| `mastered` | `--status-mastered` | gold 12% | 1.0 | gold |

### SkillEdge — `resolveEdgeVariant`

| Parent → Child | Variant | Visual |
|---|---|---|
| `locked` → any | `locked_dashed` | gray dashed, 0.25 opacity |
| any → `locked` | `locked_solid` | gray solid, 0.4 opacity |
| completed/mastered → `unlocked` | `available` | teal pulse, 1.5px, 0.65 opacity |
| `in_progress` → any | `in_progress` | blue with particle |
| `completed` → `completed` | `completed` | green |
| `mastered` → `mastered` | `mastered` | gold shimmer |
| `mastered` → `completed` | `mastered_to_completed` | gold→green gradient |

### Fill bar edge case

Skills with **no progressions defined** (`progressions = null | []`):
- `completed` or `mastered` → fill bar renders at **100%**
- Any other status → fill bar hidden (0%)

Applies to both `SkillNode.vue` (`fillWidth` computed) and `SkillList.vue` (`getProgressFill`).
