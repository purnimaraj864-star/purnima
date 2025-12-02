// Global variables
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let currentLanguage = localStorage.getItem('language') || 'en';
let currentTheme = localStorage.getItem('theme') || 'light';
let currentCalculation = null;
let chatbotReady = false;

let chatbotState = {
    conversationStep: 'initial',
    selectedType: null
};

const chatbotKnowledgeBase = [
    {
        keywords: ['rooftop', 'roof', 'house', 'home'],
        response: 'Rooftop harvesting is ideal for residential buildings. It captures water directly from your roof through gutters and channels it to storage or recharge. With an average 1200 sq ft roof and concrete surface, you can collect 60,000-80,000 liters annually. Would you like to try the rooftop calculator?'
    },
    {
        keywords: ['surface', 'yard', 'ground', 'paved', 'parking'],
        response: 'Surface runoff harvesting works great for larger properties with yards, parking, or open grounds. It captures water flowing across paved or unpaved areas. This method suits properties with limited roof space. Ready to calculate surface runoff potential?'
    },
    {
        keywords: ['pump', 'direct', 'indirect', 'pumping'],
        response: 'We support two pump types:\n• Direct-Pumped: Water goes straight from tank to outlets (simpler, cheaper).\n• Indirect-Pumped: Water goes tank → header tank → outlets via gravity (better pressure, more reliable).\nChoose based on your property size and daily water needs.'
    },
    {
        keywords: ['capture', 'potential', 'yield', 'water', 'collect'],
        response: 'Water capture depends on rainfall, roof/surface area, and runoff coefficient. Rooftops: Rainfall (mm) × Area (m²) × Coefficient ÷ 1000. Example: 140 m² roof @ 900mm rainfall with 0.85 coefficient = ~107,000 L/year.'
    },
    {
        keywords: ['maintenance', 'clean', 'service', 'upkeep'],
        response: 'Monthly: Gutter sweep + debris check. Quarterly: Reset first-flush, rinse filters. Annual: Tank deep clean + lab water test. Keep recharge pits desilted before monsoon. This keeps your system 95%+ efficient.'
    },
    {
        keywords: ['recharge', 'mandatory', 'law', 'compliance', 'cgwa'],
        response: 'Most city bylaws mandate recharge pits for plots > 100 sq m. Keep pits 6m from foundation, 1.5m above water table. Dual pit systems are recommended. Check local municipal bylaws for your area.'
    },
    {
        keywords: ['cost', 'price', 'payback', 'budget', 'savings'],
        response: 'Rooftop systems typically cost ₹45k–₹1.2L depending on storage size and pump type. Surface runoff may cost more due to larger catchment. Payback: 18–24 months with 3–6k/month tanker savings. Annual maintenance: ₹3–5k.'
    },
    {
        keywords: ['quality', 'potable', 'filter', 'drink', 'treatment'],
        response: 'For non-potable (flushing/gardening): TDS < 500ppm, turbidity < 5 NTU, pH 6.5–8.5 with dual media filters. For potable: Add UV/UF polishing post-storage and chlorine dosing (1–2ppm) after rain events.'
    },
    {
        keywords: ['automation', 'sensor', 'smart', 'iot'],
        response: 'Connect ultrasonic depth sensors, flow meters, and solenoid valves to Wi-Fi gateways (Home Assistant, Blynk) for real-time dashboards. Set auto pump shutoffs, tanker alerts, and maintenance reminders.'
    },
    {
        keywords: ['calculate', 'start', 'begin', 'compute'],
        response: 'Ready to calculate! Choose:\n1. Rooftop if you have a usable roof area and want efficient collection.\n2. Surface Runoff if you have large open grounds or paved areas.\nWhich type suits your property?'
    }
];

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkAuthentication();
    loadUserPreferences();
});

// Initialize app
function initializeApp() {
    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Update theme icon
    const themeIcon = document.querySelector('#darkModeToggle i');
    themeIcon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    
    // Set initial language
    document.getElementById('languageSelect').value = currentLanguage;
    updateTranslations();
    
    // Initialize CAPTCHA images
    loadCaptcha('login');
    loadCaptcha('register');
    
    // Initialize OTP inputs
    setupOTPInputs();

    // Initialize chatbot
    initializeChatbot();
}

