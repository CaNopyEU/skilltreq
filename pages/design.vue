<script setup lang="ts">
// ── Proposed palette ──────────────────────────────────────────────────────────
// Base: Vercel / Grok dark aesthetic — near-black with blue undertone
// Accents: gentle neons — high lightness, moderate saturation, not blinding

const proposed = {
  dark: {
    label: 'Dark (primary)',
    surfaces: [
      { token: '--bg-page',     hex: '#08080e', name: 'Page' },
      { token: '--bg-surface',  hex: '#0e0e1c', name: 'Surface' },
      { token: '--bg-muted',    hex: '#15152a', name: 'Muted' },
      { token: '--bg-hover',    hex: '#1c1c38', name: 'Hover' },
      { token: '--border',      hex: '#1e1e3a', name: 'Border' },
      { token: '--border-muted',hex: '#28284a', name: 'Border Muted' },
    ],
    text: [
      { token: '--text-primary',   hex: '#e4e4f0', name: 'Primary' },
      { token: '--text-secondary', hex: '#9898b8', name: 'Secondary' },
      { token: '--text-body',      hex: '#7070a0', name: 'Body' },
      { token: '--text-muted',     hex: '#484870', name: 'Muted' },
      { token: '--text-faint',     hex: '#2e2e50', name: 'Faint' },
    ],
    status: [
      { token: '--status-locked',      hex: '#3c3c58', label: 'Locked',      emoji: '🔒' },
      { token: '--status-in-progress', hex: '#5b9cf6', label: 'In Progress',  emoji: '◉' },
      { token: '--status-unlocked',    hex: '#4ade80', label: 'Unlocked',     emoji: '✓' },
      { token: '--status-mastered',    hex: '#f0b429', label: 'Mastered',     emoji: '★' },
    ],
    accents: [
      { hex: '#8b5cf6', name: 'Violet',  desc: 'primary action' },
      { hex: '#22d3ee', name: 'Cyan',    desc: 'highlight / focus' },
      { hex: '#ec4899', name: 'Pink',    desc: 'destructive / alert' },
      { hex: '#f97316', name: 'Orange',  desc: 'warning' },
    ],
  },
  light: {
    label: 'Light (secondary)',
    surfaces: [
      { token: '--bg-page',     hex: '#fafafa', name: 'Page' },
      { token: '--bg-surface',  hex: '#f2f2f8', name: 'Surface' },
      { token: '--bg-muted',    hex: '#e8e8f4', name: 'Muted' },
      { token: '--bg-hover',    hex: '#e0e0ef', name: 'Hover' },
      { token: '--border',      hex: '#d0d0e8', name: 'Border' },
      { token: '--border-muted',hex: '#c0c0dc', name: 'Border Muted' },
    ],
    text: [
      { token: '--text-primary',   hex: '#0a0a18', name: 'Primary' },
      { token: '--text-secondary', hex: '#3a3a58', name: 'Secondary' },
      { token: '--text-body',      hex: '#585880', name: 'Body' },
      { token: '--text-muted',     hex: '#8080a8', name: 'Muted' },
      { token: '--text-faint',     hex: '#b0b0cc', name: 'Faint' },
    ],
    status: [
      { token: '--status-locked',      hex: '#9090b0', label: 'Locked',      emoji: '🔒' },
      { token: '--status-in-progress', hex: '#3b82f6', label: 'In Progress',  emoji: '◉' },
      { token: '--status-unlocked',    hex: '#22c55e', label: 'Unlocked',     emoji: '✓' },
      { token: '--status-mastered',    hex: '#f59e0b', label: 'Mastered',     emoji: '★' },
    ],
    accents: [
      { hex: '#7c3aed', name: 'Violet',  desc: 'primary action' },
      { hex: '#0891b2', name: 'Cyan',    desc: 'highlight / focus' },
      { hex: '--',      name: '',        desc: '' },
      { hex: '--',      name: '',        desc: '' },
    ],
  },
}

