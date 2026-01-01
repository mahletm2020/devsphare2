#!/usr/bin/env php
<?php

/**
 * Chat Configuration Diagnostic Script
 * 
 * Run this to check if Stream Chat is properly configured:
 * php check_chat_config.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "\n=== Stream Chat Configuration Check ===\n\n";

// Check .env file
$envFile = __DIR__ . '/.env';
echo "1. Checking .env file: " . ($envFile ? "Found" : "NOT FOUND") . "\n";

if (file_exists($envFile)) {
    $envContent = file_get_contents($envFile);
    $hasStreamKey = strpos($envContent, 'STREAM_API_KEY=') !== false;
    $hasStreamSecret = strpos($envContent, 'STREAM_API_SECRET=') !== false;
    $hasStreamAppId = strpos($envContent, 'STREAM_APP_ID=') !== false;
    
    echo "   - STREAM_API_KEY defined: " . ($hasStreamKey ? "YES" : "NO") . "\n";
    echo "   - STREAM_API_SECRET defined: " . ($hasStreamSecret ? "YES" : "NO") . "\n";
    echo "   - STREAM_APP_ID defined: " . ($hasStreamAppId ? "YES" : "NO") . "\n";
    
    // Check if values are set (not empty)
    preg_match('/STREAM_API_KEY=(.+)/', $envContent, $keyMatch);
    preg_match('/STREAM_API_SECRET=(.+)/', $envContent, $secretMatch);
    preg_match('/STREAM_APP_ID=(.+)/', $envContent, $appIdMatch);
    
    $keyValue = isset($keyMatch[1]) ? trim($keyMatch[1]) : '';
    $secretValue = isset($secretMatch[1]) ? trim($secretMatch[1]) : '';
    $appIdValue = isset($appIdMatch[1]) ? trim($appIdMatch[1]) : '';
    
    echo "\n2. Checking .env values:\n";
    echo "   - STREAM_API_KEY value: " . ($keyValue ? "SET (" . substr($keyValue, 0, 10) . "...)" : "EMPTY ❌") . "\n";
    echo "   - STREAM_API_SECRET value: " . ($secretValue ? "SET (" . substr($secretValue, 0, 10) . "...)" : "EMPTY ❌") . "\n";
    echo "   - STREAM_APP_ID value: " . ($appIdValue ? "SET ($appIdValue)" : "EMPTY ❌") . "\n";
}

// Check Laravel config
echo "\n3. Checking Laravel config:\n";
$apiKey = config('services.stream.api_key');
$apiSecret = config('services.stream.api_secret');
$appId = config('services.stream.app_id');

echo "   - config('services.stream.api_key'): " . ($apiKey ? "SET (" . substr($apiKey, 0, 10) . "...)" : "EMPTY/NULL ❌") . "\n";
echo "   - config('services.stream.api_secret'): " . ($apiSecret ? "SET (" . substr($apiSecret, 0, 10) . "...)" : "EMPTY/NULL ❌") . "\n";
echo "   - config('services.stream.app_id'): " . ($appId ? "SET ($appId)" : "EMPTY/NULL ❌") . "\n";

// Summary
echo "\n=== SUMMARY ===\n";
$allSet = $apiKey && $apiSecret && $appId;
if ($allSet) {
    echo "✅ Stream Chat is properly configured!\n";
    echo "\nNext steps:\n";
    echo "1. Test the chat API endpoint: curl -H 'Authorization: Bearer YOUR_TOKEN' http://localhost:8000/api/v1/chat/token\n";
    echo "2. Check browser console for any frontend errors\n";
    echo "3. Verify you're logged in to the application\n";
} else {
    echo "❌ Stream Chat is NOT properly configured!\n\n";
    echo "To fix this:\n";
    echo "1. Open: " . $envFile . "\n";
    echo "2. Find these lines:\n";
    echo "   STREAM_API_KEY=\n";
    echo "   STREAM_API_SECRET=\n";
    echo "   STREAM_APP_ID=\n";
    echo "3. Add your actual Stream Chat credentials:\n";
    echo "   STREAM_API_KEY=your_actual_api_key_here\n";
    echo "   STREAM_API_SECRET=your_actual_api_secret_here\n";
    echo "   STREAM_APP_ID=your_actual_app_id_here\n";
    echo "4. Save the file\n";
    echo "5. Run: php artisan config:clear\n";
    echo "6. Run this script again to verify\n";
    echo "\nGet your credentials from: https://dashboard.getstream.io/\n";
}

echo "\n";




