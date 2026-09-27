// Nama file JSON yang harus ada di direktori yang sama
const DICTIONARY_FILES = {
    kamus1: 'kamus1.json',
    kamus2: 'kamus2.json',
    kamus3: 'kamus3.json'
};

let dictionaryData = {
    kamus1: [],
    kamus2: [],
    kamus3: []
};

let activeFilter = 'all';

// Elemen DOM
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const resultsContainer = document.getElementById('resultsContainer');
const loadingIndicator = document.getElementById('loadingIndicator');

// Fungsi inisialisasi untuk memuat data JSON
async function init() {
    loadingIndicator.classList.remove('hidden');
    
    try {
        const fetchPromises = Object.keys(DICTIONARY_FILES).map(async (key) => {
            try {
                const response = await fetch(DICTIONARY_FILES[key]);
                if (response.ok) {
                    dictionaryData[key] = await response.json();
                } else {
                    console.warn(`Gagal memuat ${DICTIONARY_FILES[key]}`);
                }
            } catch (error) {
                console.warn(`Error mengambil ${DICTIONARY_FILES[key]}:`, error);
            }
        });

        await Promise.all(fetchPromises);
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

// Menyorot kata kunci dengan tag HTML
function highlightText(text, query) {
    if (!query) return text;
    // Menggunakan regex untuk mencari teks tanpa mempedulikan huruf besar/kecil (case-insensitive)
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// Menjalankan pencarian
function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    
    // Tampilkan tombol clear jika ada teks
    clearBtn.style.display = query.length > 0 ? 'block' : 'none';
    
    if (query.length === 0) {
        resultsContainer.innerHTML = '';
        return;
    }

    let results = [];

    // Filter berdasarkan kamus yang aktif
    const sourcesToSearch = activeFilter === 'all' 
        ? Object.keys(dictionaryData) 
        : [activeFilter];

    sourcesToSearch.forEach(source => {
        const data = dictionaryData[source];
        if (data && data.length > 0) {
            const matchedData = data.filter(item => {
                const indoMatch = item.Indonesia && item.Indonesia.toLowerCase().includes(query);
                const jawaMatch = item.Javanese && item.Javanese.toLowerCase().includes(query);
                return indoMatch || jawaMatch;
            });
            
            // Menambahkan metadata sumber untuk ditampilkan
            matchedData.forEach(item => {
                results.push({ ...item, sourceName: source.toUpperCase() });
            });
        }
    });

    renderResults(results, searchInput.value.trim());
}

// Merender hasil ke dalam DOM
function renderResults(results, query) {
    resultsContainer.innerHTML = '';

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Tidak ada hasil yang ditemukan.</p>';
        return;
    }

    results.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';

        const indoHTML = highlightText(item.Indonesia || '-', query);
        const jawaHTML = highlightText(item.Javanese || '-', query);
        
        card.innerHTML = `
            <h3>${indoHTML}</h3>
            <p><span class="label">Jawa:</span> ${jawaHTML}</p>
            <p><span class="label">Alfabet:</span> ${item.Alphabet || '-'}</p>
            <div class="source-badge">Sumber: ${item.sourceName}</div>
        `;
        resultsContainer.appendChild(card);
    });
}

// Event Listeners
searchInput.addEventListener('input', performSearch);

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    performSearch();
    searchInput.focus();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Hapus class active dari semua tombol
        filterBtns.forEach(b => b.classList.remove('active'));
        // Tambahkan class active ke tombol yang diklik
        e.target.classList.add('active');
        
        activeFilter = e.target.getAttribute('data-target');
        performSearch();
    });
});

// Jalankan saat load
document.addEventListener('DOMContentLoaded', init);
          
