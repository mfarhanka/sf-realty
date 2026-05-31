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

function requireListingPayload(array $payload): array
{
    $requiredFields = ['title', 'location', 'status', 'type', 'price', 'size', 'bedrooms', 'bathrooms', 'image'];

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
        'image_url' => trim((string) $payload['image']),
    ];
}

function fetchAllListings(PDO $connection): array
{
    $statement = $connection->query(
        'SELECT id, title, location, status, type, price, size, bedrooms, bathrooms, image_url AS image FROM listings ORDER BY id DESC'
    );

    return $statement->fetchAll();
}

function fetchListingById(PDO $connection, int $listingId): ?array
{
    $statement = $connection->prepare(
        'SELECT id, title, location, status, type, price, size, bedrooms, bathrooms, image_url AS image FROM listings WHERE id = :id'
    );
    $statement->execute(['id' => $listingId]);

    $listing = $statement->fetch();
    return $listing === false ? null : $listing;
}