<template>
  <div class="min-h-screen bg-background overflow-hidden">
    <!-- Hero Section with Gradient Background -->
    <header class="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      <!-- Animated Background Elements -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute top-20 left-10 w-72 h-72 bg-brand/20 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute bottom-20 right-10 w-96 h-96 bg-brand/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-3xl"></div>
        <!-- Grid Pattern Overlay -->
        <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 40px 40px;"></div>
      </div>

      <nav class="relative container mx-auto px-4 py-6 z-10">
        <div class="flex items-center justify-between">
          <img src="/brand/logo_text_bright.png" alt="Columbus" class="h-10" />
          <div class="flex items-center gap-4">
            <template v-if="user">
              <NuxtLink to="/dashboard" class="btn-primary shadow-lg shadow-brand/30 hover:shadow-brand/50 hover:scale-105 transition-all">
                Dashboard
              </NuxtLink>
            </template>
            <template v-else>
              <NuxtLink to="/auth/login" class="text-gray-300 hover:text-white transition-colors">
                Sign In
              </NuxtLink>
              <NuxtLink to="/auth/signup" class="btn-primary shadow-lg shadow-brand/30 hover:shadow-brand/50 hover:scale-105 transition-all">
                Start Free Audit
              </NuxtLink>
            </template>
          </div>
        </div>
      </nav>

      <div class="relative container mx-auto px-4 pt-20 pb-32 text-center z-10">
        <!-- Floating Badge -->
        <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8 animate-fade-in-down">
          <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span class="text-gray-300 text-sm">Free Forever AEO Platform</span>
        </div>

        <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in-up">
          Get <span class="brand-text bg-gradient-to-r from-brand to-yellow-400 bg-clip-text text-transparent">Discovered</span> by AI
        </h1>
        <p class="text-xl text-gray-300 mb-10 max-w-3xl mx-auto animate-fade-in-up" style="animation-delay: 0.1s;">
          The only AEO platform with 100% authentic data and full ToS compliance.
          Track your visibility across ChatGPT, Claude, Gemini, Perplexity, and Google AI Overview.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up" style="animation-delay: 0.2s;">
          <button
            @click="showWaitlistModal = true"
            class="group btn-primary px-8 py-4 text-lg shadow-xl shadow-brand/30 hover:shadow-brand/50 hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            Scan for Free
            <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <a
            href="#how-it-works"
            class="px-8 py-4 text-lg rounded-lg font-medium border border-white/30 text-white hover:bg-white/10 transition-all backdrop-blur-sm"
          >
            See How It Works
          </a>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-6 text-gray-400 text-sm animate-fade-in-up" style="animation-delay: 0.3s;">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>Free forever tier</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>100% ToS compliant</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>Real user data</span>
          </div>
        </div>

        <!-- AI Engines Logos -->
        <div class="mt-16 pt-8 border-t border-white/10">
          <p class="text-gray-500 text-sm mb-6">Track visibility across 6 AI platforms</p>
          <div class="flex flex-wrap items-center justify-center gap-6 opacity-60">
            <div class="flex items-center gap-2 text-white">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg>
              <span class="font-medium text-sm">ChatGPT</span>
            </div>
            <div class="flex items-center gap-2 text-white">
              <!-- Gemini Logo -->
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path d="M12 24c-1.5-9.9-2.1-10.5-12-12 9.9-1.5 10.5-2.1 12-12 1.5 9.9 2.1 10.5 12 12-9.9 1.5-10.5 2.1-12 12z" fill="url(#gemini-gradient)"/>
                <defs>
                  <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#4285F4"/>
                    <stop offset="50%" stop-color="#9B72CB"/>
                    <stop offset="100%" stop-color="#D96570"/>
                  </linearGradient>
                </defs>
              </svg>
              <span class="font-medium text-sm">Gemini</span>
            </div>
            <div class="flex items-center gap-2 text-white">
              <!-- Claude Logo -->
              <svg class="w-6 h-6" viewBox="0 0 256 257">
                <path fill="#d97757" d="m50.228 170.321l50.357-28.257l.843-2.463l-.843-1.361h-2.462l-8.426-.518l-28.775-.778l-24.952-1.037l-24.175-1.296l-6.092-1.297L0 125.796l.583-3.759l5.12-3.434l7.324.648l16.202 1.101l24.304 1.685l17.629 1.037l26.118 2.722h4.148l.583-1.685l-1.426-1.037l-1.101-1.037l-25.147-17.045l-27.22-18.017l-14.258-10.37l-7.713-5.25l-3.888-4.925l-1.685-10.758l7-7.713l9.397.649l2.398.648l9.527 7.323l20.35 15.75L94.817 91.9l3.889 3.24l1.555-1.102l.195-.777l-1.75-2.917l-14.453-26.118l-15.425-26.572l-6.87-11.018l-1.814-6.61c-.648-2.723-1.102-4.991-1.102-7.778l7.972-10.823L71.42 0l10.63 1.426l4.472 3.888l6.61 15.101l10.694 23.786l16.591 32.34l4.861 9.592l2.592 8.879l.973 2.722h1.685v-1.556l1.36-18.211l2.528-22.36l2.463-28.776l.843-8.1l4.018-9.722l7.971-5.25l6.222 2.981l5.12 7.324l-.713 4.73l-3.046 19.768l-5.962 30.98l-3.889 20.739h2.268l2.593-2.593l10.499-13.934l17.628-22.036l7.778-8.749l9.073-9.657l5.833-4.601h11.018l8.1 12.055l-3.628 12.443l-11.342 14.388l-9.398 12.184l-13.48 18.147l-8.426 14.518l.778 1.166l2.01-.194l30.46-6.481l16.462-2.982l19.637-3.37l8.88 4.148l.971 4.213l-3.5 8.62l-20.998 5.184l-24.628 4.926l-36.682 8.685l-.454.324l.519.648l16.526 1.555l7.065.389h17.304l32.21 2.398l8.426 5.574l5.055 6.805l-.843 5.184l-12.962 6.611l-17.498-4.148l-40.83-9.721l-14-3.5h-1.944v1.167l11.666 11.406l21.387 19.314l26.767 24.887l1.36 6.157l-3.434 4.86l-3.63-.518l-23.526-17.693l-9.073-7.972l-20.545-17.304h-1.36v1.814l4.73 6.935l25.017 37.59l1.296 11.536l-1.814 3.76l-6.481 2.268l-7.13-1.297l-14.647-20.544l-15.1-23.138l-12.185-20.739l-1.49.843l-7.194 77.448l-3.37 3.953l-7.778 2.981l-6.48-4.925l-3.436-7.972l3.435-15.749l4.148-20.544l3.37-16.333l3.046-20.285l1.815-6.74l-.13-.454l-1.49.194l-15.295 20.999l-23.267 31.433l-18.406 19.702l-4.407 1.75l-7.648-3.954l.713-7.064l4.277-6.286l25.47-32.405l15.36-20.092l9.917-11.6l-.065-1.686h-.583L44.07 198.125l-12.055 1.555l-5.185-4.86l.648-7.972l2.463-2.593l20.35-13.999z"/>
              </svg>
              <span class="font-medium text-sm">Claude</span>
            </div>
            <div class="flex items-center gap-2 text-white">
              <!-- Perplexity Logo -->
              <svg class="w-6 h-6" viewBox="0 0 256 298">
                <path fill="#20B8CD" d="m34.831 0l84.689 78.028V.18h16.486v78.197L221.074 0v88.964H256v128.322h-34.819v79.218l-85.175-74.833v75.692H119.52v-74.459l-84.593 74.508v-80.126H0V88.964h34.831zm72.26 105.248H16.487v95.753h18.42v-30.204zm-55.68 72.775v83.052l68.109-59.988v-84.926zm85.069 22.27v-84.212l68.128 61.865v39.34h.088v42.94zm84.701.708h18.333v-95.753h-89.93l71.597 64.87zM204.588 88.964V37.457l-55.904 51.507zm-97.368 0H51.317V37.457z"/>
              </svg>
              <span class="font-medium text-sm">Perplexity</span>
            </div>
            <div class="flex items-center gap-2 text-white">
              <!-- Google AI Overview -->
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span class="font-medium text-sm">AI Overview</span>
            </div>
            <div class="flex items-center gap-2 text-white">
              <!-- Google AI Mode -->
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path d="M12 24c-1.5-9.9-2.1-10.5-12-12 9.9-1.5 10.5-2.1 12-12 1.5 9.9 2.1 10.5 12 12-9.9 1.5-10.5 2.1-12 12z" fill="url(#ai-mode-gradient)"/>
                <defs>
                  <linearGradient id="ai-mode-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#4285F4"/>
                    <stop offset="100%" stop-color="#34A853"/>
                  </linearGradient>
                </defs>
              </svg>
              <span class="font-medium text-sm">AI Mode</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Curved Bottom Edge -->
      <div class="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F5F5F5"/>
        </svg>
      </div>
    </header>

    <!-- Problem/Solution -->
    <section class="py-24 bg-background">
      <div class="container mx-auto px-4">
        <div class="max-w-5xl mx-auto">
          <!-- Section Header -->
          <div class="text-center mb-16">
            <span class="inline-block px-4 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium mb-4">The Industry Problem</span>
            <h2 class="text-4xl md:text-5xl font-bold mb-4">
              Why Current AEO Tools <span class="brand-text">Fail</span>
            </h2>
            <p class="text-xl text-gray-600 max-w-2xl mx-auto">
              Every AEO tool falls into one of two camps—and both have critical flaws.
            </p>
          </div>

          <div class="grid md:grid-cols-2 gap-8 mb-12">
            <!-- Camp 1: API-based -->
            <div class="group relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-red-300 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10">
              <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-500 rounded-t-2xl"></div>
              <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <span class="text-sm font-medium text-red-500 bg-red-50 px-3 py-1 rounded-full">Camp 1</span>
              </div>
              <h3 class="text-xl font-bold mb-3 text-gray-900">API-Based Tools</h3>
              <p class="text-gray-600 leading-relaxed mb-4">
                Use official AI platform APIs for data collection. Sounds legit, but...
              </p>
              <ul class="space-y-2 text-sm text-gray-500">
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                  <span>API responses differ from real user interface results</span>
                </li>
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                  <span>Different citation strategies than what users see</span>
                </li>
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                  <span>API is a black box—you don't know what you're measuring</span>
                </li>
              </ul>
            </div>

            <!-- Camp 2: Scraping -->
            <div class="group relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-red-300 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10">
              <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-500 rounded-t-2xl"></div>
              <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span class="text-sm font-medium text-red-500 bg-red-50 px-3 py-1 rounded-full">Camp 2</span>
              </div>
              <h3 class="text-xl font-bold mb-3 text-gray-900">Web Scraping Tools</h3>
              <p class="text-gray-600 leading-relaxed mb-4">
                Emulate real users with bots and proxy infrastructure. Better data, but...
              </p>
              <ul class="space-y-2 text-sm text-gray-500">
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                  <span>Violates Terms of Service of all AI platforms</span>
                </li>
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                  <span>Expensive proxy infrastructure drives prices up ($500+/mo)</span>
                </li>
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                  <span>Risk of account bans and service disruption</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Columbus Solution -->
          <div class="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-white overflow-hidden">
            <div class="absolute top-0 right-0 w-64 h-64 bg-brand/20 rounded-full blur-3xl"></div>
            <div class="absolute bottom-0 left-0 w-48 h-48 bg-brand/10 rounded-full blur-3xl"></div>
            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-6">
                <span class="text-sm font-medium text-brand bg-brand/20 px-3 py-1 rounded-full">The Columbus Way</span>
              </div>
              <h3 class="text-2xl md:text-3xl font-bold mb-4">A Completely Different Approach</h3>
              <p class="text-gray-300 text-lg mb-6 max-w-2xl">
                Columbus shifts the scanning to you. Use your own AI platform accounts and subscriptions.
                Run scans via our desktop app—manually or on autopilot. The result?
              </p>
              <div class="grid sm:grid-cols-3 gap-6">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 class="font-semibold mb-1">100% Authentic Data</h4>
                    <p class="text-sm text-gray-400">Exactly what real users see in AI interfaces</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 class="font-semibold mb-1">100% ToS Compliant</h4>
                    <p class="text-sm text-gray-400">Your accounts, your subscriptions, your free usage</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 class="font-semibold mb-1">Free Forever Tier</h4>
                    <p class="text-sm text-gray-400">No infrastructure costs = truly free AEO</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works" class="py-24 bg-gradient-to-b from-background to-white">
      <div class="container mx-auto px-4">
        <!-- Section Header -->
        <div class="text-center mb-20">
          <span class="inline-block px-4 py-1 bg-brand/10 text-brand rounded-full text-sm font-medium mb-4">Simple Process</span>
          <h2 class="text-4xl md:text-5xl font-bold mb-4">
            How <span class="brand-text">Columbus</span> Works
          </h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Three simple steps to dominate AI search results
          </p>
        </div>

        <div class="max-w-6xl mx-auto relative">
          <!-- Connection Line (Desktop) -->
          <div class="hidden md:block absolute top-24 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-brand via-brand to-brand"></div>

          <div class="grid md:grid-cols-3 gap-12">
            <!-- Step 1 -->
            <div class="relative text-center">
              <div class="relative z-10 w-20 h-20 bg-gradient-to-br from-brand to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-brand/30 rotate-3 hover:rotate-0 transition-transform">
                <span class="text-3xl font-bold text-white">1</span>
              </div>
              <div class="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
                <div class="w-14 h-14 bg-brand/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg class="w-7 h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 class="text-xl font-bold mb-3 text-gray-900">Scan Your Visibility</h3>
                <p class="text-gray-600 leading-relaxed">
                  We test 50+ prompts across ChatGPT, Claude, Gemini, and Perplexity to see if your brand appears.
                </p>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="relative text-center md:mt-8">
              <div class="relative z-10 w-20 h-20 bg-gradient-to-br from-brand to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-brand/30 -rotate-3 hover:rotate-0 transition-transform">
                <span class="text-3xl font-bold text-white">2</span>
              </div>
              <div class="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
                <div class="w-14 h-14 bg-brand/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg class="w-7 h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 class="text-xl font-bold mb-3 text-gray-900">Find Your Gaps</h3>
                <p class="text-gray-600 leading-relaxed">
                  Discover where competitors appear but you don't. Understand why with automated gap analysis.
                </p>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="relative text-center">
              <div class="relative z-10 w-20 h-20 bg-gradient-to-br from-brand to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-brand/30 rotate-3 hover:rotate-0 transition-transform">
                <span class="text-3xl font-bold text-white">3</span>
              </div>
              <div class="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
                <div class="w-14 h-14 bg-brand/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg class="w-7 h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 class="text-xl font-bold mb-3 text-gray-900">Implement Fixes</h3>
                <p class="text-gray-600 leading-relaxed">
                  Get platform-specific guides with code snippets. No guessing, no technical knowledge required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-24 bg-white">
      <div class="container mx-auto px-4">
        <!-- Section Header -->
        <div class="text-center mb-16">
          <span class="inline-block px-4 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium mb-4">Features</span>
          <h2 class="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to <span class="brand-text">Win</span> in AI
          </h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            A complete toolkit to monitor, analyze, and optimize your AI visibility
          </p>
        </div>

        <div class="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Feature 1: Desktop App -->
          <div class="group p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-brand/30 hover:shadow-lg transition-all duration-300">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold mb-2 text-gray-900">Desktop Scanning App</h3>
            <p class="text-gray-600 text-sm leading-relaxed">
              Run scans manually or set up daily auto-scans. Uses your own AI accounts for 100% authentic data.
            </p>
          </div>

          <!-- Feature 2: 6 Platforms -->
          <div class="group p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-brand/30 hover:shadow-lg transition-all duration-300">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 class="text-lg font-bold mb-2 text-gray-900">6 AI Platforms</h3>
            <p class="text-gray-600 text-sm leading-relaxed">
              Track visibility across ChatGPT, Claude, Gemini, Perplexity, Google AI Overview, and AI Mode.
            </p>
          </div>

          <!-- Feature 3: Competitor Tracking -->
          <div class="group p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-brand/30 hover:shadow-lg transition-all duration-300">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-green-500/20">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold mb-2 text-gray-900">Competitor Tracking</h3>
            <p class="text-gray-600 text-sm leading-relaxed">
              See which competitors get cited, which of their pages appear, and identify your competitive gaps.
            </p>
          </div>

          <!-- Feature 4: Citation Tracking -->
          <div class="group p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-brand/30 hover:shadow-lg transition-all duration-300">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-yellow-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-brand/20">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 class="text-lg font-bold mb-2 text-gray-900">Citation & Source Tracking</h3>
            <p class="text-gray-600 text-sm leading-relaxed">
              Know exactly which of your pages get cited by AI. Understand what content drives AI mentions.
            </p>
          </div>

          <!-- Feature 5: AI Recommendations -->
          <div class="group p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-brand/30 hover:shadow-lg transition-all duration-300">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/20">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold mb-2 text-gray-900">AI-Powered Recommendations</h3>
            <p class="text-gray-600 text-sm leading-relaxed">
              Get actionable improvement suggestions based on AI response analysis and gap identification.
            </p>
          </div>

          <!-- Feature 6: Website SDK -->
          <div class="group p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-brand/30 hover:shadow-lg transition-all duration-300">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 class="text-lg font-bold mb-2 text-gray-900">Website SDK</h3>
            <p class="text-gray-600 text-sm leading-relaxed">
              Integrate our SDK to analyze how AIs read and use your website content in real-time.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section class="py-24 bg-gradient-to-b from-white to-background relative overflow-hidden">
      <!-- Background Decoration -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand/5 rounded-full blur-3xl -z-10"></div>

      <div class="container mx-auto px-4">
        <!-- Section Header -->
        <div class="text-center mb-16">
          <span class="inline-block px-4 py-1 bg-brand/10 text-brand rounded-full text-sm font-medium mb-4">Pricing</span>
          <h2 class="text-4xl md:text-5xl font-bold mb-4">
            Simple <span class="brand-text">Pricing</span>
          </h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free, upgrade when you're ready. No hidden fees.
          </p>
        </div>

        <div class="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 items-start">
          <!-- Free Plan -->
          <div class="bg-white rounded-2xl p-8 border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900">Free</h3>
            </div>
            <div class="mb-6">
              <span class="text-5xl font-bold text-gray-900">$0</span>
              <span class="text-gray-500 ml-1">forever</span>
            </div>
            <p class="text-gray-600 text-sm mb-6">Full AEO platform, limited scale</p>
            <ul class="space-y-4 mb-8">
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-700">1 product</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-700">10 prompts per product</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-700">All 6 AI platforms</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-700">Desktop app included</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-700">Visibility tracking</span>
              </li>
            </ul>
            <button
              @click="showWaitlistModal = true"
              class="w-full py-3 px-6 rounded-xl font-medium border-2 border-gray-200 text-gray-700 hover:border-brand hover:text-brand transition-all"
            >
              Get Started Free
            </button>
          </div>

          <!-- Pro Plan - Featured -->
          <div class="relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-2xl md:scale-105 md:-my-4">
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand to-yellow-400 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
              MOST POPULAR
            </div>
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 rounded-lg bg-brand/20 flex items-center justify-center">
                <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold">Pro</h3>
            </div>
            <div class="mb-6">
              <span class="text-5xl font-bold">$49</span>
              <span class="text-gray-400 ml-1">/month</span>
            </div>
            <p class="text-gray-400 text-sm mb-6">Full analytics and actionable insights</p>
            <ul class="space-y-4 mb-8">
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-200">5 products</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-200">100 prompts per product</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-200">Competitor tracking</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-200">Citation & source tracking</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-200">AI recommendations & gap analysis</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-200">Multi-region support</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-200">Website SDK included</span>
              </li>
            </ul>
            <button
              @click="showWaitlistModal = true"
              class="w-full py-3 px-6 rounded-xl font-medium bg-gradient-to-r from-brand to-yellow-500 text-white hover:shadow-lg hover:shadow-brand/30 transition-all"
            >
              Get Started
            </button>
          </div>

          <!-- Agency Plan -->
          <div class="bg-white rounded-2xl p-8 border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900">Agency</h3>
            </div>
            <div class="mb-6">
              <span class="text-5xl font-bold text-gray-900">$149</span>
              <span class="text-gray-500 ml-1">/month</span>
            </div>
            <p class="text-gray-600 text-sm mb-6">Scale across multiple clients</p>
            <ul class="space-y-4 mb-8">
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-700">Everything in Pro</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-700">Up to 500 products</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-700">Unlimited prompts</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-700">White-label reports</span>
              </li>
              <li class="flex items-center gap-3">
                <svg class="w-5 h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-700">Client website SDK integration</span>
              </li>
            </ul>
            <button
              @click="showWaitlistModal = true"
              class="w-full py-3 px-6 rounded-xl font-medium border-2 border-gray-200 text-gray-700 hover:border-brand hover:text-brand transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      <!-- Background Elements -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute top-0 right-0 w-96 h-96 bg-brand/20 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 left-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl"></div>
        <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 40px 40px;"></div>
      </div>

      <div class="container mx-auto px-4 text-center relative z-10">
        <h2 class="text-4xl md:text-5xl font-bold mb-6 text-white">
          Ready to <span class="brand-text bg-gradient-to-r from-brand to-yellow-400 bg-clip-text text-transparent">Dominate</span> AI Search?
        </h2>
        <p class="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          Start scanning for free today. See exactly where you rank across all major AI platforms.
        </p>
        <button
          @click="showWaitlistModal = true"
          class="group inline-flex items-center gap-2 bg-gradient-to-r from-brand to-yellow-500 text-white px-8 py-4 text-lg rounded-xl font-medium shadow-xl shadow-brand/30 hover:shadow-brand/50 hover:scale-105 transition-all"
        >
          Start Scanning Free
          <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
        <p class="text-gray-500 text-sm mt-6">No credit card required</p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-400 py-16">
      <div class="container mx-auto px-4">
        <div class="grid md:grid-cols-4 gap-12 mb-12">
          <div class="md:col-span-2">
            <img src="/brand/logo_text_bright.png" alt="Columbus" class="h-10 mb-4" />
            <p class="text-gray-500 max-w-sm">
              The AI Engine Optimization platform that helps you get discovered by ChatGPT, Claude, Gemini, and Perplexity.
            </p>
          </div>
          <div>
            <h4 class="text-white font-semibold mb-4">Product</h4>
            <ul class="space-y-2">
              <li><a href="#how-it-works" class="hover:text-brand transition-colors">How it Works</a></li>
              <li><a href="#" class="hover:text-brand transition-colors">Features</a></li>
              <li><a href="#" class="hover:text-brand transition-colors">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-semibold mb-4">Legal</h4>
            <ul class="space-y-2">
              <li><a href="#" class="hover:text-brand transition-colors">Privacy Policy</a></li>
              <li><a href="#" class="hover:text-brand transition-colors">Terms of Service</a></li>
              <li><a href="#" class="hover:text-brand transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div class="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <span class="text-gray-500 text-sm">&copy; 2025 Columbus. All rights reserved.</span>
          <div class="flex items-center gap-4">
            <a href="#" class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>

    <!-- Waitlist Modal -->
    <div
      v-if="showWaitlistModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="showWaitlistModal = false"
    >
      <div class="bg-background-highlight rounded-lg p-8 max-w-md w-full border border-border">
        <h3 class="text-2xl font-bold mb-4">
          Start <span class="brand-text">Scanning Free</span>
        </h3>
        <p class="text-gray-600 mb-6">
          Enter your details to get started with Columbus and begin tracking your AI visibility.
        </p>
        <form @submit.prevent="submitWaitlist" class="space-y-4">
          <div>
            <label class="label">Email</label>
            <input
              v-model="waitlistForm.email"
              type="email"
              required
              class="input"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label class="label">Company Name (Optional)</label>
            <input
              v-model="waitlistForm.companyName"
              type="text"
              class="input"
              placeholder="Your Company"
            />
          </div>
          <div>
            <label class="label">Website (Optional)</label>
            <input
              v-model="waitlistForm.website"
              type="url"
              class="input"
              placeholder="https://yourwebsite.com"
            />
          </div>
          <div class="flex gap-3">
            <button
              type="button"
              @click="showWaitlistModal = false"
              class="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn-primary flex-1"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Submitting...' : 'Get Started' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()

const showWaitlistModal = ref(false)
const isSubmitting = ref(false)
const waitlistForm = ref({
  email: '',
  companyName: '',
  website: ''
})

const submitWaitlist = async () => {
  isSubmitting.value = true
  const supabase = useSupabaseClient()

  try {
    // Call edge function to handle waitlist + email
    const { data, error } = await supabase.functions.invoke('waitlist', {
      body: {
        email: waitlistForm.value.email,
        companyName: waitlistForm.value.companyName,
        website: waitlistForm.value.website,
      }
    })

    if (error) throw error

    alert('Thank you! Check your email to get started with Columbus.')
    showWaitlistModal.value = false
    waitlistForm.value = { email: '', companyName: '', website: '' }
  } catch (error) {
    console.error('Waitlist error:', error)
    alert('Something went wrong. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

useHead({
  title: 'Columbus - AI Engine Optimization Platform | Get Found by ChatGPT, Claude & More',
  meta: [
    {
      name: 'description',
      content: 'Optimize your visibility in AI chatbots like ChatGPT, Claude, Gemini, and Perplexity. Get actionable fix recommendations with platform-specific implementation guides.'
    }
  ]
})
</script>
