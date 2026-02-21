# useToast

Singleton composable pre toast notifikácie. Stav je zdieľaný na úrovni modulu — všetky volania `useToast()` pristupujú k tej istej fronte.

`ToastContainer` musí byť zaregistrovaný v `app.vue` aby sa toasty renderovali.

## API

```typescript
import { useToast } from '~/composables/useToast'

const toast = useToast()
```

| Funkcia | Popis |
|---|---|
| `toast.success(msg, duration?)` | Zelený toast, default 3 s |
| `toast.error(msg, duration?)` | Červený toast, default 3 s |
| `toast.info(msg, duration?)` | Modrý toast, default 3 s |
| `toast.warning(msg, duration?)` | Žltý toast, default 3 s |
| `toast.remove(id)` | Okamžité odstránenie podľa ID |
| `toast.toasts` | `Ref<Toast[]>` — interná fronta (pre `ToastContainer`) |

## Typy

```typescript
type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  type: ToastType
  message: string
}
```

## Príklady

```typescript
// V komponente alebo store
const toast = useToast()

toast.success('Skill dokončený')
toast.error('Nepodarilo sa uložiť')
toast.info('Ovplyvnené závislosti: 3', 5000)  // vlastná dĺžka 5 s
toast.warning('Pozor: zmena ovplyvní deti')
```

## Testy

`tests/unit/useToast.test.ts` — 11 testov pokrývajúcich:
- Všetky 4 typy helperov
- Unikátnosť ID
- `remove()` presnosť
- Auto-dismiss s fake timermi (default + custom duration)
- Stacking viacerých toastov

## Poznámky

- Singleton: modul-level `ref`, nie Pinia store
- Farby toastov reusujú CSS vars z `main.css` (`--prog-done-*`, `--prog-active-*`, `--req-tag-*`)
- `ToastContainer` je registrovaný globálne v `app.vue`
