// Columbus Desktop App - Main JavaScript
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-shell';

// State
let currentUser = null;
let products = [];
let selectedProductId = null;
let isScanning = false;

// DOM Elements
const loginView = document.getElementById('loginView');
const mainView = document.getElementById('mainView');
const scanningView = document.getElementById('scanningView');
const completeView = document.getElementById('completeView');

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginBtn = document.getElementById('loginBtn');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const signupLink = document.getElementById('signupLink');

const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const productSelect = document.getElementById('productSelect');
const samplesPerPrompt = document.getElementById('samplesPerPrompt');
const samplesWarning = document.getElementById('samplesWarning');
const scanBtn = document.getElementById('scanBtn');
const scanInfo = document.getElementById('scanInfo');
const dashboardLink = document.getElementById('dashboardLink');

const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const phaseIndicator = document.getElementById('phaseIndicator');
const collectNowBtn = document.getElementById('collectNowBtn');
const cancelScanBtn = document.getElementById('cancelScanBtn');

const completeStats = document.getElementById('completeStats');
const viewResultsBtn = document.getElementById('viewResultsBtn');
const newScanBtn = document.getElementById('newScanBtn');

// Platform elements
const platforms = ['chatgpt', 'claude', 'gemini', 'perplexity'];

// Dashboard URL
const DASHBOARD_URL = 'https://columbus-aeo.vercel.app/dashboard';

// Initialize app
async function init() {
    console.log('Initializing Columbus Desktop...');

    // Setup event listeners
    setupEventListeners();

    // Setup Tauri event listeners
    await setupTauriListeners();

    // Check auth status
    await checkAuthStatus();
}

function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);

    // Google login
    googleLoginBtn.addEventListener('click', handleGoogleLogin);

    // Signup link
    signupLink.addEventListener('click', handleSignupClick);

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Product selection
    productSelect.addEventListener('change', handleProductChange);

    // Samples per prompt
    samplesPerPrompt.addEventListener('change', handleSamplesChange);
    samplesPerPrompt.addEventListener('input', handleSamplesChange);

    // Scan controls
    scanBtn.addEventListener('click', handleStartScan);
    cancelScanBtn.addEventListener('click', handleCancelScan);
    collectNowBtn.addEventListener('click', handleCollectNow);

    // Complete view
    viewResultsBtn.addEventListener('click', handleViewResults);
    newScanBtn.addEventListener('click', handleNewScan);

    // Dashboard link
    dashboardLink.addEventListener('click', handleDashboardClick);
}

async function setupTauriListeners() {
    // Listen for scan progress
    await listen('scan:progress', (event) => {
        console.log('Scan progress:', event.payload);
        updateScanProgress(event.payload);
    });

    // Listen for scan complete
    await listen('scan:complete', (event) => {
        console.log('Scan complete:', event.payload);
        handleScanComplete(event.payload);
    });

    // Listen for scan error
    await listen('scan:error', (event) => {
        console.log('Scan error:', event.payload);
        handleScanError(event.payload);
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
    setGoogleLoginLoading(true);
    hideLoginError();

    try {
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
    showView('main');
    await loadProducts();
    await updatePlatformStatus();
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
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

function handleProductChange() {
    selectedProductId = productSelect.value;

    if (selectedProductId) {
        scanBtn.disabled = false;
        const product = products.find(p => p.id === selectedProductId);
        scanInfo.textContent = `Ready to scan ${product?.name || 'product'}`;
    } else {
        scanBtn.disabled = true;
        scanInfo.textContent = 'Select a product to start scanning';
    }
}

function handleSamplesChange(e) {
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
}

async function updatePlatformStatus() {
    // For now, show all platforms as ready
    platforms.forEach(platform => {
        const statusEl = document.getElementById(`status-${platform}`);
        if (statusEl) {
            statusEl.textContent = 'Ready';
            statusEl.classList.add('complete');
        }
    });
}

// Scan functions
async function handleStartScan() {
    if (!selectedProductId) return;

    const samples = parseInt(samplesPerPrompt.value) || 1;

    try {
        scanBtn.disabled = true;
        isScanning = true;

        // Reset progress UI
        resetProgressUI();

        // Show scanning view
        showView('scanning');

        // Start scan
        await invoke('start_scan', {
            productId: selectedProductId,
            samplesPerPrompt: samples
        });

        console.log('Scan started');
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

async function handleCollectNow() {
    console.log('Collect now requested');
    collectNowBtn.disabled = true;
    collectNowBtn.textContent = 'Collecting...';
}

function resetProgressUI() {
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
    phaseIndicator.textContent = 'Initializing...';
    collectNowBtn.classList.add('hidden');
    collectNowBtn.disabled = false;
    collectNowBtn.textContent = 'Collect Now';

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
    const { phase, current, total, platforms: platformStates } = progress;

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

    // Show collect now button during waiting phase
    if (phase === 'waiting') {
        collectNowBtn.classList.remove('hidden');
    } else {
        collectNowBtn.classList.add('hidden');
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

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
