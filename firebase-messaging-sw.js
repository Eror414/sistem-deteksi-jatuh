// firebase-messaging-sw.js

// Import Firebase SDKs yang dibutuhkan oleh service worker
// Gunakan versi 'compat' agar kompatibel dengan kode Anda yang lain
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Konfigurasi Firebase Anda. Ini harus sama dengan yang ada di script.js
// Untuk alasan keamanan, Anda mungkin hanya perlu messagingSenderId di sini,
// tetapi menggunakan konfigurasi lengkap tidak masalah selama ini adalah proyek pribadi.
const firebaseConfig = {
    apiKey: "AIzaSyCGSYIgHMEhrJ5WHhI7qNhlAAdMvYkZ2Yw", 
    authDomain: "deteksi-jatuh-1d9f1.firebaseapp.com",
    databaseURL: "https://deteksi-jatuh-1d9f1-default-rtdb.firebaseio.com",
    projectId: "deteksi-jatuh-1d9f1",
    storageBucket: "deteksi-jatuh-1d9f1.firebasestorage.app",
    messagingSenderId: "362282927766", // PENTING: Ini harus ada dan benar
    appId: "1:362282927766:web:9f299d02dcfba732b624b7",
    measurementId: "G-JRXT54C1HL"
};

// Inisialisasi Firebase di service worker
firebase.initializeApp(firebaseConfig);

// Dapatkan instance messaging
const messaging = firebase.messaging();

// Tangani pesan latar belakang (ketika aplikasi web tidak aktif atau diminimalkan)
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Kustomisasi notifikasi di sini
    const notificationTitle = payload.notification.title || 'Pesan Baru';
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/images/firebase-logo.png', // Pastikan path ini benar!
        // Anda bisa menambahkan opsi lain seperti badge, image, actions, dll.
        // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
    };

    // Tampilkan notifikasi
    self.registration.showNotification(notificationTitle, notificationOptions);
});