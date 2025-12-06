<template>
  <div>
    <slot />
    <CookieBanner />
  </div>
</template>

<script setup lang="ts">
const { initConsent } = useCookieConsent()

onMounted(() => {
  initConsent()
})
</script>
