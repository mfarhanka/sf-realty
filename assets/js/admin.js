const modal = document.getElementById('addModalOverlay');
const openButton = document.getElementById('openAddModalBtn');
const closeButton = document.getElementById('closeModalBtn');
const cancelButton = document.getElementById('cancelModalBtn');
const listingForm = document.getElementById('listingForm');

function toggleModal() {
    modal.classList.toggle('active');
}

openButton.addEventListener('click', toggleModal);
closeButton.addEventListener('click', toggleModal);
cancelButton.addEventListener('click', toggleModal);

listingForm.addEventListener('submit', (event) => {
    event.preventDefault();
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        toggleModal();
    }
});