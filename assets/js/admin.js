const modal = document.getElementById('addModalOverlay');
const openButton = document.getElementById('openAddModalBtn');
const closeButton = document.getElementById('closeModalBtn');
const cancelButton = document.getElementById('cancelModalBtn');
const listingForm = document.getElementById('listingForm');
const listingTableBody = document.getElementById('listingTableBody');
const searchInput = document.getElementById('listingSearchInput');
const modalTitle = document.getElementById('modalTitle');
const submitButton = document.getElementById('submitListingBtn');
const apiUrl = window.sfRealtyApiUrl || '../api/listings.php';

const stats = {
    total: document.getElementById('totalUnitsCount'),
    sale: document.getElementById('forSaleCount'),
    rent: document.getElementById('forRentCount'),
    launch: document.getElementById('newLaunchCount')
};

const formFields = {
    title: document.getElementById('listingTitleInput'),
    location: document.getElementById('listingLocationInput'),
    status: document.getElementById('listingStatusInput'),
    type: document.getElementById('listingTypeInput'),
    price: document.getElementById('listingPriceInput'),
    size: document.getElementById('listingSizeInput'),
    bedrooms: document.getElementById('listingBedroomsInput'),
    bathrooms: document.getElementById('listingBathroomsInput'),
    image: document.getElementById('listingImageInput')
};

const badgeConfig = {
    sale: { label: 'For Sale', className: 'badge-sale' },
    rent: { label: 'For Rent', className: 'badge-rent' },
    launch: { label: 'New Launch', className: 'badge-launch' }
};

const typeValueMap = {
    'Terrace House': 'terrace',
    Condominium: 'condo',
    'Semi-D': 'semi-d',
    Bungalow: 'bungalow',
    Townhouse: 'townhouse',
    Penthouse: 'penthouse',
    Studio: 'studio',
    'Bungalow / Villa': 'bungalow'
};

let listings = [];
let editingListingId = null;

function openModal() {
    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
}

function resetForm() {
    listingForm.reset();
    editingListingId = null;
    modalTitle.textContent = 'Create New Property Record';
    submitButton.textContent = 'Publish Listing';
}

function formatSize(size) {
    return `${Number(size).toLocaleString()} sf`;
}

function formatPrice(price) {
    const trimmedPrice = price.trim();
    const isRentalPrice = /\/mo$/i.test(trimmedPrice);
    const numericText = trimmedPrice
        .replace(/^RM\s*/i, '')
        .replace(/\/mo$/i, '')
        .replace(/,/g, '')
        .trim();

    if (!/^\d+(\.\d+)?$/.test(numericText)) {
        return trimmedPrice.startsWith('RM') ? trimmedPrice : `RM ${trimmedPrice}`;
    }

    const formattedNumber = Number(numericText).toLocaleString();
    return isRentalPrice ? `RM ${formattedNumber}/mo` : `RM ${formattedNumber}`;
}

function createTableRow(listing) {
    const badge = badgeConfig[listing.status];

    return `
        <tr data-id="${listing.id}">
            <td>
                <div class="property-cell">
                    <img src="${listing.image}" alt="${listing.title}">
                    <div>
                        <div class="property-name">${listing.title}</div>
                        <div class="property-loc">${listing.location}</div>
                    </div>
                </div>
            </td>
            <td>${listing.type}</td>
            <td><span class="badge-status ${badge.className}">${badge.label}</span></td>
            <td><strong>${listing.price}</strong></td>
            <td>${formatSize(listing.size)}</td>
            <td>
                <div class="actions-cell">
                    <button class="btn-action btn-edit" type="button" data-action="edit" data-id="${listing.id}" title="Edit Listing"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-action btn-delete" type="button" data-action="delete" data-id="${listing.id}" title="Remove Listing"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </td>
        </tr>
    `;
}

function updateStats() {
    stats.total.textContent = listings.length;
    stats.sale.textContent = listings.filter((listing) => listing.status === 'sale').length;
    stats.rent.textContent = listings.filter((listing) => listing.status === 'rent').length;
    stats.launch.textContent = listings.filter((listing) => listing.status === 'launch').length;
}

