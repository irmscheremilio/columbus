// Columbus Desktop App - Main JavaScript
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// ==================== State ====================
let currentUser = null;
let products = [];
let selectedProductId = null;
let isScanning = false;
let isInitializing = true;

// Region/Auth state
let configuredRegions = ['local']; // Regions the user has set up
let selectedAuthRegion = 'local'; // Currently selected region in auth view
let platformAuthStatus = {}; // { "region:platform": true/false }

// Platform data
let platforms = [];
let PLATFORM_URLS = {};

// Available countries (fetched from API)
let availableCountries = []; // Will be populated from fetch_proxy_config
const LOCAL_REGION = { code: 'local', name: 'Local (Your Location)', flag_emoji: '🏠' };

// Dashboard URL
const DASHBOARD_URL = 'https://columbus-aeo.vercel.app/dashboard';

// ==================== DOM Elements ====================
let loginView, mainView, scanningView, completeView, onboardingView, regionAuthView;
let settingsModal, addRegionModal, authRequiredModal;
let loginForm, loginError, loginBtn, googleLoginBtn, signupLink;
let userEmail, logoutBtn, productSelect;
let samplesPerPrompt, samplesWarning, scanBtn, scanInfo, dashboardLink;
let progressFill, progressText, phaseIndicator, cancelScanBtn;
let countdownDisplay, countdownSeconds;
let autoRunEnabled, scansPerDay, scansPerDayRow, timeWindowRow;
let timeWindowStart, timeWindowEnd;
let autostartEnabled;
let scheduleInfoSection, nextScanTime, scansCompleted, scansTotal;
let scanRunningSection, miniProgressFill, miniProgressText;

// ==================== Initialize ====================
async function init() {
    console.log('Initializing Columbus Desktop...');
    initDOMElements();
    setupEventListeners();
    await loadPlatforms();
    await setupScanEventListeners();
    await checkAuthStatus();
}

function initDOMElements() {
    // Views
    loginView = document.getElementById('loginView');
    mainView = document.getElementById('mainView');
    scanningView = document.getElementById('scanningView');
    completeView = document.getElementById('completeView');
    onboardingView = document.getElementById('onboardingView');
    regionAuthView = document.getElementById('regionAuthView');

    // Modals
    settingsModal = document.getElementById('settingsModal');
    addRegionModal = document.getElementById('addRegionModal');
    authRequiredModal = document.getElementById('authRequiredModal');

    // Login elements
    loginForm = document.getElementById('loginForm');
    loginError = document.getElementById('loginError');
    loginBtn = document.getElementById('loginBtn');
    googleLoginBtn = document.getElementById('googleLoginBtn');
    signupLink = document.getElementById('signupLink');

    // Main view elements
    userEmail = document.getElementById('userEmail');
    logoutBtn = document.getElementById('logoutBtn');
    productSelect = document.getElementById('productSelect');

    // Settings
    samplesPerPrompt = document.getElementById('samplesPerPrompt');
    samplesWarning = document.getElementById('samplesWarning');
    autoRunEnabled = document.getElementById('autoRunEnabled');
    scansPerDay = document.getElementById('scansPerDay');
    scansPerDayRow = document.getElementById('scansPerDayRow');
    timeWindowRow = document.getElementById('timeWindowRow');
    timeWindowStart = document.getElementById('timeWindowStart');
    timeWindowEnd = document.getElementById('timeWindowEnd');
    autostartEnabled = document.getElementById('autostartEnabled');

    // Schedule
    scheduleInfoSection = document.getElementById('scheduleInfoSection');
    nextScanTime = document.getElementById('nextScanTime');
    scansCompleted = document.getElementById('scansCompleted');
    scansTotal = document.getElementById('scansTotal');

    // Scan running indicator
    scanRunningSection = document.getElementById('scanRunningSection');
    miniProgressFill = document.getElementById('miniProgressFill');
    miniProgressText = document.getElementById('miniProgressText');

    // Scan controls
    scanBtn = document.getElementById('scanBtn');
    scanInfo = document.getElementById('scanInfo');
    dashboardLink = document.getElementById('dashboardLink');

    // Progress elements
    progressFill = document.getElementById('progressFill');
    progressText = document.getElementById('progressText');
    phaseIndicator = document.getElementById('phaseIndicator');
    cancelScanBtn = document.getElementById('cancelScanBtn');
    countdownDisplay = document.getElementById('countdownDisplay');
    countdownSeconds = document.getElementById('countdownSeconds');
}

