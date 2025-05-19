import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCDUhreZ5WL2E6PEV_dn8I1oW68HLQyy88",
    authDomain: "barangaydocs-a4533.firebaseapp.com",
    projectId: "barangaydocs-a4533",
    storageBucket: "barangaydocs-a4533.appspot.com",
    messagingSenderId: "19682468687",
    appId: "1:19682468687:web:373002e9e37df2120f1b3a",
    measurementId: "G-CC1ZGLF3W5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);



// Cloudinary settings
const cloudinaryUrl = "https://api.cloudinary.com/v1_1/dv6kpdk7n/image/upload";
const cloudinaryUploadPreset = "unsigned_preset"; // your actual upload preset name


const announcementList = document.getElementById('announcementList');
const addAnnouncementForm = document.getElementById('addAnnouncementForm');

// Load announcements
async function loadAnnouncements() {
    announcementList.innerHTML = '';
    const querySnapshot = await getDocs(collection(db, "announcements"));
    
    querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const announcementCard = document.createElement('div');
        announcementCard.className = 'announcement announcement-card';

        let formattedDate = '';
        if (data.date && typeof data.date.toDate === 'function') {
            formattedDate = data.date.toDate().toLocaleString();
        } else if (typeof data.date === 'string') {
            formattedDate = data.date;
        } else {
            formattedDate = 'Unknown date';
        }

        announcementCard.innerHTML = `
        <button class="delete-button" data-id="${docSnapshot.id}">Delete</button>
        <h3>${data.title}</h3>
        <p class="description">${data.description}</p>
        ${data.imageUrl ? `<img src="${data.imageUrl}" alt="Announcement Image" style="align-items: center; width: 100%; height: auto; margin-top: 10px;">` : ''}
        <span class="date">Posted: ${timeAgo(data.date)}</span>
    `;
    

        announcementList.appendChild(announcementCard);
    });

    // Attach delete listeners
    const deleteButtons = document.querySelectorAll('.delete-button');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this announcement?')) {
                try {
                    await deleteDoc(doc(db, "announcements", id));
                    alert('Announcement deleted successfully!');
                    loadAnnouncements();
                } catch (error) {
                    console.error('Error deleting announcement:', error);
                }
            }
        });
    });
}

// Add new announcement
addAnnouncementForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('announcementTitle').value.trim();
    const description = document.getElementById('announcementDescription').value.trim();
    const imageFile = document.getElementById('announcementImage').files[0];

    if (!title || !description) {
        alert('Title and description are required.');
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        alert('You must be logged in to add an announcement.');
        return;
    }

    let imageUrl = '';

    if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('upload_preset', cloudinaryUploadPreset);

        try {
            const response = await fetch(cloudinaryUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.secure_url) {
                imageUrl = data.secure_url;
            } else {
                throw new Error('Image upload failed.');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Image upload failed!');
            return;
        }
    }

    try {
        // ✅ Add the announcement
await addDoc(collection(db, "announcements"), {
    title: title,
    description: description,
    date: Timestamp.fromDate(new Date()),
    userId: user.uid,
    imageUrl: imageUrl
});

// ✅ Get all users and send notification
const usersSnapshot = await getDocs(collection(db, "users"));
const promises = [];

usersSnapshot.forEach(userDoc => {
    const notifRef = collection(db, "users", userDoc.id, "notifications");
    promises.push(addDoc(notifRef, {
        title: "New Announcement",
        message: `${title} - ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`,
        timestamp: Timestamp.fromDate(new Date()),
        status: "unread"
    }));
});

await Promise.all(promises);

alert('Announcement added and notifications sent!');
addAnnouncementForm.reset();
loadAnnouncements();

    } catch (error) {
        console.error('Error adding announcement:', error);
    }
});

// Initial load
document.addEventListener('DOMContentLoaded', loadAnnouncements);

// Auth state change listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is logged in:', user);
    } else {
        console.log('No user is logged in.');
    }
});

function timeAgo(timestamp) {
    const now = new Date();
    const postedDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((now - postedDate) / 1000);

    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    const years = Math.floor(days / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
}

const description = announcementCard.querySelector('.description');
const originalText = description.innerText;

// Check if the description is long
if (originalText.length > 200) { // 200 characters, you can adjust
    const shortText = originalText.substring(0, 200) + '...';

    description.innerText = shortText;

    const seeMore = document.createElement('span');
    seeMore.className = 'see-more';
    seeMore.innerText = 'See more';

    seeMore.addEventListener('click', () => {
        if (description.classList.contains('expanded')) {
            description.classList.remove('expanded');
            description.innerText = shortText;
            seeMore.innerText = 'See more';
        } else {
            description.classList.add('expanded');
            description.innerText = originalText;
            seeMore.innerText = 'See less';
        }
    });

    announcementCard.appendChild(seeMore);
}
