<?php

declare(strict_types=1);

require __DIR__ . '/includes/site-data.php';

$listings = fetchSiteListings();
$pageTitle = 'Cyberjaya Property Listings for Rent and Sale | Syed Ahmad REN 64218';
$pageDescription = 'Browse Cyberjaya and Malaysia property listings by Syed Ahmad, Registered Real Estate Negotiator REN 64218 with SF Realty E(1)1987.';
$baseUrl = getSiteBaseUrl();
$currentUrl = $baseUrl . '/';
$heroImage = $baseUrl . '/assets/images/listings/17-kanvas-soho-fully-furnished-studio/photo_2026-01-14_18-23-08.jpg';

$itemList = [
    '@context' => 'https://schema.org',
    '@type' => 'ItemList',
    'name' => 'SF Realty featured property listings',
    'itemListElement' => array_map(
        static fn (array $listing, int $index): array => [
            '@type' => 'ListItem',
            'position' => $index + 1,
            'url' => getListingUrl($listing, true),
            'name' => (string) $listing['title'],
        ],
        $listings,
        array_keys($listings)
    ),
];

$agentSchema = [
    '@context' => 'https://schema.org',
    '@type' => 'RealEstateAgent',
    'name' => SITE_AGENT_NAME,
    'identifier' => SITE_AGENT_REN,
    'worksFor' => [
        '@type' => 'RealEstateAgent',
        'name' => SITE_NAME,
        'identifier' => SITE_AGENCY_CODE,
    ],
    'areaServed' => 'Malaysia',
    'telephone' => '+' . SITE_WHATSAPP,
    'url' => $currentUrl,
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlEscape($pageTitle) ?></title>
    <meta name="description" content="<?= htmlEscape($pageDescription) ?>">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="<?= htmlEscape($currentUrl) ?>">
    <meta property="og:type" content="website">
    <meta property="og:title" content="<?= htmlEscape($pageTitle) ?>">
    <meta property="og:description" content="<?= htmlEscape($pageDescription) ?>">
    <meta property="og:url" content="<?= htmlEscape($currentUrl) ?>">
    <meta property="og:image" content="<?= htmlEscape($heroImage) ?>">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?= htmlEscape($pageTitle) ?>">
    <meta name="twitter:description" content="<?= htmlEscape($pageDescription) ?>">
    <meta name="twitter:image" content="<?= htmlEscape($heroImage) ?>">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/base.css">
    <link rel="stylesheet" href="assets/css/site.css">
    <script type="application/ld+json"><?= json_encode($agentSchema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?></script>
    <script type="application/ld+json"><?= json_encode($itemList, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?></script>
</head>
<body>
    <header>
        <nav class="navbar">
            <a class="logo-container" href="<?= htmlEscape($currentUrl) ?>" aria-label="SF Realty home">
                <div class="logo">SF <span>Realty</span></div>
                <div class="ren-tag">Syed Ahmad | REN 64218 | E(1)1987</div>
            </a>
            <ul class="nav-links">
                <li><a href="<?= htmlEscape($currentUrl) ?>">Home</a></li>
                <li><a href="#properties">Properties</a></li>
                <li><a href="#agent">About Syed</a></li>
            </ul>
            <a href="https://wa.me/<?= SITE_WHATSAPP ?>" target="_blank" rel="noopener" class="btn-contact"><i class="fa-brands fa-whatsapp"></i> Contact Syed</a>
        </nav>
    </header>

    <section class="hero">
        <div class="hero-content">
            <h1>Find Your Dream Home With <span>Syed Ahmad</span></h1>
            <div class="hero-ren">Registered Real Estate Negotiator | REN 64218 | SF Realty E(1)1987 | LPPEH Malaysia</div>

            <div class="search-container" role="search">
                <div class="search-box">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="siteSearchInput" placeholder="Search by location, area, or project..." aria-label="Search listings">
                </div>
                <select id="siteTypeFilter" aria-label="Property type">
                    <option value="">Property Type</option>
                    <option value="condo">Condominium</option>
                    <option value="terrace">Terrace House</option>
                    <option value="semi-d">Semi-D</option>
                    <option value="bungalow">Bungalow</option>
                    <option value="studio">Studio</option>
                </select>
                <select id="siteBudgetFilter" aria-label="Maximum budget">
                    <option value="">Max Budget</option>
                    <option value="1500">RM 1,500</option>
                    <option value="300000">RM 300,000</option>
                    <option value="500000">RM 500,000</option>
                    <option value="750000">RM 750,000</option>
                    <option value="1000000">RM 1,000,000</option>
                </select>
                <button class="btn-search" id="siteSearchButton" type="button">Search</button>
            </div>
        </div>
    </section>

    <main class="main-container" id="properties">
        <h2 class="section-title">Featured Listings</h2>
        <div class="property-grid" id="propertyGrid">
            <?php if ($listings === []): ?>
                <p class="empty-state">No listings are available right now.</p>
            <?php else: ?>
                <?php foreach ($listings as $listing): ?>
                    <?= renderPropertyCard($listing) ?>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>

        <section class="agent-panel" id="agent">
            <div>
                <h2>Syed Ahmad, Registered Real Estate Negotiator</h2>
                <p>Malaysia property assistance for rentals, subsale homes, and investment units, backed by SF Realty E(1)1987.</p>
            </div>
            <a href="https://wa.me/<?= SITE_WHATSAPP ?>" target="_blank" rel="noopener" class="btn-contact"><i class="fa-brands fa-whatsapp"></i> WhatsApp Syed</a>
        </section>
    </main>

    <footer>
        <div class="footer-logo">SF <span>Realty</span></div>
        <p class="footer-text">&copy; 2026 Syed Ahmad - SF Realty. All Rights Reserved.</p>
        <p class="footer-text footer-registration">Syed Ahmad (REN 64218) | SF Realty E(1)1987 | Registered with LPPEH Malaysia</p>
    </footer>

    <script src="assets/js/site.js"></script>
</body>
</html>
