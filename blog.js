import { db } from './firebase.config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const blogId = params.get('blogId');

  if (!blogId) {
    alert('Blog not found!');
    return;
  }

  const blogRef = doc(db, 'blogs', blogId);
  const blogSnap = await getDoc(blogRef);

  if (!blogSnap.exists()) {
    alert('Blog not found!');
    return;
  }

  const blog = blogSnap.data();

  document.getElementById('blogTitle').textContent = blog.title;
  document.getElementById('blogCategory').textContent = `Category: ${blog.category}`;
  document.getElementById('blogDescription').textContent = blog.description;
  document.getElementById('blogAuthor').textContent = `By ${blog.userEmail}`;

  if (blog.imageUrl) {
    const img = document.getElementById('blogImage');
    img.src = blog.imageUrl;
    img.style.display = 'block';
  }
});
