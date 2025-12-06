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

      <nav class="relative container mx-auto px-4 py-4 sm:py-6 z-10">
        <div class="flex items-center justify-between">
          <img src="/brand/logo_text_bright.png" alt="Columbus" class="h-8 sm:h-10" />
          <div class="flex items-center gap-2 sm:gap-4">
            <template v-if="waitlistMode">
              <button
                @click="openWaitlist('free')"
                class="btn-primary text-sm sm:text-base px-3 sm:px-4 py-2 shadow-lg shadow-brand/30 hover:shadow-brand/50 hover:scale-105 transition-all"
              >
                Join Waitlist
              </button>
            </template>
            <template v-else-if="user">
              <NuxtLink to="/dashboard" class="btn-primary text-sm sm:text-base px-3 sm:px-4 py-2 shadow-lg shadow-brand/30 hover:shadow-brand/50 hover:scale-105 transition-all">
                Dashboard
              </NuxtLink>
            </template>
            <template v-else>
              <NuxtLink to="/auth/login" class="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                Sign In
              </NuxtLink>
              <NuxtLink to="/auth/signup" class="btn-primary text-sm sm:text-base px-3 sm:px-4 py-2 shadow-lg shadow-brand/30 hover:shadow-brand/50 hover:scale-105 transition-all">
                <span class="hidden sm:inline">Start Free Audit</span>
                <span class="sm:hidden">Start Free</span>
              </NuxtLink>
            </template>
          </div>
        </div>
      </nav>

      <div class="relative container mx-auto px-4 pt-12 sm:pt-20 pb-20 sm:pb-32 text-center z-10">
        <!-- Floating Badge - Emphasized FREE -->
        <div class="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-6 sm:mb-8 animate-fade-in-down">
          <span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          <span class="text-emerald-300 text-xs sm:text-sm font-medium">100% FREE AEO Platform - No Credit Card Required</span>
        </div>

        <h1 class="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight animate-fade-in-up">
          Start Appearing in <span class="brand-text bg-gradient-to-r from-brand to-yellow-400 bg-clip-text text-transparent">AI Answers</span> Fast
        </h1>
        <p class="text-base sm:text-xl text-gray-300 mb-4 sm:mb-6 max-w-3xl mx-auto animate-fade-in-up px-2" style="animation-delay: 0.1s;">
          The only <span class="text-emerald-400 font-semibold">completely free</span> AEO platform with 100% authentic data and full ToS compliance.
        </p>
        <p class="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto animate-fade-in-up px-4" style="animation-delay: 0.15s;">
          AEO works for companies of any size—even new ones. Answer the right questions, optimize your online presence, and see results immediately. <span class="text-white">Track your visibility for free</span>, then fix issues fast with actionable recommendations.
        </p>

        <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 animate-fade-in-up px-4" style="animation-delay: 0.2s;">
          <button
            @click="handleStartScanning"
            class="group btn-primary px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-xl shadow-brand/30 hover:shadow-brand/50 hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            Start Scanning Free
            <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <a
            href="#pricing"
            class="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-lg font-medium border border-white/30 text-white hover:bg-white/10 transition-all backdrop-blur-sm"
          >
            Get Mentioned Fast
          </a>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-gray-400 text-xs sm:text-sm animate-fade-in-up" style="animation-delay: 0.3s;">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span class="text-emerald-300 font-medium">Free forever</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 text-brand" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>100% ToS compliant</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 text-brand" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>Real user data</span>
          </div>
        </div>

        <!-- AI Engines Logos -->
        <div class="mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-white/10">
          <p class="text-gray-500 text-xs sm:text-sm mb-4 sm:mb-6">Track visibility across 6 AI platforms</p>
          <div class="flex flex-wrap items-center justify-center gap-3 sm:gap-6 opacity-60">
            <div class="flex items-center gap-1.5 sm:gap-2 text-white">
              <svg class="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg>
              <span class="font-medium text-xs sm:text-sm">ChatGPT</span>
            </div>
            <div class="flex items-center gap-1.5 sm:gap-2 text-white">
              <!-- Gemini Logo -->
              <svg class="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none">
                <path d="M12 24c-1.5-9.9-2.1-10.5-12-12 9.9-1.5 10.5-2.1 12-12 1.5 9.9 2.1 10.5 12 12-9.9 1.5-10.5 2.1-12 12z" fill="url(#gemini-gradient)"/>
                <defs>
                  <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#4285F4"/>
                    <stop offset="50%" stop-color="#9B72CB"/>
                    <stop offset="100%" stop-color="#D96570"/>
                  </linearGradient>
                </defs>
              </svg>
              <span class="font-medium text-xs sm:text-sm">Gemini</span>
            </div>
            <div class="flex items-center gap-1.5 sm:gap-2 text-white">
              <!-- Claude Logo -->
              <svg class="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 256 257">
                <path fill="#d97757" d="m50.228 170.321l50.357-28.257l.843-2.463l-.843-1.361h-2.462l-8.426-.518l-28.775-.778l-24.952-1.037l-24.175-1.296l-6.092-1.297L0 125.796l.583-3.759l5.12-3.434l7.324.648l16.202 1.101l24.304 1.685l17.629 1.037l26.118 2.722h4.148l.583-1.685l-1.426-1.037l-1.101-1.037l-25.147-17.045l-27.22-18.017l-14.258-10.37l-7.713-5.25l-3.888-4.925l-1.685-10.758l7-7.713l9.397.649l2.398.648l9.527 7.323l20.35 15.75L94.817 91.9l3.889 3.24l1.555-1.102l.195-.777l-1.75-2.917l-14.453-26.118l-15.425-26.572l-6.87-11.018l-1.814-6.61c-.648-2.723-1.102-4.991-1.102-7.778l7.972-10.823L71.42 0l10.63 1.426l4.472 3.888l6.61 15.101l10.694 23.786l16.591 32.34l4.861 9.592l2.592 8.879l.973 2.722h1.685v-1.556l1.36-18.211l2.528-22.36l2.463-28.776l.843-8.1l4.018-9.722l7.971-5.25l6.222 2.981l5.12 7.324l-.713 4.73l-3.046 19.768l-5.962 30.98l-3.889 20.739h2.268l2.593-2.593l10.499-13.934l17.628-22.036l7.778-8.749l9.073-9.657l5.833-4.601h11.018l8.1 12.055l-3.628 12.443l-11.342 14.388l-9.398 12.184l-13.48 18.147l-8.426 14.518l.778 1.166l2.01-.194l30.46-6.481l16.462-2.982l19.637-3.37l8.88 4.148l.971 4.213l-3.5 8.62l-20.998 5.184l-24.628 4.926l-36.682 8.685l-.454.324l.519.648l16.526 1.555l7.065.389h17.304l32.21 2.398l8.426 5.574l5.055 6.805l-.843 5.184l-12.962 6.611l-17.498-4.148l-40.83-9.721l-14-3.5h-1.944v1.167l11.666 11.406l21.387 19.314l26.767 24.887l1.36 6.157l-3.434 4.86l-3.63-.518l-23.526-17.693l-9.073-7.972l-20.545-17.304h-1.36v1.814l4.73 6.935l25.017 37.59l1.296 11.536l-1.814 3.76l-6.481 2.268l-7.13-1.297l-14.647-20.544l-15.1-23.138l-12.185-20.739l-1.49.843l-7.194 77.448l-3.37 3.953l-7.778 2.981l-6.48-4.925l-3.436-7.972l3.435-15.749l4.148-20.544l3.37-16.333l3.046-20.285l1.815-6.74l-.13-.454l-1.49.194l-15.295 20.999l-23.267 31.433l-18.406 19.702l-4.407 1.75l-7.648-3.954l.713-7.064l4.277-6.286l25.47-32.405l15.36-20.092l9.917-11.6l-.065-1.686h-.583L44.07 198.125l-12.055 1.555l-5.185-4.86l.648-7.972l2.463-2.593l20.35-13.999z"/>
              </svg>
              <span class="font-medium text-xs sm:text-sm">Claude</span>
            </div>
            <div class="flex items-center gap-1.5 sm:gap-2 text-white">
              <!-- Perplexity Logo -->
              <svg class="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 256 298">
                <path fill="#20B8CD" d="m34.831 0l84.689 78.028V.18h16.486v78.197L221.074 0v88.964H256v128.322h-34.819v79.218l-85.175-74.833v75.692H119.52v-74.459l-84.593 74.508v-80.126H0V88.964h34.831zm72.26 105.248H16.487v95.753h18.42v-30.204zm-55.68 72.775v83.052l68.109-59.988v-84.926zm85.069 22.27v-84.212l68.128 61.865v39.34h.088v42.94zm84.701.708h18.333v-95.753h-89.93l71.597 64.87zM204.588 88.964V37.457l-55.904 51.507zm-97.368 0H51.317V37.457z"/>
              </svg>
              <span class="font-medium text-xs sm:text-sm">Perplexity</span>
            </div>
            <div class="flex items-center gap-1.5 sm:gap-2 text-white">
              <!-- Google AI Overview -->
              <svg class="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span class="font-medium text-xs sm:text-sm hidden sm:inline">AI Overview</span>
              <span class="font-medium text-xs sm:hidden">AIO</span>
            </div>
            <div class="flex items-center gap-1.5 sm:gap-2 text-white">
              <!-- Google AI Mode -->
              <svg class="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none">
                <path d="M12 24c-1.5-9.9-2.1-10.5-12-12 9.9-1.5 10.5-2.1 12-12 1.5 9.9 2.1 10.5 12 12-9.9 1.5-10.5 2.1-12 12z" fill="url(#ai-mode-gradient)"/>
                <defs>
                  <linearGradient id="ai-mode-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#4285F4"/>
                    <stop offset="100%" stop-color="#34A853"/>
                  </linearGradient>
                </defs>
              </svg>
              <span class="font-medium text-xs sm:text-sm hidden sm:inline">AI Mode</span>
              <span class="font-medium text-xs sm:hidden">AIM</span>
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

    <!-- Live Dashboard Preview - First Section -->
    <LandingDashboardPreview id="live-dashboard" />

    <!-- Problem/Solution -->
    <section class="py-16 sm:py-24 bg-background">
      <div class="container mx-auto px-4">
        <div class="max-w-5xl mx-auto">
          <!-- Section Header -->
          <div class="text-center mb-10 sm:mb-16">
            <span class="inline-block px-3 sm:px-4 py-1 bg-brand/10 text-brand rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">The Problem</span>
            <h2 class="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              The Flaw of Current <span class="brand-text">AEO Tools</span>
            </h2>
            <p class="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-2">
              Every AEO tool falls into one of two camps, and both have critical flaws.
            </p>
          </div>

          <div class="grid md:grid-cols-2 gap-4 sm:gap-8 mb-8 sm:mb-12">
            <!-- Camp 1: API-based -->
            <div class="group p-5 sm:p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300">
              <!-- Header -->
              <div class="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg class="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg sm:text-xl font-bold text-gray-900">API-Based Tools</h3>
                  <p class="text-xs sm:text-sm text-gray-500">Official APIs for data collection</p>
                </div>
              </div>

              <!-- Issues list -->
              <ul class="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <li class="flex items-start gap-2 sm:gap-3">
                  <svg class="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-sm sm:text-base text-gray-700">API responses differ from real user results</span>
                </li>
                <li class="flex items-start gap-2 sm:gap-3">
                  <svg class="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-sm sm:text-base text-gray-700">Different citation strategies than UI</span>
                </li>
                <li class="flex items-start gap-2 sm:gap-3">
                  <svg class="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-sm sm:text-base text-gray-700">Black box with unknown processing</span>
                </li>
              </ul>

              <!-- Bottom indicator -->
              <div class="pt-3 sm:pt-4 border-t border-gray-100">
                <div class="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-red-50 text-red-600 text-xs sm:text-sm font-medium">
                  <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                  Unreliable data
                </div>
              </div>
            </div>

            <!-- Camp 2: Scraping -->
            <div class="group p-5 sm:p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300">
              <!-- Header -->
              <div class="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg class="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg sm:text-xl font-bold text-gray-900">Web Scraping Tools</h3>
                  <p class="text-xs sm:text-sm text-gray-500">Bots and proxy infrastructure</p>
                </div>
              </div>

              <!-- Issues list -->
              <ul class="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <li class="flex items-start gap-2 sm:gap-3">
                  <svg class="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-sm sm:text-base text-gray-700">Violates Terms of Service of all AI platforms</span>
                </li>
                <li class="flex items-start gap-2 sm:gap-3">
                  <svg class="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-sm sm:text-base text-gray-700">Expensive proxy infrastructure</span>
                </li>
                <li class="flex items-start gap-2 sm:gap-3">
                  <svg class="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-sm sm:text-base text-gray-700">Risk of account bans and disruption</span>
                </li>
              </ul>

              <!-- Bottom indicator -->
              <div class="pt-3 sm:pt-4 border-t border-gray-100">
                <div class="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-red-50 text-red-600 text-xs sm:text-sm font-medium">
                  <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                  ToS violation risk
                </div>
              </div>
            </div>
          </div>

          <!-- Columbus Solution -->
          <div class="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 sm:p-8 md:p-12 text-white overflow-hidden">
            <div class="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-brand/20 rounded-full blur-3xl"></div>
            <div class="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-brand/10 rounded-full blur-3xl"></div>
            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-4 sm:mb-6">
                <span class="text-xs sm:text-sm font-medium text-brand bg-brand/20 px-2.5 sm:px-3 py-1 rounded-full">The Columbus Way</span>
              </div>
              <h3 class="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">A Completely Different Approach</h3>
              <p class="text-gray-300 text-sm sm:text-lg mb-4 sm:mb-6 max-w-2xl">
                Columbus shifts the scanning to you. Use your own AI platform accounts and subscriptions.
                Run scans via our desktop app, manually or on autopilot. The result?
              </p>
              <div class="grid sm:grid-cols-3 gap-4 sm:gap-6">
                <div class="flex items-start gap-2 sm:gap-3">
                  <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-brand/20 flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 sm:w-5 sm:h-5 text-brand" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-sm sm:text-base font-semibold mb-0.5 sm:mb-1">100% Authentic Data</h4>
                    <p class="text-xs sm:text-sm text-gray-400">Exactly what real users see in AI interfaces</p>
                  </div>
                </div>
                <div class="flex items-start gap-2 sm:gap-3">
                  <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-brand/20 flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 sm:w-5 sm:h-5 text-brand" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-sm sm:text-base font-semibold mb-0.5 sm:mb-1">100% ToS Compliant</h4>
                    <p class="text-xs sm:text-sm text-gray-400">Your accounts, your subscriptions, your free usage</p>
                  </div>
                </div>
                <div class="flex items-start gap-2 sm:gap-3">
                  <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-brand/20 flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 sm:w-5 sm:h-5 text-brand" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-sm sm:text-base font-semibold mb-0.5 sm:mb-1">Free Forever Tier</h4>
                    <p class="text-xs sm:text-sm text-gray-400">No infrastructure costs means truly free AEO</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works - Animated Flow -->
    <section id="how-it-works" class="py-16 sm:py-24 bg-gradient-to-b from-background to-white overflow-hidden">
      <div class="container mx-auto px-4">
        <!-- Section Header -->
        <div class="text-center mb-10 sm:mb-16">
          <span class="inline-block px-3 sm:px-4 py-1 bg-brand/10 text-brand rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">How It Works</span>
          <h2 class="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            From Scan to <span class="brand-text">Insights</span>
          </h2>
          <p class="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-2">
            A seamless flow from your desktop to actionable insights
          </p>
        </div>

        <!-- Animated Flow Cards -->
        <div class="max-w-6xl mx-auto">
          <div class="grid md:grid-cols-3 gap-4 mb-6 sm:mb-8">
            <LandingFlowCardDesktopScanning />
            <LandingFlowCardAIAnalysis />
            <LandingFlowCardDashboardInsights />
          </div>
        </div>
      </div>
    </section>


    <!-- Features -->
    <section class="py-16 sm:py-24 bg-white">
      <div class="container mx-auto px-4">
        <!-- Section Header -->
        <div class="text-center mb-10 sm:mb-16">
          <span class="inline-block px-3 sm:px-4 py-1 bg-brand/10 text-brand rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">Features</span>
          <h2 class="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            Everything You Need to <span class="brand-text">Win</span> in AI
          </h2>
          <p class="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-2">
            A complete toolkit to monitor, analyze, and optimize your AI visibility
          </p>
        </div>

        <div class="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          <!-- Feature 1: Desktop App -->
          <div class="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-brand/30 hover:shadow-lg transition-all duration-300">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-brand/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-sm sm:text-lg font-bold mb-1 sm:mb-2 text-gray-900">Desktop Scanning App</h3>
            <p class="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Run scans manually or set up daily auto-scans. Uses your own AI accounts for 100% authentic data.
            </p>
          </div>

          <!-- Feature 2: 6 Platforms -->
          <div class="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-brand/30 hover:shadow-lg transition-all duration-300">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-brand/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 class="text-sm sm:text-lg font-bold mb-1 sm:mb-2 text-gray-900">6 AI Platforms</h3>
            <p class="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Track visibility across ChatGPT, Claude, Gemini, Perplexity, Google AI Overview, and AI Mode.
            </p>
          </div>

          <!-- Feature 3: Competitor Tracking -->
          <div class="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-brand/30 hover:shadow-lg transition-all duration-300">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-brand/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-sm sm:text-lg font-bold mb-1 sm:mb-2 text-gray-900">Competitor Tracking</h3>
            <p class="text-gray-600 text-xs sm:text-sm leading-relaxed">
              See which competitors get cited, which of their pages appear, and identify your competitive gaps.
            </p>
          </div>

          <!-- Feature 4: Citation Tracking -->
          <div class="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-brand/30 hover:shadow-lg transition-all duration-300">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-brand/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 class="text-sm sm:text-lg font-bold mb-1 sm:mb-2 text-gray-900">Citation & Source Tracking</h3>
            <p class="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Know exactly which of your pages get cited by AI. Understand what content drives AI mentions.
            </p>
          </div>

          <!-- Feature 5: AI Recommendations -->
          <div class="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-brand/30 hover:shadow-lg transition-all duration-300">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-brand/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 class="text-sm sm:text-lg font-bold mb-1 sm:mb-2 text-gray-900">AI-Powered Recommendations</h3>
            <p class="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Get actionable improvement suggestions based on AI response analysis and gap identification.
            </p>
          </div>

          <!-- Feature 6: Website SDK -->
          <div class="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-brand/30 hover:shadow-lg transition-all duration-300">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-brand/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 class="text-sm sm:text-lg font-bold mb-1 sm:mb-2 text-gray-900">Website SDK</h3>
            <p class="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Integrate our SDK to track AI-driven traffic and measure ROI from your visibility efforts.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" class="py-16 sm:py-24 bg-gradient-to-b from-white to-background relative overflow-hidden">
      <!-- Background Decoration -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-brand/5 rounded-full blur-3xl -z-10"></div>

      <div class="container mx-auto px-4">
        <!-- Section Header -->
        <div class="text-center mb-8 sm:mb-12">
          <span class="inline-block px-3 sm:px-4 py-1 bg-brand/10 text-brand rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">Pricing</span>
          <h2 class="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            Simple <span class="brand-text">Pricing</span>
          </h2>
          <p class="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
            Start free, upgrade when you're ready. No hidden fees.
          </p>

          <!-- Billing Toggle -->
          <div class="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <span class="text-sm sm:text-base" :class="billingPeriod === 'monthly' ? 'text-gray-900 font-medium' : 'text-gray-500'">Monthly</span>
            <button
              @click="billingPeriod = billingPeriod === 'monthly' ? 'yearly' : 'monthly'"
              class="relative w-12 h-6 sm:w-14 sm:h-7 rounded-full transition-colors"
              :class="billingPeriod === 'yearly' ? 'bg-brand' : 'bg-gray-300'"
            >
              <span
                class="absolute top-0.5 left-0.5 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md transition-transform"
                :class="billingPeriod === 'yearly' ? 'translate-x-6 sm:translate-x-7' : 'translate-x-0'"
              />
            </button>
            <span class="text-sm sm:text-base" :class="billingPeriod === 'yearly' ? 'text-gray-900 font-medium' : 'text-gray-500'">
              Yearly
              <span class="ml-1 text-[10px] sm:text-xs bg-green-100 text-green-700 px-1.5 sm:px-2 py-0.5 rounded-full font-medium">Save ~17%</span>
            </span>
          </div>
        </div>

        <div class="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 items-start">
          <template v-for="tier in subscriptionTiers" :key="tier.id">
            <!-- Popular/Featured tier (dark card) -->
            <div
              v-if="tier.is_popular"
              class="relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl p-5 sm:p-8 text-white shadow-2xl sm:col-span-2 md:col-span-1 md:scale-105 md:-my-4"
            >
              <div class="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand to-yellow-400 text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-lg whitespace-nowrap">
                MOST POPULAR
              </div>
              <div class="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 mt-2 sm:mt-0">
                <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-brand/20 flex items-center justify-center">
                  <svg class="w-4 h-4 sm:w-5 sm:h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="getIconSvg(tier.icon)"></svg>
                </div>
                <h3 class="text-lg sm:text-xl font-bold">{{ tier.name }}</h3>
              </div>
              <div class="mb-4 sm:mb-6">
                <span class="text-3xl sm:text-5xl font-bold">{{ formatPrice(billingPeriod === 'yearly' ? tier.yearly_price : tier.monthly_price) }}</span>
                <span class="text-gray-400 ml-1 text-sm sm:text-base">/{{ billingPeriod === 'yearly' ? 'year' : 'month' }}</span>
                <div v-if="billingPeriod === 'yearly' && tier.yearly_price > 0" class="text-xs sm:text-sm text-gray-400 mt-1">
                  {{ getMonthlyEquivalent(tier.yearly_price) }}/month billed annually
                </div>
              </div>
              <p class="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">{{ tier.description }}</p>
              <ul class="space-y-2 sm:space-y-4 mb-6 sm:mb-8">
                <li v-for="feature in tier.highlight_features" :key="feature" class="flex items-center gap-2 sm:gap-3">
                  <svg class="w-4 h-4 sm:w-5 sm:h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-gray-200 text-sm sm:text-base">{{ feature }}</span>
                </li>
              </ul>
              <button
                @click="handlePricingClick(tier.id)"
                :disabled="isProcessingCheckout"
                class="w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base bg-gradient-to-r from-brand to-yellow-500 text-white hover:shadow-lg hover:shadow-brand/30 transition-all disabled:opacity-50"
              >
                <span v-if="isProcessingCheckout && selectedTier === tier.id">Processing...</span>
                <span v-else>Get Started</span>
              </button>
            </div>

            <!-- Regular tier (light card) -->
            <div
              v-else
              class="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg"
            >
              <div class="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center" :class="tier.id === 'free' ? 'bg-gray-100' : 'bg-brand/10'">
                  <svg class="w-4 h-4 sm:w-5 sm:h-5" :class="tier.id === 'free' ? 'text-gray-600' : 'text-brand'" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="getIconSvg(tier.icon)"></svg>
                </div>
                <h3 class="text-lg sm:text-xl font-bold text-gray-900">{{ tier.name }}</h3>
              </div>
              <div class="mb-4 sm:mb-6">
                <span class="text-3xl sm:text-5xl font-bold text-gray-900">{{ formatPrice(billingPeriod === 'yearly' ? tier.yearly_price : tier.monthly_price) }}</span>
                <span class="text-gray-500 ml-1 text-sm sm:text-base">{{ tier.monthly_price === 0 ? 'forever' : (billingPeriod === 'yearly' ? '/year' : '/month') }}</span>
                <div v-if="billingPeriod === 'yearly' && tier.yearly_price > 0" class="text-xs sm:text-sm text-gray-500 mt-1">
                  {{ getMonthlyEquivalent(tier.yearly_price) }}/month billed annually
                </div>
              </div>
              <p class="text-gray-600 text-xs sm:text-sm mb-4 sm:mb-6">{{ tier.description }}</p>
              <ul class="space-y-2 sm:space-y-4 mb-6 sm:mb-8">
                <li v-for="feature in tier.highlight_features" :key="feature" class="flex items-center gap-2 sm:gap-3">
                  <svg class="w-4 h-4 sm:w-5 sm:h-5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-gray-700 text-sm sm:text-base">{{ feature }}</span>
                </li>
              </ul>
              <button
                @click="handlePricingClick(tier.id)"
                :disabled="isProcessingCheckout"
                class="w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base border-2 border-gray-200 text-gray-700 hover:border-brand hover:text-brand transition-all disabled:opacity-50"
              >
                <span v-if="isProcessingCheckout && selectedTier === tier.id">Processing...</span>
                <span v-else>{{ tier.id === 'free' ? 'Get Started Free' : 'Get Started' }}</span>
              </button>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 sm:py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      <!-- Background Elements -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-brand/20 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-brand/10 rounded-full blur-3xl"></div>
        <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 40px 40px;"></div>
      </div>

      <div class="container mx-auto px-4 text-center relative z-10">
        <h2 class="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-white">
          Ready to <span class="brand-text bg-gradient-to-r from-brand to-yellow-400 bg-clip-text text-transparent">Dominate</span> AI Search?
        </h2>
        <p class="text-base sm:text-xl text-gray-300 mb-6 sm:mb-10 max-w-2xl mx-auto px-2">
          Start scanning for free today. See exactly where you rank across all major AI platforms.
        </p>
        <button
          @click="handleStartScanning"
          class="group inline-flex items-center gap-2 bg-gradient-to-r from-brand to-yellow-500 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-xl font-medium shadow-xl shadow-brand/30 hover:shadow-brand/50 hover:scale-105 transition-all"
        >
          Start Scanning Free
          <svg class="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
        <p class="text-gray-500 text-xs sm:text-sm mt-4 sm:mt-6">No credit card required</p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-400 py-10 sm:py-16">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
          <div class="col-span-2">
            <img src="/brand/logo_text_bright.png" alt="Columbus" class="h-8 sm:h-10 mb-3 sm:mb-4" />
            <p class="text-gray-500 text-sm sm:text-base max-w-sm">
              The AI Engine Optimization platform that helps you get discovered by ChatGPT, Claude, Gemini, and Perplexity.
            </p>
          </div>
          <div>
            <h4 class="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Product</h4>
            <ul class="space-y-1.5 sm:space-y-2 text-sm">
              <li><a href="#how-it-works" class="hover:text-brand transition-colors">How it Works</a></li>
              <li><a href="#" class="hover:text-brand transition-colors">Features</a></li>
              <li><a href="#" class="hover:text-brand transition-colors">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Legal</h4>
            <ul class="space-y-1.5 sm:space-y-2 text-sm">
              <li><NuxtLink to="/privacy" class="hover:text-brand transition-colors">Privacy Policy</NuxtLink></li>
              <li><NuxtLink to="/terms" class="hover:text-brand transition-colors">Terms of Service</NuxtLink></li>
              <li><NuxtLink to="/impressum" class="hover:text-brand transition-colors">Impressum</NuxtLink></li>
            </ul>
          </div>
        </div>
        <div class="pt-6 sm:pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <span class="text-gray-500 text-xs sm:text-sm">&copy; 2025 Columbus. All rights reserved.</span>
          <div class="flex items-center gap-3 sm:gap-4">
            <a href="#" class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand transition-colors">
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand transition-colors">
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>

    <!-- Waitlist Modal -->
    <div
      v-if="showWaitlistModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50"
      @click.self="showWaitlistModal = false"
    >
      <div class="bg-background-highlight rounded-lg p-5 sm:p-8 max-w-md w-full border border-border">
        <h3 class="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
          <template v-if="waitlistMode">
            Join the <span class="brand-text">Waitlist</span>
          </template>
          <template v-else>
            Start <span class="brand-text">Scanning Free</span>
          </template>
        </h3>
        <p class="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
          <template v-if="waitlistMode">
            Be among the first to access Columbus when we launch. We'll notify you as soon as it's ready.
          </template>
          <template v-else>
            Enter your details to get started with Columbus and begin tracking your AI visibility.
          </template>
        </p>
        <form @submit.prevent="submitWaitlist" class="space-y-3 sm:space-y-4">
          <div>
            <label class="label text-sm">Email</label>
            <input
              v-model="waitlistForm.email"
              type="email"
              required
              class="input text-sm sm:text-base"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label class="label text-sm">Company Name (Optional)</label>
            <input
              v-model="waitlistForm.companyName"
              type="text"
              class="input text-sm sm:text-base"
              placeholder="Your Company"
            />
          </div>
          <div>
            <label class="label text-sm">Website (Optional)</label>
            <input
              v-model="waitlistForm.website"
              type="url"
              class="input text-sm sm:text-base"
              placeholder="https://yourwebsite.com"
            />
          </div>
          <div class="flex gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              @click="showWaitlistModal = false"
              class="btn-secondary flex-1 text-sm sm:text-base py-2 sm:py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn-primary flex-1 text-sm sm:text-base py-2 sm:py-2.5"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Submitting...' : (waitlistMode ? 'Join Waitlist' : 'Get Started') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const config = useRuntimeConfig()
