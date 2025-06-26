// @ts-nocheck

// Your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyCGSYIgHMEhrJ5WHhI7qNhlAAdMvYkZ2Yw",
    authDomain: "deteksi-jatuh-1d9f1.firebaseapp.com",
    databaseURL: "https://deteksi-jatuh-1d9f1-default-rtdb.firebaseio.com",
    projectId: "deteksi-jatuh-1d9f1",
    storageBucket: "deteksi-jatuh-1d9f1.firebasestorage.app",
    messagingSenderId: "362282927766",
    appId: "1:362282927766:web:9f299d02dcfba732b624b7",
    measurementId: "G-JRXT54C1HL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const dataRef = database.ref('data'); // Sesuaikan dengan path data Anda di Firebase

// Initialize Leaflet Map
let map = L.map('map').setView([-7.6302, 110.5309], 15);
let marker = L.marker([-7.6302, 110.5309]).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Get reference to the new button
const clearStatusButton = document.getElementById('clear-status-button');

// Function to update UI with data
function updateUI(data) {
    // Pastikan semua elemen HTML ada sebelum diakses
    const deviceIdEl = document.getElementById('device-id');
    const timestampEl = document.getElementById('timestamp');
    const statusMessageEl = document.getElementById('status-message');
    const latitudeEl = document.getElementById('latitude');
    const longitudeEl = document.getElementById('longitude');

    if (!deviceIdEl || !timestampEl || !statusMessageEl || !latitudeEl || !longitudeEl || !clearStatusButton) {
        console.error("One or more required HTML elements not found!");
        return; // Hentikan eksekusi jika elemen tidak ada
    }

    if (data) {
        // Find the latest entry based on timestamp
        const latestEntryKey = Object.keys(data).sort((a, b) => {
            // Pastikan timestamp ada dan valid sebelum mencoba mengurai
            const timeA = data[a].timestamp ? new Date(data[a].timestamp).getTime() : 0;
            const timeB = data[b].timestamp ? new Date(data[b].timestamp).getTime() : 0;
            return timeB - timeA; // Descending order to get the latest
        })[0];

        const latestData = data[latestEntryKey];

        // LOGIKA BARU UNTUK MENAMPILKAN DATA KOSONG JIKA STATUS ADALAH "Aman" dari tombol "Berikan Pertolongan"
        if (latestData.status === "Aman" && latestData.device_id === "ResetUI") { // Menggunakan "ResetUI" sebagai penanda khusus
            deviceIdEl.textContent = '-';
            timestampEl.textContent = '-';
            statusMessageEl.textContent = 'Aman'; // Tampilkan 'Aman' secara eksplisit
            latitudeEl.textContent = '-';
            longitudeEl.textContent = '-';
            statusMessageEl.style.color = '#28a745'; // Green
            clearStatusButton.style.display = 'none'; // Sembunyikan tombol

            marker.setLatLng([0,0]); // Pindahkan marker ke 0,0 atau sembunyikan
            map.setView([0,0], 2); // Atur peta ke tampilan global
        } else {
            // Logika standar untuk menampilkan data jika bukan data reset UI
            deviceIdEl.textContent = latestData.device_id || '-';
            timestampEl.textContent = latestData.timestamp || '-';
            statusMessageEl.textContent = latestData.status || 'Tidak ada data';
            latitudeEl.textContent = latestData.latitude !== undefined ? latestData.latitude.toFixed(6) : '-';
            longitudeEl.textContent = latestData.longitude !== undefined ? latestData.longitude.toFixed(6) : '-';

            // Update map
            if (latestData.latitude !== undefined && latestData.longitude !== undefined &&
                latestData.latitude !== 0 && latestData.longitude !== 0) { // Avoid 0,0 default
                const newLatLng = new L.LatLng(latestData.latitude, latestData.longitude);
                marker.setLatLng(newLatLng);
                map.setView(newLatLng, 15); // Adjust zoom level as needed
            } else {
                console.warn("Invalid latitude or longitude data for map. Resetting map view.");
                marker.setLatLng([0,0]); // Reset marker
                map.setView([0,0], 2); // Reset map view
            }

            // Change status message color based on status and show/hide button
            if (latestData.status === "Jatuh Terdeteksi") {
                statusMessageEl.style.color = '#e74c3c'; // Red
                clearStatusButton.style.display = 'block'; // Tampilkan tombol
            } else {
                statusMessageEl.style.color = '#28a745'; // Green for normal or other status
                clearStatusButton.style.display = 'none'; // Sembunyikan tombol
            }
        }

    } else {
        // Jika tidak ada data sama sekali di Firebase
        deviceIdEl.textContent = '-';
        timestampEl.textContent = '-';
        statusMessageEl.textContent = 'Tidak ada data';
        latitudeEl.textContent = '-';
        longitudeEl.textContent = '-';
        statusMessageEl.style.color = '#e74c3c';

        marker.setLatLng([0,0]); // Reset marker
        map.setView([0,0], 2); // Reset map view
        clearStatusButton.style.display = 'none'; // Sembunyikan tombol jika tidak ada data
    }
}

