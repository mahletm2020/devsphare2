<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChapaService
{
    private $secretKey;
    private $publicKey;
    private $baseUrl;

    public function __construct()
    {
        $this->secretKey = config('services.chapa.secret_key');
        $this->publicKey = config('services.chapa.public_key');
        $this->baseUrl = config('services.chapa.base_url', 'https://api.chapa.co/v1');
    }

    /**
     * Initialize a payment transaction
     *
     * @param array $data Payment data
     * @return array
     */
    public function initializeTransaction(array $data)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/transaction/initialize', [
                'amount' => $data['amount'],
                'currency' => $data['currency'] ?? 'ETB',
                'email' => $data['email'],
                'first_name' => $data['first_name'] ?? '',
                'last_name' => $data['last_name'] ?? '',
                'phone_number' => $data['phone_number'] ?? '',
                'tx_ref' => $data['tx_ref'], // Unique transaction reference
                'callback_url' => $data['callback_url'],
                'return_url' => $data['return_url'] ?? null,
                'meta' => $data['meta'] ?? [],
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            Log::error('Chapa payment initialization failed', [
                'response' => $response->json(),
                'status' => $response->status(),
            ]);

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Payment initialization failed',
                'data' => $response->json(),
            ];
        } catch (\Exception $e) {
            Log::error('Chapa payment initialization exception', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Payment service error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Verify a payment transaction
     *
     * @param string $txRef Transaction reference
     * @return array
     */
    public function verifyTransaction(string $txRef)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Content-Type' => 'application/json',
            ])->get($this->baseUrl . '/transaction/verify/' . $txRef);

            if ($response->successful()) {
                $data = $response->json();
                
                return [
                    'success' => true,
                    'data' => $data,
                    'status' => $data['status'] ?? null,
                ];
            }

            Log::error('Chapa payment verification failed', [
                'tx_ref' => $txRef,
                'response' => $response->json(),
                'status' => $response->status(),
            ]);

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Payment verification failed',
                'data' => $response->json(),
            ];
        } catch (\Exception $e) {
            Log::error('Chapa payment verification exception', [
                'tx_ref' => $txRef,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Payment verification error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Generate unique transaction reference
     *
     * @param int $adRequestId
     * @return string
     */
    public function generateTxRef(int $adRequestId): string
    {
        return 'AD-' . $adRequestId . '-' . time() . '-' . uniqid();
    }
}