const waitlistMode = config.public.waitlistMode
const { createCheckout } = useEdgeFunctions()

// Subscription tiers
const { tiers: subscriptionTiers, fetchTiers, formatPrice, getMonthlyEquivalent, getIconSvg } = useSubscriptionTiers()

// Billing period toggle
const billingPeriod = ref<'monthly' | 'yearly'>('monthly')

// Checkout state
const isProcessingCheckout = ref(false)
const selectedTier = ref<string | null>(null)

onMounted(() => {
  fetchTiers()
})

const showWaitlistModal = ref(false)
const isSubmitting = ref(false)
const waitlistIntent = ref<string>('free')
const waitlistForm = ref({
  email: '',
  companyName: '',
  website: ''
})

const openWaitlist = (intent: string = 'free') => {
  waitlistIntent.value = intent
  showWaitlistModal.value = true
}

// Handle pricing button click
const handlePricingClick = async (tierId: string) => {
  // In waitlist mode, always open waitlist modal
  if (waitlistMode) {
    openWaitlist(tierId)
    return
  }

  // Free tier - redirect to signup
  if (tierId === 'free') {
    navigateTo('/auth/signup')
    return
  }

  // Not logged in - redirect to login with plan info
  if (!user.value) {
    navigateTo(`/auth/login?plan=${tierId}&billing=${billingPeriod.value}`)
    return
  }

  // Logged in - start Stripe checkout
  isProcessingCheckout.value = true
  selectedTier.value = tierId

  try {
    const result = await createCheckout(tierId, billingPeriod.value)
    if (result.url) {
      window.location.href = result.url
    }
  } catch (e: any) {
    console.error('Checkout error:', e)
    alert(e.message || 'Failed to start checkout. Please try again.')
  } finally {
    isProcessingCheckout.value = false
    selectedTier.value = null
  }
}

