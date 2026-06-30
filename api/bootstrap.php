<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function getDatabaseConnection(): PDO
{
    static $connection = null;

    if ($connection instanceof PDO) {
        return $connection;
    }

    $dsn = 'mysql:host=127.0.0.1;dbname=dzvisual_sfrealty;charset=utf8mb4';
    $username = 'root';
    $password = '';

    $connection = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    return $connection;
}

function sendJson(mixed $data, int $statusCode = 200): never
{
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function readJsonBody(): array
{
    $rawBody = file_get_contents('php://input');

    if ($rawBody === false || $rawBody === '') {
        return [];
    }

    $decoded = json_decode($rawBody, true);

    if (!is_array($decoded)) {
        sendJson(['error' => 'Invalid JSON payload.'], 400);
    }

    return $decoded;
}

function readListingRequestPayload(): array
{
    if (str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data')) {
        return $_POST;
    }

    return readJsonBody();
}

function slugifyListingText(string $text): string
{
    $slug = strtolower(trim($text));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    $slug = trim($slug, '-');

    return $slug !== '' ? $slug : 'property';
}

function getListingImageFolder(int $listingId, string $title): array
{
    $folderName = $listingId . '-' . slugifyListingText($title);
    $relativePath = 'assets/images/listings/' . $folderName;
    $absolutePath = dirname(__DIR__) . '/' . $relativePath;

    return [$absolutePath, $relativePath];
}

function getUploadedPhotoList(): array
{
    if (!isset($_FILES['photos']) || !is_array($_FILES['photos']['name'])) {
        return [];
    }

    $photos = [];
    $count = count($_FILES['photos']['name']);

    for ($index = 0; $index < $count; $index++) {
        if (($_FILES['photos']['error'][$index] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            continue;
        }

        $photos[] = [
            'name' => (string) $_FILES['photos']['name'][$index],
            'tmp_name' => (string) $_FILES['photos']['tmp_name'][$index],
            'error' => (int) $_FILES['photos']['error'][$index],
        ];
    }

    return $photos;
}

function sanitizeUploadedFileName(string $fileName, int $index): string
{
    $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

    if (!in_array($extension, $allowedExtensions, true)) {
        sendJson(['error' => 'Only JPG, PNG, and WebP images are allowed.'], 422);
    }

    $baseName = pathinfo($fileName, PATHINFO_FILENAME);
    $baseName = slugifyListingText($baseName);

    return sprintf('%02d-%s.%s', $index + 1, $baseName, $extension);
}

function saveUploadedListingPhotos(int $listingId, string $title): array
{
    $photos = getUploadedPhotoList();

    if ($photos === []) {
        return [];
    }

    [$absoluteFolder, $relativeFolder] = getListingImageFolder($listingId, $title);

    if (!is_dir($absoluteFolder) && !mkdir($absoluteFolder, 0775, true)) {
        sendJson(['error' => 'Unable to create listing image folder.'], 500);
    }

    $savedPaths = [];

    foreach ($photos as $index => $photo) {
        if ($photo['error'] !== UPLOAD_ERR_OK) {
            sendJson(['error' => 'One or more photos failed to upload.'], 422);
        }

        $fileName = sanitizeUploadedFileName($photo['name'], $index);
        $destination = $absoluteFolder . '/' . $fileName;

        if (!move_uploaded_file($photo['tmp_name'], $destination)) {
            sendJson(['error' => 'Unable to save uploaded photo.'], 500);
        }

        $savedPaths[] = $relativeFolder . '/' . $fileName;
    }

    return $savedPaths;
}

function getPayloadStringList(mixed $value): array
{
    if (!is_array($value)) {
        return $value === null || $value === '' ? [] : [trim((string) $value)];
    }

    return array_values(array_filter(
        array_map(static fn (mixed $item): string => trim((string) $item), $value),
        static fn (string $item): bool => $item !== ''
    ));
}

function deleteListingPhotoFiles(array $photoPaths): void
{
    $imageRoot = realpath(dirname(__DIR__) . '/assets/images/listings');

    if ($imageRoot === false) {
        return;
    }

    foreach ($photoPaths as $photoPath) {
        if (!str_starts_with($photoPath, 'assets/images/listings/')) {
            continue;
        }

        $absolutePath = realpath(dirname(__DIR__) . '/' . $photoPath);

        if ($absolutePath === false || !is_file($absolutePath)) {
            continue;
        }

        if ($absolutePath === $imageRoot || !str_starts_with($absolutePath, $imageRoot . DIRECTORY_SEPARATOR)) {
            continue;
        }

        unlink($absolutePath);
    }
}

function deleteEmptyListingPhotoFolders(array $photoPaths): void
{
    $imageRoot = realpath(dirname(__DIR__) . '/assets/images/listings');

    if ($imageRoot === false) {
        return;
    }

    $directories = [];

    foreach ($photoPaths as $photoPath) {
        if (!str_starts_with($photoPath, 'assets/images/listings/')) {
            continue;
        }

        $absoluteDirectory = realpath(dirname(__DIR__) . '/' . dirname($photoPath));

        if ($absoluteDirectory === false || !is_dir($absoluteDirectory)) {
            continue;
        }

        if ($absoluteDirectory === $imageRoot || !str_starts_with($absoluteDirectory, $imageRoot . DIRECTORY_SEPARATOR)) {
            continue;
        }

        $directories[$absoluteDirectory] = strlen($absoluteDirectory);
    }

    arsort($directories);

    foreach (array_keys($directories) as $directory) {
        $contents = scandir($directory);

        if ($contents !== false && array_diff($contents, ['.', '..']) === []) {
            rmdir($directory);
        }
    }
}

function getListingGalleryForImage(string $image): array
{
    if (!str_starts_with($image, 'assets/images/listings/')) {
        return $image === '' ? [] : [$image];
    }

    $directory = dirname(__DIR__) . '/' . dirname($image);

    $files = glob($directory . '/*.{jpg,jpeg,png,webp}', GLOB_BRACE);

    if ($files === false || $files === []) {
        return $image === '' ? [] : [$image];
    }

    $webDirectory = dirname($image);

    return array_map(
        static fn (string $file): string => str_replace('\\', '/', $webDirectory . '/' . basename($file)),
        $files
    );
}

function requireListingPayload(array $payload): array
{
    $requiredFields = ['title', 'location', 'status', 'type', 'price', 'size', 'bedrooms', 'bathrooms'];

    foreach ($requiredFields as $field) {
        if (!array_key_exists($field, $payload)) {
            sendJson(['error' => "Missing required field: {$field}."], 422);
        }
    }

    $status = (string) $payload['status'];
    if (!in_array($status, ['sale', 'rent', 'launch'], true)) {
        sendJson(['error' => 'Invalid status value.'], 422);
    }

    return [
        'title' => trim((string) $payload['title']),
        'location' => trim((string) $payload['location']),
        'status' => $status,
        'type' => trim((string) $payload['type']),
        'price' => trim((string) $payload['price']),
        'size' => (int) $payload['size'],
        'bedrooms' => (int) $payload['bedrooms'],
        'bathrooms' => (int) $payload['bathrooms'],
        'image_url' => trim((string) ($payload['image'] ?? '')),
    ];
}

function fetchAllListings(PDO $connection): array
{
    $statement = $connection->query(
        'SELECT id, title, location, status, type, price, size, bedrooms, bathrooms, image_url AS image FROM listings ORDER BY id DESC'
    );

    $listings = $statement->fetchAll();

    return array_map('attachListingGallery', $listings);
}

function fetchListingById(PDO $connection, int $listingId): ?array
{
    $statement = $connection->prepare(
        'SELECT id, title, location, status, type, price, size, bedrooms, bathrooms, image_url AS image FROM listings WHERE id = :id'
    );
    $statement->execute(['id' => $listingId]);

    $listing = $statement->fetch();
    return $listing === false ? null : attachListingGallery($listing);
}

function attachListingGallery(array $listing): array
{
    $listing['gallery'] = getListingGalleryForImage((string) ($listing['image'] ?? ''));

    return $listing;
}