function renderListings(filterText = '') {
    const normalizedFilter = filterText.trim().toLowerCase();
    const filteredListings = listings.filter((listing) => {
        const haystack = [listing.title, listing.location, listing.type, badgeConfig[listing.status].label]
            .join(' ')
            .toLowerCase();

        return haystack.includes(normalizedFilter);
    });

    if (filteredListings.length === 0) {
        listingTableBody.innerHTML = `
            <tr>
                <td colspan="6">No property listings match your search.</td>
            </tr>
        `;
        return;
    }

    listingTableBody.innerHTML = filteredListings.map(createTableRow).join('');
}

function getFormValues() {
    return {
        title: formFields.title.value.trim(),
        location: formFields.location.value.trim(),
        status: formFields.status.value,
        type: formFields.type.options[formFields.type.selectedIndex].text,
        price: formatPrice(formFields.price.value),
        size: Number(formFields.size.value),
        bedrooms: Number(formFields.bedrooms.value),
        bathrooms: Number(formFields.bathrooms.value),
        image: formFields.image.value.trim()
    };
}

function populateForm(listing) {
    formFields.title.value = listing.title;
    formFields.location.value = listing.location;
    formFields.status.value = listing.status;
    formFields.type.value = typeValueMap[listing.type] || 'terrace';
    formFields.price.value = listing.price.replace(/^RM\s*/, '');
    formFields.size.value = listing.size;
    formFields.bedrooms.value = listing.bedrooms;
    formFields.bathrooms.value = listing.bathrooms;
    formFields.image.value = listing.image;
}

function handleEditListing(listingId) {
    const listing = listings.find((item) => item.id === listingId);

    if (!listing) {
        return;
    }

    editingListingId = listingId;
    modalTitle.textContent = 'Edit Property Record';
    submitButton.textContent = 'Update Listing';
    populateForm(listing);
    openModal();
}

function handleDeleteListing(listingId) {
    deleteListing(listingId);
}

async function handleFormSubmit(event) {
    event.preventDefault();

    const formValues = getFormValues();

    if (editingListingId === null) {
        await createListing(formValues);
    } else {
        await updateListing(editingListingId, formValues);
    }

    resetForm();
    closeModal();
    await loadListings(searchInput.value);
}

async function requestJson(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        ...options
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Request failed.');
    }

    return data;
}

async function loadListings(filterText = '') {
    const data = await requestJson(apiUrl, { method: 'GET' });
    listings = Array.isArray(data.listings) ? data.listings : [];
    updateStats();
    renderListings(filterText);
}

async function createListing(payload) {
    await requestJson(apiUrl, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

async function updateListing(listingId, payload) {
    await requestJson(`${apiUrl}?id=${listingId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
}

async function deleteListing(listingId) {
    await requestJson(`${apiUrl}?id=${listingId}`, {
        method: 'DELETE'
    });
    await loadListings(searchInput.value);
}

openButton.addEventListener('click', () => {
    resetForm();
    openModal();
});

closeButton.addEventListener('click', () => {
    resetForm();
    closeModal();
});

cancelButton.addEventListener('click', () => {
    resetForm();
    closeModal();
});

listingForm.addEventListener('submit', handleFormSubmit);

searchInput.addEventListener('input', (event) => {
    renderListings(event.target.value);
});

listingTableBody.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-action]');

    if (!actionButton) {
        return;
    }

    const listingId = Number(actionButton.dataset.id);

    if (actionButton.dataset.action === 'edit') {
        handleEditListing(listingId);
        return;
    }

    if (actionButton.dataset.action === 'delete') {
        handleDeleteListing(listingId);
    }
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        resetForm();
        closeModal();
    }
});

loadListings().catch(() => {
    listingTableBody.innerHTML = '<tr><td colspan="6">Unable to load listings from the database.</td></tr>';
});