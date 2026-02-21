# BaseModal

Generický modálny komponent. Používa `<Teleport to="body">` a `<Transition>`. Zavára sa na ESC alebo kliknutím na backdrop.

## Props

| Prop | Typ | Default | Popis |
|---|---|---|---|
| `open` | `boolean` | — | Riadi viditeľnosť modalu (required) |
| `title` | `string` | — | Text nadpisu v hlavičke |
| `confirmLabel` | `string` | — | Text confirm buttonu; ak nie je nastavený, footer s buttonmi sa nezobrazí |
| `cancelLabel` | `string` | `'Zrušiť'` | Text cancel buttonu |
| `confirmVariant` | `'primary' \| 'danger'` | `'primary'` | Farba confirm buttonu |
| `width` | `string` | `'380px'` | Šírka modalu |

## Emits

| Event | Popis |
|---|---|
| `close` | Backdrop klik alebo ESC |
| `confirm` | Confirm button klik |
| `cancel` | Cancel button klik (vždy emituje aj `close`) |

## Sloty

| Slot | Popis |
|---|---|
| `default` | Telo modalu |
| `header` | Nahradí celú hlavičku (vrátane `title`) |
| `footer` | Nahradí celý footer (vrátane default buttonov) |

## Príklady

### Confirmation modal
```vue
<BaseModal
  :open="showConfirm"
  title="Potvrdiť akciu"
  confirm-label="Potvrdiť"
  confirm-variant="danger"
  @confirm="onConfirm"
  @close="showConfirm = false"
>
  Naozaj chceš pokračovať?
</BaseModal>
```

### Info modal bez buttonov
```vue
<BaseModal :open="showInfo" title="Info" @close="showInfo = false">
  <p>Nejaká informácia.</p>
</BaseModal>
```

### Vlastný footer
```vue
<BaseModal :open="open" @close="open = false">
  <template #footer>
    <button @click="open = false">Zatvoriť</button>
  </template>
  Obsah modalu.
</BaseModal>
```

## Poznámky

- Z-index: `300` (nad FilterPanel, PrereqModal má `200`)
- `BaseModal` môže koexistovať s `PrereqModal` — `PrereqModal` bude postupne nahradený alebo refaktorovaný na `BaseModal`
- Komponentové (DOM) testy pre `BaseModal` vyžadujú `@vue/test-utils` + `jsdom` environment (nie je zatiaľ nastavené)
