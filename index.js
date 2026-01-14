// index.js - Complete Blog Application Logic
import { auth, db, storage } from './firebase.config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// ==================== GLOBAL VARIABLES ====================
let currentUser = null;
let isSignUp = false;
let editingBlogId = null;
let currentImageFile = null;

// ==================== DOM ELEMENTS ====================
const authPage = document.getElementById('authPage');
const mainApp = document.getElementById('mainApp');
const authForm = document.getElementById('authForm');
const authButton = document.getElementById('authButton');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authSwitchText = document.getElementById('authSwitchText');
const authSwitchLink = document.getElementById('authSwitchLink');
const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const createBlogBtn = document.getElementById('createBlogBtn');
const blogModal = document.getElementById('blogModal');
const closeModal = document.getElementById('closeModal');
const blogForm = document.getElementById('blogForm');
const blogGrid = document.getElementById('blogGrid');
const categoryFilter = document.getElementById('categoryFilter');
const loadingMessage = document.getElementById('loadingMessage');
const blogImage = document.getElementById('blogImage');
const imagePreview = document.getElementById('imagePreview');

// ==================== AUTH STATE OBSERVER ====================
// This monitors if user is logged in or not
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        currentUser = user;
        console.log('User logged in:', user.email);
        showMainApp();
        loadBlogs();
    } else {
        // User is signed out
        currentUser = null;
        console.log('User logged out');
        showAuthPage();
    }
});

// ==================== AUTH FUNCTIONS ====================

// Toggle between Sign In and Sign Up
authSwitchLink.addEventListener('click', () => {
    isSignUp = !isSignUp;
    
    if (isSignUp) {
        // Switch to Sign Up mode
        authTitle.textContent = 'Create Account';
        authSubtitle.textContent = 'Join BlogHub today';
        authButton.textContent = 'Sign Up';
        authSwitchText.textContent = 'Already have an account?';
        authSwitchLink.textContent = 'Sign In';
        confirmPasswordGroup.style.display = 'block';
    } else {
        // Switch to Sign In mode
        authTitle.textContent = 'Welcome to BlogHub';
        authSubtitle.textContent = 'Sign in to continue';
        authButton.textContent = 'Sign In';
        authSwitchText.textContent = "Don't have an account?";
        authSwitchLink.textContent = 'Sign Up';
        confirmPasswordGroup.style.display = 'none';
    }
    
    hideMessages();
    authForm.reset();
});

// Handle Sign In / Sign Up Form Submit
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Validation for Sign Up
    if (isSignUp) {
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showError('Passwords do not match!');
            return;
        }
        
        if (password.length < 6) {
            showError('Password must be at least 6 characters!');
            return;
        }
    }

    try {
        authButton.disabled = true;
        authButton.textContent = isSignUp ? 'Creating Account...' : 'Signing In...';
        
        if (isSignUp) {
            // Create new account
            await createUserWithEmailAndPassword(auth, email, password);
            console.log('Account created successfully');
            showSuccess('Account created successfully! 🎉');
        } else {
            // Sign in existing user
            await signInWithEmailAndPassword(auth, email, password);
            console.log('Signed in successfully');
            showSuccess('Welcome back! 👋');
        }
        
        authForm.reset();
    } catch (error) {
        console.error('Auth error:', error);
        let errorMsg = 'An error occurred';
        
        // Handle specific Firebase errors
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMsg = 'This email is already registered';
                break;
            case 'auth/invalid-email':
                errorMsg = 'Invalid email address';
                break;
            case 'auth/weak-password':
                errorMsg = 'Password is too weak';
                break;
            case 'auth/user-not-found':
                errorMsg = 'No account found with this email';
                break;
            case 'auth/wrong-password':
                errorMsg = 'Incorrect password';
                break;
            case 'auth/invalid-credential':
                errorMsg = 'Invalid email or password';
                break;
            default:
                errorMsg = error.message;
        }
        
        showError(errorMsg);
    } finally {
        authButton.disabled = false;
        authButton.textContent = isSignUp ? 'Sign Up' : 'Sign In';
    }
});