// ── Neon variants — two comparison options ────────────────────────────────────
// Option A: more saturated / vibrant colors (still tasteful, not blinding)
const neonColors = [
  { hex: '#818cf8', label: 'Locked',      emoji: '🔒', desc: 'indigo-400' },
  { hex: '#22d3ee', label: 'In Progress', emoji: '◉',  desc: 'cyan-400' },
  { hex: '#4ade80', label: 'Unlocked',    emoji: '✓',  desc: 'green-400' },
  { hex: '#fbbf24', label: 'Mastered',    emoji: '★',  desc: 'amber-400' },
]

// Option B: same proposed colors + glow (box-shadow)
const glowColors = [
  { hex: '#5b9cf6', glow: '#5b9cf6', label: 'Locked',      emoji: '🔒' },
  { hex: '#5b9cf6', glow: '#5b9cf6', label: 'In Progress',  emoji: '◉' },
  { hex: '#4ade80', glow: '#4ade80', label: 'Unlocked',     emoji: '✓' },
  { hex: '#f0b429', glow: '#f0b429', label: 'Mastered',     emoji: '★' },
]

// Option C: neon colors + glow combined
const neonGlowColors = [
  { hex: '#818cf8', glow: '#818cf8', label: 'Locked',      emoji: '🔒' },
  { hex: '#22d3ee', glow: '#22d3ee', label: 'In Progress',  emoji: '◉' },
  { hex: '#4ade80', glow: '#4ade80', label: 'Unlocked',     emoji: '✓' },
  { hex: '#fbbf24', glow: '#fbbf24', label: 'Mastered',     emoji: '★' },
]

function glowStyle(color: string, intensity = 14) {
  return `0 0 0 1px ${color}66, 0 0 ${intensity}px ${color}55, inset 0 0 ${intensity / 2}px ${color}22`
}

// ── Category color proposals ───────────────────────────────────────────────────
const categories = [
  { id: 'pull',  name: 'Pull',  desc: 'pull-up, front lever, muscle-up' },
  { id: 'push',  name: 'Push',  desc: 'handstand, planche, dip' },
  { id: 'legs',  name: 'Legs',  desc: 'squat, pistol, shrimp' },
  { id: 'core',  name: 'Core',  desc: 'l-sit, dragon flag, manna' },
  { id: 'rings', name: 'Rings', desc: 'iron cross, maltese, butterfly' },
]

const catCurrent = ['#4472C4', '#ED7D31', '#70AD47', '#FFC000', '#00B0F0']

// ── 12-color spectrum: 6 hues × 2 variants (light = menej sýta, dark = viac sýta)
// Pravidlá:
//   • žiadna z 12 farieb nesmie vizuálne kolidovať so status farbami
//     (in-progress #5b9cf6 = modrá, unlocked #4ade80 = zelená, mastered #fbbf24 = zlatá)
//   • každá hue skupina musí byť okamžite rozlíšiteľná od ostatných
//   • light/dark verzia tej istej hue = sub-kategória (napr. Vertical Pull / Horizontal Pull)

const catSpectrum = [
  {
    hue: 'Red — Crimson',
    note: 'silná, energická — Push, dynamické pohyby',
    light: { hex: '#fca5a5', tw: 'red-300' },
    dark:  { hex: '#f43f5e', tw: 'rose-500' },
  },
  {
    hue: 'Orange — Ember',
    note: 'teplá, core / stabilizácia',
    light: { hex: '#fdba74', tw: 'orange-300' },
    dark:  { hex: '#f97316', tw: 'orange-500' },
  },
  {
    hue: 'Emerald — Nuxt',
    note: 'Nuxt green #00DC82, prirodzená — Legs, pohyb dole',
    light: { hex: '#6ee7b7', tw: 'emerald-300' },
    dark:  { hex: '#00dc82', tw: 'nuxt ✦' },
  },
  {
    hue: 'Cyan — Electric',
    note: 'ľahká, vzdušná — Rings, balansové elementy',
    light: { hex: '#a5f3fc', tw: 'cyan-200' },
    dark:  { hex: '#22d3ee', tw: 'cyan-400' },
  },
  {
    hue: 'Violet — Royal',
    note: 'hlboká, sila — Pull, ťahové pohyby',
    light: { hex: '#d8b4fe', tw: 'purple-300' },
    dark:  { hex: '#a855f7', tw: 'purple-500' },
  },
  {
    hue: 'Pink — Fuchsia',
    note: 'mobilita, flexibilita, ostatné',
    light: { hex: '#f9a8d4', tw: 'pink-300' },
    dark:  { hex: '#e879f9', tw: 'fuchsia-400' },
  },
]