// Setup event listeners
function setupEventListeners() {
    // Language selector
    document.getElementById('languageSelect').addEventListener('change', function(e) {
        currentLanguage = e.target.value;
        localStorage.setItem('language', currentLanguage);
        updateTranslations();
    });
    
    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    
    // Authentication buttons
    document.getElementById('loginBtn').addEventListener('click', showLoginModal);
    document.getElementById('registerBtn').addEventListener('click', showRegisterModal);
    document.getElementById('closeAuthModal').addEventListener('click', hideAuthModal);
    
    // Auth form switches
    document.getElementById('switchToRegister').addEventListener('click', showRegisterForm);
    document.getElementById('switchToLogin').addEventListener('click', showLoginForm);
    document.getElementById('phoneLoginBtn').addEventListener('click', showPhoneLoginForm);
    document.getElementById('switchToEmailLogin').addEventListener('click', showLoginForm);
    
    // Form submissions
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
    document.getElementById('registerFormElement').addEventListener('submit', handleRegister);
    document.getElementById('phoneLoginFormElement').addEventListener('submit', handlePhoneLogin);
    document.getElementById('otpForm').addEventListener('submit', handleOTPVerification);
    
    // Type-specific form handlers
    const rooftopForm = document.getElementById('rooftopForm');
    const surfaceForm = document.getElementById('surfaceRunoffForm');
    if (rooftopForm) rooftopForm.addEventListener('submit', handleRooftopCalculation);
    if (surfaceForm) surfaceForm.addEventListener('submit', handleSurfaceRunoffCalculation);
    
    // CAPTCHA refresh
    document.getElementById('refreshLoginCaptcha').addEventListener('click', () => loadCaptcha('login'));
    document.getElementById('refreshRegisterCaptcha').addEventListener('click', () => loadCaptcha('register'));
    
    // OAuth buttons
    const googleBtn = document.getElementById('googleLoginBtn');
    const facebookBtn = document.getElementById('facebookLoginBtn');
    if (googleBtn) googleBtn.addEventListener('click', () => handleOAuthLogin('google'));
    if (facebookBtn) facebookBtn.addEventListener('click', () => handleOAuthLogin('facebook'));
    
    // User menu
    document.getElementById('userMenuBtn').addEventListener('click', toggleUserMenu);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('profileBtn').addEventListener('click', showProfile);
    document.getElementById('historyBtn').addEventListener('click', showHistory);
    document.getElementById('settingsBtn').addEventListener('click', showSettings);
    
    // OTP modal
    document.getElementById('closeOtpModal').addEventListener('click', hideOtpModal);
    document.getElementById('resendOtp').addEventListener('click', handleResendOTP);
    
    // Action buttons
    document.getElementById('saveCalculation').addEventListener('click', saveCalculation);
    document.getElementById('downloadReport').addEventListener('click', downloadReport);
    document.getElementById('shareReport').addEventListener('click', shareReport);
    document.getElementById('newCalculation').addEventListener('click', newCalculation);
    
    // Close modals on outside click
    document.getElementById('authModal').addEventListener('click', function(e) {
        if (e.target === this) hideAuthModal();
    });
    
    document.getElementById('otpModal').addEventListener('click', function(e) {
        if (e.target === this) hideOtpModal();
    });
    
    // Close user menu on outside click
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-menu')) {
            document.getElementById('userDropdown').classList.remove('active');
        }
    });

    // Chatbot events
    setupChatbot();
}

// Type Selector Functions
function selectHarvestingType(type) {
    const rooftopCalc = document.getElementById('rooftopCalculator');
    const surfaceCalc = document.getElementById('surfaceRunoffCalculator');
    const formSection = document.getElementById('formSection');
    const resultsSection = document.getElementById('resultsSection');

    if (resultsSection) resultsSection.style.display = 'none';
    if (formSection) formSection.style.display = 'none';

    if (type === 'rooftop' && rooftopCalc) {
        rooftopCalc.style.display = 'block';
        rooftopCalc.scrollIntoView({ behavior: 'smooth' });
        chatbotState.selectedType = 'rooftop';
    } else if (type === 'surface_runoff' && surfaceCalc) {
        surfaceCalc.style.display = 'block';
        surfaceCalc.scrollIntoView({ behavior: 'smooth' });
        chatbotState.selectedType = 'surface_runoff';
    }
}

function backToTypeSelector() {
    const rooftopCalc = document.getElementById('rooftopCalculator');
    const surfaceCalc = document.getElementById('surfaceRunoffCalculator');
    const formSection = document.getElementById('formSection');

    if (rooftopCalc) rooftopCalc.style.display = 'none';
    if (surfaceCalc) surfaceCalc.style.display = 'none';
    if (formSection) {
        formSection.style.display = 'block';
        formSection.scrollIntoView({ behavior: 'smooth' });
    }
    chatbotState.selectedType = null;
}

// Theme Management
function toggleDarkMode() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    
    // Update theme icon
    const themeIcon = document.querySelector('#darkModeToggle i');
    themeIcon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    
    // Save user preference if logged in
    if (currentUser) {
        saveUserPreference('dark_mode', currentTheme === 'dark');
    }
}

// Authentication Functions
function checkAuthentication() {
    if (authToken) {
        // Verify token and get user info
        fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Invalid token');
            }
        })
        .then(data => {
            currentUser = data.user;
            updateAuthUI();
            loadUserPreferences();
        })
        .catch(error => {
            console.error('Authentication error:', error);
            // Token is invalid, clear it
            localStorage.removeItem('authToken');
            authToken = null;
            currentUser = null;
            updateAuthUI();
        });
    } else {
        updateAuthUI();
    }
}

function updateAuthUI() {
    const guestAuth = document.getElementById('guestAuth');
    const userAuth = document.getElementById('userAuth');
    
    if (currentUser) {
        guestAuth.style.display = 'none';
        userAuth.style.display = 'block';
        document.getElementById('userName').textContent = currentUser.first_name || currentUser.email;
    } else {
        guestAuth.style.display = 'flex';
        userAuth.style.display = 'none';
    }
}

// Modal Functions
function showLoginModal() {
    document.getElementById('authModal').classList.add('active');
    document.getElementById('authModalTitle').textContent = 'Login';
    showLoginForm();
}

function showRegisterModal() {
    document.getElementById('authModal').classList.add('active');
    document.getElementById('authModalTitle').textContent = 'Sign Up';
    showRegisterForm();
}