// Handle Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log('Logged out successfully');
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error signing out: ' + error.message);
    }
});

// ==================== BLOG FUNCTIONS ====================

// Open Create Blog Modal
createBlogBtn.addEventListener('click', () => {
    editingBlogId = null;
    document.getElementById('modalTitle').textContent = 'Create New Blog';
    document.getElementById('submitBlogBtn').textContent = '🚀 Publish Blog';
    blogForm.reset();
    imagePreview.classList.add('hidden');
    currentImageFile = null;
    blogModal.style.display = 'flex';
});

// Close Modal
closeModal.addEventListener('click', () => {
    blogModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === blogModal) {
        blogModal.style.display = 'none';
    }
});

// Handle Image Selection and Preview
blogImage.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        currentImageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// Handle Blog Form Submit (Create or Edit)
blogForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('blogTitle').value.trim();
    const category = document.getElementById('blogCategory').value;
    const description = document.getElementById('blogDescription').value.trim();
    const submitBtn = document.getElementById('submitBlogBtn');

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = editingBlogId ? '⏳ Updating...' : '⏳ Publishing...';

        let imageUrl = null;

        // Upload image to Firebase Storage if selected
        if (currentImageFile) {
            console.log('Uploading image...');
            const storageRef = ref(storage, `blog-images/${Date.now()}_${currentImageFile.name}`);
            await uploadBytes(storageRef, currentImageFile);
            imageUrl = await getDownloadURL(storageRef);
            console.log('Image uploaded:', imageUrl);
        }

        if (editingBlogId) {
            // Update existing blog
            console.log('Updating blog:', editingBlogId);
            const blogRef = doc(db, 'blogs', editingBlogId);
            const updateData = {
                title,
                category,
                description,
                updatedAt: serverTimestamp()
            };
            if (imageUrl) updateData.imageUrl = imageUrl;
            
            await updateDoc(blogRef, updateData);
            console.log('Blog updated successfully');
        } else {
            // Create new blog
            console.log('Creating new blog...');
            await addDoc(collection(db, 'blogs'), {
                title,
                category,
                description,
                imageUrl,
                userId: currentUser.uid,
                userEmail: currentUser.email,
                createdAt: serverTimestamp()
            });
            console.log('Blog created successfully');
        }

        // Close modal and reload blogs
        blogModal.style.display = 'none';
        blogForm.reset();
        imagePreview.classList.add('hidden');
        currentImageFile = null;
        loadBlogs();
        
    } catch (error) {
        console.error('Error saving blog:', error);
        alert('Error saving blog: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '🚀 Publish Blog';
    }
});

// Handle Category Filter Change
categoryFilter.addEventListener('change', loadBlogs);