function setupEventListeners() {
    // Login
    loginForm?.addEventListener('submit', handleLogin);
    googleLoginBtn?.addEventListener('click', handleGoogleLogin);
    signupLink?.addEventListener('click', (e) => {
        e.preventDefault();
        invoke('open_url_in_browser', { url: 'https://columbus-aeo.vercel.app/signup' });
    });

    // Main view
    logoutBtn?.addEventListener('click', handleLogout);
    productSelect?.addEventListener('change', handleProductChange);
    scanBtn?.addEventListener('click', handleStartScan);
    cancelScanBtn?.addEventListener('click', handleCancelScan);
    dashboardLink?.addEventListener('click', (e) => {
        e.preventDefault();
        invoke('open_url_in_browser', { url: DASHBOARD_URL });
    });

    // Settings
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });
    document.getElementById('closeSettingsBtn')?.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });
    document.getElementById('settingsModalOverlay')?.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });
    document.getElementById('openRegionAuthBtn')?.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
        showRegionAuthView();
    });

    // Manage Auth button on main view
    document.getElementById('manageAuthBtn')?.addEventListener('click', showRegionAuthView);

    // Auto-run settings
    autoRunEnabled?.addEventListener('change', handleAutoRunChange);
    scansPerDay?.addEventListener('change', saveProductConfig);
    timeWindowStart?.addEventListener('change', saveProductConfig);
    timeWindowEnd?.addEventListener('change', saveProductConfig);
    autostartEnabled?.addEventListener('change', handleAutostartChange);
    samplesPerPrompt?.addEventListener('change', () => {
        const val = parseInt(samplesPerPrompt.value) || 1;
        if (val > 3) {
            samplesWarning.classList.remove('hidden');
        } else {
            samplesWarning.classList.add('hidden');
        }
        saveProductConfig();
    });

    // Onboarding
    document.getElementById('continueToAuthBtn')?.addEventListener('click', handleOnboardingContinue);

    // Region Auth View
    document.getElementById('backToMainBtn')?.addEventListener('click', () => {
        showView('main');
        updateAuthStatusGrid();
    });
    document.getElementById('addRegionBtn')?.addEventListener('click', showAddRegionModal);
    document.getElementById('openMagicLinkBtn')?.addEventListener('click', handleOpenMagicLink);

    // Add Region Modal
    document.getElementById('closeAddRegionBtn')?.addEventListener('click', () => {
        addRegionModal.classList.add('hidden');
    });
    document.getElementById('addRegionOverlay')?.addEventListener('click', () => {
        addRegionModal.classList.add('hidden');
    });

    // Auth Required Modal
    document.getElementById('dismissAuthRequiredBtn')?.addEventListener('click', () => {
        authRequiredModal.classList.add('hidden');
    });
    document.getElementById('authRequiredOverlay')?.addEventListener('click', () => {
        authRequiredModal.classList.add('hidden');
    });
    document.getElementById('goToAuthBtn')?.addEventListener('click', () => {
        authRequiredModal.classList.add('hidden');
        showRegionAuthView();
    });

    // Complete view
    document.getElementById('viewResultsBtn')?.addEventListener('click', () => {
        invoke('open_url_in_browser', { url: DASHBOARD_URL });
    });
    document.getElementById('newScanBtn')?.addEventListener('click', () => {
        showView('main');
    });
}

// ==================== Platform Loading ====================
async function loadPlatforms() {
    try {
        const platformsData = await invoke('get_ai_platforms', { forceRefresh: false });
        console.log('Loaded platforms:', platformsData);
        platforms = platformsData.map(p => p.id);
        PLATFORM_URLS = {};
        platformsData.forEach(p => {
            PLATFORM_URLS[p.id] = p.website_url || '';
        });
        return platformsData;
    } catch (error) {
        console.error('Failed to load platforms:', error);
        platforms = ['chatgpt', 'claude', 'gemini', 'perplexity'];
        PLATFORM_URLS = {
            chatgpt: 'https://chat.openai.com',
            claude: 'https://claude.ai',
            gemini: 'https://gemini.google.com',
            perplexity: 'https://perplexity.ai'
        };
        return null;
    }
}

// ==================== Country Loading ====================
async function loadAvailableCountries() {
    try {
        const countries = await invoke('fetch_proxy_config');
        console.log('Loaded available countries:', countries);
        availableCountries = countries || [];
        return countries;
    } catch (error) {
        console.error('Failed to load countries (may require paid plan):', error);
        availableCountries = [];
        return [];
    }
}

function getAllRegions() {
    // Returns local + all available countries
    return [LOCAL_REGION, ...availableCountries.map(c => ({
        code: c.code.toLowerCase(),
        name: c.name,
        flag_emoji: c.flag_emoji || ''
    }))];
}

