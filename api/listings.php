<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

try {
    $connection = getDatabaseConnection();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $payload = readListingRequestPayload();

    if ($method === 'POST' && strtoupper((string) ($payload['_method'] ?? '')) === 'PUT') {
        $method = 'PUT';
    }

    $listingId = isset($_GET['id']) ? (int) $_GET['id'] : null;

    if ($method === 'GET') {
        sendJson(['listings' => fetchAllListings($connection)]);
    }

    if ($method === 'POST') {
        $listing = requireListingPayload($payload);
        $uploadedPhotoList = getUploadedPhotoList();

        if ($uploadedPhotoList === []) {
            sendJson(['error' => 'Upload at least one listing photo.'], 422);
        }

        $statement = $connection->prepare(
            'INSERT INTO listings (title, location, status, type, price, size, bedrooms, bathrooms, image_url)
             VALUES (:title, :location, :status, :type, :price, :size, :bedrooms, :bathrooms, :image_url)'
        );
        $statement->execute($listing);

        $createdId = (int) $connection->lastInsertId();
        $uploadedPhotos = saveUploadedListingPhotos($createdId, $listing['title']);

        if ($uploadedPhotos !== []) {
            $coverIndex = max(0, (int) ($payload['cover_upload_index'] ?? 0));
            $coverImage = $uploadedPhotos[$coverIndex] ?? $uploadedPhotos[0];
            $coverStatement = $connection->prepare('UPDATE listings SET image_url = :image_url WHERE id = :id');
            $coverStatement->execute(['image_url' => $coverImage, 'id' => $createdId]);
        }

        $created = fetchListingById($connection, $createdId);
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

        $listing = requireListingPayload($payload);
        $uploadedPhotos = saveUploadedListingPhotos($listingId, $listing['title']);
        $selectedCover = trim((string) ($payload['cover_image'] ?? ''));

        if ($selectedCover !== '') {
            $listing['image_url'] = $selectedCover;
        }

        if ($uploadedPhotos !== []) {
            $coverIndex = max(0, (int) ($payload['cover_upload_index'] ?? 0));
            $listing['image_url'] = $uploadedPhotos[$coverIndex] ?? $uploadedPhotos[0];
        }

        if ($listing['image_url'] === '') {
            $listing['image_url'] = (string) $existing['image'];
        }

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
