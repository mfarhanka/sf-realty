const siteApiUrl = 'api/listings.php';
const propertyGrid = document.getElementById('propertyGrid');
const searchInput = document.getElementById('siteSearchInput');
const typeFilter = document.getElementById('siteTypeFilter');
const budgetFilter = document.getElementById('siteBudgetFilter');
const searchButton = document.getElementById('siteSearchButton');

const statusLabelMap = {
    sale: 'For Sale',
    rent: 'For Rent',
    launch: 'New Launch'
};

let siteListings = [];

function parsePriceValue(price) {
    const numericText = price.replace(/^RM\s*/i, '').replace(/\/mo$/i, '').replace(/,/g, '').trim();
    return Number(numericText) || 0;
}

function normalizeType(type) {
    const value = type.toLowerCase();

    if (value.includes('condo')) {
        return 'condo';
    }

    if (value.includes('terrace')) {
        return 'terrace';
    }

    if (value.includes('semi')) {
        return 'semi-d';
    }

    if (value.includes('bungalow') || value.includes('villa')) {
        return 'bungalow';
    }

    return '';
}

function buildWhatsAppUrl(title) {
    return `https://wa.me/60123456789?text=${encodeURIComponent(`Hi Syed, I am interested in ${title}.`)}`;
}

function renderPropertyCard(listing) {
    return `
        <div class="property-card">
            <div class="property-thumb">
                <span class="tag-status">${statusLabelMap[listing.status]}</span>
                <img src="${listing.image}" alt="${listing.title}">
            </div>
            <div class="property-details">
                <div class="price">${listing.price}</div>
                <div class="title">${listing.title}</div>
                <div class="location"><i class="fa-solid fa-location-dot"></i> ${listing.location}</div>
                <div class="features">
                    <span><i class="fa-solid fa-bed"></i> ${listing.bedrooms} Beds</span>
                    <span><i class="fa-solid fa-bath"></i> ${listing.bathrooms} Baths</span>
                    <span><i class="fa-solid fa-ruler-combined"></i> ${Number(listing.size).toLocaleString()} sf</span>
                </div>
                <a href="${buildWhatsAppUrl(listing.title)}" target="_blank" class="btn-whatsapp-unit">
                    <i class="fa-brands fa-whatsapp"></i> WhatsApp Inquiry
                </a>
            </div>
        </div>
    `;
}

function renderSiteListings(listings) {
    if (listings.length === 0) {
        propertyGrid.innerHTML = '<p class="empty-state">No listings match the current filters.</p>';
        return;
    }

    propertyGrid.innerHTML = listings.map(renderPropertyCard).join('');
}

function applySiteFilters() {
    const term = searchInput.value.trim().toLowerCase();
    const selectedType = typeFilter.value;
    const selectedBudget = budgetFilter.value;

    const filteredListings = siteListings.filter((listing) => {
        const matchesTerm = [listing.title, listing.location, listing.type, statusLabelMap[listing.status]]
            .join(' ')
            .toLowerCase()
            .includes(term);
        const matchesType = selectedType === '' || normalizeType(listing.type) === selectedType;
        const matchesBudget = selectedBudget === '' || parsePriceValue(listing.price) <= Number(selectedBudget);

        return matchesTerm && matchesType && matchesBudget;
    });

    renderSiteListings(filteredListings);
}

async function loadSiteListings() {
    propertyGrid.innerHTML = '<p class="empty-state">Loading listings...</p>';

    try {
        const response = await fetch(siteApiUrl, { headers: { Accept: 'application/json' } });

        if (!response.ok) {
            throw new Error('Unable to load listings.');
        }

        const data = await response.json();
        siteListings = Array.isArray(data.listings) ? data.listings : [];
        applySiteFilters();
    } catch (error) {
        propertyGrid.innerHTML = '<p class="empty-state">Unable to load listings right now.</p>';
    }
}

searchButton.addEventListener('click', applySiteFilters);
searchInput.addEventListener('input', applySiteFilters);
typeFilter.addEventListener('change', applySiteFilters);
budgetFilter.addEventListener('change', applySiteFilters);

loadSiteListings();