function getRegionName(code) {
    if (code === 'local') return LOCAL_REGION.name;
    const country = availableCountries.find(c => c.code.toLowerCase() === code.toLowerCase());
    return country ? country.name : code.toUpperCase();
}

function getRegionFlag(code) {
    if (code === 'local') return LOCAL_REGION.flag_emoji;
    const country = availableCountries.find(c => c.code.toLowerCase() === code.toLowerCase());
    return country?.flag_emoji || '';
}

// ==================== View Management ====================
function showView(viewName) {
    [loginView, mainView, scanningView, completeView, onboardingView, regionAuthView].forEach(v => {
        v?.classList.add('hidden');
    });

    switch (viewName) {
        case 'login':
            loginView?.classList.remove('hidden');
            break;
        case 'main':
            mainView?.classList.remove('hidden');
            break;
        case 'scanning':
            scanningView?.classList.remove('hidden');
            break;
        case 'complete':
            completeView?.classList.remove('hidden');
            break;
        case 'onboarding':
            onboardingView?.classList.remove('hidden');
            break;
        case 'region-auth':
            regionAuthView?.classList.remove('hidden');
            break;
    }
}

// ==================== Authentication ====================
async function checkAuthStatus() {
    try {
        const status = await invoke('get_auth_status');
        console.log('Auth status:', status);

        if (status.authenticated && status.user) {
            currentUser = status.user;
            userEmail.textContent = currentUser.email;

            // Load available countries from API (for paid users)
            await loadAvailableCountries();
            await loadConfiguredRegions();
            await loadPlatformAuthStatus();

            // Check if scan is running
            const scanRunning = await invoke('is_scan_running');
            if (scanRunning) {
                isScanning = true;
                renderPlatformProgressGrid();
                showView('scanning');
                const progress = await invoke('get_scan_progress');
                updateScanProgress(progress);
            } else if (configuredRegions.length === 1 && configuredRegions[0] === 'local' && !hasAnyAuth()) {
                // First time - show onboarding
                renderOnboardingRegions();
                showView('onboarding');
            } else {
                showView('main');
            }

            await loadProducts();
            await loadAutostartSetting();
            isInitializing = false;
        } else {
            showView('login');
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showView('login');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    loginBtn.disabled = true;
    loginError.classList.add('hidden');

    try {
        const result = await invoke('login', { email, password });
        console.log('Login result:', result);
        currentUser = result.user;
        await checkAuthStatus();
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = error;
        loginError.classList.remove('hidden');
    } finally {
        loginBtn.disabled = false;
    }
}

async function handleGoogleLogin() {
    googleLoginBtn.disabled = true;
    try {
        await invoke('login_with_google');
        // Will be handled by the OAuth callback
    } catch (error) {
        console.error('Google login error:', error);
        alert('Failed to start Google login: ' + error);
    } finally {
        googleLoginBtn.disabled = false;
    }
}

async function handleLogout() {
    try {
        await invoke('logout');
        currentUser = null;
        showView('login');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ==================== Region & Auth Management ====================
async function loadConfiguredRegions() {
    try {
        // Get countries that have proxies configured (from API)
        const regions = await invoke('get_configured_proxy_countries');
        if (regions && regions.length > 0) {
            // Always include 'local' as an option, plus configured proxy countries
            configuredRegions = ['local', ...regions];
        } else {
            configuredRegions = ['local'];
        }
        console.log('Configured regions:', configuredRegions);
    } catch (error) {
        console.error('Failed to load regions:', error);
        configuredRegions = ['local'];
    }
}

async function loadPlatformAuthStatus() {
    platformAuthStatus = {};
    for (const region of configuredRegions) {
        for (const platform of platforms) {
            try {
                const authInfo = await invoke('get_country_platform_auth', {
                    countryCode: region,
                    platform: platform
                });
                // authInfo is either null or { is_authenticated: bool, ... }
                // Handle both snake_case and camelCase just in case
                const isAuth = authInfo?.is_authenticated ?? authInfo?.isAuthenticated ?? false;
                platformAuthStatus[`${region}:${platform}`] = isAuth === true;
            } catch (e) {
                platformAuthStatus[`${region}:${platform}`] = false;
            }
        }
    }
    console.log('Platform auth status:', platformAuthStatus);
}

function hasAnyAuth() {
    return Object.values(platformAuthStatus).some(v => v === true);
}

function isPlatformAuthForRegion(region, platform) {
    return platformAuthStatus[`${region}:${platform}`] === true;
}

function getAuthCountForRegion(region) {
    return platforms.filter(p => isPlatformAuthForRegion(region, p)).length;
}

async function addRegion(regionCode) {
    if (!configuredRegions.includes(regionCode)) {
        configuredRegions.push(regionCode);
        // Initialize auth status for new region
        for (const platform of platforms) {
            platformAuthStatus[`${regionCode}:${platform}`] = false;
        }
        // Save to storage
        await invoke('set_country_platform_auth', {
            countryCode: regionCode,
            platform: platforms[0],
            authenticated: false
        });
    }
}

async function removeRegion(regionCode) {
    if (regionCode === 'local') return; // Can't remove local
    configuredRegions = configuredRegions.filter(r => r !== regionCode);
    // Remove from auth status
    for (const platform of platforms) {
        delete platformAuthStatus[`${regionCode}:${platform}`];
    }
}

// ==================== Auth Status Grid (Main View) ====================
function updateAuthStatusGrid() {
    const grid = document.getElementById('authStatusGrid');
    if (!grid) return;

    let html = '';
    for (const region of configuredRegions) {
        const authCount = getAuthCountForRegion(region);
        const flag = getRegionFlag(region);
        const name = region === 'local' ? 'Local' : region.toUpperCase();
        html += `
            <div class="auth-region-badge">
                <span class="region-name">${flag} ${name}</span>
                <div class="platform-dots">
                    ${platforms.map(p => `
                        <span class="platform-dot ${p} ${isPlatformAuthForRegion(region, p) ? 'authenticated' : ''}"
                              title="${capitalizeFirst(p)}: ${isPlatformAuthForRegion(region, p) ? 'Authenticated' : 'Not authenticated'}"></span>
                    `).join('')}
                </div>
            </div>
        `;
    }
    grid.innerHTML = html;
    updateScanButtonState();
}

// ==================== Region Auth View ====================
function showRegionAuthView() {
    selectedAuthRegion = configuredRegions[0] || 'local';
    showView('region-auth');
    renderRegionTabs();
    renderAuthPlatformsGrid();
}

function renderRegionTabs() {
    const tabsContainer = document.getElementById('regionTabs');
    if (!tabsContainer) return;

    let html = '';
    for (const region of configuredRegions) {
        const authCount = getAuthCountForRegion(region);
        const isActive = region === selectedAuthRegion;
        const flag = getRegionFlag(region);
        const name = region === 'local' ? 'Local' : region.toUpperCase();
        html += `
            <button class="region-tab ${isActive ? 'active' : ''}" data-region="${region}">
                <span>${flag} ${name}</span>
                <span class="auth-count">${authCount}/${platforms.length}</span>
                ${region !== 'local' ? `<button class="remove-region" data-region="${region}" title="Remove region">&times;</button>` : ''}
            </button>
        `;
    }
    tabsContainer.innerHTML = html;

    // Add click handlers
    tabsContainer.querySelectorAll('.region-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-region')) {
                e.stopPropagation();
                handleRemoveRegion(e.target.dataset.region);
                return;
            }
            selectedAuthRegion = tab.dataset.region;
            renderRegionTabs();
            renderAuthPlatformsGrid();
        });
    });
}

