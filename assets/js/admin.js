const modal = document.getElementById('addModalOverlay');
const openButton = document.getElementById('openAddModalBtn');
const closeButton = document.getElementById('closeModalBtn');
const cancelButton = document.getElementById('cancelModalBtn');
const listingForm = document.getElementById('listingForm');
const listingTableBody = document.getElementById('listingTableBody');
const searchInput = document.getElementById('listingSearchInput');
const modalTitle = document.getElementById('modalTitle');
const submitButton = document.getElementById('submitListingBtn');

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

const initialListings = [
    {
        id: 1,
        title: 'Modern Luxury Villa',
        location: 'Amber Heights, Section 7',
        status: 'sale',
        type: 'Bungalow / Villa',
        price: 'RM 520,000',
        size: 2200,
        bedrooms: 4,
        bathrooms: 3,
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=100&q=80'
    },
    {
        id: 2,
        title: 'Skyline View Condominium',
        location: 'City Centre, Block B',
        status: 'sale',
        type: 'Condominium',
        price: 'RM 315,000',
        size: 1100,
        bedrooms: 3,
        bathrooms: 2,
        image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=100&q=80'
    },
    {
        id: 3,
        title: '2-Story Minimalist Terrace',
        location: 'Clover Park Residences',
        status: 'launch',
        type: 'Terrace House',
        price: 'RM 740,000',
        size: 2600,
        bedrooms: 4,
        bathrooms: 4,
        image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=100&q=80'
    },
    {
        id: 4,
        title: 'Exclusive Botanical Bungalow',
        location: 'Green Hills Estate',
        status: 'sale',
        type: 'Bungalow',
        price: 'RM 1,250,000',
        size: 4500,
        bedrooms: 5,
        bathrooms: 6,
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=100&q=80'
    },
    {
        id: 5,
        title: 'Cozy Family Townhouse',
        location: 'Saujana Utama',
        status: 'rent',
        type: 'Townhouse',
        price: 'RM 2,200/mo',
        size: 1800,
        bedrooms: 3,
        bathrooms: 3,
        image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=100&q=80'
    },
    {
        id: 6,
        title: 'Urban Duplex Penthouse',
        location: 'Metro Heights',
        status: 'sale',
        type: 'Penthouse',
        price: 'RM 450,000',
        size: 1350,
        bedrooms: 2,
        bathrooms: 2,
        image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=100&q=80'
    },
    {
        id: 7,
        title: 'Smart Home Semi-D',
        location: 'Cyber Grove',
        status: 'sale',
        type: 'Semi-D',
        price: 'RM 620,000',
        size: 2400,
        bedrooms: 4,
        bathrooms: 4,
        image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=100&q=80'
    },
    {
        id: 8,
        title: 'Modern Studio Suite',
        location: 'Nexus Suites, Central',
        status: 'rent',
        type: 'Studio',
        price: 'RM 1,800/mo',
        size: 650,
        bedrooms: 1,
        bathrooms: 1,
        image: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=100&q=80'
    }
];

let listings = [...initialListings];
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
    listings = listings.filter((listing) => listing.id !== listingId);
    updateStats();
    renderListings(searchInput.value);
}

function handleFormSubmit(event) {
    event.preventDefault();

    const formValues = getFormValues();

    if (editingListingId === null) {
        listings.unshift({
            id: Date.now(),
            ...formValues
        });
    } else {
        listings = listings.map((listing) => (
            listing.id === editingListingId
                ? { ...listing, ...formValues }
                : listing
        ));
    }

    resetForm();
    closeModal();
    updateStats();
    renderListings(searchInput.value);
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

updateStats();
renderListings();