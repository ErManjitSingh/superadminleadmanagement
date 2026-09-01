<?php
/**
 * Himachal Cab quote form → Explore My Bharat CRM
 *
 * Upload this file as: https://himachalcabservice.in/cab/form.php
 * (replaces the current form.php that the quote forms already post to)
 *
 * SETUP:
 * 1. Run on CRM server: node src/scripts/enableWebsiteLeadIngest.js --domain=crm.exploremybharat.info
 * 2. Paste the printed X-Lead-Key below into CRM_LEAD_API_KEY
 * 3. Upload this file to the /cab/ folder on the website host
 */

declare(strict_types=1);

// ——— CONFIG (edit these) ———
const CRM_LEAD_API_URL = 'https://crm.exploremybharat.info/api/public/leads';
const CRM_LEAD_API_KEY = '4bd8f5b83382a48286e1f006fbf7fa131098ba240e748acc';
const REDIRECT_OK = 'index.html?quote=sent#contact-form';
const REDIRECT_ERR = 'index.html?quote=error#contact-form';
// ————————————————

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.html');
    exit;
}

$name = trim((string)($_POST['name'] ?? ''));
$phone = trim((string)($_POST['no'] ?? $_POST['phone'] ?? ''));
$destination = trim((string)($_POST['destination'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$message = trim((string)($_POST['message'] ?? ''));
$package = trim((string)($_POST['package'] ?? $_POST['packageName'] ?? ''));

if ($name === '' || $phone === '') {
    header('Location: ' . REDIRECT_ERR);
    exit;
}

$payload = [
    'name' => $name,
    'phone' => $phone,
    'destination' => $destination !== '' ? $destination : 'Himachal Cab Enquiry',
    'email' => $email,
    'message' => $message,
    'packageName' => $package,
    'sourcePage' => 'https://himachalcabservice.in/cab/',
    'sourceLabel' => 'Himachal Cab Website',
];

$ch = curl_init(CRM_LEAD_API_URL);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: application/json',
        'X-Lead-Key: ' . CRM_LEAD_API_KEY,
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 20,
]);

$response = curl_exec($ch);
$status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

$ok = !$curlErr && $status >= 200 && $status < 300;

// Optional: log failures locally without exposing details to the visitor
if (!$ok) {
    @file_put_contents(
        __DIR__ . '/lead-form-errors.log',
        date('c') . " status={$status} err={$curlErr} body={$response}\n",
        FILE_APPEND
    );
}

header('Location: ' . ($ok ? REDIRECT_OK : REDIRECT_ERR));
exit;