function renderAuthPlatformsGrid() {
    const grid = document.getElementById('authPlatformsGrid');
    if (!grid) return;

    let html = '';
    for (const platform of platforms) {
        const isAuth = isPlatformAuthForRegion(selectedAuthRegion, platform);
        html += `
            <div class="auth-platform-card ${isAuth ? 'authenticated' : ''}">
                <div class="auth-platform-left">
                    <div class="auth-platform-icon ${platform}"></div>
                    <div class="auth-platform-info">
                        <span class="auth-platform-name">${capitalizeFirst(platform)}</span>
                        <span class="auth-platform-status ${isAuth ? 'authenticated' : ''}">
                            ${isAuth ? 'Authenticated' : 'Not authenticated'}
                        </span>
                    </div>
                </div>
                <div class="auth-platform-right">
                    <button class="btn-auth ${isAuth ? 'authenticated' : ''}"
                            data-platform="${platform}"
                            data-region="${selectedAuthRegion}">
                        ${isAuth ? 'Re-auth' : 'Login'}
                    </button>
                    <button class="btn-toggle-auth ${isAuth ? 'is-auth' : ''}"
                            data-platform="${platform}"
                            data-region="${selectedAuthRegion}"
                            title="${isAuth ? 'Mark as not logged in' : 'Mark as logged in'}">
                        ${isAuth ? '✓' : '○'}
                    </button>
                </div>
            </div>
        `;
    }
    grid.innerHTML = html;

    // Add click handlers for login button
    grid.querySelectorAll('.btn-auth').forEach(btn => {
        btn.addEventListener('click', () => {
            handleAuthPlatform(btn.dataset.platform, btn.dataset.region);
        });
    });

    // Add click handlers for toggle button
    grid.querySelectorAll('.btn-toggle-auth').forEach(btn => {
        btn.addEventListener('click', () => {
            handleToggleAuth(btn.dataset.platform, btn.dataset.region);
        });
    });
}

