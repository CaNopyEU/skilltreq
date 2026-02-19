<script setup lang="ts">
const route = useRoute()
const skillId = route.params.id as string
</script>

<template>
  <main class="min-h-screen p-8">
    <NuxtLink to="/skills" class="text-blue-600 hover:underline mb-4 inline-block">
      ← Späť
    </NuxtLink>
    <h1 class="text-2xl font-bold">Skill: {{ skillId }}</h1>
    <p class="text-gray-500 mt-2">Detail skilu príde v Phase 1.</p>
  </main>
</template>
