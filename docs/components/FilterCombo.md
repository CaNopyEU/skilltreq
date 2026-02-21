# FilterCombo

Custom cross-platform dropdown filter component. Replaces native `<select>` and checkbox lists to ensure consistent appearance on Mac and Windows.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | — | Uppercase label shown left of the trigger |
| `options` | `FilterOption[]` | — | List of selectable options |
| `modelValue` | `string \| string[]` | — | Single value (single mode) or array (multi mode) |
| `multi` | `boolean` | `false` | Enables multi-select with checkboxes |
| `placeholder` | `string` | `'All'` | Text shown when nothing is selected (multi) or value is `'all'` (single) |

### `FilterOption`

```ts
interface FilterOption {
  value: string
  label: string
  color?: string  // hex — renders as colored dot (used for categories)
  meta?: string   // right-aligned text (used for category tracker: "3/8 ★1")
}
```

## Usage

### Single select (Sport, Type, Status)

```vue
<FilterCombo
  label="Sport"
  :options="[
    { value: 'all', label: 'All' },
    { value: 'calisthenics', label: 'Calisthenics' },
  ]"
  :model-value="store.sportFilter"
  @update:model-value="store.sportFilter = $event as 'all' | 'calisthenics' | 'acrobatics'"
/>
```

- Trigger shows the selected option label ("All" / "Calisthenics" / …)
- Selecting an option closes the dropdown automatically
- Trigger highlight (`border-color: blue`) when value is not `'all'`

### Multi select (Category)

```vue
<FilterCombo
  label="Category"
  :options="categoryOptions"
  :model-value="store.categoryFilter"
  :multi="true"
  @update:model-value="store.categoryFilter = $event as string[]"
/>
```

- Trigger shows: "All" (empty), single option label, or "N selected"
- Dropdown stays open; close by clicking outside or pressing Escape
- Each option has a checkbox
- Category options include `color` dot and `meta` tracker (`"3/8 ★2"`)

## Behaviour

- **Outside click**: closes dropdown (capture-phase listener on `document`)
- **Escape key**: closes dropdown
- **Active styling**: trigger border turns blue when a non-default filter is active
  - Single: any value other than `''` or `'all'`
  - Multi: array has ≥1 item
- **Dropdown width**: `min-width: 100%` of trigger, grows with content
- **Z-index**: 200 (above filter panel and most UI)