async function handleAuthPlatform(platform, region) {
    console.log(`Opening auth for ${platform} in region ${region}`);
    try {
        // Open login webview for this platform/region
        await invoke('open_country_login', {
            countryCode: region,
            platform: platform
        });
    } catch (error) {
        console.error('Failed to open auth:', error);
        alert('Failed to open authentication: ' + error);
    }
}

async function handleToggleAuth(platform, region) {
    const isCurrentlyAuth = isPlatformAuthForRegion(region, platform);
    const newStatus = !isCurrentlyAuth;

    console.log(`Toggling auth for ${platform} in region ${region}: ${isCurrentlyAuth} -> ${newStatus}`);

    try {
        await invoke('set_platform_auth_status', {
            countryCode: region,
            platform: platform,
            authenticated: newStatus
        });

        // Update local state
        const key = `${region}:${platform}`;
        platformAuthStatus[key] = newStatus;

        // Re-render the grid
        renderAuthPlatformsGrid();
    } catch (error) {
        console.error('Failed to toggle auth status:', error);
        alert('Failed to update auth status: ' + error);
    }
}

async function handleRemoveRegion(regionCode) {
    if (regionCode === 'local') return;
    if (!confirm(`Remove ${regionCode.toUpperCase()} region? You'll need to re-authenticate platforms if you add it back.`)) {
        return;
    }
    await removeRegion(regionCode);
    if (selectedAuthRegion === regionCode) {
        selectedAuthRegion = configuredRegions[0] || 'local';
    }
    renderRegionTabs();
    renderAuthPlatformsGrid();
}

// ==================== Add Region Modal ====================
function showAddRegionModal() {
    const optionsContainer = document.getElementById('addRegionOptions');
    if (!optionsContainer) return;

    // Get regions not yet configured
    const allRegions = getAllRegions();
    const unconfiguredRegions = allRegions.filter(r => !configuredRegions.includes(r.code));

    if (unconfiguredRegions.length === 0) {
        optionsContainer.innerHTML = '<p style="color: #6b7280; text-align: center;">All available regions have been added.</p>';
    } else {
        let html = '';
        for (const region of unconfiguredRegions) {
            html += `
                <div class="add-region-option" data-region="${region.code}">
                    <span class="region-name">${region.flag_emoji} ${region.name}</span>
                    <span class="region-code">${region.code.toUpperCase()}</span>
                </div>
            `;
        }
        optionsContainer.innerHTML = html;

        // Add click handlers
        optionsContainer.querySelectorAll('.add-region-option').forEach(opt => {
            opt.addEventListener('click', async () => {
                await addRegion(opt.dataset.region);
                selectedAuthRegion = opt.dataset.region;
                addRegionModal.classList.add('hidden');
                renderRegionTabs();
                renderAuthPlatformsGrid();
            });
        });
    }

    addRegionModal.classList.remove('hidden');
}

// ==================== Magic Link ====================
async function handleOpenMagicLink() {
    const input = document.getElementById('magicLinkInput');
    const url = input?.value?.trim();
    if (!url) {
        alert('Please paste a URL first');
        return;
    }
    try {
        await invoke('open_magic_link', {
            countryCode: selectedAuthRegion,
            url: url
        });
        input.value = '';
    } catch (error) {
        console.error('Failed to open URL:', error);
        alert('Failed to open URL: ' + error);
    }
}

// ==================== Onboarding ====================
function renderOnboardingRegions() {
    const container = document.getElementById('onboardingRegions');
    if (!container) return;

    const allRegions = getAllRegions();

    let html = '';
    for (const region of allRegions) {
        const isLocal = region.code === 'local';
        html += `
            <label class="region-option">
                <input type="checkbox" value="${region.code}" ${isLocal ? 'checked' : ''}>
                <span class="region-name">${region.flag_emoji} ${region.name}</span>
            </label>
        `;
    }
    container.innerHTML = html;
}

async function handleOnboardingContinue() {
    // Get selected regions from onboarding
    const checkboxes = document.querySelectorAll('#onboardingRegions input[type="checkbox"]:checked');
    const selectedRegions = Array.from(checkboxes).map(cb => cb.value);

    if (selectedRegions.length === 0) {
        alert('Please select at least one region');
        return;
    }

    // Add selected regions
    for (const region of selectedRegions) {
        if (!configuredRegions.includes(region)) {
            await addRegion(region);
        }
    }

    // Go to region auth view
    showRegionAuthView();
}