// Odporúčané mapovanie pre aktuálnych 5 kategórií
const catMapping = [
  { name: 'Pull',  hue: 'Violet',  hex: '#a855f7', reason: 'silná, ťahová' },
  { name: 'Push',  hue: 'Red',     hex: '#f43f5e', reason: 'energická, dynamická' },
  { name: 'Legs',  hue: 'Emerald', hex: '#00dc82', reason: 'Nuxt green, pohyb' },
  { name: 'Core',  hue: 'Orange',  hex: '#f97316', reason: 'teplá, stabilizácia' },
  { name: 'Rings', hue: 'Cyan',    hex: '#22d3ee', reason: 'vzdušná, balans' },
]

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ── Current palette (for comparison) ─────────────────────────────────────────
const current = {
  status: [
    { hex: '#9ca3af', label: 'Locked' },
    { hex: '#3b82f6', label: 'In Progress' },
    { hex: '#22c55e', label: 'Unlocked' },
    { hex: '#eab308', label: 'Mastered' },
  ],
  dark: [
    { hex: '#0f172a', label: 'bg-page' },
    { hex: '#1e293b', label: 'bg-surface' },
    { hex: '#334155', label: 'bg-muted' },
  ],
}

function isLight(hex: string): boolean {
  if (!hex || hex === '--') return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}
</script>

