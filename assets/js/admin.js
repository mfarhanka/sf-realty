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
    photos: document.getElementById('listingPhotosInput')
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
let existingPhotoPaths = [];
let deletedPhotoPaths = [];
let selectedCoverValue = '';

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
    existingPhotoPaths = [];
    deletedPhotoPaths = [];
    selectedCoverValue = '';
    syncPhotoInputFiles();
    editingListingId = null;
    modalTitle.textContent = 'Create New Property Record';
    submitButton.textContent = 'Publish Listing';
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

function syncPhotoInputFiles() {
    const dataTransfer = new DataTransfer();

    selectedPhotoFiles.forEach((file) => dataTransfer.items.add(file));
    formFields.photos.files = dataTransfer.files;
}

function setSelectedPhotoFiles(files, append = true) {
    const imageFiles = [...files].filter((file) => file.type.startsWith('image/'));
    selectedPhotoFiles = append ? [...selectedPhotoFiles, ...imageFiles] : imageFiles;
    syncPhotoInputFiles();
    renderPhotoPreview();
}

function getAvailableExistingPhotos() {
    return existingPhotoPaths.filter((imagePath) => !deletedPhotoPaths.includes(imagePath));
}

function normalizeSelectedCover() {
    const existingPhotos = getAvailableExistingPhotos();

    if (selectedCoverValue.startsWith('__upload:')) {
        const uploadIndex = Number(selectedCoverValue.replace('__upload:', ''));
        if (selectedPhotoFiles[uploadIndex]) {
            return;
        }
    }

    if (selectedCoverValue !== '' && existingPhotos.includes(selectedCoverValue)) {
        return;
    }

    if (existingPhotos.length > 0) {
        selectedCoverValue = existingPhotos[0];
        return;
    }

    selectedCoverValue = selectedPhotoFiles.length > 0 ? '__upload:0' : '';
}

function renderPhotoPreview() {
    normalizeSelectedCover();

    const existingPhotos = getAvailableExistingPhotos();

    if (existingPhotos.length === 0 && selectedPhotoFiles.length === 0) {
        photoPreview.innerHTML = '';
        return;
    }

    const existingCards = existingPhotos.map((imagePath, index) => {
        const isCover = selectedCoverValue === imagePath;

        return `
        <div class="photo-preview-card ${isCover ? 'is-cover' : ''}">
            <button type="button" class="photo-cover-btn" data-cover-existing="${escapeHtml(imagePath)}" aria-label="Use existing photo ${index + 1} as cover">
                <img src="${escapeHtml(resolveAdminImageUrl(imagePath))}" alt="Existing listing photo ${index + 1}">
            </button>
            <button type="button" class="photo-remove-btn" data-delete-existing="${escapeHtml(imagePath)}" aria-label="Delete existing photo ${index + 1}">
                <i class="fa-solid fa-trash-can"></i>
            </button>
            <span>${isCover ? 'Cover photo' : `Existing photo ${index + 1}`}</span>
        </div>
        `;
    }).join('');

    const uploadCards = selectedPhotoFiles.map((file, index) => {
        const coverValue = `__upload:${index}`;
        const isCover = selectedCoverValue === coverValue;

        return `
        <div class="photo-preview-card ${isCover ? 'is-cover' : ''}">
            <button type="button" class="photo-cover-btn" data-cover-upload="${index}" aria-label="Use ${escapeHtml(file.name)} as cover">
                <img src="${URL.createObjectURL(file)}" alt="${escapeHtml(file.name)}">
            </button>
            <button type="button" class="photo-remove-btn" data-photo-index="${index}" aria-label="Remove ${escapeHtml(file.name)}">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <span>${isCover ? 'Cover photo' : escapeHtml(file.name)}</span>
        </div>
        `;
    }).join('');

    photoPreview.innerHTML = existingCards + uploadCards;
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

    formData.append('title', formFields.title.value.trim());
    formData.append('location', formFields.location.value.trim());
    formData.append('status', formFields.status.value);
    formData.append('type', formFields.type.options[formFields.type.selectedIndex].text);
    formData.append('price', formatPrice(formFields.price.value));
    formData.append('size', Number(formFields.size.value));
    formData.append('bedrooms', Number(formFields.bedrooms.value));
    formData.append('bathrooms', Number(formFields.bathrooms.value));

    normalizeSelectedCover();

    if (selectedCoverValue.startsWith('__upload:')) {
        formData.append('cover_upload_index', selectedCoverValue.replace('__upload:', ''));
    } else {
        formData.append('cover_image', selectedCoverValue);
    }

    selectedPhotoFiles.forEach((file) => {
        formData.append('photos[]', file);
    });

    deletedPhotoPaths.forEach((imagePath) => {
        formData.append('deleted_photos[]', imagePath);
    });

    return formData;
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
    existingPhotoPaths = Array.isArray(listing.gallery) ? [...listing.gallery] : (listing.image ? [listing.image] : []);
    deletedPhotoPaths = [];
    selectedCoverValue = listing.image || existingPhotoPaths[0] || '';
    renderPhotoPreview();
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
    const existingCoverButton = event.target.closest('[data-cover-existing]');
    const uploadCoverButton = event.target.closest('[data-cover-upload]');
    const deleteExistingButton = event.target.closest('[data-delete-existing]');
    const removeButton = event.target.closest('[data-photo-index]');

    if (existingCoverButton) {
        selectedCoverValue = existingCoverButton.dataset.coverExisting;
        renderPhotoPreview();
        return;
    }

    if (uploadCoverButton) {
        selectedCoverValue = `__upload:${uploadCoverButton.dataset.coverUpload}`;
        renderPhotoPreview();
        return;
    }

    if (deleteExistingButton) {
        const imagePath = deleteExistingButton.dataset.deleteExisting;
        deletedPhotoPaths = [...new Set([...deletedPhotoPaths, imagePath])];
        renderPhotoPreview();
        return;
    }

    if (!removeButton) {
        return;
    }

    const removedIndex = Number(removeButton.dataset.photoIndex);
    selectedPhotoFiles.splice(removedIndex, 1);

    if (selectedCoverValue === `__upload:${removedIndex}`) {
        selectedCoverValue = '';
    } else if (selectedCoverValue.startsWith('__upload:')) {
        const coverIndex = Number(selectedCoverValue.replace('__upload:', ''));
        selectedCoverValue = coverIndex > removedIndex ? `__upload:${coverIndex - 1}` : selectedCoverValue;
    }

    syncPhotoInputFiles();
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