// ==================== Products ====================
async function loadProducts() {
    try {
        const status = await invoke('get_status');
        products = status.products || [];
        console.log('Loaded products:', products);

        productSelect.innerHTML = '<option value="">Select a product...</option>';
        products.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            productSelect.appendChild(opt);
        });

        // Restore last selected product
        const lastProductId = await invoke('get_last_product_id');
        if (lastProductId && products.find(p => p.id === lastProductId)) {
            productSelect.value = lastProductId;
            selectedProductId = lastProductId;
            await loadProductConfig(lastProductId);
        }

        updateAuthStatusGrid();
        updateScanButtonState();
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

async function handleProductChange() {
    selectedProductId = productSelect.value;
    if (selectedProductId) {
        await invoke('set_last_product_id', { productId: selectedProductId });
        await loadProductConfig(selectedProductId);
    }
    updateScanButtonState();
}

async function loadProductConfig(productId) {
    try {
        const config = await invoke('get_product_config', { productId });
        console.log('Loaded product config:', config);

        samplesPerPrompt.value = config.samples_per_prompt || 1;
        autoRunEnabled.checked = config.auto_run_enabled !== false;
        scansPerDay.value = config.scans_per_day || 1;
        timeWindowStart.value = config.time_window_start ?? 9;
        timeWindowEnd.value = config.time_window_end ?? 17;

        updateAutoRunUI();
        loadScheduleInfo();

        // Auto-initialize platforms if empty (new product or fresh install)
        // This ensures auto-scan has platforms to work with
        if (!config.ready_platforms || config.ready_platforms.length === 0) {
            console.log('Product has no platforms configured, initializing with available platforms:', platforms);
            if (platforms.length > 0) {
                await saveProductConfig(true); // Force save even during initialization
            }
        }
    } catch (error) {
        console.error('Failed to load product config:', error);
    }
}

async function saveProductConfig(force = false) {
    if (!selectedProductId || (isInitializing && !force)) return;
    try {
        await invoke('set_product_config', {
            productId: selectedProductId,
            readyPlatforms: platforms, // All platforms are now "ready" if authenticated
            samplesPerPrompt: parseInt(samplesPerPrompt.value) || 1,
            autoRunEnabled: autoRunEnabled.checked,
            scansPerDay: parseInt(scansPerDay.value) || 1,
            timeWindowStart: parseInt(timeWindowStart.value),
            timeWindowEnd: parseInt(timeWindowEnd.value)
        });
        console.log('Saved product config with platforms:', platforms);
    } catch (error) {
        console.error('Failed to save product config:', error);
    }
}

// ==================== Auto-Run Settings ====================
function handleAutoRunChange() {
    updateAutoRunUI();
    saveProductConfig();
}

function updateAutoRunUI() {
    const enabled = autoRunEnabled.checked;
    scansPerDayRow.style.opacity = enabled ? '1' : '0.5';
    scansPerDayRow.style.pointerEvents = enabled ? 'auto' : 'none';
    timeWindowRow.style.opacity = enabled ? '1' : '0.5';
    timeWindowRow.style.pointerEvents = enabled ? 'auto' : 'none';

    if (enabled) {
        scheduleInfoSection.classList.remove('disabled');
    } else {
        scheduleInfoSection.classList.add('disabled');
    }
}

async function loadAutostartSetting() {
    try {
        const enabled = await invoke('get_autostart_enabled');
        autostartEnabled.checked = enabled;
    } catch (error) {
        console.error('Failed to load autostart setting:', error);
    }
}

async function handleAutostartChange() {
    try {
        await invoke('set_autostart_enabled', { enabled: autostartEnabled.checked });
    } catch (error) {
        console.error('Failed to save autostart setting:', error);
    }
}

async function loadScheduleInfo() {
    try {
        const info = await invoke('get_schedule_info', { productId: selectedProductId });
        if (info.next_scan_time) {
            const time = new Date(info.next_scan_time);
            nextScanTime.textContent = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            nextScanTime.textContent = '--';
        }
        scansCompleted.textContent = info.scans_completed_today || 0;
        scansTotal.textContent = info.scans_per_day || 1;
    } catch (error) {
        console.error('Failed to load schedule info:', error);
    }
}