<template>
  <div class="dp">
    <!-- Header -->
    <header class="dp__header">
      <div>
        <h1 class="dp__title">Design System</h1>
        <p class="dp__sub">Proposed palette · Vercel/Grok dark + soft neon accents</p>
      </div>
      <NuxtLink to="/skills" class="dp__back">← Back to app</NuxtLink>
    </header>

    <!-- Comparison strip -->
    <section class="dp__section">
      <h2 class="dp__section-title">Current vs Proposed — Status Colors</h2>
      <div class="dp__compare">
        <div class="dp__compare-col">
          <p class="dp__compare-label">Current</p>
          <div class="dp__row">
            <div
              v-for="s in current.status"
              :key="s.label"
              class="dp__swatch dp__swatch--lg"
              :style="{ background: s.hex, color: isLight(s.hex) ? '#111' : '#fff' }"
            >
              <span class="dp__swatch-name">{{ s.label }}</span>
              <span class="dp__swatch-hex">{{ s.hex }}</span>
            </div>
          </div>
        </div>
        <div class="dp__compare-col">
          <p class="dp__compare-label">Proposed (dark)</p>
          <div class="dp__row">
            <div
              v-for="s in proposed.dark.status"
              :key="s.token"
              class="dp__swatch dp__swatch--lg"
              :style="{ background: s.hex, color: isLight(s.hex) ? '#111' : '#fff' }"
            >
              <span class="dp__swatch-name">{{ s.label }}</span>
              <span class="dp__swatch-hex">{{ s.hex }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Proposed: Dark -->
    <section class="dp__section dp__section--dark" :style="{ background: '#08080e' }">
      <h2 class="dp__section-title" style="color: #e4e4f0">Dark mode palette</h2>

      <div class="dp__group">
        <p class="dp__group-label" style="color: #7070a0">Surfaces</p>
        <div class="dp__row">
          <div
            v-for="s in proposed.dark.surfaces"
            :key="s.token"
            class="dp__swatch"
            :style="{ background: s.hex, border: '1px solid #28284a' }"
          >
            <span class="dp__swatch-name" style="color: #9898b8">{{ s.name }}</span>
            <span class="dp__swatch-token" style="color: #484870">{{ s.token }}</span>
            <span class="dp__swatch-hex" style="color: #9898b8">{{ s.hex }}</span>
          </div>
        </div>
      </div>

      <div class="dp__group">
        <p class="dp__group-label" style="color: #7070a0">Text scale</p>
        <div class="dp__row">
          <div
            v-for="t in proposed.dark.text"
            :key="t.token"
            class="dp__text-swatch"
            :style="{ background: '#0e0e1c', border: '1px solid #1e1e3a' }"
          >
            <span class="dp__text-preview" :style="{ color: t.hex }">Aa</span>
            <span class="dp__swatch-name" style="color: #7070a0">{{ t.name }}</span>
            <span class="dp__swatch-hex" style="color: #484870">{{ t.hex }}</span>
          </div>
        </div>
      </div>

      <div class="dp__group">
        <p class="dp__group-label" style="color: #7070a0">Status — gentle neon</p>
        <div class="dp__row">
          <div
            v-for="s in proposed.dark.status"
            :key="s.token"
            class="dp__swatch dp__swatch--lg"
            :style="{ background: s.hex, color: isLight(s.hex) ? '#111' : '#e4e4f0' }"
          >
            <span style="font-size: 20px">{{ s.emoji }}</span>
            <span class="dp__swatch-name">{{ s.label }}</span>
            <span class="dp__swatch-hex">{{ s.hex }}</span>
          </div>
        </div>
      </div>

      <div class="dp__group">
        <p class="dp__group-label" style="color: #7070a0">Accent palette</p>
        <div class="dp__row">
          <div
            v-for="a in proposed.dark.accents"
            :key="a.hex"
            class="dp__swatch"
            :style="{ background: a.hex, color: isLight(a.hex) ? '#111' : '#fff' }"
          >
            <span class="dp__swatch-name">{{ a.name }}</span>
            <span class="dp__swatch-hex" style="opacity: 0.7; font-size: 10px">{{ a.desc }}</span>
            <span class="dp__swatch-hex">{{ a.hex }}</span>
          </div>
        </div>
      </div>

      <!-- Node previews on dark -->
      <div class="dp__group">
        <p class="dp__group-label" style="color: #7070a0">Node variants</p>
        <div class="dp__row dp__row--wrap">
          <div
            v-for="s in proposed.dark.status"
            :key="`node-${s.token}`"
            class="dp__node"
            :style="{
              borderColor: s.hex,
              background: s.hex + '22',
              color: '#e4e4f0',
            }"
          >
            <div class="dp__node-fill" :style="{ width: s.label === 'In Progress' ? '45%' : s.label === 'Unlocked' ? '75%' : s.label === 'Mastered' ? '100%' : '0%', background: s.hex + '44' }" />
            <span class="dp__node-name">{{ s.label }}</span>
            <span class="dp__node-badge" :style="{ background: '#1c1c38', color: '#9898b8' }">7</span>
          </div>
        </div>
      </div>

      <!-- Neon comparison -->
      <div class="dp__group">
        <p class="dp__group-label" style="color: #7070a0">Neon variants — porovnanie</p>

        <!-- Option A: vibrant colors, no glow -->
        <p class="dp__comp-label" style="color: #484870; margin-bottom: 10px">A · Sýtejšie farby (bez glow)</p>
        <div class="dp__row dp__row--wrap" style="margin-bottom: 20px">
          <div
            v-for="s in neonColors"
            :key="`nA-${s.label}`"
            class="dp__node"
            :style="{
              borderColor: s.hex,
              background: s.hex + '1a',
              color: '#e4e4f0',
              border: `1.5px solid ${s.hex}`,
            }"
          >
            <div class="dp__node-fill" :style="{ width: s.label === 'In Progress' ? '45%' : s.label === 'Unlocked' ? '75%' : s.label === 'Mastered' ? '100%' : '0%', background: s.hex + '33' }" />
            <span class="dp__node-name">{{ s.label }}</span>
            <span class="dp__node-badge" :style="{ background: '#1c1c38', color: '#9898b8' }">7</span>
          </div>
        </div>

        <!-- Option B: proposed colors + glow -->
        <p class="dp__comp-label" style="color: #484870; margin-bottom: 10px">B · Pôvodné farby + neon glow border</p>
        <div class="dp__row dp__row--wrap" style="margin-bottom: 20px">
          <div
            v-for="(s, i) in proposed.dark.status"
            :key="`nB-${s.token}`"
            class="dp__node"
            :style="{
              borderColor: s.hex,
              background: s.hex + '18',
              color: '#e4e4f0',
              border: `1.5px solid ${s.hex}`,
              boxShadow: glowStyle(s.hex),
            }"
          >
            <div class="dp__node-fill" :style="{ width: s.label === 'In Progress' ? '45%' : s.label === 'Unlocked' ? '75%' : s.label === 'Mastered' ? '100%' : '0%', background: s.hex + '33' }" />
            <span class="dp__node-name">{{ s.label }}</span>
            <span class="dp__node-badge" :style="{ background: '#1c1c38', color: '#9898b8' }">7</span>
          </div>
        </div>

        <!-- Option C: neon colors + glow -->
        <p class="dp__comp-label" style="color: #484870; margin-bottom: 10px">C · Sýtejšie farby + neon glow border</p>
        <div class="dp__row dp__row--wrap" style="margin-bottom: 8px">
          <div
            v-for="s in neonGlowColors"
            :key="`nC-${s.label}`"
            class="dp__node"
            :style="{
              borderColor: s.hex,
              background: s.hex + '18',
              color: '#e4e4f0',
              border: `1.5px solid ${s.hex}`,
              boxShadow: glowStyle(s.hex),
            }"
          >
            <div class="dp__node-fill" :style="{ width: s.label === 'In Progress' ? '45%' : s.label === 'Unlocked' ? '75%' : s.label === 'Mastered' ? '100%' : '0%', background: s.hex + '33' }" />
            <span class="dp__node-name">{{ s.label }}</span>
            <span class="dp__node-badge" :style="{ background: '#1c1c38', color: '#9898b8' }">7</span>
          </div>
        </div>
      </div>

      <!-- Component previews -->
      <div class="dp__group">
        <p class="dp__group-label" style="color: #7070a0">Components</p>
        <div class="dp__components">
          <!-- Buttons -->
          <div class="dp__comp-group">
            <p class="dp__comp-label" style="color: #484870">Buttons</p>
            <div class="dp__row">
              <button class="dp__btn" :style="{ background: '#8b5cf6', color: '#fff', border: 'none' }">Primary</button>
              <button class="dp__btn" :style="{ background: 'transparent', color: '#e4e4f0', border: '1px solid #28284a' }">Secondary</button>
              <button class="dp__btn" :style="{ background: '#5b9cf633', color: '#5b9cf6', border: '1px solid #5b9cf644' }">Ghost</button>
              <button class="dp__btn" :style="{ background: '#ec489922', color: '#ec4899', border: '1px solid #ec489944' }">Danger</button>
            </div>
          </div>

          <!-- Status pills -->
          <div class="dp__comp-group">
            <p class="dp__comp-label" style="color: #484870">Status chips</p>
            <div class="dp__row">
              <span
                v-for="s in proposed.dark.status"
                :key="`chip-${s.token}`"
                class="dp__chip"
                :style="{ background: s.hex + '22', color: s.hex, border: `1px solid ${s.hex}44` }"
              >
                {{ s.emoji }} {{ s.label }}
              </span>
            </div>
          </div>

          <!-- Input -->
          <div class="dp__comp-group">
            <p class="dp__comp-label" style="color: #484870">Input / Select</p>
            <div class="dp__row">
              <input
                class="dp__input"
                placeholder="Search skills..."
                :style="{ background: '#0e0e1c', border: '1px solid #28284a', color: '#e4e4f0' }"
              />
              <select class="dp__input" :style="{ background: '#0e0e1c', border: '1px solid #28284a', color: '#e4e4f0' }">
                <option>🔒 Locked</option>
                <option>◉ In Progress</option>
                <option>✓ Unlocked</option>
                <option>★ Mastered</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Category color spectrum -->
    <section class="dp__section dp__section--dark" :style="{ background: '#08080e', padding: '32px 24px' }">
      <h2 class="dp__section-title" style="color: #e4e4f0">Category colors — 12-farebné spektrum</h2>
      <p style="color: #7070a0; font-size: 13px; margin: -16px 0 28px">
        6 hue skupín × 2 varianty (light / dark). Light = menej sýta pre sub-kategóriu, dark = hlavná kategória.
        Žiadna nesmie kolidovať so status farbami (modrá · zelená · zlatá).
      </p>

      <!-- Spectrum grid: 6 hue pairs -->
      <div class="dp__group">
        <p class="dp__group-label" style="color: #7070a0">Spektrum — 6 hue × light / dark</p>
        <div class="dp__spectrum">
          <div v-for="hue in catSpectrum" :key="hue.hue" class="dp__spectrum-row">
            <!-- Light variant -->
            <div class="dp__spectrum-pair">
              <div
                class="dp__spec-node"
                :style="{
                  borderColor: hue.light.hex,
                  background: hexToRgba(hue.light.hex, 0.1),
                  color: '#e4e4f0',
                  boxShadow: glowStyle(hue.light.hex, 8),
                }"
              >
                <div class="dp__spec-fill" :style="{ width: '55%', background: hexToRgba(hue.light.hex, 0.28) }" />
                <span class="dp__spec-label">light</span>
              </div>
              <div class="dp__spec-meta">
                <span class="dp__spec-hex" style="color: #9898b8">{{ hue.light.hex }}</span>
                <span class="dp__spec-tw" style="color: #484870">{{ hue.light.tw }}</span>
              </div>
            </div>

            <!-- Dark variant -->
            <div class="dp__spectrum-pair">
              <div
                class="dp__spec-node"
                :style="{
                  borderColor: hue.dark.hex,
                  background: hexToRgba(hue.dark.hex, 0.14),
                  color: '#e4e4f0',
                  boxShadow: glowStyle(hue.dark.hex, 12),
                }"
              >
                <div class="dp__spec-fill" :style="{ width: '55%', background: hexToRgba(hue.dark.hex, 0.35) }" />
                <span class="dp__spec-label">dark</span>
              </div>
              <div class="dp__spec-meta">
                <span class="dp__spec-hex" style="color: #9898b8">{{ hue.dark.hex }}</span>
                <span class="dp__spec-tw" style="color: #484870">{{ hue.dark.tw }}</span>
              </div>
            </div>

            <!-- Hue name + usage -->
            <div class="dp__spec-info">
              <span class="dp__spec-hue" :style="{ color: hue.dark.hex }">{{ hue.hue }}</span>
              <span class="dp__spec-note" style="color: #484870">{{ hue.note }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Sub-category example -->
      <div class="dp__group">
        <p class="dp__group-label" style="color: #7070a0">Príklad — sub-kategórie (Violet: Pull Vertical / Pull Horizontal)</p>
        <div class="dp__row" style="gap: 16px; align-items: flex-start">
          <div v-for="v in [
            { label: 'Pull Vertical', sub: 'pull-up, front lever, muscle-up', hex: '#a855f7', fill: 60 },
            { label: 'Pull Horizontal', sub: 'row, back lever, face pull', hex: '#d8b4fe', fill: 35 },
          ]" :key="v.label" style="display:flex;flex-direction:column;gap:8px">
            <div
              class="dp__spec-node"
              style="width:180px"
              :style="{
                borderColor: v.hex,
                background: hexToRgba(v.hex, 0.12),
                color: '#e4e4f0',
                boxShadow: glowStyle(v.hex, 10),
              }"
            >
              <div class="dp__spec-fill" :style="{ width: v.fill + '%', background: hexToRgba(v.hex, 0.32) }" />
              <span class="dp__spec-label">{{ v.label }}</span>
            </div>
            <p style="font-size:11px;color:#484870;margin:0;max-width:180px">{{ v.sub }}</p>
            <p style="font-family:monospace;font-size:10px;color:#9898b8;margin:0">{{ v.hex }}</p>
          </div>
        </div>
      </div>

      <!-- Recommended mapping for current 5 categories -->
      <div class="dp__group">
        <p class="dp__group-label" style="color: #7070a0">Odporúčané mapovanie — aktuálnych 5 kategórií</p>
        <div class="dp__row" style="gap: 10px; flex-wrap: wrap">
          <div v-for="m in catMapping" :key="m.name" class="dp__map-card">
            <div
              class="dp__spec-node"
              :style="{
                borderColor: m.hex,
                background: hexToRgba(m.hex, 0.12),
                color: '#e4e4f0',
                boxShadow: glowStyle(m.hex, 10),
              }"
            >
              <div class="dp__spec-fill" :style="{ width: '45%', background: hexToRgba(m.hex, 0.32) }" />
              <span class="dp__spec-label">{{ m.name }}</span>
            </div>
            <p style="font-size:11px;color:#9898b8;margin:4px 0 0">{{ m.hue }}</p>
            <p style="font-family:monospace;font-size:10px;color:#484870;margin:2px 0 0">{{ m.hex }}</p>
            <p style="font-size:10px;color:#2e2e50;margin:1px 0 0;font-style:italic">{{ m.reason }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Proposed: Light -->
    <section class="dp__section dp__section--light" :style="{ background: '#fafafa' }">
      <h2 class="dp__section-title" style="color: #0a0a18">Light mode palette</h2>

      <div class="dp__group">
        <p class="dp__group-label" style="color: #8080a8">Surfaces</p>
        <div class="dp__row">
          <div
            v-for="s in proposed.light.surfaces"
            :key="s.token"
            class="dp__swatch"
            :style="{ background: s.hex, border: '1px solid #c0c0dc' }"
          >
            <span class="dp__swatch-name" style="color: #3a3a58">{{ s.name }}</span>
            <span class="dp__swatch-token" style="color: #8080a8">{{ s.token }}</span>
            <span class="dp__swatch-hex" style="color: #3a3a58">{{ s.hex }}</span>
          </div>
        </div>
      </div>

      <div class="dp__group">
        <p class="dp__group-label" style="color: #8080a8">Status colors</p>
        <div class="dp__row">
          <div
            v-for="s in proposed.light.status"
            :key="s.token"
            class="dp__swatch dp__swatch--lg"
            :style="{ background: s.hex, color: isLight(s.hex) ? '#111' : '#fff' }"
          >
            <span style="font-size: 20px">{{ s.emoji }}</span>
            <span class="dp__swatch-name">{{ s.label }}</span>
            <span class="dp__swatch-hex">{{ s.hex }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Typography -->
    <section class="dp__section">
      <h2 class="dp__section-title">Typography scale</h2>
      <div class="dp__type-scale">
        <div v-for="t in [
          { size: '28px', weight: 700, label: 'Heading 1', usage: 'Page titles' },
          { size: '20px', weight: 700, label: 'Heading 2', usage: 'Section titles' },
          { size: '16px', weight: 600, label: 'Heading 3', usage: 'Card titles' },
          { size: '14px', weight: 400, label: 'Body',      usage: 'Content, descriptions' },
          { size: '13px', weight: 400, label: 'Small',     usage: 'Labels, captions' },
          { size: '11px', weight: 600, label: 'Caption',   usage: 'Uppercase labels, metadata' },
        ]" :key="t.size" class="dp__type-row">
          <span class="dp__type-meta">{{ t.size }} / {{ t.weight }}</span>
          <span class="dp__type-sample" :style="{ fontSize: t.size, fontWeight: t.weight }">{{ t.label }}</span>
          <span class="dp__type-usage">{{ t.usage }}</span>
        </div>
      </div>
    </section>

    <!-- Spacing -->
    <section class="dp__section">
      <h2 class="dp__section-title">Spacing & Radius</h2>
      <div class="dp__row dp__row--wrap">
        <div v-for="r in [
          { px: 4,  label: 'xs', usage: 'badges' },
          { px: 6,  label: 'sm', usage: 'chips, tags' },
          { px: 8,  label: 'md', usage: 'inputs, buttons' },
          { px: 12, label: 'lg', usage: 'cards, panels' },
          { px: 16, label: 'xl', usage: 'modals, sheets' },
          { px: 9999, label: 'full', usage: 'pills' },
        ]" :key="r.label" class="dp__radius-item">
          <div class="dp__radius-box" :style="{ borderRadius: r.px + 'px', width: '48px', height: '48px', background: 'var(--bg-muted)', border: '1px solid var(--border)' }" />
          <span class="dp__radius-label">{{ r.px === 9999 ? '∞' : r.px + 'px' }}</span>
          <span class="dp__radius-usage">{{ r.usage }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dp {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 24px 80px;
  font-family: inherit;
}

.dp__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 48px;
}

