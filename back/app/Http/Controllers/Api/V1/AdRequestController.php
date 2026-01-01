<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AdRequest;
use App\Models\PaymentTransaction;
use App\Services\ChapaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdRequestController extends Controller
{
    // Get all ad requests (for super admin)
    public function index(Request $request)
    {
        $user = $request->user();
        
        if (!$user->hasRole('super_admin')) {
            abort(403, 'Only super admins can view all ad requests.');
        }

        $status = $request->query('status');
        $query = AdRequest::with(['sponsor:id,name,email', 'reviewer:id,name,email']);

        if ($status) {
            $query->where('status', $status);
        }

        $adRequests = $query->orderByDesc('created_at')->paginate(20);

        return response()->json($adRequests);
    }

    // Get sponsor's own ad requests
    public function myRequests(Request $request)
    {
        $user = $request->user();
        
        if (!$user->hasRole('sponsor')) {
            abort(403, 'Only sponsors can access this endpoint.');
        }

        $adRequests = AdRequest::where('sponsor_id', $user->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($adRequests);
    }

    // Create new ad request
    public function store(Request $request)
    {
        $user = $request->user();
        
        if (!$user->hasRole('sponsor')) {
            abort(403, 'Only sponsors can create ad requests.');
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'headline' => 'nullable|string|max:255',
            'ad_copy' => 'nullable|string',
            'link_url' => 'nullable|url|max:500',
            'image_url' => 'nullable|url|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $adRequest = AdRequest::create([
            'sponsor_id' => $user->id,
            'title' => $request->title,
            'description' => $request->description,
            'headline' => $request->headline,
            'ad_copy' => $request->ad_copy,
            'link_url' => $request->link_url,
            'image_url' => $request->image_url,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Ad request submitted successfully',
            'ad_request' => $adRequest->load('sponsor:id,name,email')
        ], 201);
    }

    // Show single ad request
    public function show(Request $request, AdRequest $adRequest)
    {
        $user = $request->user();
        
        // Sponsor can only see their own requests
        if ($user->hasRole('sponsor') && $adRequest->sponsor_id !== $user->id) {
            abort(403, 'You can only view your own ad requests.');
        }
        
        // Super admin can see all
        if (!$user->hasRole('super_admin') && !$user->hasRole('sponsor')) {
            abort(403, 'Unauthorized');
        }

        $adRequest->load(['sponsor:id,name,email', 'reviewer:id,name,email']);

        return response()->json($adRequest);
    }

    // Approve or reject ad request (super admin only)
    public function update(Request $request, AdRequest $adRequest)
    {
        $user = $request->user();
        
        if (!$user->hasRole('super_admin')) {
            abort(403, 'Only super admins can review ad requests.');
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:approved,rejected',
            'amount' => 'required_if:status,approved|numeric|min:0',
            'admin_response' => 'nullable|string',
            'ad_post_end_date' => 'nullable|date|after:now',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $adRequest->update([
            'status' => $request->status,
            'amount' => $request->status === 'approved' ? $request->amount : null,
            'admin_response' => $request->admin_response,
            'reviewed_by' => $user->id,
            'reviewed_at' => now(),
            'ad_post_end_date' => $request->ad_post_end_date ?? null,
        ]);

        return response()->json([
            'message' => $request->status === 'approved' 
                ? 'Ad request approved successfully' 
                : 'Ad request rejected',
            'ad_request' => $adRequest->load(['sponsor:id,name,email', 'reviewer:id,name,email'])
        ]);
    }

    // Initialize Chapa payment for ad request
    public function initializePayment(Request $request, AdRequest $adRequest)
    {
        $user = $request->user();
        
        // Check if user is the sponsor or super admin
        if ($adRequest->sponsor_id !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'You can only pay for your own ad requests.');
        }

        // Check if ad is approved
        if ($adRequest->status !== 'approved') {
            abort(422, 'Only approved ad requests can be paid.');
        }

        // Check if already paid
        if ($adRequest->payment_status === 'paid') {
            abort(422, 'This ad request has already been paid.');
        }

        if (!$adRequest->amount || $adRequest->amount <= 0) {
            abort(422, 'Ad request amount is not set or invalid.');
        }

        $chapaService = new ChapaService();
        $txRef = $chapaService->generateTxRef($adRequest->id);

        // Create payment transaction record
        $transaction = PaymentTransaction::create([
            'ad_request_id' => $adRequest->id,
            'tx_ref' => $txRef,
            'amount' => $adRequest->amount,
            'currency' => 'ETB',
            'status' => 'pending',
        ]);

        // Get sponsor details
        $sponsor = $adRequest->sponsor;

        // Initialize payment with Chapa
        $paymentData = [
            'amount' => $adRequest->amount,
            'currency' => 'ETB',
            'email' => $sponsor->email,
            'first_name' => explode(' ', $sponsor->name)[0] ?? '',
            'last_name' => explode(' ', $sponsor->name)[1] ?? '',
            'tx_ref' => $txRef,
            'callback_url' => route('api.v1.payments.callback'),
            'return_url' => $request->get('return_url', config('app.frontend_url') . '/sponsor/ads?payment=success'),
            'meta' => [
                'ad_request_id' => $adRequest->id,
                'transaction_id' => $transaction->id,
            ],
        ];

        $result = $chapaService->initializeTransaction($paymentData);

        if (!$result['success']) {
            $transaction->update(['status' => 'failed']);
            return response()->json([
                'message' => $result['message'] ?? 'Failed to initialize payment',
                'error' => $result['data'] ?? null,
            ], 400);
        }

        // Extract checkout URL from Chapa response (handle different response structures)
        $checkoutUrl = null;
        $chapaTransactionId = null;
        
        if (isset($result['data']['data']['checkout_url'])) {
            $checkoutUrl = $result['data']['data']['checkout_url'];
            $chapaTransactionId = $result['data']['data']['id'] ?? null;
        } elseif (isset($result['data']['checkout_url'])) {
            $checkoutUrl = $result['data']['checkout_url'];
            $chapaTransactionId = $result['data']['id'] ?? null;
        }
        
        // Update transaction with Chapa response
        $transaction->update([
            'chapa_response' => $result['data'],
            'chapa_transaction_id' => $chapaTransactionId,
        ]);

        return response()->json([
            'message' => 'Payment initialized successfully',
            'checkout_url' => $checkoutUrl,
            'transaction' => $transaction,
        ]);
    }

    // Chapa payment callback (webhook)
    public function paymentCallback(Request $request)
    {
        $txRef = $request->input('tx_ref');
        
        if (!$txRef) {
            \Log::warning('Chapa callback received without tx_ref', $request->all());
            return response()->json(['message' => 'Invalid callback'], 400);
        }

        $transaction = PaymentTransaction::where('tx_ref', $txRef)->first();

        if (!$transaction) {
            \Log::warning('Chapa callback received for unknown transaction', ['tx_ref' => $txRef]);
            return response()->json(['message' => 'Transaction not found'], 404);
        }

        // Verify payment with Chapa
        $chapaService = new ChapaService();
        $verification = $chapaService->verifyTransaction($txRef);

        if ($verification['success'] && isset($verification['data']['status'])) {
            $status = $verification['data']['status'];
            
            if ($status === 'success') {
                $transaction->update([
                    'status' => 'success',
                    'chapa_response' => $verification['data'],
                    'paid_at' => now(),
                ]);

                // Update ad request
                $adRequest = $transaction->adRequest;
                $adRequest->update([
                    'payment_status' => 'paid',
                    'is_posted' => true,
                ]);

                \Log::info('Payment successful', [
                    'tx_ref' => $txRef,
                    'ad_request_id' => $adRequest->id,
                ]);
            } else {
                $transaction->update([
                    'status' => 'failed',
                    'chapa_response' => $verification['data'],
                ]);
            }
        } else {
            \Log::error('Payment verification failed', [
                'tx_ref' => $txRef,
                'verification' => $verification,
            ]);
        }

        return response()->json(['message' => 'Callback processed']);
    }

    // Verify payment status
    public function verifyPayment(Request $request, AdRequest $adRequest)
    {
        $transaction = PaymentTransaction::where('ad_request_id', $adRequest->id)
            ->where('status', 'pending')
            ->latest()
            ->first();

        if (!$transaction) {
            return response()->json([
                'status' => 'not_found',
                'message' => 'No pending payment found',
            ]);
        }

        $chapaService = new ChapaService();
        $verification = $chapaService->verifyTransaction($transaction->tx_ref);

        if ($verification['success'] && isset($verification['data']['status'])) {
            $status = $verification['data']['status'];
            
            if ($status === 'success') {
                $transaction->update([
                    'status' => 'success',
                    'chapa_response' => $verification['data'],
                    'paid_at' => now(),
                ]);

                $adRequest->update([
                    'payment_status' => 'paid',
                    'is_posted' => true,
                ]);
            }
        }

        return response()->json([
            'status' => $transaction->fresh()->status,
            'payment_status' => $adRequest->fresh()->payment_status,
            'transaction' => $transaction->fresh(),
        ]);
    }

    // Get posted ads for home page (public endpoint, no auth required)
    public function getPostedAds(Request $request)
    {
        try {
            $ads = AdRequest::where('is_posted', true)
                ->where('status', 'approved')
                ->where(function ($query) {
                    // Show ads that haven't expired (either no end date or end date is in the future)
                    $query->whereNull('ad_post_end_date')
                          ->orWhere('ad_post_end_date', '>', now());
                })
                ->with(['sponsor:id,name,email'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($ads);
        } catch (\Exception $e) {
            \Log::error('Error fetching posted ads: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching posted ads',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Delete ad request
    public function destroy(Request $request, AdRequest $adRequest)
    {
        $user = $request->user();
        
        // Sponsor can only delete their own pending requests
        if ($user->hasRole('sponsor')) {
            if ($adRequest->sponsor_id !== $user->id) {
                abort(403, 'You can only delete your own ad requests.');
            }
            if ($adRequest->status !== 'pending') {
                abort(422, 'You can only delete pending ad requests.');
            }
        } elseif (!$user->hasRole('super_admin')) {
            abort(403, 'Unauthorized');
        }

        $adRequest->delete();

        return response()->json([
            'message' => 'Ad request deleted successfully'
        ]);
    }
}
