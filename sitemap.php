<?php

declare(strict_types=1);

require __DIR__ . '/includes/site-data.php';

header('Content-Type: application/xml; charset=utf-8');

$baseUrl = getSiteBaseUrl();
$listings = fetchSiteListings();

echo '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL;
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc><?= htmlEscape($baseUrl) ?>/</loc>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
<?php foreach ($listings as $listing): ?>
    <url>
        <loc><?= htmlEscape(getListingUrl($listing, true)) ?></loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
<?php endforeach; ?>
</urlset>
