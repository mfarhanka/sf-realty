<?php

declare(strict_types=1);

require __DIR__ . '/includes/site-data.php';

$listingId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
$listing = $listingId > 0 ? fetchSiteListingById($listingId) : null;

if ($listing === null) {
    http_response_code(404);
}

$baseUrl = getSiteBaseUrl();
$pageTitle = $listing === null
    ? 'Property Listing Not Found | SF Realty'
    : $listing['title'] . ' - ' . $listing['price'] . ' | ' . SITE_AGENT_NAME . ' ' . SITE_AGENT_REN;
$pageDescription = $listing === null
    ? 'The requested SF Realty property listing could not be found.'
    : getListingDescription($listing);
$canonicalUrl = $listing === null ? $baseUrl . '/listing.php' : getListingUrl($listing, true);
$mainImage = $listing === null ? $baseUrl . '/assets/images/listings/17-kanvas-soho-fully-furnished-studio/photo_2026-01-14_18-23-08.jpg' : getImageUrl((string) $listing['image'], true);
$gallery = $listing === null ? [] : getLocalListingGallery($listing);
$listingSchema = null;

if ($listing !== null) {
    $listingSchema = [
        '@context' => 'https://schema.org',
        '@type' => 'Apartment',
        'name' => (string) $listing['title'],
        'description' => $pageDescription,
        'url' => $canonicalUrl,
        'image' => array_map(static fn (string $image): string => getImageUrl($image, true), $gallery),
        'address' => [
            '@type' => 'PostalAddress',
            'addressLocality' => (string) $listing['location'],
            'addressCountry' => 'MY',
        ],
        'floorSize' => [
            '@type' => 'QuantitativeValue',
            'value' => (int) $listing['size'],
            'unitText' => 'sqft',
        ],
        'numberOfBedrooms' => (int) $listing['bedrooms'],
        'numberOfBathroomsTotal' => (int) $listing['bathrooms'],
        'offers' => [
            '@type' => 'Offer',
            'priceCurrency' => 'MYR',
            'price' => preg_replace('/[^\d.]/', '', (string) $listing['price']),
            'availability' => 'https://schema.org/InStock',
            'url' => $canonicalUrl,
        ],
        'provider' => [
            '@type' => 'RealEstateAgent',
            'name' => SITE_AGENT_NAME,
            'identifier' => SITE_AGENT_REN,
            'telephone' => '+' . SITE_WHATSAPP,
        ],
    ];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlEscape($pageTitle) ?></title>
    <meta name="description" content="<?= htmlEscape($pageDescription) ?>">
    <meta name="robots" content="<?= $listing === null ? 'noindex, follow' : 'index, follow' ?>">
    <link rel="canonical" href="<?= htmlEscape($canonicalUrl) ?>">
    <meta property="og:type" content="article">
    <meta property="og:title" content="<?= htmlEscape($pageTitle) ?>">
    <meta property="og:description" content="<?= htmlEscape($pageDescription) ?>">
    <meta property="og:url" content="<?= htmlEscape($canonicalUrl) ?>">
    <meta property="og:image" content="<?= htmlEscape($mainImage) ?>">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?= htmlEscape($pageTitle) ?>">
    <meta name="twitter:description" content="<?= htmlEscape($pageDescription) ?>">
    <meta name="twitter:image" content="<?= htmlEscape($mainImage) ?>">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="<?= htmlEscape($baseUrl) ?>/assets/css/base.css">
    <link rel="stylesheet" href="<?= htmlEscape($baseUrl) ?>/assets/css/site.css">
    <?php if ($listingSchema !== null): ?>
        <script type="application/ld+json"><?= json_encode($listingSchema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?></script>
    <?php endif; ?>
</head>
<body>
    <header>
        <nav class="navbar">
            <a class="logo-container" href="<?= htmlEscape($baseUrl) ?>/" aria-label="SF Realty home">
                <div class="logo">SF <span>Realty</span></div>
                <div class="ren-tag">Syed Ahmad | REN 64218 | E(1)1987</div>
            </a>
            <ul class="nav-links">
                <li><a href="<?= htmlEscape($baseUrl) ?>/">Home</a></li>
                <li><a href="<?= htmlEscape($baseUrl) ?>/#properties">Properties</a></li>
                <li><a href="<?= htmlEscape($baseUrl) ?>/#agent">About Syed</a></li>
            </ul>
            <a href="https://wa.me/<?= SITE_WHATSAPP ?>" target="_blank" rel="noopener" class="btn-contact"><i class="fa-brands fa-whatsapp"></i> Contact Syed</a>
        </nav>
    </header>

    <main class="listing-detail">
        <?php if ($listing === null): ?>
            <section class="not-found-panel">
                <h1>Listing not found</h1>
                <p>This property may have been removed or updated.</p>
                <a href="<?= htmlEscape($baseUrl) ?>/" class="btn-details">View current listings</a>
            </section>
        <?php else: ?>
            <nav class="breadcrumb" aria-label="Breadcrumb">
                <a href="<?= htmlEscape($baseUrl) ?>/">Home</a>
                <span>/</span>
                <a href="<?= htmlEscape($baseUrl) ?>/#properties">Properties</a>
                <span>/</span>
                <span><?= htmlEscape($listing['title']) ?></span>
            </nav>

            <section class="listing-hero">
                <div class="listing-copy">
                    <span class="listing-status"><?= htmlEscape(getStatusLabel((string) $listing['status'])) ?></span>
                    <h1><?= htmlEscape($listing['title']) ?></h1>
                    <p class="listing-address"><i class="fa-solid fa-location-dot"></i> <?= htmlEscape($listing['location']) ?></p>
                    <div class="listing-price"><?= htmlEscape($listing['price']) ?></div>
                    <div class="listing-facts">
                        <span><i class="fa-solid fa-bed"></i> <?= (int) $listing['bedrooms'] ?> Bed</span>
                        <span><i class="fa-solid fa-bath"></i> <?= (int) $listing['bathrooms'] ?> Bath</span>
                        <span><i class="fa-solid fa-ruler-combined"></i> <?= htmlEscape(formatListingSize($listing['size'])) ?></span>
                        <span><i class="fa-solid fa-building"></i> <?= htmlEscape($listing['type']) ?></span>
                    </div>
                    <p><?= htmlEscape($pageDescription) ?></p>
                    <a href="<?= htmlEscape(buildWhatsAppUrl((string) $listing['title'])) ?>" target="_blank" rel="noopener" class="btn-contact"><i class="fa-brands fa-whatsapp"></i> Ask About This Unit</a>
                </div>
                <img src="<?= htmlEscape($mainImage) ?>" alt="<?= htmlEscape($listing['title'] . ' main photo') ?>">
            </section>

            <section class="listing-section">
                <h2>Photo Gallery</h2>
                <div class="listing-gallery">
                    <?php foreach ($gallery as $index => $image): ?>
                        <?php
                            $photoUrl = getImageUrl($image, true);
                            $photoAlt = $listing['title'] . ' photo ' . ($index + 1);
                        ?>
                        <button class="gallery-photo" type="button" data-gallery-index="<?= $index ?>" data-gallery-src="<?= htmlEscape($photoUrl) ?>" data-gallery-alt="<?= htmlEscape($photoAlt) ?>" aria-label="<?= htmlEscape('Open ' . $photoAlt) ?>">
                            <img src="<?= htmlEscape($photoUrl) ?>" alt="<?= htmlEscape($photoAlt) ?>" loading="lazy">
                        </button>
                    <?php endforeach; ?>
                </div>
            </section>

            <dialog class="gallery-modal" id="galleryModal" aria-label="Photo gallery viewer">
                <button class="gallery-modal-close" type="button" data-gallery-close aria-label="Close photo viewer">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <button class="gallery-modal-nav gallery-modal-prev" type="button" data-gallery-prev aria-label="Previous photo">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <figure class="gallery-modal-frame">
                    <img id="galleryModalImage" src="" alt="">
                    <figcaption id="galleryModalCaption"></figcaption>
                </figure>
                <button class="gallery-modal-nav gallery-modal-next" type="button" data-gallery-next aria-label="Next photo">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </dialog>

            <section class="listing-section listing-agent">
                <div>
                    <h2>Contact <?= htmlEscape(SITE_AGENT_NAME) ?></h2>
                    <p><?= htmlEscape(SITE_AGENT_NAME) ?> (<?= htmlEscape(SITE_AGENT_REN) ?>) | SF Realty <?= htmlEscape(SITE_AGENCY_CODE) ?> | Registered with LPPEH Malaysia</p>
                </div>
                <a href="<?= htmlEscape(buildWhatsAppUrl((string) $listing['title'])) ?>" target="_blank" rel="noopener" class="btn-whatsapp-unit"><i class="fa-brands fa-whatsapp"></i> WhatsApp Inquiry</a>
            </section>
        <?php endif; ?>
    </main>

    <footer>
        <div class="footer-logo">SF <span>Realty</span></div>
        <p class="footer-text">&copy; 2026 Syed Ahmad - SF Realty. All Rights Reserved.</p>
        <p class="footer-text footer-registration">Syed Ahmad (REN 64218) | SF Realty E(1)1987 | Registered with LPPEH Malaysia</p>
    </footer>
    <script>
        (() => {
            const modal = document.getElementById('galleryModal');

            if (!modal) {
                return;
            }

            const photos = Array.from(document.querySelectorAll('.gallery-photo'));
            const modalImage = document.getElementById('galleryModalImage');
            const modalCaption = document.getElementById('galleryModalCaption');
            const closeButton = modal.querySelector('[data-gallery-close]');
            const prevButton = modal.querySelector('[data-gallery-prev]');
            const nextButton = modal.querySelector('[data-gallery-next]');
            let activeIndex = 0;

            const showPhoto = (index) => {
                activeIndex = (index + photos.length) % photos.length;
                const photo = photos[activeIndex];

                modalImage.src = photo.dataset.gallerySrc;
                modalImage.alt = photo.dataset.galleryAlt;
                modalCaption.textContent = `${photo.dataset.galleryAlt} (${activeIndex + 1} of ${photos.length})`;
            };

            const openModal = (index) => {
                showPhoto(index);
                modal.showModal();
            };

            photos.forEach((photo, index) => {
                photo.addEventListener('click', () => openModal(index));
            });

            closeButton.addEventListener('click', () => modal.close());
            prevButton.addEventListener('click', () => showPhoto(activeIndex - 1));
            nextButton.addEventListener('click', () => showPhoto(activeIndex + 1));

            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.close();
                }
            });

            modal.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowLeft') {
                    showPhoto(activeIndex - 1);
                }

                if (event.key === 'ArrowRight') {
                    showPhoto(activeIndex + 1);
                }
            });

            modal.addEventListener('close', () => {
                modalImage.removeAttribute('src');
            });
        })();
    </script>
</body>
</html>
