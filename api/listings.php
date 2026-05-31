<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

try {
    $connection = getDatabaseConnection();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $listingId = isset($_GET['id']) ? (int) $_GET['id'] : null;

    if ($method === 'GET') {
        sendJson(['listings' => fetchAllListings($connection)]);
    }

    if ($method === 'POST') {
        $listing = requireListingPayload(readJsonBody());
        $statement = $connection->prepare(
            'INSERT INTO listings (title, location, status, type, price, size, bedrooms, bathrooms, image_url)
             VALUES (:title, :location, :status, :type, :price, :size, :bedrooms, :bathrooms, :image_url)'
        );
        $statement->execute($listing);

        $created = fetchListingById($connection, (int) $connection->lastInsertId());
        sendJson(['listing' => $created], 201);
    }

    if ($listingId === null || $listingId <= 0) {
        sendJson(['error' => 'A valid listing id is required.'], 422);
    }

    if ($method === 'PUT') {
        $existing = fetchListingById($connection, $listingId);

        if ($existing === null) {
            sendJson(['error' => 'Listing not found.'], 404);
        }

        $listing = requireListingPayload(readJsonBody());
        $listing['id'] = $listingId;

        $statement = $connection->prepare(
            'UPDATE listings
             SET title = :title,
                 location = :location,
                 status = :status,
                 type = :type,
                 price = :price,
                 size = :size,
                 bedrooms = :bedrooms,
                 bathrooms = :bathrooms,
                 image_url = :image_url
             WHERE id = :id'
        );
        $statement->execute($listing);

        sendJson(['listing' => fetchListingById($connection, $listingId)]);
    }

    if ($method === 'DELETE') {
        $statement = $connection->prepare('DELETE FROM listings WHERE id = :id');
        $statement->execute(['id' => $listingId]);

        if ($statement->rowCount() === 0) {
            sendJson(['error' => 'Listing not found.'], 404);
        }

        sendJson(['success' => true]);
    }

    sendJson(['error' => 'Method not allowed.'], 405);
} catch (PDOException $exception) {
    sendJson(['error' => 'Database request failed.', 'details' => $exception->getMessage()], 500);
}