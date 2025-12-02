// Columbus Desktop App - Main JavaScript
console.log('Main.js loading...');

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-shell';
import { getCurrentWindow } from '@tauri-apps/api/window';

console.log('Tauri imports loaded');

// State
let currentUser = null;
let products = [];
let selectedProductId = null;
let isScanning = false;
let isInitializing = true; // Flag to prevent saving during initialization

// Per-product config (loaded when product is selected)
let currentProductConfig = {
    readyPlatforms: [],
    samplesPerPrompt: 1,
    autoRunEnabled: true,
    scansPerDay: 1,
    timeWindowStart: 9,
    timeWindowEnd: 17
};

// DOM Elements - get them after DOM is ready
let loginView, mainView, scanningView, completeView;
let loginForm, loginError, loginBtn, googleLoginBtn, signupLink;

let userEmail, logoutBtn, productSelect;
let samplesPerPrompt, samplesWarning, scanBtn, scanInfo, dashboardLink;
let progressFill, progressText, phaseIndicator, cancelScanBtn;
let countdownDisplay, countdownSeconds;
let completeStats, viewResultsBtn, newScanBtn;
let autoRunEnabled, scansPerDay, scansPerDayRow, autostartEnabled;
let timeWindowStart, timeWindowEnd, timeWindowRow;
let scheduleInfoSection, nextScanTime, scansCompleted, scansTotal;
let scanRunningSection, miniProgressFill, miniProgressText;

// Platform data - loaded dynamically from API
let platforms = [];
let PLATFORM_URLS = {};

// Track which platforms user has marked as ready
let readyPlatforms = new Set();

// Dashboard URL
const DASHBOARD_URL = 'https://columbus-aeo.vercel.app/dashboard';

