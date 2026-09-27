// Konfigurasi Nama File JSON (Ubah jika nama file Anda berbeda)
const JSON_FILES = {
    kamus1: 'kamus1.json', // Sesuaikan nama file asli
    kamus2: 'kamus2.json',
    kamus3: 'kamus3.json'
};

// State Aplikasi
let kamusData = {
    kamus1: [],
    kamus2: [],
    kamus3: []
};
let activeFilter = 'all'; // all | kamus1 | kamus2 | kamus3

// Elemen DOM
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const resultsContainer = document.getElementById('resultsContainer');
const filterBtns = document.querySelectorAll('.filter-btn');
const loadingIndicator = document.getElementById('loading');

// 1. Inisialisasi dan Fetch Data
async function initApp() {
    loadingIndicator.classList.remove('hidden');
    resultsContainer.innerHTML = '';
    
    try {
        const [res1, res2, res3] = await Promise.all([
            fetch(JSON_FILES.kamus1).catch(() => ({ json: () => [] })),
            fetch(JSON_FILES.kamus2).catch(() => ({ json: () => [] })),
            fetch(JSON_FILES.kamus3).catch(() => ({ json: () => [] }))
        ]);

        kamusData.kamus1 = await res1.json();
        kamusData.kamus2 = await res2.json();
        kamusData.kamus3 = await res3.json();
        
        loadingIndicator.classList.add('hidden');
        renderEmptyState();
    } catch (error) {
        console.error("Gagal memuat file JSON:", error);
        resultsContainer.innerHTML = `<div class="empty-state"><p>Terjadi kesalahan saat memuat data JSON. Pastikan file berada di root yang sama.</p></div>`;
        loadingIndicator.classList.add('hidden');
    }
}

// 2. Event Listeners
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    // Tampilkan atau sembunyikan tombol clear
    clearBtn.style.display = query.length > 0 ? 'block' : 'none';
    handleSearch(query);
});

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    searchInput.focus();
    renderEmptyState();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Update active class
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        // Update filter state dan trigger search ulang
        activeFilter = e.target.dataset.target;
        handleSearch(searchInput.value.trim());
    });
});

// 3. Logika Pencarian
function handleSearch(query) {
    if (!query) {
        renderEmptyState();
        return;
    }

    const lowerQuery = query.toLowerCase();
    let results = [];

    // Fungsi utilitas untuk memeriksa dan memasukkan data jika cocok
    const searchInDataset = (dataset) => {
        if (!Array.isArray(dataset)) return [];
        return dataset.filter(item => {
            // Mengecek seluruh value di dalam object secara dinamis
            return Object.values(item).some(val => 
                String(val).toLowerCase().includes(lowerQuery)
            );
        });
    };

    // Filter berdasarkan tombol yang aktif
    if (activeFilter === 'all' || activeFilter === 'kamus1') {
        results = results.concat(searchInDataset(kamusData.kamus1));
    }
    if (activeFilter === 'all' || activeFilter === 'kamus2') {
        results = results.concat(searchInDataset(kamusData.kamus2));
    }
    if (activeFilter === 'all' || activeFilter === 'kamus3') {
        results = results.concat(searchInDataset(kamusData.kamus3));
    }

    renderResults(results, query);
}

// 4. Render Hasil & Highlight Text
function renderResults(results, query) {
    resultsContainer.innerHTML = '';

    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>Tidak ditemukan hasil untuk "<b>${query}</b>" pada kamus yang dipilih.</p>
            </div>`;
        return;
    }

    // Batasi hasil maksimal agar browser tidak lag jika kata terlalu umum
    const maxResults = 100; 
    const displayResults = results.slice(0, maxResults);

    displayResults.forEach(item => {
        const card = document.createElement('div');
        card.className = 'result-card';

        // Loop melalui seluruh key/value dalam JSON objek secara dinamis
        for (const [key, value] of Object.entries(item)) {
            const formattedKey = key.replace(/_/g, ' '); // Format key (ex: krama_inggil -> krama inggil)
            const highlightedValue = highlightText(String(value), query);
            
            const row = document.createElement('div');
            row.className = 'attr-row';
            row.innerHTML = `<span class="attr-key">${formattedKey}:</span> ${highlightedValue}`;
            card.appendChild(row);
        }

        resultsContainer.appendChild(card);
    });

    if (results.length > maxResults) {
        const warning = document.createElement('div');
        warning.className = 'empty-state';
        warning.innerHTML = `<p>Menampilkan ${maxResults} hasil teratas. Spesifikkan pencarian Anda.</p>`;
        resultsContainer.appendChild(warning);
    }
}

// Fungsi untuk mewarnai teks yang dicari (Regex)
function highlightText(text, query) {
    if (!query) return text;
    // Hindari masalah regex karakter khusus
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
    const regex = new RegExp(`(${safeQuery})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function renderEmptyState() {
    resultsContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-book-open"></i>
            <p>Mulai mengetik untuk mencari kosakata. Hasil akan otomatis muncul.</p>
        </div>`;
}

// Jalankan aplikasi saat file diload
initApp();
