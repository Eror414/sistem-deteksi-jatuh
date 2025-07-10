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
let marker = L.marker([-7.6302, 110.5309]).addTo(map); // Biarkan ini untuk marker default awal
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Get reference to the new button and display elements
const clearStatusButton = document.getElementById('clear-status-button');
const deviceIdEl = document.getElementById('device-id');
const timestampEl = document.getElementById('timestamp');
const statusMessageEl = document.getElementById('status-message');
const latitudeEl = document.getElementById('latitude');
const longitudeEl = document.getElementById('longitude');

// --- PENTING: Pengecekan elemen HTML di awal ---
// Jika ada elemen yang tidak ditemukan, akan ada error di console dan script mungkin tidak berfungsi penuh
if (!deviceIdEl || !timestampEl || !statusMessageEl || !latitudeEl || !longitudeEl || !clearStatusButton) {
    console.error("Kesalahan: Satu atau lebih elemen HTML yang diperlukan tidak ditemukan di index.html!");
    // Anda bisa menambahkan alert di sini atau mengubah UI untuk memberi tahu pengguna
    // alert("Aplikasi tidak dapat berfungsi dengan baik karena elemen HTML tidak lengkap.");
}


// Fungsi untuk memperbarui UI dengan data terbaru
function updateUI(data) {
    // Pastikan elemen HTML ada sebelum mencoba mengaksesnya
    if (!deviceIdEl || !timestampEl || !statusMessageEl || !latitudeEl || !longitudeEl || !clearStatusButton) {
        console.error("Elemen HTML tidak lengkap, update UI dibatalkan.");
        return;
    }

    if (data) {
        // Temukan entri data terbaru berdasarkan timestamp
        // Perbaikan: Pastikan entry dan timestamp ada sebelum diakses
        const latestEntryKey = Object.keys(data).sort((a, b) => {
            const timeA = data[a] && data[a].timestamp ? new Date(data[a].timestamp).getTime() : 0;
            const timeB = data[b] && data[b].timestamp ? new Date(data[b].timestamp).getTime() : 0;
            return timeB - timeA; // Urutan menurun untuk mendapatkan yang terbaru
        })[0];

        const latestData = data[latestEntryKey];
        // console.log("updateUI dipanggil. Data terbaru yang terdeteksi:", latestData); // Debug log (bisa di-komen setelah berhasil)

        // --- Logika untuk status "Aman" dari tombol "Berikan Pertolongan" (Reset UI) ---
        // Catatan: Logika ini sekarang lebih relevan untuk data 'ResetUI' yang datang dari sumber lain
        // atau sebagai fallback, karena reset utama dilakukan langsung di event listener tombol.
        if (latestData && latestData.status === "Aman" && latestData.device_id === "ResetUI") {
            // console.log("Kondisi reset terpenuhi (dari data Firebase)! Melakukan reset UI."); // Debug log
            deviceIdEl.textContent = '-';
            timestampEl.textContent = '-';
            statusMessageEl.textContent = 'Aman';
            latitudeEl.textContent = '-';
            longitudeEl.textContent = '-';
            statusMessageEl.style.color = '#28a745'; // Hijau
            clearStatusButton.style.display = 'none';

            marker.setLatLng([0,0]); // Pindahkan marker ke 0,0
            map.setView([0,0], 2); // Atur peta ke tampilan global
        } else if (latestData) { // Jika ada data terbaru dan bukan data reset UI
            // console.log("Kondisi reset TIDAK terpenuhi. Memperbarui UI dengan data normal."); // Debug log
            // --- Pembaruan Teks Data ---
            deviceIdEl.textContent = latestData.device_id || '-';

            // Format timestamp menjadi lebih mudah dibaca
            const dateObj = latestData.timestamp ? new Date(latestData.timestamp) : null;
            if (dateObj && !isNaN(dateObj.getTime())) { // Pastikan tanggal valid
                timestampEl.textContent = dateObj.toLocaleString();
            } else {
                timestampEl.textContent = '-';
            }
            
            statusMessageEl.textContent = latestData.status || 'Tidak ada data';
            
            // Perbaikan penting: Konversi lat/lng ke float dan validasi
            const lat = parseFloat(latestData.latitude);
            const lng = parseFloat(latestData.longitude);

            latitudeEl.textContent = !isNaN(lat) ? lat.toFixed(6) : '-';
            longitudeEl.textContent = !isNaN(lng) ? lng.toFixed(6) : '-';

            // --- Pembaruan Peta ---
            // Hanya update peta jika lat/lng adalah angka valid dan tidak (0,0) (kecuali jika 0,0 adalah lokasi valid)
            // Memastikan kedua koordinat adalah angka dan setidaknya salah satunya bukan 0 jika kita ingin menghindari default 0,0
            if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0) && map) { 
                const newLatLng = new L.LatLng(lat, lng);
                marker.setLatLng(newLatLng);
                map.setView(newLatLng, 15); // Sesuaikan tingkat zoom sesuai kebutuhan
            } else {
                console.warn("Data latitude atau longitude tidak valid atau (0,0). Mengatur ulang tampilan peta.");
                marker.setLatLng([0,0]); // Reset marker ke 0,0
                map.setView([0,0], 2); // Reset tampilan peta ke global
            }

            // --- Perubahan Warna Status dan Tampilan Tombol ---
            if (latestData.status === "Jatuh Terdeteksi") {
                statusMessageEl.style.color = '#e74c3c'; // Merah
                clearStatusButton.style.display = 'block'; // Tampilkan tombol
            } else {
                statusMessageEl.style.color = '#28a745'; // Hijau untuk status normal atau lainnya
                clearStatusButton.style.display = 'none'; // Sembunyikan tombol
            }
        } else {
            // Jika latestData null atau tidak valid setelah ditemukan key
            console.warn("latestData tidak valid setelah sorting.");
            displayNoDataState();
        }

    } else {
        // Jika tidak ada data sama sekali di Firebase
        console.log("Tidak ada data di Firebase Realtime Database.");
        displayNoDataState();
    }
}