function hideAuthModal() {
    document.getElementById('authModal').classList.remove('active');
    resetAuthForms();
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('phoneLoginForm').style.display = 'none';
    loadCaptcha('login');
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('phoneLoginForm').style.display = 'none';
    loadCaptcha('register');
}

function showPhoneLoginForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('phoneLoginForm').style.display = 'block';
}

function resetAuthForms() {
    document.getElementById('loginFormElement').reset();
    document.getElementById('registerFormElement').reset();
    document.getElementById('phoneLoginFormElement').reset();
    document.getElementById('otpForm').reset();
}

// CAPTCHA Functions
function loadCaptcha(type) {
    const captchaId = `captcha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const captchaImage = document.getElementById(`${type}CaptchaImage`);
    captchaImage.src = `${API_BASE_URL}/captcha/${captchaId}`;
    captchaImage.setAttribute('data-captcha-id', captchaId);
}

// Form Handlers
function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const captchaId = document.getElementById('loginCaptchaImage').getAttribute('data-captcha-id');
    
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password'),
        captcha: formData.get('captcha'),
        captcha_id: captchaId
    };
    
    fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            updateAuthUI();
            hideAuthModal();
            showNotification('Login successful!', 'success');
            loadUserPreferences();
        } else {
            showNotification(data.message || 'Login failed', 'error');
            loadCaptcha('login');
        }
    })
    .catch(error => {
        showNotification('Login failed. Please try again.', 'error');
        loadCaptcha('login');
    });
}

function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const captchaId = document.getElementById('registerCaptchaImage').getAttribute('data-captcha-id');
    
    if (formData.get('password') !== formData.get('confirm_password')) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    const registerData = {
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        password: formData.get('password'),
        captcha: formData.get('captcha'),
        captcha_id: captchaId
    };
    
    fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Registration successful! Please check your email for verification.', 'success');
            hideAuthModal();
            showLoginForm();
        } else {
            showNotification(data.message || 'Registration failed', 'error');
            loadCaptcha('register');
        }
    })
    .catch(error => {
        showNotification('Registration failed. Please try again.', 'error');
        loadCaptcha('register');
    });
}

function handlePhoneLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const phoneData = {
        country_code: formData.get('country_code'),
        phone_number: formData.get('phone_number')
    };
    
    fetch(`${API_BASE_URL}/auth/phone-login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(phoneData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('OTP sent to your phone!', 'success');
            hideAuthModal();
            showOtpModal(phoneData.country_code + phoneData.phone_number);
        } else {
            showNotification(data.message || 'Failed to send OTP', 'error');
        }
    })
    .catch(error => {
        showNotification('Failed to send OTP. Please try again.', 'error');
    });
}

function handleOAuthLogin(provider) {
    // Redirect to OAuth provider
    window.location.href = `${API_BASE_URL}/auth/${provider}`;
}

// OTP Functions
function setupOTPInputs() {
    const otpInputs = document.querySelectorAll('.otp-input');
    
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            if (e.target.value.length === 1) {
                if (index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            }
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
        
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text');
            const digits = pastedData.replace(/\D/g, '').slice(0, 6);
            
            digits.split('').forEach((digit, i) => {
                if (otpInputs[i]) {
                    otpInputs[i].value = digit;
                }
            });
        });
    });
}

function showOtpModal(phoneNumber) {
    document.getElementById('otpModal').classList.add('active');
    document.getElementById('otpPhoneNumber').textContent = phoneNumber;
    
    // Clear OTP inputs
    document.querySelectorAll('.otp-input').forEach(input => input.value = '');
    document.querySelector('.otp-input').focus();
}

function hideOtpModal() {
    document.getElementById('otpModal').classList.remove('active');
}

function handleOTPVerification(e) {
    e.preventDefault();
    
    const otpInputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(otpInputs).map(input => input.value).join('');
    
    if (otp.length !== 6) {
        showNotification('Please enter a 6-digit OTP', 'error');
        return;
    }
    
    const phoneNumber = document.getElementById('otpPhoneNumber').textContent;
    
    fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            phone_number: phoneNumber,
            otp: otp
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            updateAuthUI();
            hideOtpModal();
            showNotification('Login successful!', 'success');
            loadUserPreferences();
        } else {
            showNotification(data.message || 'Invalid OTP', 'error');
        }
    })
    .catch(error => {
        showNotification('OTP verification failed. Please try again.', 'error');
    });
}

function handleResendOTP(e) {
    e.preventDefault();
    
    const phoneNumber = document.getElementById('otpPhoneNumber').textContent;
    
    fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            phone_number: phoneNumber
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('OTP resent successfully!', 'success');
        } else {
            showNotification(data.message || 'Failed to resend OTP', 'error');
        }
    })
    .catch(error => {
        showNotification('Failed to resend OTP. Please try again.', 'error');
    });
}

// User Management
function toggleUserMenu() {
    document.getElementById('userDropdown').classList.toggle('active');
}

function handleLogout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    updateAuthUI();
    showNotification('Logged out successfully', 'success');
    
    // Redirect to home
    window.location.reload();
}

function showProfile() {
    if (!currentUser) return;
    
    showNotification('Profile feature coming soon!', 'info');
}

function showHistory() {
    if (!currentUser) return;
    
    // Hide other sections
    document.getElementById('resultsSection').style.display = 'none';
    const formSection = document.getElementById('formSection');
    if (formSection) {
        formSection.style.display = 'none';
    }
    
    // Show history section
    document.getElementById('historySection').style.display = 'block';
    
    // Load user history
    loadUserHistory();
}