// Load AI platforms from API
async function loadPlatforms() {
    try {
        const platformsData = await invoke('get_ai_platforms', { forceRefresh: false });
        console.log('Loaded platforms:', platformsData);

        // Transform to array of platform IDs
        platforms = platformsData.map(p => p.id);

        // Build URL map
        PLATFORM_URLS = {};
        platformsData.forEach(p => {
            PLATFORM_URLS[p.id] = p.website_url || '';
        });

        // Update the UI if platform elements exist
        updatePlatformUI(platformsData);

        return platformsData;
    } catch (error) {
        console.error('Failed to load platforms:', error);
        // Use fallback defaults
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

// Update platform UI elements dynamically
function updatePlatformUI(platformsData) {
    const platformsGrid = document.getElementById('platformsGrid');
    const platformProgressGrid = document.getElementById('platformProgressGrid');

    if (platformsGrid && platformsData) {
        platformsGrid.innerHTML = platformsData.map(p => `
            <div class="platform-login-item" data-platform="${p.id}">
                <div class="platform-login-left">
                    <div class="platform-icon" style="background-color: ${p.color || '#666'}"></div>
                    <span class="platform-name">${p.name}</span>
                </div>
                <div class="platform-login-right">
                    <label class="platform-checkbox">
                        <input type="checkbox" id="ready-${p.id}" class="platform-ready-check">
                        <span class="checkmark"></span>
                    </label>
                    <button class="btn-icon-only" id="open-${p.id}" title="Open ${p.name}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Re-attach event listeners
        setupPlatformEventListeners();
    }

    if (platformProgressGrid && platformsData) {
        platformProgressGrid.innerHTML = platformsData.map(p => `
            <div class="platform-progress-item" data-platform="${p.id}">
                <div class="platform-progress-header">
                    <span class="platform-progress-icon" style="background-color: ${p.color || '#666'}"></span>
                    <span class="platform-progress-name">${p.name}</span>
                    <span class="platform-progress-status" id="progress-${p.id}-status">pending</span>
                </div>
                <div class="platform-progress-bar">
                    <div class="platform-progress-fill" id="progress-${p.id}-fill" style="width: 0%"></div>
                </div>
                <span class="platform-progress-count" id="progress-${p.id}-count">0/0</span>
            </div>
        `).join('');
    }
}

// Setup event listeners for dynamically created platform elements
function setupPlatformEventListeners() {
    platforms.forEach(platform => {
        const openBtn = document.getElementById(`open-${platform}`);
        const checkbox = document.getElementById(`ready-${platform}`);

        if (openBtn) {
            openBtn.addEventListener('click', () => openPlatform(platform));
        }
        if (checkbox) {
            checkbox.addEventListener('change', (e) => handlePlatformReadyChange(platform, e.target.checked));
        }
    });
}

// Initialize app
async function init() {
    console.log('Initializing Columbus Desktop...');

    // Load platforms from API first (before DOM setup so we can render dynamic elements)
    await loadPlatforms();

    // Initialize DOM elements
    loginView = document.getElementById('loginView');
    mainView = document.getElementById('mainView');
    scanningView = document.getElementById('scanningView');
    completeView = document.getElementById('completeView');

    loginForm = document.getElementById('loginForm');
    loginError = document.getElementById('loginError');
    loginBtn = document.getElementById('loginBtn');
    googleLoginBtn = document.getElementById('googleLoginBtn');
    signupLink = document.getElementById('signupLink');

    userEmail = document.getElementById('userEmail');
    logoutBtn = document.getElementById('logoutBtn');
    productSelect = document.getElementById('productSelect');
    samplesPerPrompt = document.getElementById('samplesPerPrompt');
    samplesWarning = document.getElementById('samplesWarning');
    scanBtn = document.getElementById('scanBtn');
    scanInfo = document.getElementById('scanInfo');
    dashboardLink = document.getElementById('dashboardLink');

    progressFill = document.getElementById('progressFill');
    progressText = document.getElementById('progressText');
    phaseIndicator = document.getElementById('phaseIndicator');
    countdownDisplay = document.getElementById('countdownDisplay');
    countdownSeconds = document.getElementById('countdownSeconds');
    cancelScanBtn = document.getElementById('cancelScanBtn');

    completeStats = document.getElementById('completeStats');
    viewResultsBtn = document.getElementById('viewResultsBtn');
    newScanBtn = document.getElementById('newScanBtn');

    // Auto-run settings elements
    autoRunEnabled = document.getElementById('autoRunEnabled');
    scansPerDay = document.getElementById('scansPerDay');
    scansPerDayRow = document.getElementById('scansPerDayRow');
    timeWindowStart = document.getElementById('timeWindowStart');
    timeWindowEnd = document.getElementById('timeWindowEnd');
    timeWindowRow = document.getElementById('timeWindowRow');
    autostartEnabled = document.getElementById('autostartEnabled');

    // Schedule info elements
    scheduleInfoSection = document.getElementById('scheduleInfoSection');
    nextScanTime = document.getElementById('nextScanTime');
    scansCompleted = document.getElementById('scansCompleted');
    scansTotal = document.getElementById('scansTotal');

    // Scan running indicator elements
    scanRunningSection = document.getElementById('scanRunningSection');
    miniProgressFill = document.getElementById('miniProgressFill');
    miniProgressText = document.getElementById('miniProgressText');

    console.log('DOM elements loaded, googleLoginBtn:', googleLoginBtn);

    // Setup event listeners (platform listeners are setup in loadPlatforms -> updatePlatformUI)
    setupEventListeners();

    // Setup Tauri event listeners
    await setupTauriListeners();

    // Check scan status when window becomes visible
    document.addEventListener('visibilitychange', async () => {
        console.log('visibilitychange:', document.visibilityState);
        if (document.visibilityState === 'visible' && currentUser && !isInitializing) {
            await checkAndShowScanProgress();
        }
    });

    // Also listen for Tauri window focus event (more reliable for tray show)
    const appWindow = getCurrentWindow();
    appWindow.onFocusChanged(async ({ payload: focused }) => {
        console.log('Window focus changed:', focused);
        if (focused && currentUser && !isInitializing) {
            await checkAndShowScanProgress();
        }
    });

    // Check auth status
    await checkAuthStatus();
}

// Check if scan is running and update UI accordingly
async function checkAndShowScanProgress() {
    console.log('checkAndShowScanProgress called, currentUser:', !!currentUser, 'isInitializing:', isInitializing);
    try {
        const scanRunning = await invoke('is_scan_running');
        console.log('is_scan_running result:', scanRunning, 'isScanning state:', isScanning);

        if (scanRunning) {
            // Get current progress
            const progress = await invoke('get_scan_progress');
            console.log('Scan progress:', progress);

            // Update the running indicator in main view
            updateScanRunningIndicator(true, progress);

            if (!isScanning) {
                console.log('Scan is running, switching to scanning view');
                isScanning = true;
                showView('scanning');
                updateScanProgress(progress);
            }
        } else {
            // Hide running indicator
            updateScanRunningIndicator(false);

            if (isScanning) {
                // Scan finished while window was hidden
                console.log('Scan finished, switching to main view');
                isScanning = false;
                showView('main');
                // Refresh schedule info
                loadScheduleInfo();
            }
        }
    } catch (e) {
        console.error('Failed to check scan status:', e);
    }
}

function setupEventListeners() {
    console.log('Setting up event listeners...');

    // Login form
    loginForm.addEventListener('submit', handleLogin);

    // Google login
    console.log('Adding click listener to googleLoginBtn:', googleLoginBtn);
    googleLoginBtn.addEventListener('click', (e) => {
        console.log('Google login button clicked!');
        handleGoogleLogin();
    });

    // Signup link
    signupLink.addEventListener('click', handleSignupClick);

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Product selection
    productSelect.addEventListener('change', handleProductChange);

    // Platform login buttons and checkboxes are set up dynamically in setupPlatformEventListeners()

    // Samples per prompt
    samplesPerPrompt.addEventListener('change', handleSamplesChange);
    samplesPerPrompt.addEventListener('input', handleSamplesChange);

    // Scan controls
    scanBtn.addEventListener('click', handleStartScan);
    cancelScanBtn.addEventListener('click', handleCancelScan);

    // Complete view
    viewResultsBtn.addEventListener('click', handleViewResults);
    newScanBtn.addEventListener('click', handleNewScan);

    // Dashboard link
    dashboardLink.addEventListener('click', handleDashboardClick);

    // Custom URL input
    const openUrlBtn = document.getElementById('openUrlBtn');
    const customUrlInput = document.getElementById('customUrlInput');
    if (openUrlBtn && customUrlInput) {
        openUrlBtn.addEventListener('click', () => handleOpenCustomUrl(customUrlInput));
        customUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleOpenCustomUrl(customUrlInput);
            }
        });
    }

    // Auto-run settings
    if (autoRunEnabled) {
        autoRunEnabled.addEventListener('change', handleAutoRunChange);
    }
    if (scansPerDay) {
        scansPerDay.addEventListener('change', handleScansPerDayChange);
    }
    if (timeWindowStart) {
        timeWindowStart.addEventListener('change', handleTimeWindowChange);
    }
    if (timeWindowEnd) {
        timeWindowEnd.addEventListener('change', handleTimeWindowChange);
    }
    if (autostartEnabled) {
        autostartEnabled.addEventListener('change', handleAutostartChange);
    }
}

async function setupTauriListeners() {
    // Listen for scan progress
    await listen('scan:progress', (event) => {
        console.log('Scan progress:', event.payload);
        updateScanProgress(event.payload);
        // Also update mini indicator in main view
        updateScanRunningIndicator(true, event.payload);
    });

    // Listen for scan complete
    await listen('scan:complete', (event) => {
        console.log('Scan complete:', event.payload);
        handleScanComplete(event.payload);
        // Hide running indicator and refresh schedule
        updateScanRunningIndicator(false);
        loadScheduleInfo();
    });

    // Listen for scan error
    await listen('scan:error', (event) => {
        console.log('Scan error:', event.payload);
        handleScanError(event.payload);
        // Hide running indicator
        updateScanRunningIndicator(false);
    });
}

// View management
function showView(viewName) {
    loginView.classList.add('hidden');
    mainView.classList.add('hidden');
    scanningView.classList.add('hidden');
    completeView.classList.add('hidden');

    switch (viewName) {
        case 'login':
            loginView.classList.remove('hidden');
            break;
        case 'main':
            mainView.classList.remove('hidden');
            break;
        case 'scanning':
            scanningView.classList.remove('hidden');
            break;
        case 'complete':
            completeView.classList.remove('hidden');
            break;
    }
}

// Auth functions
async function checkAuthStatus() {
    try {
        const status = await invoke('get_auth_status');
        console.log('Auth status:', status);

        if (status.authenticated && status.user) {
            currentUser = { email: status.user.email };
            await onAuthenticated();
        } else {
            showView('login');
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showView('login');
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    setLoginLoading(true);
    hideLoginError();

    try {
        const result = await invoke('login', { email, password });
        console.log('Login result:', result);

        currentUser = { email: result.email };
        await onAuthenticated();
    } catch (error) {
        console.error('Login error:', error);
        showLoginError(error || 'Login failed');
    } finally {
        setLoginLoading(false);
    }
}

async function handleGoogleLogin() {
    console.log('handleGoogleLogin called');
    setGoogleLoginLoading(true);
    hideLoginError();

    try {
        console.log('Calling invoke login_with_google...');
        const result = await invoke('login_with_google');
        console.log('Google login result:', result);

        currentUser = { email: result.email };
        await onAuthenticated();
    } catch (error) {
        console.error('Google login error:', error);
        showLoginError(error || 'Google login failed');
    } finally {
        setGoogleLoginLoading(false);
    }
}

async function handleSignupClick(e) {
    e.preventDefault();
    try {
        await open('https://columbus-aeo.vercel.app/signup');
    } catch (error) {
        console.error('Failed to open signup:', error);
        window.open('https://columbus-aeo.vercel.app/signup', '_blank');
    }
}

async function handleLogout() {
    try {
        await invoke('logout');
        currentUser = null;
        products = [];
        selectedProductId = null;
        showView('login');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

async function onAuthenticated() {
    userEmail.textContent = currentUser.email;

    // Check if a scan is currently running
    try {
        const scanRunning = await invoke('is_scan_running');
        if (scanRunning) {
            console.log('Scan is running, showing scanning view');
            isScanning = true;
            showView('scanning');

            // Get current progress to update UI
            const progress = await invoke('get_scan_progress');
            updateScanProgress(progress);
        } else {
            showView('main');
        }
    } catch (e) {
        console.error('Failed to check scan status:', e);
        showView('main');
    }

    await loadProducts();

    // Load product config if a product was restored
    if (selectedProductId) {
        await loadProductConfig(selectedProductId);
    }

    // Load autostart setting (global, not per-product)
    await loadAutostartSetting();

    // Initialization complete - enable persistence
    isInitializing = false;
    console.log('Initialization complete, persistence enabled');
}

// Product functions
async function loadProducts() {
    try {
        const status = await invoke('get_status');
        console.log('Status:', status);

        products = status.products || [];

        // Populate product select
        productSelect.innerHTML = '<option value="">Select a product...</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            productSelect.appendChild(option);
        });

        // Restore last selected product
        try {
            const lastProductId = await invoke('get_last_product_id');
            if (lastProductId && products.some(p => p.id === lastProductId)) {
                productSelect.value = lastProductId;
                selectedProductId = lastProductId;
                updateScanButtonState();
            }
        } catch (e) {
            console.error('Failed to restore last product:', e);
        }
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

async function handleProductChange() {
    selectedProductId = productSelect.value;

    // Load config for this product
    if (selectedProductId) {
        await loadProductConfig(selectedProductId);
    } else {
        // Reset to defaults if no product selected
        currentProductConfig = {
            readyPlatforms: [],
            samplesPerPrompt: 1,
            autoRunEnabled: true,
            scansPerDay: 1,
            timeWindowStart: 9,
            timeWindowEnd: 17
        };
        await applyProductConfigToUI();
    }

    updateScanButtonState();

    // Only persist if not during initialization
    if (!isInitializing) {
        try {
            await invoke('set_last_product_id', { productId: selectedProductId || null });
        } catch (e) {
            console.error('Failed to save product selection:', e);
        }
    }
}

async function loadProductConfig(productId) {
    try {
        const config = await invoke('get_product_config', { productId });
        console.log('Loaded product config for', productId, ':', config);

        currentProductConfig = {
            readyPlatforms: config.ready_platforms || [],
            samplesPerPrompt: config.samples_per_prompt || 1,
            autoRunEnabled: config.auto_run_enabled !== false,
            scansPerDay: config.scans_per_day || 1,
            timeWindowStart: config.time_window_start ?? 9,
            timeWindowEnd: config.time_window_end ?? 17
        };

        await applyProductConfigToUI();
    } catch (e) {
        console.error('Failed to load product config:', e);
    }
}

async function applyProductConfigToUI() {
    // Update platform checkboxes
    readyPlatforms.clear();
    currentProductConfig.readyPlatforms.forEach(p => readyPlatforms.add(p));

    platforms.forEach(platform => {
        const checkbox = document.getElementById(`ready-${platform}`);
        const item = document.querySelector(`.platform-login-item[data-platform="${platform}"]`);
        const isReady = readyPlatforms.has(platform);

        if (checkbox) checkbox.checked = isReady;
        if (item) {
            if (isReady) {
                item.classList.add('ready');
            } else {
                item.classList.remove('ready');
            }
        }
    });

    // Update samples per prompt
    if (samplesPerPrompt) {
        samplesPerPrompt.value = currentProductConfig.samplesPerPrompt;
    }

    // Update auto-run settings
    if (autoRunEnabled) {
        autoRunEnabled.checked = currentProductConfig.autoRunEnabled;
    }
    if (scansPerDay) {
        scansPerDay.value = currentProductConfig.scansPerDay;
    }
    if (timeWindowStart) {
        timeWindowStart.value = currentProductConfig.timeWindowStart;
    }
    if (timeWindowEnd) {
        timeWindowEnd.value = currentProductConfig.timeWindowEnd;
    }

    // Update disabled state of auto-run dependent fields
    const autoRunDependentEnabled = currentProductConfig.autoRunEnabled;
    if (scansPerDayRow) {
        scansPerDayRow.style.opacity = autoRunDependentEnabled ? '1' : '0.5';
        scansPerDay.disabled = !autoRunDependentEnabled;
    }
    if (timeWindowRow) {
        timeWindowRow.style.opacity = autoRunDependentEnabled ? '1' : '0.5';
        timeWindowStart.disabled = !autoRunDependentEnabled;
        timeWindowEnd.disabled = !autoRunDependentEnabled;
    }

    updatePlatformHint();
    updateScanButtonState();

    // Load schedule info for auto-run products
    if (selectedProductId) {
        await loadScheduleInfo();
    }
}

// Format hour to 12-hour format with AM/PM
function formatHour(hour) {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
}

// Load and display schedule info for the current product
async function loadScheduleInfo() {
    if (!selectedProductId || !currentProductConfig.autoRunEnabled) {
        // Hide schedule info if no product or auto-run disabled
        if (scheduleInfoSection) {
            scheduleInfoSection.classList.add('disabled');
            nextScanTime.textContent = 'Auto-run disabled';
            scansCompleted.textContent = '0';
            scansTotal.textContent = '0';
        }
        return;
    }

    try {
        const info = await invoke('get_schedule_info', { productId: selectedProductId });
        console.log('Schedule info:', info);

        if (scheduleInfoSection) {
            scheduleInfoSection.classList.remove('disabled');

            if (info.next_scan_hour !== null) {
                nextScanTime.textContent = formatHour(info.next_scan_hour);
            } else if (info.scans_completed_today >= info.scans_total_today) {
                nextScanTime.textContent = 'Done for today';
            } else {
                nextScanTime.textContent = '--';
            }

            scansCompleted.textContent = info.scans_completed_today;
            scansTotal.textContent = info.scans_total_today;
        }
    } catch (e) {
        console.error('Failed to load schedule info:', e);
    }
}

// Update scan running indicator in main view
function updateScanRunningIndicator(isRunning, progress = null) {
    if (scanRunningSection) {
        if (isRunning) {
            scanRunningSection.classList.remove('hidden');
            if (progress) {
                const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
                miniProgressFill.style.width = `${percent}%`;
                miniProgressText.textContent = `${percent}%`;
            }
        } else {
            scanRunningSection.classList.add('hidden');
        }
    }

    // Disable/enable scan button based on running state
    if (scanBtn) {
        if (isRunning) {
            scanBtn.disabled = true;
            scanBtn.querySelector('.btn-text').textContent = 'Scan Running...';
        } else {
            updateScanButtonState();
            scanBtn.querySelector('.btn-text').textContent = 'Run Scan';
        }
    }
}

async function handleSamplesChange(e) {
    let count = parseInt(e.target.value, 10);

    if (isNaN(count) || count < 1) {
        count = 1;
        e.target.value = '1';
    }

    // Show warning for high values
    if (count > 10) {
        samplesWarning.classList.remove('hidden');
    } else {
        samplesWarning.classList.add('hidden');
    }

    // Persist platform config
    await saveProductConfig();
}

// Platform functions
async function openPlatform(platform) {
    try {
        // Open in Tauri webview so cookies are shared with scan
        await invoke('open_platform_login', { platform });
    } catch (error) {
        console.error(`Failed to open ${platform}:`, error);
        // Fallback to shell open (cookies won't be shared with scan)
        const url = PLATFORM_URLS[platform];
        if (url) {
            try {
                await open(url);
            } catch (e) {
                window.open(url, '_blank');
            }
        }
    }
}

async function handleOpenCustomUrl(inputElement) {
    const url = inputElement.value.trim();
    if (!url) {
        return;
    }

    // Basic URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert('Please enter a valid URL starting with http:// or https://');
        return;
    }

    try {
        await invoke('open_url_in_browser', { url });
        inputElement.value = ''; // Clear input on success
    } catch (error) {
        console.error('Failed to open URL:', error);
        alert('Failed to open URL: ' + error);
    }
}

async function handlePlatformReadyChange(platform, isReady) {
    const item = document.querySelector(`.platform-login-item[data-platform="${platform}"]`);

    if (isReady) {
        readyPlatforms.add(platform);
        item?.classList.add('ready');
    } else {
        readyPlatforms.delete(platform);
        item?.classList.remove('ready');
    }

    updateScanButtonState();
    updatePlatformHint();

    // Only persist if not during initialization
    if (!isInitializing) {
        await saveProductConfig();
    }
}

async function saveProductConfig() {
    if (!selectedProductId) return;

    try {
        await invoke('set_product_config', {
            productId: selectedProductId,
            readyPlatforms: Array.from(readyPlatforms),
            samplesPerPrompt: parseInt(samplesPerPrompt.value) || 1,
            autoRunEnabled: currentProductConfig.autoRunEnabled,
            scansPerDay: currentProductConfig.scansPerDay,
            timeWindowStart: currentProductConfig.timeWindowStart,
            timeWindowEnd: currentProductConfig.timeWindowEnd
        });
    } catch (e) {
        console.error('Failed to save product config:', e);
    }
}

function updateScanButtonState() {
    const hasProduct = !!selectedProductId;
    const hasPlatforms = readyPlatforms.size > 0;

    scanBtn.disabled = !hasProduct || !hasPlatforms;

    if (!hasProduct && !hasPlatforms) {
        scanInfo.textContent = 'Select a product and log into platforms';
    } else if (!hasProduct) {
        scanInfo.textContent = 'Select a product to start scanning';
    } else if (!hasPlatforms) {
        scanInfo.textContent = 'Check at least one platform you\'re logged into';
    } else {
        const product = products.find(p => p.id === selectedProductId);
        const platformCount = readyPlatforms.size;
        scanInfo.textContent = `Ready to scan ${product?.name || 'product'} on ${platformCount} platform${platformCount > 1 ? 's' : ''}`;
    }
}

function updatePlatformHint() {
    const hint = document.getElementById('platformsHint');
    if (!hint) return;

    const count = readyPlatforms.size;
    if (count === 0) {
        hint.textContent = 'Check platforms you\'re logged into';
        hint.className = 'platforms-hint warning';
    } else if (count < platforms.length) {
        hint.textContent = `${count} of ${platforms.length} platforms ready`;
        hint.className = 'platforms-hint';
    } else {
        hint.textContent = 'All platforms ready!';
        hint.className = 'platforms-hint ready';
    }
}

// updatePlatformStatus is no longer needed - config is loaded per-product in handleProductChange

// Scan functions
async function handleStartScan() {
    if (!selectedProductId) return;
    if (readyPlatforms.size === 0) {
        alert('Please select at least one platform you\'re logged into');
        return;
    }

    const samples = parseInt(samplesPerPrompt.value) || 1;
    const selectedPlatforms = Array.from(readyPlatforms);

    try {
        scanBtn.disabled = true;
        isScanning = true;

        // Reset progress UI
        resetProgressUI();

        // Show scanning view
        showView('scanning');

        // Start scan with selected platforms
        await invoke('start_scan', {
            productId: selectedProductId,
            samplesPerPrompt: samples,
            platforms: selectedPlatforms
        });

        console.log('Scan started with platforms:', selectedPlatforms);
    } catch (error) {
        console.error('Start scan error:', error);
        alert('Failed to start scan: ' + error);
        showView('main');
        scanBtn.disabled = false;
        isScanning = false;
    }
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

function resetProgressUI() {
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
    phaseIndicator.textContent = 'Initializing...';
    countdownDisplay.classList.add('hidden');
    countdownSeconds.textContent = '45';

    // Reset platform progress
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

function updateScanProgress(progress) {
    const { phase, current, total, platforms: platformStates, countdownSeconds: countdown } = progress;

    // Update overall progress
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${percent}%`;

    // Update phase indicator
    const phaseText = {
        'initializing': 'Initializing scan...',
        'submitting': 'Submitting prompts to AI platforms...',
        'waiting': 'Waiting for AI responses...',
        'collecting': 'Collecting and analyzing responses...',
        'complete': 'Scan complete!'
    };
    phaseIndicator.textContent = phaseText[phase] || phase;

    // Show countdown during waiting phase
    if (phase === 'waiting' && countdown !== null && countdown !== undefined) {
        countdownDisplay.classList.remove('hidden');
        countdownSeconds.textContent = countdown;
    } else {
        countdownDisplay.classList.add('hidden');
    }

    // Update platform progress
    if (platformStates) {
        for (const [platform, state] of Object.entries(platformStates)) {
            updatePlatformProgress(platform, state);
        }
    }
}

function updatePlatformProgress(platform, state) {
    const statusEl = document.getElementById(`progress-${platform}-status`);
    const fillEl = document.getElementById(`progress-${platform}-fill`);
    const countEl = document.getElementById(`progress-${platform}-count`);

    if (!statusEl || !fillEl || !countEl) return;

    // Update status
    statusEl.textContent = state.status;
    statusEl.className = `platform-progress-status ${state.status}`;

    // Update progress bar
    const percent = state.total > 0 ? Math.round((state.collected / state.total) * 100) : 0;
    fillEl.style.width = `${percent}%`;

    if (state.status === 'complete') {
        fillEl.classList.add('complete');
    }

    // Update count
    countEl.textContent = `${state.collected}/${state.total}`;
}

function handleScanComplete(stats) {
    isScanning = false;

    // Update complete stats
    completeStats.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${stats.successful_prompts}</div>
            <div class="stat-label">Responses Collected</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.mention_rate.toFixed(1)}%</div>
            <div class="stat-label">Mention Rate</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.citation_rate.toFixed(1)}%</div>
            <div class="stat-label">Citation Rate</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.total_prompts}</div>
            <div class="stat-label">Total Prompts</div>
        </div>
    `;

    showView('complete');
}

function handleScanError(error) {
    isScanning = false;
    alert('Scan error: ' + error);
    showView('main');
    scanBtn.disabled = false;
}

// Navigation functions
async function handleViewResults(e) {
    e.preventDefault();
    try {
        await open(DASHBOARD_URL + '/visibility');
    } catch (error) {
        console.error('Failed to open dashboard:', error);
        window.open(DASHBOARD_URL + '/visibility', '_blank');
    }
}

function handleNewScan() {
    showView('main');
    scanBtn.disabled = !selectedProductId;
}

async function handleDashboardClick(e) {
    e.preventDefault();
    try {
        await open(DASHBOARD_URL);
    } catch (error) {
        console.error('Failed to open dashboard:', error);
        window.open(DASHBOARD_URL, '_blank');
    }
}

// Helper functions
function showLoginError(message) {
    loginError.textContent = message;
    loginError.classList.remove('hidden');
}

function hideLoginError() {
    loginError.classList.add('hidden');
}

function setLoginLoading(loading) {
    loginBtn.disabled = loading;
    loginBtn.querySelector('.btn-text').classList.toggle('hidden', loading);
    loginBtn.querySelector('.btn-loading').classList.toggle('hidden', !loading);
}

function setGoogleLoginLoading(loading) {
    googleLoginBtn.disabled = loading;
    googleLoginBtn.querySelector('.btn-text').classList.toggle('hidden', loading);
    googleLoginBtn.querySelector('.btn-loading').classList.toggle('hidden', !loading);
}

// Auto-run settings handlers (per-product)
async function handleAutoRunChange(e) {
    if (!selectedProductId) return;

    const enabled = e.target.checked;
    currentProductConfig.autoRunEnabled = enabled;

    // Show/hide scans per day and time window settings based on auto-run state
    if (scansPerDayRow) {
        scansPerDayRow.style.opacity = enabled ? '1' : '0.5';
        scansPerDay.disabled = !enabled;
    }
    if (timeWindowRow) {
        timeWindowRow.style.opacity = enabled ? '1' : '0.5';
        timeWindowStart.disabled = !enabled;
        timeWindowEnd.disabled = !enabled;
    }

    try {
        await saveProductConfig();
        console.log('Auto-run setting updated for product:', selectedProductId, enabled);
    } catch (error) {
        console.error('Failed to update auto-run setting:', error);
        // Revert UI on error
        e.target.checked = !enabled;
        currentProductConfig.autoRunEnabled = !enabled;
    }
}

async function handleScansPerDayChange(e) {
    if (!selectedProductId) return;

    let value = parseInt(e.target.value, 10);

    // Clamp value between 1 and 24
    if (isNaN(value) || value < 1) {
        value = 1;
        e.target.value = '1';
    } else if (value > 24) {
        value = 24;
        e.target.value = '24';
    }

    currentProductConfig.scansPerDay = value;

    try {
        await saveProductConfig();
        console.log('Scans per day updated for product:', selectedProductId, value);
    } catch (error) {
        console.error('Failed to update scans per day:', error);
    }
}

async function handleTimeWindowChange(e) {
    if (!selectedProductId) return;

    const startValue = parseInt(timeWindowStart.value, 10);
    const endValue = parseInt(timeWindowEnd.value, 10);

    // Validate that end is after start
    if (endValue <= startValue) {
        console.warn('End time must be after start time');
        // Reset to previous values
        timeWindowStart.value = currentProductConfig.timeWindowStart;
        timeWindowEnd.value = currentProductConfig.timeWindowEnd;
        return;
    }

    currentProductConfig.timeWindowStart = startValue;
    currentProductConfig.timeWindowEnd = endValue;

    try {
        await saveProductConfig();
        console.log('Time window updated for product:', selectedProductId, startValue, '-', endValue);
    } catch (error) {
        console.error('Failed to update time window:', error);
    }
}

async function handleAutostartChange(e) {
    const enabled = e.target.checked;

    try {
        const result = await invoke('set_autostart_enabled', { enabled });
        console.log('Autostart setting updated:', result);
    } catch (error) {
        console.error('Failed to update autostart setting:', error);
        // Revert UI on error
        e.target.checked = !enabled;
    }
}

async function loadAutostartSetting() {
    try {
        // Load autostart setting (this is global, not per-product)
        const autostartIsEnabled = await invoke('get_autostart_enabled');
        if (autostartEnabled) {
            autostartEnabled.checked = autostartIsEnabled;
        }
        console.log('Autostart status:', autostartIsEnabled);
    } catch (error) {
        console.error('Failed to load autostart setting:', error);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    init().catch(e => {
        console.error('Init error:', e);
    });
});

console.log('Main.js fully loaded');
