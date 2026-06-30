const modal = document.getElementById('addModalOverlay');
const openButton = document.getElementById('openAddModalBtn');
const closeButton = document.getElementById('closeModalBtn');
const cancelButton = document.getElementById('cancelModalBtn');
const listingForm = document.getElementById('listingForm');
const listingTableBody = document.getElementById('listingTableBody');
const searchInput = document.getElementById('listingSearchInput');
const modalTitle = document.getElementById('modalTitle');
const submitButton = document.getElementById('submitListingBtn');
const deleteModal = document.getElementById('deleteModalOverlay');
const closeDeleteButton = document.getElementById('closeDeleteModalBtn');
const cancelDeleteButton = document.getElementById('cancelDeleteModalBtn');
const confirmDeleteButton = document.getElementById('confirmDeleteBtn');
const deleteListingName = document.getElementById('deleteListingName');
const apiUrl = window.sfRealtyApiUrl || '../api/listings.php';
const photoDropzone = document.getElementById('listingPhotoDropzone');
const photoPreview = document.getElementById('listingPhotoPreview');

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
    photos: document.getElementById('listingPhotosInput'),
    cover: document.getElementById('listingCoverInput')
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
let pendingDeleteListingId = null;
let selectedPhotoFiles = [];

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[character]));
}

function resolveAdminImageUrl(image) {
    if (/^https?:\/\//i.test(image) || image.startsWith('../')) {
        return image;
    }

    return image.startsWith('assets/') ? `../${image}` : image;
}

function openModal() {
    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
}

function openDeleteModal() {
    deleteModal.classList.add('active');
}

function closeDeleteModal() {
    deleteModal.classList.remove('active');
    pendingDeleteListingId = null;
    deleteListingName.textContent = 'This action will remove the listing from the website and admin panel.';
}

function resetForm() {
    listingForm.reset();
    selectedPhotoFiles = [];
    syncPhotoInputFiles();
    editingListingId = null;
    modalTitle.textContent = 'Create New Property Record';
    submitButton.textContent = 'Publish Listing';
    resetCoverOptions();
    renderPhotoPreview();
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

function resetCoverOptions() {
    formFields.cover.innerHTML = '<option value="">Use current cover or first uploaded photo</option>';
}

function addCoverOption(value, label, selected = false) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    option.selected = selected;
    formFields.cover.append(option);
}

function syncPhotoInputFiles() {
    const dataTransfer = new DataTransfer();

    selectedPhotoFiles.forEach((file) => dataTransfer.items.add(file));
    formFields.photos.files = dataTransfer.files;
}

function setSelectedPhotoFiles(files, append = true) {
    const imageFiles = [...files].filter((file) => file.type.startsWith('image/'));
    selectedPhotoFiles = append ? [...selectedPhotoFiles, ...imageFiles] : imageFiles;
    syncPhotoInputFiles();
    refreshUploadedCoverOptions();
    renderPhotoPreview();
}

function renderPhotoPreview() {
    if (selectedPhotoFiles.length === 0) {
        photoPreview.innerHTML = '';
        return;
    }

    photoPreview.innerHTML = selectedPhotoFiles.map((file, index) => `
        <div class="photo-preview-card">
            <img src="${URL.createObjectURL(file)}" alt="${escapeHtml(file.name)}">
            <button type="button" class="photo-remove-btn" data-photo-index="${index}" aria-label="Remove ${escapeHtml(file.name)}">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <span>${escapeHtml(file.name)}</span>
        </div>
    `).join('');
}

function refreshUploadedCoverOptions() {
    [...formFields.cover.querySelectorAll('option[data-upload-option="true"]')].forEach((option) => option.remove());

    selectedPhotoFiles.forEach((file, index) => {
        addCoverOption(`__upload:${index}`, `New upload: ${file.name}`, index === 0 && formFields.cover.value === '');
        formFields.cover.lastElementChild.dataset.uploadOption = 'true';
    });
}