// ==================== Scan Functions ====================
function updateScanButtonState() {
    const hasProduct = !!selectedProductId;
    const hasAuth = hasAnyAuth();

    scanBtn.disabled = !hasProduct || !hasAuth;

    if (!hasProduct && !hasAuth) {
        scanInfo.textContent = 'Select a product and authenticate platforms';
    } else if (!hasProduct) {
        scanInfo.textContent = 'Select a product to start scanning';
    } else if (!hasAuth) {
        scanInfo.textContent = 'Authenticate at least one platform to scan';
    } else {
        const product = products.find(p => p.id === selectedProductId);
        const authCount = configuredRegions.reduce((sum, r) => sum + getAuthCountForRegion(r), 0);
        scanInfo.textContent = `Ready to scan ${product?.name || 'product'}`;
    }
}

async function handleStartScan() {
    if (!selectedProductId) return;
    if (!hasAnyAuth()) {
        showAuthRequiredModal([]);
        return;
    }

    // Check which platforms/regions are needed for this product's prompts
    try {
        const promptRegions = await invoke('get_prompt_target_regions', { productId: selectedProductId });
        const neededRegions = new Set();

        // Collect all regions needed
        for (const regions of Object.values(promptRegions)) {
            if (regions.length === 0) {
                neededRegions.add('local');
            } else {
                regions.forEach(r => neededRegions.add(r.toLowerCase()));
            }
        }

        // Check if we have auth for all needed regions
        const missingAuth = [];
        for (const region of neededRegions) {
            // Need at least one platform auth per region
            const hasAuthForRegion = platforms.some(p => isPlatformAuthForRegion(region, p));
            if (!hasAuthForRegion) {
                missingAuth.push({ region, platforms: platforms });
            }
        }

        if (missingAuth.length > 0) {
            showAuthRequiredModal(missingAuth);
            return;
        }

        // Get authenticated platforms for the scan
        const authPlatforms = platforms.filter(p =>
            configuredRegions.some(r => isPlatformAuthForRegion(r, p))
        );

        if (authPlatforms.length === 0) {
            showAuthRequiredModal([]);
            return;
        }

        // Start the scan
        scanBtn.disabled = true;
        isScanning = true;
        resetProgressUI();
        showView('scanning');

        await invoke('start_scan', {
            productId: selectedProductId,
            samplesPerPrompt: parseInt(samplesPerPrompt.value) || 1,
            platforms: authPlatforms
        });

        console.log('Scan started with platforms:', authPlatforms);
    } catch (error) {
        console.error('Start scan error:', error);
        alert('Failed to start scan: ' + error);
        showView('main');
        scanBtn.disabled = false;
        isScanning = false;
    }
}

function showAuthRequiredModal(missingAuth) {
    const list = document.getElementById('authRequiredList');
    const message = document.getElementById('authRequiredMessage');

    if (missingAuth.length === 0) {
        message.textContent = 'No platforms are authenticated. Please set up authentication first.';
        list.innerHTML = '';
    } else {
        message.textContent = 'The following regions need at least one authenticated platform:';
        let html = '';
        for (const item of missingAuth) {
            html += `
                <div class="auth-required-item">
                    <span class="item-text">${item.region === 'local' ? 'Local' : item.region.toUpperCase()} - no authenticated platforms</span>
                </div>
            `;
        }
        list.innerHTML = html;
    }

    authRequiredModal.classList.remove('hidden');
}

async function handleCancelScan() {
    try {
        await invoke('cancel_scan');
        isScanning = false;
        showView('main');
        scanBtn.disabled = false;
    } catch (error) {
        console.error('Cancel scan error:', error);
    }
}

// Platform display names
const PLATFORM_NAMES = {
    'chatgpt': 'ChatGPT',
    'claude': 'Claude',
    'gemini': 'Gemini',
    'perplexity': 'Perplexity',
    'google_aio': 'Google AI Overview'
};

function renderPlatformProgressGrid() {
    const grid = document.getElementById('platformProgressGrid');
    if (!grid) return;

    let html = '';
    platforms.forEach(platform => {
        const displayName = PLATFORM_NAMES[platform] || capitalizeFirst(platform);
        html += `
            <div class="platform-progress-item" data-platform="${platform}">
                <div class="platform-progress-header">
                    <span class="platform-progress-icon ${platform}"></span>
                    <span class="platform-progress-name">${displayName}</span>
                    <span class="platform-progress-status" id="progress-${platform}-status">pending</span>
                </div>
                <div class="platform-progress-bar">
                    <div class="platform-progress-fill" id="progress-${platform}-fill" style="width: 0%"></div>
                </div>
                <span class="platform-progress-count" id="progress-${platform}-count">0/0</span>
            </div>
        `;
    });
    grid.innerHTML = html;
}

