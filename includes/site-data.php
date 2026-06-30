<?php

declare(strict_types=1);

const SITE_NAME = 'SF Realty';
const SITE_AGENT_NAME = 'Syed Ahmad';
const SITE_AGENT_REN = 'REN 64218';
const SITE_AGENCY_CODE = 'E(1)1987';
const SITE_WHATSAPP = '60123456789';

function htmlEscape(string|int|float|null $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function getSiteBaseUrl(): string
{
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '/sf-realty/index.php';
    $basePath = rtrim(str_replace('\\', '/', dirname($scriptName)), '/');

    if ($basePath === '' || $basePath === '.') {
        $basePath = '';
    }

    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['SERVER_PORT'] ?? '') === '443');
    $scheme = $isHttps ? 'https' : 'http';

    return $scheme . '://' . $host . $basePath;
}

function getDatabaseConnectionForSite(): PDO
{
    return new PDO(
        'mysql:host=127.0.0.1;dbname=dzvisual_sfrealty;charset=utf8mb4',
        'root',
        '',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
}

function fetchSiteListings(): array
{
    try {
        $connection = getDatabaseConnectionForSite();
        $statement = $connection->query(
            'SELECT id, title, location, status, type, price, size, bedrooms, bathrooms, image_url AS image
             FROM listings
             ORDER BY id DESC'
        );

        return $statement->fetchAll();
    } catch (PDOException) {
        return [];
    }
}

function fetchSiteListingById(int $listingId): ?array
{
    try {
        $connection = getDatabaseConnectionForSite();
        $statement = $connection->prepare(
            'SELECT id, title, location, status, type, price, size, bedrooms, bathrooms, image_url AS image
             FROM listings
             WHERE id = :id'
        );
        $statement->execute(['id' => $listingId]);
        $listing = $statement->fetch();

        return $listing === false ? null : $listing;
    } catch (PDOException) {
        return null;
    }
}

function slugify(string $text): string
{
    $slug = strtolower(trim($text));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    $slug = trim($slug, '-');

    return $slug !== '' ? $slug : 'property';
}

function getListingUrl(array $listing, bool $absolute = false): string
{
    $path = 'listing/' . (int) $listing['id'] . '/' . slugify((string) $listing['title']);
    return $absolute ? getSiteBaseUrl() . '/' . $path : $path;
}

function getImageUrl(string $image, bool $absolute = false): string
{
    if (preg_match('/^https?:\/\//i', $image) === 1) {
        return $image;
    }

    $path = ltrim($image, '/');
    return $absolute ? getSiteBaseUrl() . '/' . $path : $path;
}

function getStatusLabel(string $status): string
{
    return [
        'sale' => 'For Sale',
        'rent' => 'For Rent',
        'launch' => 'New Launch',
    ][$status] ?? 'Available';
}

function buildWhatsAppUrl(string $title): string
{
    return 'https://wa.me/' . SITE_WHATSAPP . '?text=' . rawurlencode('Hi Syed, I am interested in ' . $title . '.');
}

function formatListingSize(int|string $size): string
{
    return number_format((int) $size) . ' sf';
}

function getListingDescription(array $listing): string
{
    return sprintf(
        '%s in %s available at %s. %s with %d bed%s, %d bath%s and %s built-up. Contact %s (%s), %s.',
        (string) $listing['title'],
        (string) $listing['location'],
        (string) $listing['price'],
        (string) $listing['type'],
        (int) $listing['bedrooms'],
        (int) $listing['bedrooms'] === 1 ? '' : 's',
        (int) $listing['bathrooms'],
        (int) $listing['bathrooms'] === 1 ? '' : 's',
        formatListingSize($listing['size']),
        SITE_AGENT_NAME,
        SITE_AGENT_REN,
        SITE_AGENCY_CODE
    );
}

function renderPropertyCard(array $listing): string
{
    $title = (string) $listing['title'];
    $detailsUrl = getListingUrl($listing);
    $image = getImageUrl((string) $listing['image']);

    return '
        <article class="property-card">
            <a class="property-thumb" href="' . htmlEscape($detailsUrl) . '" aria-label="View ' . htmlEscape($title) . ' details">
                <span class="tag-status">' . htmlEscape(getStatusLabel((string) $listing['status'])) . '</span>
                <img src="' . htmlEscape($image) . '" alt="' . htmlEscape($title . ' in ' . $listing['location']) . '" loading="lazy">
            </a>
            <div class="property-details">
                <div class="price">' . htmlEscape($listing['price']) . '</div>
                <h3 class="title"><a href="' . htmlEscape($detailsUrl) . '">' . htmlEscape($title) . '</a></h3>
                <div class="location"><i class="fa-solid fa-location-dot"></i> ' . htmlEscape($listing['location']) . '</div>
                <div class="features">
                    <span><i class="fa-solid fa-bed"></i> ' . (int) $listing['bedrooms'] . ' Beds</span>
                    <span><i class="fa-solid fa-bath"></i> ' . (int) $listing['bathrooms'] . ' Baths</span>
                    <span><i class="fa-solid fa-ruler-combined"></i> ' . htmlEscape(formatListingSize($listing['size'])) . '</span>
                </div>
                <div class="property-actions">
                    <a href="' . htmlEscape($detailsUrl) . '" class="btn-details">Details</a>
                    <a href="' . htmlEscape(buildWhatsAppUrl($title)) . '" target="_blank" rel="noopener" class="btn-whatsapp-unit">
                        <i class="fa-brands fa-whatsapp"></i> WhatsApp
                    </a>
                </div>
            </div>
        </article>
    ';
}

function getLocalListingGallery(array $listing): array
{
    $image = (string) $listing['image'];

    if (!str_contains($image, 'assets/images/listings/')) {
        return [$image];
    }

    $directory = dirname(__DIR__) . '/' . dirname($image);
    $webDirectory = dirname($image);
    $files = glob($directory . '/*.{jpg,jpeg,png,webp}', GLOB_BRACE);

    if ($files === false || $files === []) {
        return [$image];
    }

    return array_map(
        static fn (string $file): string => str_replace('\\', '/', $webDirectory . '/' . basename($file)),
        $files
    );
}