function createTableRow(listing) {
    const badge = badgeConfig[listing.status];
    const imageUrl = resolveAdminImageUrl(listing.image);

    return `
        <tr data-id="${listing.id}">
            <td>
                <div class="property-cell">
                    <img src="${imageUrl}" alt="${listing.title}">
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
    const formData = new FormData();
    const coverValue = formFields.cover.value;

    formData.append('title', formFields.title.value.trim());
    formData.append('location', formFields.location.value.trim());
    formData.append('status', formFields.status.value);
    formData.append('type', formFields.type.options[formFields.type.selectedIndex].text);
    formData.append('price', formatPrice(formFields.price.value));
    formData.append('size', Number(formFields.size.value));
    formData.append('bedrooms', Number(formFields.bedrooms.value));
    formData.append('bathrooms', Number(formFields.bathrooms.value));

    if (coverValue.startsWith('__upload:')) {
        formData.append('cover_upload_index', coverValue.replace('__upload:', ''));
    } else {
        formData.append('cover_image', coverValue);
    }

    selectedPhotoFiles.forEach((file) => {
        formData.append('photos[]', file);
    });

    return formData;
}

function populateForm(listing) {
    resetCoverOptions();
    formFields.title.value = listing.title;
    formFields.location.value = listing.location;
    formFields.status.value = listing.status;
    formFields.type.value = typeValueMap[listing.type] || 'terrace';
    formFields.price.value = listing.price.replace(/^RM\s*/, '');
    formFields.size.value = listing.size;
    formFields.bedrooms.value = listing.bedrooms;
    formFields.bathrooms.value = listing.bathrooms;

    if (Array.isArray(listing.gallery)) {
        listing.gallery.forEach((imagePath, index) => {
            const label = imagePath === listing.image ? `Current cover: Photo ${index + 1}` : `Existing photo ${index + 1}`;
            addCoverOption(imagePath, label, imagePath === listing.image);
        });
    } else if (listing.image) {
        addCoverOption(listing.image, 'Current cover image', true);
    }
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
    const listing = listings.find((item) => item.id === listingId);

    if (!listing) {
        return;
    }

    pendingDeleteListingId = listingId;
    deleteListingName.textContent = `${listing.title} in ${listing.location} will be removed from the website and admin panel.`;
    openDeleteModal();
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
    const isFormData = options.body instanceof FormData;
    const response = await fetch(url, {
        headers: isFormData
            ? { Accept: 'application/json' }
            : {
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
        body: payload
    });
}

async function updateListing(listingId, payload) {
    payload.append('_method', 'PUT');

    await requestJson(`${apiUrl}?id=${listingId}`, {
        method: 'POST',
        body: payload
    });
}

async function deleteListing(listingId) {
    await requestJson(`${apiUrl}?id=${listingId}`, {
        method: 'DELETE'
    });
    await loadListings(searchInput.value);
}

async function confirmPendingDelete() {
    if (pendingDeleteListingId === null) {
        return;
    }

    const listingId = pendingDeleteListingId;
    confirmDeleteButton.disabled = true;
    confirmDeleteButton.textContent = 'Deleting...';

    try {
        await deleteListing(listingId);
        closeDeleteModal();
    } finally {
        confirmDeleteButton.disabled = false;
        confirmDeleteButton.textContent = 'Delete Listing';
    }
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

closeDeleteButton.addEventListener('click', closeDeleteModal);
cancelDeleteButton.addEventListener('click', closeDeleteModal);
confirmDeleteButton.addEventListener('click', confirmPendingDelete);

listingForm.addEventListener('submit', handleFormSubmit);

formFields.photos.addEventListener('change', (event) => {
    setSelectedPhotoFiles(event.target.files, false);
});

photoDropzone.addEventListener('click', (event) => {
    if (event.target === formFields.photos) {
        return;
    }

    formFields.photos.click();
});

photoDropzone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        formFields.photos.click();
    }
});

photoDropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    photoDropzone.classList.add('is-dragover');
});

photoDropzone.addEventListener('dragleave', () => {
    photoDropzone.classList.remove('is-dragover');
});

photoDropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    photoDropzone.classList.remove('is-dragover');
    setSelectedPhotoFiles(event.dataTransfer.files);
});

photoPreview.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-photo-index]');

    if (!removeButton) {
        return;
    }

    selectedPhotoFiles.splice(Number(removeButton.dataset.photoIndex), 1);
    syncPhotoInputFiles();
    refreshUploadedCoverOptions();
    renderPhotoPreview();
});

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

    if (event.target === deleteModal) {
        closeDeleteModal();
    }
});

loadListings().catch(() => {
    listingTableBody.innerHTML = '<tr><td colspan="6">Unable to load listings from the database.</td></tr>';
});