function resetProgressUI() {
    // Ensure the platform progress grid is rendered
    renderPlatformProgressGrid();

    progressFill.style.width = '0%';
    progressText.textContent = '0%';
    phaseIndicator.textContent = 'Initializing...';
    countdownDisplay.classList.add('hidden');
    countdownSeconds.textContent = '45';

    platforms.forEach(platform => {
        const statusEl = document.getElementById(`progress-${platform}-status`);
        const fillEl = document.getElementById(`progress-${platform}-fill`);
        const countEl = document.getElementById(`progress-${platform}-count`);

        if (statusEl) {
            statusEl.textContent = 'pending';
            statusEl.className = 'platform-progress-status pending';
        }
        if (fillEl) {
            fillEl.style.width = '0%';
            fillEl.classList.remove('complete');
        }
        if (countEl) {
            countEl.textContent = '0/0';
        }
    });
}

// ==================== Scan Events ====================
async function setupScanEventListeners() {
    await listen('scan:progress', (event) => {
        updateScanProgress(event.payload);
    });

    await listen('scan:complete', (event) => {
        handleScanComplete(event.payload);
    });

    await listen('scan:error', (event) => {
        handleScanError(event.payload);
    });

    await listen('scan:countdown', (event) => {
        updateCountdown(event.payload);
    });

    // Listen for auth state changes from webviews
    await listen('platform-auth-changed', async (event) => {
        const { region, platform, authenticated } = event.payload;
        platformAuthStatus[`${region}:${platform}`] = authenticated;
        renderAuthPlatformsGrid();
        updateAuthStatusGrid();
    });
}

function updateScanProgress(progress) {
    if (!progress) return;

    const percent = progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 0;

    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${percent}%`;
    phaseIndicator.textContent = progress.phase || 'Processing...';

    // Update mini progress in main view
    if (miniProgressFill) miniProgressFill.style.width = `${percent}%`;
    if (miniProgressText) miniProgressText.textContent = `${percent}%`;

    // Update countdown if present
    if (progress.countdownSeconds !== undefined && progress.countdownSeconds !== null) {
        updateCountdown(progress.countdownSeconds);
    } else {
        countdownDisplay?.classList.add('hidden');
    }

    // Update per-platform progress
    if (progress.platforms) {
        for (const [platform, state] of Object.entries(progress.platforms)) {
            const statusEl = document.getElementById(`progress-${platform}-status`);
            const fillEl = document.getElementById(`progress-${platform}-fill`);
            const countEl = document.getElementById(`progress-${platform}-count`);

            if (statusEl) {
                statusEl.textContent = state.status;
                statusEl.className = `platform-progress-status ${state.status}`;
            }
            if (fillEl) {
                const platformPercent = state.total > 0
                    ? Math.round(((state.submitted + state.collected) / (state.total * 2)) * 100)
                    : 0;
                fillEl.style.width = `${platformPercent}%`;
                if (state.status === 'complete') {
                    fillEl.classList.add('complete');
                }
            }
            if (countEl) {
                countEl.textContent = `${state.collected}/${state.total}`;
            }
        }
    }
}

function updateCountdown(seconds) {
    countdownDisplay.classList.remove('hidden');
    countdownSeconds.textContent = seconds;
}

function handleScanComplete(result) {
    console.log('Scan complete:', result);
    console.log('mention_rate raw:', result?.mention_rate, 'citation_rate raw:', result?.citation_rate);
    isScanning = false;
    scanBtn.disabled = false;

    const stats = document.getElementById('completeStats');
    if (stats && result) {
        stats.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${result.total_prompts || 0}</div>
                <div class="stat-label">Prompts Tested</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${Math.round(result.mention_rate || 0)}%</div>
                <div class="stat-label">Mention Rate</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${result.successful_prompts || 0}</div>
                <div class="stat-label">Successful</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${Math.round(result.citation_rate || 0)}%</div>
                <div class="stat-label">Citation Rate</div>
            </div>
        `;
    }

    showView('complete');
    loadScheduleInfo();
    updateScanRunningIndicator(false);
}

function handleScanError(error) {
    console.error('Scan error:', error);
    isScanning = false;
    scanBtn.disabled = false;
    alert('Scan failed: ' + (error.message || error));
    showView('main');
    updateScanRunningIndicator(false);
}

function updateScanRunningIndicator(running, progress = null) {
    if (running) {
        scanRunningSection?.classList.remove('hidden');
        if (progress) {
            const percent = progress.total > 0
                ? Math.round((progress.current / progress.total) * 100)
                : 0;
            if (miniProgressFill) miniProgressFill.style.width = `${percent}%`;
            if (miniProgressText) miniProgressText.textContent = `${percent}%`;
        }
    } else {
        scanRunningSection?.classList.add('hidden');
    }
}

// ==================== Utilities ====================
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    init().catch(e => {
        console.error('Init error:', e);
    });
});

console.log('Main.js loaded');