// Load Blogs from Firestore
async function loadBlogs() {
    loadingMessage.classList.remove('hidden');
    blogGrid.innerHTML = '';
    console.log('Loading blogs...');

    try {
        const category = categoryFilter.value;
        let q;
        
        // Create query based on category filter
        if (category === 'all') {
            q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
        } else {
            q = query(
                collection(db, 'blogs'), 
                where('category', '==', category), 
                orderBy('createdAt', 'desc')
            );
        }

        const querySnapshot = await getDocs(q);
        console.log('Blogs loaded:', querySnapshot.size);
        
        if (querySnapshot.empty) {
            blogGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <h3>No blogs found</h3>
                    <p>Be the first to create a blog in this category!</p>
                </div>
            `;
        } else {
            querySnapshot.forEach((document) => {
                const blog = document.data();
                const blogCard = createBlogCard(document.id, blog);
                blogGrid.appendChild(blogCard);
            });
        }
    } catch (error) {
        console.error('Error loading blogs:', error);
        blogGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <h3>Error loading blogs</h3>
                <p>Please try again later</p>
            </div>
        `;
    }

    loadingMessage.classList.add('hidden');
}

// Create Blog Card Element
function createBlogCard(id, blog) {
    const card = document.createElement('div');
    card.className = 'blog-card';

    const isOwner = currentUser && blog.userId === currentUser.uid;
    const date = blog.createdAt 
        ? new Date(blog.createdAt.seconds * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
        : 'Just now';

    // Category emojis
    const categoryEmojis = {
        'Technology': '💻',
        'Lifestyle': '🌟',
        'Travel': '✈️',
        'Food': '🍔',
        'Business': '💼',
        'Health': '💪',
        'Education': '📚',
        'Entertainment': '🎬',
        'Other': '📌'
    };

    const emoji = categoryEmojis[blog.category] || '📌';

    // Build card HTML
    card.innerHTML = `
        ${blog.imageUrl 
            ? `<img src="${blog.imageUrl}" alt="${blog.title}" class="blog-image">` 
            : `<div class="blog-placeholder">${emoji}</div>`
        }
        <div class="blog-content">
            <span class="blog-category">${blog.category}</span>
            <h3 class="blog-title">${blog.title}</h3>
            <p class="blog-description">${blog.description}</p>
            <div class="blog-meta">
                <span>👤 ${blog.userEmail}</span>
                <span>📅 ${date}</span>
            </div>
            ${isOwner ? `
            <div class="blog-actions">
                <button class="btn btn-primary edit-btn" data-id="${id}">✏️ Edit</button>
                <button class="btn btn-danger delete-btn" data-id="${id}">🗑️ Delete</button>
            </div>
            ` : ''}
        </div>
    `;

    // Add event listeners for edit and delete buttons
    if (isOwner) {
        const editBtn = card.querySelector('.edit-btn');
        const deleteBtn = card.querySelector('.delete-btn');

        editBtn.addEventListener('click', () => editBlog(id, blog));
        deleteBtn.addEventListener('click', () => deleteBlog(id, blog.imageUrl || ''));
    }

    return card;
}

// Edit Blog
async function editBlog(id, blog) {
    console.log('Editing blog:', id);
    editingBlogId = id;
    
    // Fill form with blog data
    document.getElementById('blogTitle').value = blog.title;
    document.getElementById('blogCategory').value = blog.category;
    document.getElementById('blogDescription').value = blog.description;
    
    // Show image preview if exists
    if (blog.imageUrl) {
        imagePreview.src = blog.imageUrl;
        imagePreview.classList.remove('hidden');
    }
    
    // Update modal title and button
    document.getElementById('modalTitle').textContent = 'Edit Blog';
    document.getElementById('submitBlogBtn').textContent = '💾 Update Blog';
    blogModal.style.display = 'flex';
}

// Delete Blog
async function deleteBlog(id, imageUrl) {
    if (!confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
        return;
    }

    try {
        console.log('Deleting blog:', id);
        
        // Delete image from storage if exists
        if (imageUrl) {
            try {
                const imageRef = ref(storage, imageUrl);
                await deleteObject(imageRef);
                console.log('Image deleted');
            } catch (error) {
                console.log('Image already deleted or does not exist');
            }
        }
        
        // Delete blog document from Firestore
        await deleteDoc(doc(db, 'blogs', id));
        console.log('Blog deleted successfully');
        loadBlogs();
    } catch (error) {
        console.error('Error deleting blog:', error);
        alert('Error deleting blog: ' + error.message);
    }
}

// ==================== HELPER FUNCTIONS ====================

function showAuthPage() {
    authPage.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

function showMainApp() {
    authPage.classList.add('hidden');
    mainApp.classList.remove('hidden');
    userEmail.textContent = currentUser.email;
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);
}

function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

// Log when script loads
console.log('Blog app initialized!');