// Helper function to display 'no data' state
function displayNoDataState() {
    deviceIdEl.textContent = '-';
    timestampEl.textContent = '-';
    statusMessageEl.textContent = 'Tidak ada data';
    latitudeEl.textContent = '-';
    longitudeEl.textContent = '-';
    statusMessageEl.style.color = '#e74c3c'; // Warna merah untuk 'tidak ada data'
    marker.setLatLng([0,0]);
    map.setView([0,0], 2);
    clearStatusButton.style.display = 'none';
}


// Listener untuk perubahan data dari Firebase (menggunakan 'value' untuk pembaruan real-time)
dataRef.on('value', (snapshot) => {
    const data = snapshot.val();
    updateUI(data); // Panggil updateUI setiap kali ada perubahan data di Firebase
}, (errorObject) => {
    console.error('Pembacaan data dari Firebase gagal: ' + errorObject.code);
    displayNoDataState(); // Atur UI ke 'tidak ada data' jika ada error
});

// Event listener untuk tombol refresh (sekarang tidak terlalu diperlukan karena real-time)
document.getElementById('refresh-button').addEventListener('click', () => {
    console.log("Tombol refresh diklik. Data seharusnya diperbarui secara otomatis jika ada perubahan di Firebase.");
});

// Event listener untuk tombol "Berikan Pertolongan"
clearStatusButton.addEventListener('click', () => {
    const now = new Date();
    const timestamp = now.toISOString(); // Format ISO untuk konsistensi

    const safeDataEntry = {
        device_id: 'ResetUI', // Penanda khusus untuk UI
        timestamp: timestamp,
        status: 'Aman',
        latitude: 0, // Sertakan latitude
        longitude: 0, // Sertakan longitude
        raw_fall_data_string: '' // Sertakan field baru agar struktur konsisten
    };

    // --- LANGKAH PENTING: Langsung reset UI di sini tanpa menunggu Firebase ---
    if (deviceIdEl && timestampEl && statusMessageEl && latitudeEl && longitudeEl && clearStatusButton) {
        deviceIdEl.textContent = '-';
        timestampEl.textContent = '-';
        statusMessageEl.textContent = 'Aman';
        latitudeEl.textContent = '-';
        longitudeEl.textContent = '-';
        statusMessageEl.style.color = '#28a745'; // Hijau
        clearStatusButton.style.display = 'none';
        
        // Pindahkan marker dan atur view map ke posisi default 0,0
        marker.setLatLng([0,0]); 
        map.setView([0,0], 2); // Atur peta ke tampilan global
        console.log("UI langsung direset setelah tombol 'Berikan Pertolongan' diklik.");
    } else {
        console.error("Elemen HTML tidak ditemukan saat mencoba reset UI langsung.");
    }


    // --- LANGKAH 2: Tetap kirim data 'Aman' ke Firebase untuk pencatatan ---
    dataRef.push(safeDataEntry)
        .then(() => {
            console.log("Status 'Aman' dengan reset UI berhasil dikirim ke Firebase.");
            // UI akan otomatis terupdate jika ada data lain yang datang,
            // tapi reset utamanya sudah dilakukan di atas.
        })
        .catch((error) => {
            console.error("Gagal mengirim status reset ke Firebase: ", error);
            alert("Gagal memperbarui status. Periksa koneksi atau izin Firebase.");
            // Jika push ke Firebase gagal, Anda mungkin ingin mengembalikan UI ke kondisi sebelumnya
            // atau memberi tahu pengguna.
        });
});

// --- Bagian Push Notification ---
// Pastikan library Firebase Messaging sudah dimuat di index.html Anda
// <script src="https://www.gstatic.com/firebasejs/X.X.X/firebase-messaging.js"></script>
const messaging = firebase.messaging(); 

// Fungsi untuk meminta izin notifikasi dan mendapatkan token FCM
function requestPermissionAndGetToken() {
    console.log('Meminta izin notifikasi...');
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            console.log('Izin notifikasi diberikan.');
            return messaging.getToken(); // Dapatkan FCM registration token
        } else {
            console.warn('Gagal mendapatkan izin notifikasi.');
            return Promise.reject('Izin notifikasi ditolak.');
        }
    }).then((currentToken) => {
        if (currentToken) {
            console.log('FCM registration token:', currentToken);
            saveMessagingDeviceToken(currentToken); // Simpan token ke Realtime Database
        } else {
            console.warn('Tidak ada FCM registration token. Minta izin untuk membuatnya.');
        }
    }).catch((err) => {
        console.error('Terjadi error saat mendapatkan token: ', err);
    });
}

// Fungsi untuk menyimpan token ke Firebase Realtime Database
function saveMessagingDeviceToken(currentToken) {
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
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/images/firebase-logo.png' // Pastikan path ikon benar
    };
    new Notification(notificationTitle, notificationOptions);
});

// Daftarkan Service Worker dan panggil fungsi requestPermissionAndGetToken()
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./firebase-messaging-sw.js')
        .then((registration) => {
            console.log('Service Worker berhasil didaftarkan dengan scope:', registration.scope);
            messaging.useServiceWorker(registration);
            requestPermissionAndGetToken();
        })
        .catch((err) => {
            console.error('Pendaftaran Service Worker gagal:', err);
        });
} else {
    console.warn('Browser ini tidak mendukung Service Worker.');
}