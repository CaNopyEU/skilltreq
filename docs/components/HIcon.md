# HIcon

Wrapper komponent pre [Heroicons](https://heroicons.com) (`@heroicons/vue/20/solid`). Auto-importovaný Nuxtom — žiadny explicitný import v komponentoch nie je potrebný.

## Props

| Prop | Typ | Default | Popis |
|---|---|---|---|
| `name` | `IconName` | — | Názov ikony (required) |
| `size` | `number` | `16` | Veľkosť v px (width + height) |

## Dostupné ikony (`IconName`)

| Name | Heroicon | Použitie |
|---|---|---|
| `lock-closed` | LockClosedIcon | Status: locked |
| `bolt` | BoltIcon | Status: in_progress |
| `check-circle` | CheckCircleIcon | Status: completed, toast success |
| `star` | StarIcon | Status: mastered, final step, mastery prompt |
| `x-mark` | XMarkIcon | Close button |
| `x-circle` | XCircleIcon | Toast error |
| `chevron-up` | ChevronUpIcon | SkillList accordeon |
| `chevron-down` | ChevronDownIcon | SkillList accordeon |
| `arrow-right` | ArrowRightIcon | Relation navigácia |
| `arrow-top-right-on-square` | ArrowTopRightOnSquareIcon | Externé tutorialy |
| `information-circle` | InformationCircleIcon | Toast info |
| `exclamation-triangle` | ExclamationTriangleIcon | Toast warning |
| `check` | CheckIcon | Všeobecný checkmark |

## Príklady

```vue
<!-- Status badge -->
<HIcon :name="statusIconName[progress.status]" :size="11" />

<!-- Close button -->
<HIcon name="x-mark" :size="16" />

<!-- Navigation arrow -->
<HIcon name="arrow-right" :size="12" class="drawer__rel-arrow" />
```

## Rozšírenie

Pre pridanie novej ikony:
1. Pridaj import do `components/HIcon.vue`
2. Pridaj záznam do `iconMap`
3. Rozšír `IconName` union type
4. Zdokumentuj tu

## Poznámky

- `color: currentColor` — ikona dedí farbu z CSS `color` vlastnosti rodiča
- `display: inline-block; verticalAlign: middle` — správne zarovnanie inline
- Tree-shakeable — bundlujú sa len explicitne importované ikony