// Handle start scanning button (hero CTA)
const handleStartScanning = () => {
  if (waitlistMode) {
    openWaitlist('free')
    return
  }
  if (user.value) {
    navigateTo('/dashboard')
  } else {
    navigateTo('/pricing')
  }
}

const submitWaitlist = async () => {
  isSubmitting.value = true
  const supabase = useSupabaseClient()

  // Capture intent value at submission time to ensure correct value is sent
  const submittedIntent = waitlistIntent.value

  try {
    // Call edge function to handle waitlist + email
    const { data, error } = await supabase.functions.invoke('waitlist', {
      body: {
        email: waitlistForm.value.email,
        companyName: waitlistForm.value.companyName,
        website: waitlistForm.value.website,
        intent: submittedIntent,
      }
    })

    if (error) throw error

    const successMessage = waitlistMode
      ? "You're on the list! We'll email you when Columbus launches."
      : 'Thank you! Check your email to get started with Columbus.'
    alert(successMessage)
    showWaitlistModal.value = false
    waitlistForm.value = { email: '', companyName: '', website: '' }
    waitlistIntent.value = 'free' // Reset intent for next submission
  } catch (error) {
    console.error('Waitlist error:', error)
    alert('Something went wrong. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

// SEO and Schema setup
const { setupSeo } = usePageSeo({
  title: 'Columbus - Free AI Engine Optimization Platform | Get Found by ChatGPT, Claude & More',
  description: 'The only completely free AEO platform with 100% authentic data and full ToS compliance. Track your visibility in ChatGPT, Claude, Gemini, and Perplexity.',
  canonicalPath: '/',
})
setupSeo()

// Organization schema for brand identity
const { injectSchema: injectOrgSchema } = useOrganizationSchema()
injectOrgSchema()

// FAQ schema for AEO optimization
const { injectSchema: injectFaqSchema } = useFaqSchema([
  {
    question: 'What is AEO (AI Engine Optimization)?',
    answer: 'AEO is the practice of optimizing your brand\'s visibility in AI-powered search engines and chatbots like ChatGPT, Claude, Gemini, and Perplexity. Unlike traditional SEO, AEO focuses on how AI systems understand and recommend your brand in conversational responses.',
  },
  {
    question: 'How does Columbus track AI visibility?',
    answer: 'Columbus uses your own AI accounts to run authentic queries and analyze real responses. This 100% ToS-compliant approach provides genuine data about how AI platforms mention, cite, and recommend your brand compared to competitors.',
  },
  {
    question: 'Is Columbus really free?',
    answer: 'Yes, Columbus offers a completely free tier with core visibility tracking features. You can monitor your brand\'s presence in AI responses, track competitors, and see mention trends without paying anything. Premium features are available for teams needing advanced recommendations.',
  },
  {
    question: 'What AI platforms does Columbus support?',
    answer: 'Columbus tracks visibility across all major AI platforms: ChatGPT, Claude, Gemini, Perplexity, and Google AI Overviews. Each platform is analyzed for mentions, citations, sentiment, and competitive positioning.',
  },
  {
    question: 'How is Columbus different from other AEO tools?',
    answer: 'Columbus is the only AEO platform that uses 100% authentic data from your own accounts (ToS compliant), offers a completely free tier, and provides platform-specific fix recommendations. Unlike scrapers or API-based tools, we show real user experiences.',
  },
])
injectFaqSchema()
</script>