// Function to fetch data from Firebase (using 'value' for real-time updates)
dataRef.on('value', (snapshot) => {
    const data = snapshot.val();
    updateUI(data); // Ini harus dipanggil setiap kali ada perubahan data di Firebase
}, (errorObject) => {
    console.error('The read failed: ' + errorObject.code);
    updateUI(null); // Clear UI on error
});

// Add event listener to refresh button
document.getElementById('refresh-button').addEventListener('click', () => {
    console.log("Refresh button clicked. Data should update automatically if Firebase changes.");
});

// Add event listener to the new "Berikan Pertolongan" button
clearStatusButton.addEventListener('click', () => {
    // Buat entri "status aman" baru dengan penanda khusus dan timestamp terbaru
    const now = new Date();
    const timestamp = now.toISOString(); // Format ISO untuk konsistensi

    const safeDataEntry = {
        device_id: 'ResetUI', // Gunakan penanda khusus untuk UI
        timestamp: timestamp, // Tetap gunakan timestamp agar menjadi data terbaru
        status: 'Aman',
        // latitude dan longitude tidak disertakan agar dianggap "kosong" oleh UI
    };

    // Kirim data baru ke Firebase. Ini akan membuat entri baru di bawah 'data'
    // Firebase akan otomatis menambahkan key unik
    dataRef.push(safeDataEntry)
        .then(() => {
            console.log("Status 'Aman' dengan reset UI berhasil dikirim ke Firebase.");
            // UI akan otomatis terupdate karena dataRef.on('value')
        })
        .catch((error) => {
            console.error("Failed to send reset status to Firebase: ", error);
            alert("Gagal memperbarui status. Periksa koneksi atau izin Firebase.");
        });
});

// ... (kode script.js Anda yang sudah ada, termasuk inisialisasi Firebase) ...

// --- Bagian Push Notification ---
const messaging = firebase.messaging(); // Dapatkan instance Firebase Messaging

// Fungsi untuk meminta izin notifikasi dan mendapatkan token FCM
function requestPermissionAndGetToken() {
    console.log('Meminta izin notifikasi...');
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            console.log('Izin notifikasi diberikan.');
            // Dapatkan FCM registration token
            return messaging.getToken(); 
        } else {
            console.warn('Gagal mendapatkan izin notifikasi.');
            return Promise.reject('Izin notifikasi ditolak.');
        }
    }).then((currentToken) => {
        if (currentToken) {
            console.log('FCM registration token:', currentToken);
            // Simpan token ke Realtime Database agar Cloud Function bisa menggunakannya
            saveMessagingDeviceToken(currentToken);
        } else {
            console.warn('Tidak ada FCM registration token. Minta izin untuk membuatnya.');
        }
    }).catch((err) => {
        console.error('Terjadi error saat mendapatkan token: ', err);
    });
}

// Fungsi untuk menyimpan token ke Firebase Realtime Database
function saveMessagingDeviceToken(currentToken) {
    // Simpan token di bawah node 'fcmTokens'. Key adalah tokennya sendiri, value bisa true.
    // Ini akan membuat struktur: fcmTokens/{token_anda}: true
    database.ref('/fcmTokens/' + currentToken).set(true)
        .then(() => {
            console.log('FCM token berhasil disimpan ke database.');
        })
        .catch((error) => {
            console.error('Error saat menyimpan FCM token ke database:', error);
        });
}

// Tangani pesan foreground (ketika aplikasi web sedang aktif dan terbuka)
messaging.onMessage((payload) => {
    console.log('[script.js] Menerima pesan foreground ', payload);
    // Tampilkan notifikasi langsung
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/images/firebase-logo.png' 
    };
    new Notification(notificationTitle, notificationOptions); // Tampilkan notifikasi
    
    // Anda juga bisa melakukan update UI di sini jika diperlukan,
    // misalnya menampilkan pesan di halaman web.
});

// Daftarkan Service Worker dan panggil fungsi requestPermissionAndGetToken()
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./firebase-messaging-sw.js')
        .then((registration) => {
            console.log('Service Worker berhasil didaftarkan dengan scope:', registration.scope);
            // Memberi tahu Firebase Messaging untuk menggunakan Service Worker ini
            messaging.useServiceWorker(registration);
            // Setelah SW terdaftar, baru minta izin dan token
            requestPermissionAndGetToken(); 
        })
        .catch((err) => {
            console.error('Pendaftaran Service Worker gagal:', err);
        });
} else {
    console.warn('Browser ini tidak mendukung Service Worker.');
    // Jika tidak ada Service Worker, push notification tidak akan berfungsi saat latar belakang
}