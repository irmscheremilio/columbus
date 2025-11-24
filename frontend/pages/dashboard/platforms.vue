<template>
  <div class="min-h-screen bg-background">
    <DashboardNav />

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <h1 class="text-3xl font-bold text-gray-900">Platform Strategy</h1>
        <p class="mt-2 text-gray-600">
          Optimize your visibility across different AI platforms
        </p>
      </div>

      <!-- Platform Cards -->
      <div class="px-4 py-6 sm:px-0">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- ChatGPT -->
          <div class="card-highlight border-l-4 border-green-500">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                  </svg>
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900">ChatGPT</h2>
                  <p class="text-sm text-gray-500">OpenAI</p>
                </div>
              </div>
              <div class="text-right">
                <div class="text-3xl font-bold" :class="getScoreColor(platformStats.chatgpt.score)">
                  {{ platformStats.chatgpt.score }}%
                </div>
                <div class="text-xs text-gray-500">visibility score</div>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Citations</span>
                <span class="font-medium">{{ platformStats.chatgpt.citations }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Tests Run</span>
                <span class="font-medium">{{ platformStats.chatgpt.tests }}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-green-500 h-2 rounded-full transition-all"
                  :style="{ width: `${platformStats.chatgpt.score}%` }"
                ></div>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t">
              <h4 class="text-sm font-medium text-gray-900 mb-2">Optimization Tips</h4>
              <ul class="text-sm text-gray-600 space-y-1">
                <li>• Use clear, structured content</li>
                <li>• Include FAQ sections on pages</li>
                <li>• Ensure fast page load times</li>
              </ul>
            </div>
          </div>

          <!-- Claude -->
          <div class="card-highlight border-l-4 border-orange-500">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span class="text-orange-600 font-bold text-lg">C</span>
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900">Claude</h2>
                  <p class="text-sm text-gray-500">Anthropic</p>
                </div>
              </div>
              <div class="text-right">
                <div class="text-3xl font-bold" :class="getScoreColor(platformStats.claude.score)">
                  {{ platformStats.claude.score }}%
                </div>
                <div class="text-xs text-gray-500">visibility score</div>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Citations</span>
                <span class="font-medium">{{ platformStats.claude.citations }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Tests Run</span>
                <span class="font-medium">{{ platformStats.claude.tests }}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-orange-500 h-2 rounded-full transition-all"
                  :style="{ width: `${platformStats.claude.score}%` }"
                ></div>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t">
              <h4 class="text-sm font-medium text-gray-900 mb-2">Optimization Tips</h4>
              <ul class="text-sm text-gray-600 space-y-1">
                <li>• Provide detailed documentation</li>
                <li>• Use semantic HTML structure</li>
                <li>• Include technical specifications</li>
              </ul>
            </div>
          </div>

          <!-- Perplexity -->
          <div class="card-highlight border-l-4 border-blue-500">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span class="text-blue-600 font-bold text-lg">P</span>
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900">Perplexity</h2>
                  <p class="text-sm text-gray-500">Perplexity AI</p>
                </div>
              </div>
              <div class="text-right">
                <div class="text-3xl font-bold" :class="getScoreColor(platformStats.perplexity.score)">
                  {{ platformStats.perplexity.score }}%
                </div>
                <div class="text-xs text-gray-500">visibility score</div>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Citations</span>
                <span class="font-medium">{{ platformStats.perplexity.citations }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Tests Run</span>
                <span class="font-medium">{{ platformStats.perplexity.tests }}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-500 h-2 rounded-full transition-all"
                  :style="{ width: `${platformStats.perplexity.score}%` }"
                ></div>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t">
              <h4 class="text-sm font-medium text-gray-900 mb-2">Optimization Tips</h4>
              <ul class="text-sm text-gray-600 space-y-1">
                <li>• Focus on authoritative backlinks</li>
                <li>• Create comprehensive guides</li>
                <li>• Use schema markup extensively</li>
              </ul>
            </div>
          </div>

          <!-- Gemini -->
          <div class="card-highlight border-l-4 border-purple-500">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span class="text-purple-600 font-bold text-lg">G</span>
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900">Gemini</h2>
                  <p class="text-sm text-gray-500">Google</p>
                </div>
              </div>
              <div class="text-right">
                <div class="text-3xl font-bold" :class="getScoreColor(platformStats.gemini.score)">
                  {{ platformStats.gemini.score }}%
                </div>
                <div class="text-xs text-gray-500">visibility score</div>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Citations</span>
                <span class="font-medium">{{ platformStats.gemini.citations }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Tests Run</span>
                <span class="font-medium">{{ platformStats.gemini.tests }}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-purple-500 h-2 rounded-full transition-all"
                  :style="{ width: `${platformStats.gemini.score}%` }"
                ></div>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t">
              <h4 class="text-sm font-medium text-gray-900 mb-2">Optimization Tips</h4>
              <ul class="text-sm text-gray-600 space-y-1">
                <li>• Optimize for Google Search</li>
                <li>• Use structured data markup</li>
                <li>• Maintain consistent NAP info</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Platform Comparison -->
      <div class="px-4 py-6 sm:px-0">
        <div class="card-highlight">
          <h2 class="text-lg font-semibold mb-4">Platform Comparison</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Platform</th>
                  <th class="text-center py-3 px-4 text-sm font-medium text-gray-500">Score</th>
                  <th class="text-center py-3 px-4 text-sm font-medium text-gray-500">Citations</th>
                  <th class="text-center py-3 px-4 text-sm font-medium text-gray-500">Tests</th>
                  <th class="text-center py-3 px-4 text-sm font-medium text-gray-500">Citation Rate</th>
                  <th class="text-center py-3 px-4 text-sm font-medium text-gray-500">Trend</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(stats, platform) in platformStats" :key="platform" class="border-b last:border-b-0">
                  <td class="py-3 px-4 font-medium capitalize">{{ platform }}</td>
                  <td class="text-center py-3 px-4">
                    <span class="font-bold" :class="getScoreColor(stats.score)">{{ stats.score }}%</span>
                  </td>
                  <td class="text-center py-3 px-4">{{ stats.citations }}</td>
                  <td class="text-center py-3 px-4">{{ stats.tests }}</td>
                  <td class="text-center py-3 px-4">
                    {{ stats.tests > 0 ? Math.round((stats.citations / stats.tests) * 100) : 0 }}%
                  </td>
                  <td class="text-center py-3 px-4">
                    <span :class="stats.trend === 'up' ? 'text-green-600' : stats.trend === 'down' ? 'text-red-600' : 'text-gray-400'">
                      {{ stats.trend === 'up' ? '↑' : stats.trend === 'down' ? '↓' : '−' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Best & Worst Performing -->
      <div class="px-4 py-6 sm:px-0 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card-highlight">
          <h2 class="text-lg font-semibold mb-4 text-green-700">Best Performing Prompts</h2>
          <div v-if="bestPrompts.length === 0" class="text-gray-500 text-center py-4">
            No data yet. Run a visibility scan to see results.
          </div>
          <div v-else class="space-y-3">
            <div v-for="prompt in bestPrompts" :key="prompt.id" class="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <span class="px-2 py-0.5 bg-green-500 text-white text-xs rounded font-bold">
                L{{ prompt.granularity_level }}
              </span>
              <div class="flex-1">
                <p class="text-sm text-gray-900">{{ prompt.prompt_text }}</p>
                <p class="text-xs text-green-600 mt-1">{{ prompt.citation_count }} citations</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card-highlight">
          <h2 class="text-lg font-semibold mb-4 text-red-700">Needs Improvement</h2>
          <div v-if="worstPrompts.length === 0" class="text-gray-500 text-center py-4">
            No data yet. Run a visibility scan to see results.
          </div>
          <div v-else class="space-y-3">
            <div v-for="prompt in worstPrompts" :key="prompt.id" class="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
              <span class="px-2 py-0.5 bg-red-500 text-white text-xs rounded font-bold">
                L{{ prompt.granularity_level }}
              </span>
              <div class="flex-1">
                <p class="text-sm text-gray-900">{{ prompt.prompt_text }}</p>
                <p class="text-xs text-red-600 mt-1">{{ prompt.citation_count }} citations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const platformStats = ref({
  chatgpt: { score: 0, citations: 0, tests: 0, trend: 'stable' as 'up' | 'down' | 'stable' },
  claude: { score: 0, citations: 0, tests: 0, trend: 'stable' as 'up' | 'down' | 'stable' },
  perplexity: { score: 0, citations: 0, tests: 0, trend: 'stable' as 'up' | 'down' | 'stable' },
  gemini: { score: 0, citations: 0, tests: 0, trend: 'stable' as 'up' | 'down' | 'stable' }
})

const bestPrompts = ref<any[]>([])
const worstPrompts = ref<any[]>([])

onMounted(async () => {
  await loadPlatformData()
})

const loadPlatformData = async () => {
  try {
    const { data: userData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.value?.id)
      .single()

    if (!userData?.organization_id) return

    // Load visibility scores by platform
    const { data: scores } = await supabase
      .from('visibility_scores')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (scores) {
      // Group by platform and calculate stats
      const platforms = ['chatgpt', 'claude', 'perplexity', 'gemini']

      platforms.forEach(platform => {
        const platformScores = scores.filter(s => s.ai_model === platform)
        if (platformScores.length > 0) {
          const latestScore = platformScores[0]
          const avgScore = Math.round(
            platformScores.reduce((sum, s) => sum + s.score, 0) / platformScores.length
          )

          platformStats.value[platform as keyof typeof platformStats.value] = {
            score: latestScore.score,
            citations: platformScores.filter(s => s.score > 0).length,
            tests: platformScores.length,
            trend: platformScores.length > 1
              ? (platformScores[0].score > platformScores[1].score ? 'up' : platformScores[0].score < platformScores[1].score ? 'down' : 'stable')
              : 'stable'
          }
        }
      })
    }

    // Load prompt results to find best/worst performing
    const { data: prompts } = await supabase
      .from('prompts')
      .select('id, prompt_text, granularity_level')
      .eq('organization_id', userData.organization_id)

    if (prompts && prompts.length > 0) {
      const promptIds = prompts.map(p => p.id)

      const { data: results } = await supabase
        .from('prompt_results')
        .select('prompt_id, was_mentioned')
        .in('prompt_id', promptIds)

      if (results) {
        // Calculate citation count per prompt
        const citationCounts: Record<string, number> = {}
        results.forEach(r => {
          if (r.was_mentioned) {
            citationCounts[r.prompt_id] = (citationCounts[r.prompt_id] || 0) + 1
          } else {
            citationCounts[r.prompt_id] = citationCounts[r.prompt_id] || 0
          }
        })

        // Map prompts with their citation counts
        const promptsWithCounts = prompts.map(p => ({
          ...p,
          citation_count: citationCounts[p.id] || 0
        }))

        // Sort by citation count
        const sorted = promptsWithCounts.sort((a, b) => b.citation_count - a.citation_count)

        bestPrompts.value = sorted.slice(0, 5)
        worstPrompts.value = sorted.slice(-5).reverse()
      }
    }
  } catch (error) {
    console.error('Error loading platform data:', error)
  }
}

const getScoreColor = (score: number) => {
  if (score >= 70) return 'text-green-600'
  if (score >= 40) return 'text-yellow-600'
  return 'text-red-600'
}
</script>
