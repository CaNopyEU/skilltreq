# Dark Mode — kontrast a CSS vars

## Farebná hierarchia textu

Všetky farby textu sú definované v `assets/css/main.css` ako CSS custom properties. Komponenty používajú výhradne CSS vars (nie hardcoded hex), čo umožňuje automatický prepínač.

### Hodnoty

| Var | Light | Dark | Použitie |
|---|---|---|---|
| `--text-primary` | `#0a0a18` | `#e4e4f0` | Nadpisy, primárny obsah |
| `--text-secondary` | `#3a3a58` | `#b0b0d0` | Sekundárny text, rel items |
| `--text-body` | `#585880` | `#9090c0` | Popisy, telo textu |
| `--text-muted` | `#8080a8` | `#7878b0` | Count badges, close button |
| `--text-faint` | `#b0b0cc` | `#6060a0` | Labels, section titles, chevrons, D-badges |

### Kde sa `--text-faint` používa (kritické miesta)
- `FilterPanel.vue` — labels „View", „Sport", „Category", „Status"
- `SkillDetail.vue` — `.drawer__label`, `.drawer__section-title`, `.drawer__rel-arrow`
- `SkillList.vue` — `.skill-list__chevron`, `.skill-list__diff` (D1-D9 badge)

## color-scheme: dark

`.dark { color-scheme: dark; }` je nastavené v `main.css`. Toto umožňuje prehliadaču správne renderovať natívne form elementy (`select`, `input[type=checkbox]`, `textarea`) v dark mode — vrátane dropdown opcií a scrollbarov.

## Čo nepoužívať

- **Nikdy nepoužívaj hardcoded farby pre text** (okrem špecifických prípadov ako `color: #1a0a00` na gold mastered badge — tmavý text na svetlom pozadí).
- Vždy `color: var(--text-*)` podľa hierarchie.

## História zmien

| Verzia | Zmena |
|---|---|
| Iter. 2 | Opravené `--text-faint`, `--text-muted`, `--text-body`, `--text-secondary` v dark mode + pridané `color-scheme: dark` |
