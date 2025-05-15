// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Create default admin account if no users exist
function initializeDefaultAdmin() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Check if admin already exists
    const adminExists = users.some(user => user.username === 'admin');
    
    if (!adminExists) {
        const defaultAdmin = {
            username: 'admin',
            email: 'admin@example.com',
            password: 'admin123',
            role: 'admin'
        };
        users.push(defaultAdmin);
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Default admin account created successfully!');
    }
}

// Initialize admin account
initializeDefaultAdmin();

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        // Update active tab button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show selected tab content
        tabContents.forEach(content => {
            content.classList.add('hidden');
            if (content.id === tabId) {
                content.classList.remove('hidden');
            }
        });
    });
});

// Handle Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.querySelector('input[name="role"]:checked').value;
    
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Debug logging
    console.log('Login attempt:', { username, role });
    console.log('Available users:', users);
    
    // Find user
    const user = users.find(u => 
        u.username === username && 
        u.password === password && 
        u.role === role
    );
    
    if (user) {
        // Store current user in session
        sessionStorage.setItem('currentUser', JSON.stringify({
            username: user.username,
            role: user.role
        }));
        
        // Redirect to main page
        window.location.href = 'index.html';
    } else {
        alert('Invalid credentials or role! Please try again.');
        // Clear password field
        document.getElementById('loginPassword').value = '';
    }
});

// Handle Registration
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    // Get existing users
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Check if username already exists
    if (users.some(u => u.username === username)) {
        alert('Username already exists!');
        return;
    }
    
    // Create new user (default role is 'user')
    const newUser = {
        username,
        email,
        password,
        role: 'user' // Default role
    };
    
    // Add user to storage
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('Registration successful! Please login.');
    
    // Switch to login tab
    tabBtns[0].click();
    registerForm.reset();
});

// Check if user is already logged in
window.addEventListener('load', () => {
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = 'index.html';
    }
}); 