// @ts-nocheck

// Firebase config
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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const dataRef = database.ref('data');

// Leaflet map
let map = L.map('map').setView([-7.6302, 110.5309], 15);
let marker = L.marker([-7.6302, 110.5309]).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const clearStatusButton = document.getElementById('clear-status-button');

function updateUI(data) {
    const deviceIdEl = document.getElementById('device-id');
    const timestampEl = document.getElementById('timestamp');
    const statusMessageEl = document.getElementById('status-message');
    const latitudeEl = document.getElementById('latitude');
    const longitudeEl = document.getElementById('longitude');

    if (!deviceIdEl || !timestampEl || !statusMessageEl || !latitudeEl || !longitudeEl || !clearStatusButton) {
        console.error("One or more required HTML elements not found!");
        return;
    }

    if (data) {
        const validEntries = Object.entries(data).filter(([_, value]) => {
            return value &&
                typeof value.device_id === 'string' &&
                typeof value.status === 'string' &&
                typeof value.timestamp === 'string';
        });

        if (validEntries.length === 0) {
            updateUI(null);
            return;
        }

        validEntries.sort((a, b) => {
            const timeA = new Date(a[1].timestamp.replace(' ', 'T')).getTime();
            const timeB = new Date(b[1].timestamp.replace(' ', 'T')).getTime();
            return timeB - timeA;
        });

        const latestData = validEntries[0][1];

        // Handle reset UI
        if (latestData.status === "Aman" && latestData.device_id === "ResetUI") {
            deviceIdEl.textContent = '-';
            timestampEl.textContent = '-';
            statusMessageEl.textContent = 'Aman';
            latitudeEl.textContent = '-';
            longitudeEl.textContent = '-';
            statusMessageEl.style.color = '#28a745';
            clearStatusButton.style.display = 'none';
            marker.setLatLng([0, 0]);
            map.setView([0, 0], 2);
            return;
        }

        // Normal data
        deviceIdEl.textContent = latestData.device_id || '-';
        timestampEl.textContent = latestData.timestamp || '-';
        statusMessageEl.textContent = latestData.status || 'Tidak ada data';
        latitudeEl.textContent = latestData.latitude !== undefined ? latestData.latitude.toFixed(6) : '-';
        longitudeEl.textContent = latestData.longitude !== undefined ? latestData.longitude.toFixed(6) : '-';

        if (latestData.latitude !== undefined && latestData.longitude !== undefined &&
            latestData.latitude !== 0 && latestData.longitude !== 0) {
            const newLatLng = new L.LatLng(latestData.latitude, latestData.longitude);
            marker.setLatLng(newLatLng);
            map.setView(newLatLng, 15);
        } else {
            marker.setLatLng([0, 0]);
            map.setView([0, 0], 2);
        }

        if (latestData.status === "Jatuh Terdeteksi") {
            statusMessageEl.style.color = '#e74c3c';
            clearStatusButton.style.display = 'block';
        } else {
            statusMessageEl.style.color = '#28a745';
            clearStatusButton.style.display = 'none';
        }

    } else {
        deviceIdEl.textContent = '-';
        timestampEl.textContent = '-';
        statusMessageEl.textContent = 'Tidak ada data';
        latitudeEl.textContent = '-';
        longitudeEl.textContent = '-';
        statusMessageEl.style.color = '#e74c3c';
        marker.setLatLng([0, 0]);
        map.setView([0, 0], 2);
        clearStatusButton.style.display = 'none';
    }
}

// Listen real-time
dataRef.on('value', (snapshot) => {
    const data = snapshot.val();
    updateUI(data);
}, (errorObject) => {
    console.error('The read failed: ' + errorObject.code);
    updateUI(null);
});

// Tombol refresh manual
document.getElementById('refresh-button').addEventListener('click', () => {
    console.log("Refresh button clicked.");
});

// Tombol Berikan Pertolongan
clearStatusButton.addEventListener('click', () => {
    const now = new Date();
    const timestamp = now.toISOString();
    const safeDataEntry = {
        device_id: 'ResetUI',
        timestamp: timestamp,
        status: 'Aman'
    };

    dataRef.push(safeDataEntry)
        .then(() => {
            console.log("Status 'Aman' berhasil dikirim.");
        })
        .catch((error) => {
            console.error("Gagal memperbarui status:", error);
            alert("Gagal memperbarui status. Periksa koneksi.");
        });
});

// Notifikasi
const messaging = firebase.messaging();

function requestPermissionAndGetToken() {
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            return messaging.getToken();
        } else {
            return Promise.reject('Izin notifikasi ditolak.');
        }
    }).then((currentToken) => {
        if (currentToken) {
            saveMessagingDeviceToken(currentToken);
        }
    }).catch((err) => {
        console.error('Token error:', err);
    });
}

function saveMessagingDeviceToken(currentToken) {
    database.ref('/fcmTokens/' + currentToken).set(true)
        .then(() => {
            console.log('FCM token disimpan.');
        })
        .catch((error) => {
            console.error('Error simpan FCM token:', error);
        });
}

messaging.onMessage((payload) => {
    console.log('[script.js] Pesan foreground:', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/images/firebase-logo.png'
    };
    new Notification(notificationTitle, notificationOptions);
});

// Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./firebase-messaging-sw.js')
        .then((registration) => {
            messaging.useServiceWorker(registration);
            requestPermissionAndGetToken();
        })
        .catch((err) => {
            console.error('SW gagal didaftarkan:', err);
        });
} else {
    console.warn('Service Worker tidak didukung.');
}
