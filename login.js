// Backend API URL
const API_URL = 'http://localhost:3000/api';

// DOM Elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePasswordButton = document.getElementById('toggle-password');
const loginButton = document.getElementById('login-button');
const buttonText = loginButton.querySelector('.button-text');
const loadingSpinner = loginButton.querySelector('.loading-spinner');
const errorMessage = document.getElementById('error-message');

// Toggle password visibility
togglePasswordButton.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle eye icon
    const icon = togglePasswordButton.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
});

// Handle input validation
function validateInputs() {
    if (!emailInput.value.trim()) {
        showError('Please enter your email');
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value.trim())) {
        showError('Please enter a valid email address');
        return false;
    }
    
    if (!passwordInput.value) {
        showError('Please enter your password');
        return false;
    }
    
    return true;
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Shake animation for error feedback
    loginButton.classList.add('shake');
    setTimeout(() => {
        loginButton.classList.remove('shake');
    }, 500);
}

// Clear error message
function clearError() {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
}

// Set button state during login process
function setButtonState(isLoading) {
    if (isLoading) {
        buttonText.textContent = 'Signing in...';
        loadingSpinner.style.display = 'inline-block';
        loginButton.disabled = true;
    } else {
        buttonText.textContent = 'Login';
        loadingSpinner.style.display = 'none';
        loginButton.disabled = false;
    }
}

// Handle login
async function handleLogin() {
    // Validate inputs
    if (!validateInputs()) {
        return;
    }
    
    // Clear previous error
    clearError();
    
    // Set loading state
    setButtonState(true);
    
    try {
        // Attempt to sign in using the proxy server
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: emailInput.value.trim(),
                password: passwordInput.value
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Login failed');
        }
        
        const data = await response.json();
        
        // Login successful - store user session
        localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));
        
        // Redirect to main page
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Login error:', error);
        
        // Show appropriate error message
        if (error.message.includes('Invalid login credentials')) {
            showError('Invalid email or password');
        } else {
            showError('Login failed. Please try again later.');
        }
        
        // Reset button state
        setButtonState(false);
    }
}

// Event listeners
loginButton.addEventListener('click', handleLogin);

// Allow pressing Enter to submit
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleLogin();
    }
});

emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleLogin();
    }
});

// Check for existing session on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check if this is a logout redirect - if so, don't check session
    const urlParams = new URLSearchParams(window.location.search);
    const isLogout = urlParams.get('logout') === 'true';
    
    if (isLogout) {
        // Clear any local storage session data
        localStorage.removeItem('supabase.auth.token');
        // Clean up the URL
        window.history.replaceState(null, '', 'login.html');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/session`);
        
        if (!response.ok) {
            throw new Error('Failed to check session');
        }
        
        const data = await response.json();
        
        if (data.session) {
            // User is already logged in, redirect to main page
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Session check error:', error);
    }
});

// Add animation on page load
emailInput.focus();

// Add shake animation class
document.head.insertAdjacentHTML('beforeend', `
<style>
.shake {
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}
@keyframes shake {
    10%, 90% { transform: translateX(-1px); }
    20%, 80% { transform: translateX(2px); }
    30%, 50%, 70% { transform: translateX(-3px); }
    40%, 60% { transform: translateX(3px); }
}
</style>
`);