<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardSidebar />

    <!-- Main content area -->
    <div class="lg:pl-64">
      <!-- Mobile header spacer -->
      <div class="h-16 lg:h-0" />

      <!-- Page content -->
      <main class="min-h-screen">
        <slot />
      </main>
    </div>

    <!-- Active jobs indicator -->
    <ActiveJobsBadge />
  </div>
</template>
