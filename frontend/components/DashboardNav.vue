<template>
  <nav class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <NuxtLink to="/dashboard" class="text-xl font-bold brand-text">
              Columbus
            </NuxtLink>
          </div>
          <div class="hidden sm:ml-8 sm:flex sm:space-x-8">
            <NuxtLink
              to="/dashboard"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2"
              :class="route.path === '/dashboard' ? 'border-brand text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
            >
              Dashboard
            </NuxtLink>
            <NuxtLink
              to="/dashboard/visibility"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2"
              :class="route.path.startsWith('/dashboard/visibility') ? 'border-brand text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
            >
              Visibility
            </NuxtLink>
            <NuxtLink
              to="/dashboard/recommendations"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2"
              :class="route.path.startsWith('/dashboard/recommendations') ? 'border-brand text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
            >
              Recommendations
            </NuxtLink>
            <NuxtLink
              to="/dashboard/gaps"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2"
              :class="route.path.startsWith('/dashboard/gaps') ? 'border-brand text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
            >
              Gaps
            </NuxtLink>
            <NuxtLink
              to="/dashboard/competitors"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2"
              :class="route.path.startsWith('/dashboard/competitors') ? 'border-brand text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
            >
              Competitors
            </NuxtLink>
            <NuxtLink
              to="/dashboard/settings"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2"
              :class="route.path.startsWith('/dashboard/settings') ? 'border-brand text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
            >
              Settings
            </NuxtLink>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-600">{{ user?.email }}</span>
          <button @click="handleLogout" class="btn btn-outline text-sm">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const handleLogout = async () => {
  await supabase.auth.signOut()
  await router.push('/')
}
</script>