function showSettings() {
    if (!currentUser) return;
    
    showNotification('Settings feature coming soon!', 'info');
}

function loadUserPreferences() {
    if (!currentUser) return;
    
    fetch(`${API_BASE_URL}/user/preferences`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const preferences = data.preferences;
            
            // Apply dark mode preference
            if (preferences.dark_mode) {
                currentTheme = 'dark';
                document.documentElement.setAttribute('data-theme', currentTheme);
                document.querySelector('#darkModeToggle i').className = 'fas fa-sun';
            }
            
            // Apply language preference
            if (preferences.language) {
                currentLanguage = preferences.language;
                document.getElementById('languageSelect').value = currentLanguage;
                updateTranslations();
            }
        }
    })
    .catch(error => {
        console.error('Failed to load user preferences:', error);
    });
}

function saveUserPreference(key, value) {
    if (!currentUser) return;
    
    fetch(`${API_BASE_URL}/user/preferences`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            [key]: value
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Preference saved successfully');
        }
    })
    .catch(error => {
        console.error('Failed to save preference:', error);
    });
}

function loadUserHistory() {
    if (!currentUser) return;
    
    fetch(`${API_BASE_URL}/user/history`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayUserHistory(data.calculations);
        } else {
            showNotification('Failed to load history', 'error');
        }
    })
    .catch(error => {
        showNotification('Failed to load history', 'error');
    });
}

function displayUserHistory(calculations) {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    if (calculations.length === 0) {
        historyList.innerHTML = '<p>No calculations found.</p>';
        return;
    }
    
    calculations.forEach(calc => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-item-info">
                <div class="history-item-location">${calc.location}</div>
                <div class="history-item-date">${new Date(calc.created_at).toLocaleDateString()}</div>
            </div>
            <div class="history-item-actions">
                <button class="history-item-btn" onclick="viewCalculation(${calc.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="history-item-btn" onclick="deleteCalculation(${calc.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        historyList.appendChild(historyItem);
    });
}

function viewCalculation(id) {
    // Load and display specific calculation
    fetch(`${API_BASE_URL}/calculation/${id}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayResults(data.calculation);
            document.getElementById('historySection').style.display = 'none';
            document.getElementById('resultsSection').style.display = 'block';
        } else {
            showNotification('Failed to load calculation', 'error');
        }
    })
    .catch(error => {
        showNotification('Failed to load calculation', 'error');
    });
}

function deleteCalculation(id) {
    if (!confirm('Are you sure you want to delete this calculation?')) return;
    
    fetch(`${API_BASE_URL}/calculation/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Calculation deleted successfully', 'success');
            loadUserHistory();
        } else {
            showNotification('Failed to delete calculation', 'error');
        }
    })
    .catch(error => {
        showNotification('Failed to delete calculation', 'error');
    });
}

// Main Calculation Functions
// Main Calculation Functions - Rooftop
function handleRooftopCalculation(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const calculationData = {
        location: formData.get('location'),
        country_code: formData.get('country_code'),
        roofArea: parseFloat(formData.get('roofArea')),
        harvestingType: 'rooftop',
        numPeople: parseInt(formData.get('numPeople')),
        availableSpace: parseFloat(formData.get('availableSpace')),
        roofType: formData.get('roofType'),
        soilType: formData.get('soilType'),
        pumpType: formData.get('pumpType')
    };
    
    performCalculation(calculationData);
}

// Main Calculation Functions - Surface Runoff
function handleSurfaceRunoffCalculation(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const calculationData = {
        location: formData.get('location'),
        country_code: formData.get('country_code'),
        catchmentArea: parseFloat(formData.get('catchmentArea')),
        surfaceType: formData.get('surfaceType'),
        harvestingType: 'surface_runoff',
        numPeople: parseInt(formData.get('numPeople')),
        soilType: formData.get('soilType'),
        pumpType: formData.get('pumpType'),
        storageSize: parseFloat(formData.get('storageSize'))
    };
    
    performCalculation(calculationData);
}

// Unified calculation handler
function performCalculation(calculationData) {
    // Validate form data
    if (!calculationData.location || !calculationData.numPeople || !calculationData.soilType) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Show loading section
    document.getElementById('loadingSection').style.display = 'block';
    const formSection = document.getElementById('formSection');
    const rooftopCalc = document.getElementById('rooftopCalculator');
    const surfaceCalc = document.getElementById('surfaceRunoffCalculator');
    if (formSection) formSection.style.display = 'none';
    if (rooftopCalc) rooftopCalc.style.display = 'none';
    if (surfaceCalc) surfaceCalc.style.display = 'none';
    
    // Use public endpoint for calculations
    const url = `${API_BASE_URL}/calculate-public`;
    const headers = {
        'Content-Type': 'application/json'
    };
    
    fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(calculationData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Calculation failed');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            currentCalculation = { ...data.calculation, ...calculationData, pumpType: calculationData.pumpType };
            displayResults(data.calculation);
            showNotification('Calculation completed successfully!', 'success');
        } else {
            showNotification(data.message || 'Calculation failed', 'error');
            // Hide loading and show form again
            document.getElementById('loadingSection').style.display = 'none';
            if (rooftopCalc && rooftopCalc.style.display !== 'none') rooftopCalc.style.display = 'block';
            if (surfaceCalc && surfaceCalc.style.display !== 'none') surfaceCalc.style.display = 'block';
        }
    })
    .catch(error => {
        console.error('Calculation error:', error);
        showNotification(error.message || 'Calculation failed. Please try again.', 'error');
        // Hide loading and show form again
        document.getElementById('loadingSection').style.display = 'none';
        if (rooftopCalc && rooftopCalc.style.display !== 'none') rooftopCalc.style.display = 'block';
        if (surfaceCalc && surfaceCalc.style.display !== 'none') surfaceCalc.style.display = 'block';
    });
}