.dp__title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 4px;
  color: var(--text-primary);
}

.dp__sub {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

.dp__back {
  font-size: 13px;
  color: var(--text-muted);
  text-decoration: none;
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
}

.dp__back:hover { color: var(--text-primary); }

.dp__section {
  margin-bottom: 48px;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.dp__section--dark,
.dp__section--light {
  border: none;
}

.dp__section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 24px;
}

.dp__group {
  margin-bottom: 28px;
}

.dp__group-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 12px;
}

.dp__row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dp__swatch {
  width: 120px;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dp__swatch--lg {
  width: 140px;
  padding: 16px 12px;
  align-items: center;
  text-align: center;
}

.dp__swatch-name {
  font-size: 12px;
  font-weight: 600;
}

.dp__swatch-token {
  font-size: 9px;
  opacity: 0.6;
  font-family: monospace;
}

.dp__swatch-hex {
  font-size: 11px;
  font-family: monospace;
  opacity: 0.8;
}

.dp__text-swatch {
  width: 100px;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.dp__text-preview {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

/* Node preview */
.dp__node {
  width: 160px;
  height: 60px;
  border: 2px solid;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  font-size: 13px;
  font-weight: 500;
  padding: 0 24px 0 8px;
  box-sizing: border-box;
}

.dp__node-fill {
  position: absolute;
  left: 0; top: 0;
  height: 100%;
  pointer-events: none;
}

.dp__node-name {
  position: relative;
  z-index: 1;
  flex: 1;
}

.dp__node-badge {
  position: absolute;
  z-index: 1;
  top: 4px; right: 6px;
  border-radius: 4px;
  font-size: 10px;
  padding: 1px 4px;
  font-weight: 600;
}

/* Components */
.dp__components {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dp__comp-group {}
.dp__comp-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 10px;
}

.dp__btn {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.dp__chip {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.dp__input {
  padding: 7px 12px;
  border-radius: 6px;
  font-size: 13px;
  min-width: 180px;
  outline: none;
}

/* Category proposals */
.dp__cat-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.dp__cat-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.dp__cat-swatch {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  min-width: 120px;
}

.dp__cat-nodes {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dp__cat-node {
  width: 120px;
  height: 32px;
  border: 1.5px solid;
  border-radius: 6px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  position: relative;
  overflow: hidden;
  font-weight: 500;
}

.dp__cat-node-fill {
  position: absolute;
  left: 0; top: 0;
  height: 100%;
  pointer-events: none;
}

.dp__cat-label {
  font-size: 12px;
  font-weight: 600;
  margin: 0;
}

.dp__cat-hex {
  font-size: 10px;
  font-family: monospace;
  margin: 0;
}

/* Spectrum */
.dp__spectrum {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dp__spectrum-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #0e0e1c;
  border: 1px solid #1e1e3a;
  border-radius: 10px;
}

.dp__spectrum-pair {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dp__spec-node {
  width: 140px;
  height: 36px;
  border: 1.5px solid;
  border-radius: 7px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  position: relative;
  overflow: hidden;
  font-weight: 500;
  flex-shrink: 0;
}

.dp__spec-fill {
  position: absolute;
  left: 0; top: 0;
  height: 100%;
  pointer-events: none;
}

.dp__spec-label {
  position: relative;
  z-index: 1;
  font-size: 12px;
}

.dp__spec-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 80px;
}

.dp__spec-hex {
  font-family: monospace;
  font-size: 11px;
}

.dp__spec-tw {
  font-size: 10px;
}

.dp__spec-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-left: 8px;
}

.dp__spec-hue {
  font-size: 13px;
  font-weight: 600;
}

.dp__spec-note {
  font-size: 11px;
}

.dp__map-card {
  display: flex;
  flex-direction: column;
}

/* Compare */
.dp__compare {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.dp__compare-col {}
.dp__compare-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Typography */
.dp__type-scale {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dp__type-row {
  display: flex;
  align-items: baseline;
  gap: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.dp__type-meta {
  font-size: 11px;
  font-family: monospace;
  color: var(--text-faint);
  width: 100px;
  flex-shrink: 0;
}

.dp__type-sample {
  flex: 1;
  color: var(--text-primary);
}

.dp__type-usage {
  font-size: 12px;
  color: var(--text-muted);
  width: 180px;
  flex-shrink: 0;
}

/* Spacing */
.dp__radius-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.dp__radius-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  font-family: monospace;
}

.dp__radius-usage {
  font-size: 11px;
  color: var(--text-muted);
}
</style>
