import { auth, db } from './firebase.config.js';
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
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {

  let currentUser = null;
  let editingBlogId = null;
  let authMode = 'login';

  // ---------------- DOM ----------------
  const navLoginBtn = document.getElementById('navLoginBtn');
  const navLogoutBtn = document.getElementById('navLogoutBtn');
  const navUserEmail = document.getElementById('navUserEmail');
  const navCreateBlogBtn = document.getElementById('navCreateBlogBtn');

  const authModal = document.getElementById('authModal');
  const authForm = document.getElementById('authForm');
  const authModalTitle = document.getElementById('authModalTitle');
  const authButton = document.getElementById('authButton');
  const authSwitchText = document.getElementById('authSwitchText');
  const authSwitchLink = document.getElementById('authSwitchLink');
  const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
  const authModalClose = document.getElementById('authModalClose');

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');

  const blogModal = document.getElementById('blogModal');
  const blogForm = document.getElementById('blogForm');
  const closeBlogModalBtn = document.getElementById('closeBlogModal');

  const homePage = document.getElementById('homePage');
  const blogGrid = document.getElementById('blogGrid');
  const loadingMessage = document.getElementById('loadingMessage');

  // ---------------- AUTH STATE ----------------
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    updateNavbar();
    showHomePage();
    await loadAllBlogs();
  });

  function updateNavbar() {
    if (currentUser) {
      navLoginBtn.classList.add('hidden');
      navLogoutBtn.classList.remove('hidden');
      navUserEmail.classList.remove('hidden');
      navUserEmail.textContent = currentUser.email;
    } else {
      navLoginBtn.classList.remove('hidden');
      navLogoutBtn.classList.add('hidden');
      navUserEmail.classList.add('hidden');
    }
    navCreateBlogBtn.classList.remove('hidden'); // Everyone can create blogs
  }

  // ---------------- AUTH MODAL ----------------
  navLoginBtn.addEventListener('click', () => {
    authModal.style.display = 'flex';
    setLoginMode();
  });

  authModalClose.addEventListener('click', () => {
    authModal.style.display = 'none';
  });

  authSwitchLink.addEventListener('click', () => {
    authMode === 'login' ? setSignupMode() : setLoginMode();
  });

  function setLoginMode() {
    authMode = 'login';
    authModalTitle.textContent = 'Welcome Back';
    authButton.textContent = 'Sign In';
    authSwitchText.textContent = "Don't have an account?";
    authSwitchLink.textContent = 'Sign Up';
    confirmPasswordGroup.style.display = 'none';
  }

  function setSignupMode() {
    authMode = 'signup';
    authModalTitle.textContent = 'Create Your Account';
    authButton.textContent = 'Sign Up';
    authSwitchText.textContent = 'Already have an account?';
    authSwitchLink.textContent = 'Sign In';
    confirmPasswordGroup.style.display = 'block';
  }

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput?.value.trim();

    try {
      if (authMode === 'signup') {
        if (password !== confirmPassword) {
          alert('❌ Passwords do not match');
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
        alert('✅ Account created successfully');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        alert('✅ Logged in successfully');
      }
      authModal.style.display = 'none';
      authForm.reset();
    } catch (error) {
      alert(error.message);
    }
  });

  navLogoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    blogGrid.innerHTML = '';
    loadAllBlogs();
  });

  // ---------------- BLOG MODAL ----------------
  navCreateBlogBtn.addEventListener('click', openBlogModal);

  function openBlogModal() {
    blogForm.reset();
    editingBlogId = null;
    blogModal.style.display = 'flex';
  }

  closeBlogModalBtn.addEventListener('click', () => {
    blogModal.style.display = 'none';
  });

  blogForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = blogForm.blogTitle.value.trim();
    const category = blogForm.blogCategory.value;
    const description = blogForm.blogDescription.value.trim();

    if (editingBlogId && currentUser) {
      const blogRef = doc(db, 'blogs', editingBlogId);
      await updateDoc(blogRef, { title, category, description });
      alert('✅ Blog updated successfully');
      editingBlogId = null;
    } else {
      await addDoc(collection(db, 'blogs'), {
        title,
        category,
        description,
        userId: currentUser ? currentUser.uid : 'guest',
        userEmail: currentUser ? currentUser.email : 'Guest User',
        createdAt: serverTimestamp(),
        createdAtClient: Date.now()
      });
      alert('✅ Blog created successfully');
    }

    blogModal.style.display = 'none';
    blogForm.reset();
    await loadAllBlogs();
  });

  // ---------------- LOAD BLOGS ----------------
  async function loadAllBlogs() {
    blogGrid.innerHTML = '';
    loadingMessage.classList.remove('hidden');

    let q;
    if (currentUser) {
      q = query(
        collection(db, 'blogs'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAtClient', 'desc')
      );
    } else {
      q = query(collection(db, 'blogs'), orderBy('createdAtClient', 'desc'));
    }

    try {
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        blogGrid.innerHTML = `<p>No blogs to show.</p>`;
      } else {
        snapshot.forEach(docSnap => blogGrid.appendChild(createBlogCard(docSnap.data(), docSnap.id)));
      }
    } catch (err) {
      console.error('Error fetching blogs:', err.message);
      blogGrid.innerHTML = `<p>Unable to load blogs right now.</p>`;
    }

    loadingMessage.classList.add('hidden');
  }

  // ---------------- BLOG CARD ----------------
  function createBlogCard(blog, blogId) {
    const card = document.createElement('div');
    card.className = 'blog-card';

    const date = blog.createdAt?.seconds
      ? new Date(blog.createdAt.seconds * 1000).toLocaleDateString()
      : 'Just now';

    let editButton = '';
    if (currentUser && blog.userId === currentUser.uid) {
      editButton = `<button class="btn btn-success edit-btn">Edit</button>`;
    }

    const readMoreButton = `<a href="blog.html?blogId=${blogId}" class="read-more-btn">Read More</a>`;

    card.innerHTML = `
      <div class="blog-content">
        <span class="blog-category">${blog.category}</span>
        <h3>${blog.title}</h3>
        <p>${blog.description.substring(0, 150)}...</p>
        <small>${blog.userEmail} • ${date}</small>
        <div class="blog-actions">
          ${editButton}
          ${readMoreButton}
        </div>
      </div>
    `;

    const editBtn = card.querySelector('.edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        editingBlogId = blogId;
        blogForm.blogTitle.value = blog.title;
        blogForm.blogCategory.value = blog.category;
        blogForm.blogDescription.value = blog.description;
        blogModal.style.display = 'flex';
      });
    }

    return card;
  }

  function showHomePage() {
    homePage.classList.remove('hidden');
  }

  console.log('✅ All users can create blogs. Logged-in users can edit their own blogs.');
});