function displayResults(calculation) {
    const loadingSection = document.getElementById('loadingSection');
    if (loadingSection) {
        loadingSection.style.display = 'none';
    }

    const formSection = document.getElementById('formSection');
    if (formSection) {
        formSection.style.display = 'none';
    }
    
    const resultsSection = document.getElementById('resultsSection');
    if (!resultsSection) {
        console.error('Results section not found');
        showNotification('Results section not found', 'error');
        return;
    }

    resultsSection.style.display = 'block';

    updateFeasibilityCard(calculation);
    updateCollectionMetrics(calculation);
    updateSystemRecommendationCard(calculation);
    updateCostBreakdown(calculation);
    updateWeatherData(calculation);
    
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function updateFeasibilityCard(calculation) {
    const target = document.getElementById('feasibilityResult');
    if (!target) return;

    const scorePercent = normalizeFeasibilityScore(calculation);
    const recommendation = calculation.feasibility?.recommendation ||
        `Inputs for ${calculation.roof_type || calculation.roofType || 'your roof'} with ${calculation.soil_type || calculation.soilType || 'soil'} look ${scorePercent !== null ? 'promising' : 'pending'}.`;

    target.className = 'feasibility-result';
    if (scorePercent !== null) {
        if (scorePercent >= 70) {
            target.classList.add('feasible');
        } else if (scorePercent >= 40) {
            target.classList.add('moderate');
        } else {
            target.classList.add('not-feasible');
        }
    }

    target.innerHTML = `
        <div class="feasibility-score">${scorePercent !== null ? `${scorePercent.toFixed(1)}%` : '—'}</div>
        <div>
            <p>${recommendation}</p>
            <small>Roof: ${calculation.roof_type || calculation.roofType || '—'} · Soil: ${calculation.soil_type || calculation.soilType || '—'}</small>
        </div>
    `;
}

function updateCollectionMetrics(calculation) {
    const annualEl = document.getElementById('annualCollection');
    const monthlyEl = document.getElementById('monthlyCollection');
    const savingsEl = document.getElementById('savings');
    const savingsLabel = document.getElementById('savingsLabel');

    const annualValue = parseNumericValue(calculation.water_potential?.annual_liters) ||
        parseNumericValue(calculation.collection_potential);

    const monthlyValue = annualValue ? annualValue / 12 : null;

    if (annualEl) {
        annualEl.textContent = annualValue ? formatNumber(annualValue) : '—';
    }

    if (monthlyEl) {
        monthlyEl.textContent = monthlyValue ? formatNumber(monthlyValue) : '—';
    }

    if (savingsEl) {
        const savingsSummary = typeof calculation.cost_analysis === 'object'
            ? calculation.cost_analysis.annual_savings_formatted || calculation.cost_analysis.annual_water_savings
            : extractCurrencySegment(calculation.cost_analysis, 'Annual savings');
        savingsEl.textContent = savingsSummary || '—';
    }

    if (savingsLabel && calculation.regional_pricing?.currency) {
        savingsLabel.textContent = `Annual Savings (${calculation.regional_pricing.currency})`;
    }
}

function updateSystemRecommendationCard(calculation) {
    const container = document.getElementById('systemRecommendation');
    if (!container) return;

    const recommendation = typeof calculation.system_recommendation === 'object'
        ? calculation.system_recommendation
        : calculation.recommendation || null;

    if (recommendation && recommendation.system_type) {
        const dimensions = recommendation.dimensions
            ? Object.entries(recommendation.dimensions)
                .map(([key, value]) => `<li>${key.replace(/_/g, ' ')}: ${value}</li>`).join('')
            : '';

        container.innerHTML = `
            <p><strong>${recommendation.system_type}</strong></p>
            ${dimensions ? `<ul>${dimensions}</ul>` : ''}
            ${recommendation.daily_recharge_capacity ? `<p>Handles ~${formatNumber(recommendation.daily_recharge_capacity)} L/day of recharge.</p>` : ''}
        `;
    } else if (calculation.recommended_system) {
        container.innerHTML = `<p>${calculation.recommended_system}</p>`;
    } else {
        container.innerHTML = '<p>Run a calculation to see the optimal recharge system for your plot.</p>';
    }

    // Show alternative harvesting options if provided
    if (calculation.alternatives && Array.isArray(calculation.alternatives)) {
        const altHtml = calculation.alternatives.map((alt, idx) => {
            const isBest = calculation.best_option && calculation.best_option.harvesting_type === alt.harvesting_type;
            return `
                <div class="alt-item" style="margin-top:8px;padding:8px;border-radius:6px;background:#fafafa;">
                    <strong>${isBest ? 'Recommended — ' : ''}${alt.harvesting_type.replace(/_/g, ' ')}</strong>
                    <div style="font-size:0.95rem">${formatNumber(alt.annual_liters)} L/yr · coeff: ${alt.used_coefficient}</div>
                    <div style="font-size:0.85rem;color:#666">${alt.notes || ''}</div>
                </div>
            `;
        }).join('');

        container.innerHTML += `
            <div style="margin-top:12px">
                <h5>Alternative catchment options</h5>
                ${altHtml}
            </div>
        `;
    }
}

function updateCostBreakdown(calculation) {
    const container = document.getElementById('costBreakdown');
    if (!container) return;

    container.innerHTML = '';

    if (calculation.cost_analysis && Array.isArray(calculation.cost_analysis.cost_breakdown)) {
        calculation.cost_analysis.cost_breakdown.forEach(item => {
            container.innerHTML += `
                <div class="cost-item">
                    <span>${item.item}</span>
                    <strong>${calculation.cost_analysis.currency_symbol || ''}${formatNumber(item.cost)}</strong>
                </div>
            `;
        });
        container.innerHTML += `
            <div class="cost-item">
                <span>Total Installation</span>
                <strong>${calculation.cost_analysis.currency_symbol || ''}${formatNumber(calculation.cost_analysis.installation_cost)}</strong>
            </div>
        `;
    } else if (typeof calculation.cost_analysis === 'string') {
        container.innerHTML = `
            <div class="cost-item">
                <span>Summary</span>
                <strong>${calculation.cost_analysis}</strong>
            </div>
        `;
    } else {
        container.innerHTML = '<p>Cost analysis will appear once a calculation completes.</p>';
    }

    if (calculation.regional_pricing) {
        container.innerHTML += `
            <div class="cost-item">
                <span>Region / Currency</span>
                <strong>${calculation.regional_pricing}</strong>
            </div>
        `;
    }
}

function updateWeatherData(calculation) {
    const container = document.getElementById('weatherData');
    if (!container) return;

    const weather = calculation.weather_data || calculation.weather;
    const annualRainfall = calculation.annual_rainfall || weather?.annual_rainfall;
    const summaryLines = [];

    if (annualRainfall) {
        summaryLines.push(`<p><strong>Annual rainfall:</strong> ${formatNumber(annualRainfall)} mm</p>`);
    }

    if (weather?.recent_rainfall) {
        summaryLines.push(`<p><strong>Recent rainfall:</strong> ${weather.recent_rainfall}</p>`);
    }

    if (calculation.location) {
        summaryLines.push(`<p><strong>Location:</strong> ${calculation.location}</p>`);
    }

    if (summaryLines.length === 0) {
        summaryLines.push('<p>Run a calculation to pull hyperlocal rainfall data.</p>');
    }

    container.innerHTML = summaryLines.join('');
}

// Location Functions
function getCurrentLocationRooftop() {
    getCurrentLocationForField('rooftopLocation');
}

function getCurrentLocationSurface() {
    getCurrentLocationForField('surfaceLocation');
}

function getCurrentLocationForField(fieldId) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                // Reverse geocoding to get address
                fetch(`${API_BASE_URL}/location/reverse?lat=${lat}&lon=${lon}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            document.getElementById(fieldId).value = data.address;
                            showNotification('Location detected successfully!', 'success');
                        } else {
                            showNotification('Failed to get address from coordinates', 'error');
                        }
                    })
                    .catch(error => {
                        showNotification('Failed to get location', 'error');
                    });
            },
            function(error) {
                showNotification('Failed to get location. Please enter manually.', 'error');
            }
        );
    } else {
        showNotification('Geolocation is not supported by this browser.', 'error');
    }
}

// Action Functions
function saveCalculation() {
    if (!currentCalculation) return;
    
    if (!currentUser) {
        showNotification('Please login to save calculations', 'warning');
        showLoginModal();
        return;
    }
    
    fetch(`${API_BASE_URL}/calculation`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentCalculation)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Calculation saved successfully!', 'success');
        } else {
            showNotification(data.message || 'Failed to save calculation', 'error');
        }
    })
    .catch(error => {
        showNotification('Failed to save calculation', 'error');
    });
}

function downloadReport() {
    if (!currentCalculation) return;
    
    // Create report content
    const reportContent = generateReportContent(currentCalculation);
    
    // Create blob and download
    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rainwater-harvesting-report-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Report downloaded successfully!', 'success');
}

function formatNumber(value, options = {}) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return null;
    }
    return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 1,
        minimumFractionDigits: 0,
        ...options
    }).format(value);
}

function parseNumericValue(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    const numeric = parseFloat(String(value).replace(/[^\d.-]/g, ''));
    return Number.isNaN(numeric) ? null : numeric;
}

function extractCurrencySegment(text, label) {
    if (typeof text !== 'string') return null;
    const regex = new RegExp(`${label}:\\s*([^,]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
}

function normalizeFeasibilityScore(calculation) {
    if (calculation.feasibility?.score !== undefined) {
        const value = calculation.feasibility.score;
        return value <= 1 ? value * 100 : value;
    }
    if (calculation.feasibility_score !== undefined) {
        const raw = parseNumericValue(calculation.feasibility_score);
        if (raw === null) return null;
        return raw > 1 ? raw : raw * 100;
    }
    return null;
}

function generateReportContent(calculation) {
    const feasibilityScore = normalizeFeasibilityScore(calculation);
    const feasibilityClass = feasibilityScore === null
        ? ''
        : feasibilityScore >= 70
            ? 'feasible'
            : feasibilityScore >= 40
                ? 'moderate'
                : 'not-feasible';
    const feasibilityText = calculation.feasibility?.recommendation ||
        `Recommend installing ${calculation.recommended_system || 'a recharge system tuned to your plot'} based on the submitted inputs.`;

    const annualLiters = parseNumericValue(calculation.water_potential?.annual_liters) ||
        parseNumericValue(calculation.collection_potential);
    const monthlyLiters = parseNumericValue(calculation.water_potential?.monthly_liters) ||
        (annualLiters ? annualLiters / 12 : null);
    const dailyLiters = parseNumericValue(calculation.water_potential?.daily_liters) ||
        (annualLiters ? annualLiters / 365 : null);

    const recommendation = typeof calculation.recommendation === 'object'
        ? calculation.recommendation
        : calculation.system_recommendation || null;

    const costAnalysis = typeof calculation.cost_analysis === 'object' ? calculation.cost_analysis : null;
    const costSummary = typeof calculation.cost_analysis === 'string' ? calculation.cost_analysis : null;

    const installationCost = costAnalysis
        ? `${costAnalysis.currency_symbol || ''}${formatNumber(costAnalysis.installation_cost, { maximumFractionDigits: 0 })}`
        : extractCurrencySegment(costSummary, 'Installation') || 'N/A';
    const annualMaintenance = costAnalysis
        ? `${costAnalysis.currency_symbol || ''}${formatNumber(costAnalysis.annual_maintenance, { maximumFractionDigits: 0 })}`
        : '≈5% of installation cost';
    const annualSavings = costAnalysis
        ? `${costAnalysis.currency_symbol || ''}${formatNumber(costAnalysis.annual_water_savings, { maximumFractionDigits: 0 })}`
        : extractCurrencySegment(costSummary, 'Annual savings') || 'N/A';
    const paybackYears = costAnalysis?.payback_period_years || 'N/A';

    const totalInvestment = costAnalysis
        ? `${costAnalysis.currency_symbol || ''}${formatNumber(costAnalysis.installation_cost + (costAnalysis.annual_maintenance || 0), { maximumFractionDigits: 0 })}`
        : 'Refer to summary';

    const recommendationSummary = recommendation
        ? `
        <div class="metric">
            <strong>System Type:</strong> ${recommendation.system_type}
        </div>
        ${recommendation.storage_capacity_liters ? `<div class="metric"><strong>Storage Capacity:</strong> ${formatNumber(recommendation.storage_capacity_liters, { maximumFractionDigits: 0 })} liters</div>` : ''}
        ${recommendation.filter_type ? `<div class="metric"><strong>Filter Type:</strong> ${recommendation.filter_type}</div>` : ''}
        `
        : `<div class="metric"><strong>System Type:</strong> ${calculation.recommended_system || 'N/A'}</div>`;

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Rainwater Harvesting Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .section { margin-bottom: 30px; }
        .metric { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .feasible { color: #27ae60; }
        .moderate { color: #f39c12; }
        .not-feasible { color: #e74c3c; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Rainwater Harvesting Report</h1>
        <p>Generated for: ${calculation.location}</p>
        <p>Date: ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="section">
        <h2>Feasibility Assessment</h2>
        <div class="metric ${feasibilityClass}">
            <strong>Score: ${feasibilityScore !== null ? `${feasibilityScore.toFixed(1)}%` : 'Pending'}</strong>
            <p>${feasibilityText}</p>
        </div>
    </div>
    
    <div class="section">
        <h2>Water Collection Potential</h2>
        <div class="metric">
            <strong>Annual Collection:</strong> ${annualLiters ? `${formatNumber(annualLiters, { maximumFractionDigits: 0 })} liters` : 'N/A'}
        </div>
        <div class="metric">
            <strong>Monthly Collection:</strong> ${monthlyLiters ? `${formatNumber(monthlyLiters, { maximumFractionDigits: 0 })} liters` : 'N/A'}
        </div>
        <div class="metric">
            <strong>Daily Collection:</strong> ${dailyLiters ? `${formatNumber(dailyLiters, { maximumFractionDigits: 0 })} liters` : 'N/A'}
        </div>
    </div>
    
    <div class="section">
        <h2>Recommended System</h2>
        ${recommendationSummary}
    </div>
    
    <div class="section">
        <h2>Cost Analysis</h2>
        <div class="metric">
            <strong>Installation Cost:</strong> ${installationCost}
        </div>
        <div class="metric">
            <strong>Annual Maintenance:</strong> ${annualMaintenance}
        </div>
        <div class="metric">
            <strong>Annual Savings:</strong> ${annualSavings}
        </div>
        <div class="metric">
            <strong>Payback Period:</strong> ${paybackYears} years
        </div>
        <div class="metric">
            <strong>Total Investment:</strong> ${totalInvestment}
        </div>
        ${costSummary ? `<div class="metric"><strong>Summary:</strong> ${costSummary}</div>` : ''}
    </div>
</body>
</html>
    `;
}

function shareReport() {
    if (!currentCalculation) return;
    
    // Create shareable link
    const shareUrl = `${window.location.origin}?calculation=${btoa(JSON.stringify(currentCalculation))}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
        showNotification('Report link copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy link', 'error');
    });
}

function newCalculation() {
    // Reset forms
    const rooftopForm = document.getElementById('rooftopForm');
    const surfaceForm = document.getElementById('surfaceRunoffForm');
    if (rooftopForm) rooftopForm.reset();
    if (surfaceForm) surfaceForm.reset();
    
    const resultsSection = document.getElementById('resultsSection');
    const historySection = document.getElementById('historySection');
    const rooftopCalc = document.getElementById('rooftopCalculator');
    const surfaceCalc = document.getElementById('surfaceRunoffCalculator');
    const formSection = document.getElementById('formSection');

    if (resultsSection) resultsSection.style.display = 'none';
    if (historySection) historySection.style.display = 'none';
    if (rooftopCalc) rooftopCalc.style.display = 'none';
    if (surfaceCalc) surfaceCalc.style.display = 'none';
    if (formSection) formSection.style.display = 'block';
    
    // Clear current calculation
    currentCalculation = null;
    chatbotState.selectedType = null;
    
    // Scroll to form
    if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Chatbot Functions
function initializeChatbot() {
    if (chatbotReady) return;
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    chatbotReady = true;
    addChatMessage('Hi! I’m AquaGuide, your rainwater harvesting expert. Ask me about feasibility, ROI, maintenance, or compliance anytime.', 'ai');
}

function setupChatbot() {
    const toggleBtn = document.getElementById('chatbotToggle');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const closeBtn = document.getElementById('chatbotClose');
    const form = document.getElementById('chatbotForm');
    const input = document.getElementById('chatbotInput');
    const suggestions = document.querySelectorAll('.chat-suggestion');

    if (!toggleBtn || !chatbotWindow || !form || !input) return;

    const openChat = () => {
        chatbotWindow.classList.add('active');
        toggleBtn.setAttribute('aria-expanded', 'true');
        if (!chatbotReady) {
            initializeChatbot();
        }
        setTimeout(() => input.focus(), 150);
    };

    const closeChat = () => {
        chatbotWindow.classList.remove('active');
        toggleBtn.setAttribute('aria-expanded', 'false');
    };

    toggleBtn.addEventListener('click', () => {
        if (chatbotWindow.classList.contains('active')) {
            closeChat();
        } else {
            openChat();
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', closeChat);
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const message = input.value.trim();
        if (!message) return;

        addChatMessage(message, 'user');
        input.value = '';
        handleChatbotResponse(message);
    });

    suggestions.forEach(button => {
        button.addEventListener('click', () => {
            const question = button.dataset.question || button.textContent;
            openChat();
            addChatMessage(question, 'user');
            handleChatbotResponse(question);
        });
    });
}

function addChatMessage(content, sender = 'ai') {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${sender}`;
    const avatarIcon = sender === 'ai' ? '<i class="fas fa-droplet"></i>' : '<i class="fas fa-user"></i>';

    messageEl.innerHTML = `
        <div class="avatar">${avatarIcon}</div>
        <div class="chat-bubble">${content}</div>
    `;

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function handleChatbotResponse(message) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    const typingEl = document.createElement('div');
    typingEl.className = 'chat-message ai';
    typingEl.innerHTML = `
        <div class="avatar"><i class="fas fa-droplet"></i></div>
        <div class="chat-bubble">
            <div class="chat-typing">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    messagesContainer.appendChild(typingEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    setTimeout(() => {
        typingEl.remove();
        const response = generateChatbotResponse(message);
        addChatMessage(response, 'ai');
    }, 700);
}

function generateChatbotResponse(message) {
    const normalized = message.toLowerCase();

    if (currentCalculation && normalized.includes('my') && (normalized.includes('calculation') || normalized.includes('result'))) {
        const location = currentCalculation.location || 'your property';
        const annual = currentCalculation.water_potential?.annual_liters;
        const feasibility = currentCalculation.feasibility?.score;

        return `Your latest analysis for ${location} shows ${annual ? `${annual.toLocaleString()} liters/year` : 'strong collection potential'} with a feasibility score of ${feasibility ? `${Math.round(feasibility * 100)}%` : 'the right conditions'}. You can tweak roof type, storage size, or recharge pits in the form to see how the numbers shift.`;
    }

    for (const entry of chatbotKnowledgeBase) {
        if (entry.keywords.some(keyword => normalized.includes(keyword))) {
            return entry.response;
        }
    }

    return 'I can help with capture math, component selection, recharge mandates, water quality, or automation tips. Try asking “How do I size the tank?”, “Is recharge mandatory in Bengaluru?”, or “What filters keep water potable?”.';
}

// Utility Functions
function showNotification(message, type = 'info') {
    const notificationContainer = document.getElementById('notificationContainer');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 
                 type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <div class="notification-content">
            <div class="notification-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Translation function (placeholder - would be implemented in translations.js)
function updateTranslations() {
    // This function would update all text content based on selected language
    // For now, it's a placeholder
    console.log('Updating translations for language:', currentLanguage);
}

// Handle OAuth callback
function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    
    if (token) {
        localStorage.setItem('authToken', token);
        authToken = token;
        checkAuthentication();
        showNotification('Login successful!', 'success');
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
        showNotification('OAuth login failed', 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Check for OAuth callback on page load
if (window.location.search.includes('token') || window.location.search.includes('error')) {
    handleOAuthCallback();
}
