# Chapa Payment Integration Setup

Chapa payment gateway is already integrated into the application. Follow these steps to complete the setup:

## 1. Get Chapa API Credentials

1. Sign up for a Chapa account at https://chapa.co
2. Go to your dashboard and navigate to API settings
3. Copy your **Secret Key** and **Public Key**

## 2. Configure Environment Variables

Add the following to your `.env` file in the `back` directory:

```env
# Chapa Payment Gateway
CHAPA_SECRET_KEY=your_secret_key_here
CHAPA_PUBLIC_KEY=your_public_key_here
CHAPA_BASE_URL=https://api.chapa.co/v1
```

**For testing/development, use Chapa's test keys:**
- Test Secret Key: `CHASECK_TEST-...` (starts with CHASECK_TEST)
- Test Public Key: `CHAPUBK_TEST-...` (starts with CHAPUBK_TEST)

## 3. Configure Frontend URL

Make sure your `.env` has the correct frontend URL for payment callbacks:

```env
FRONTEND_URL=http://localhost:5173
# or in production:
# FRONTEND_URL=https://yourdomain.com
```

## 4. How It Works

### Payment Flow:

1. **Sponsor submits ad request** → Admin reviews and approves with an amount
2. **Sponsor clicks "Pay with Chapa"** → System initializes payment with Chapa API
3. **User redirected to Chapa checkout** → User completes payment on Chapa's secure page
4. **Chapa sends callback** → System verifies and updates payment status
5. **User redirected back** → Ad is automatically posted when payment succeeds

### API Endpoints:

- `POST /api/v1/ad-requests/{id}/initialize-payment` - Initialize Chapa payment
- `POST /api/v1/payments/callback` - Chapa webhook callback (handles payment status)
- `GET /api/v1/ad-requests/{id}/verify-payment` - Verify payment status manually

### Database Tables:

- `payment_transactions` - Stores all payment transactions
- `ad_requests` - Has `payment_status` and `is_posted` fields

## 5. Testing

### Test Mode:
- Use Chapa test credentials
- Test transactions won't charge real money
- Test card numbers are available in Chapa dashboard

### Production:
- Switch to live credentials
- Update `CHAPA_BASE_URL` if needed (usually same URL)
- Ensure callback URL is publicly accessible

## 6. Verification

After setup, test the payment flow:

1. Create an ad request as a sponsor
2. Approve it as super admin with an amount
3. Click "Pay with Chapa" button
4. Complete payment on Chapa checkout page
5. Verify payment status updates and ad gets posted

## Troubleshooting

### Payment initialization fails:
- Check API credentials are correct
- Verify network connectivity to Chapa API
- Check Laravel logs: `storage/logs/laravel.log`

### Callback not working:
- Ensure callback URL is publicly accessible
- Check Chapa webhook settings in dashboard
- Verify route is accessible: `/api/v1/payments/callback`

### Payment verified but ad not posted:
- Check database: `payment_transactions` and `ad_requests` tables
- Verify `payment_status` is set to 'paid'
- Check if `is_posted` flag is updated

## Support

For Chapa API issues, refer to:
- Chapa API Documentation: https://developer.chapa.co
- Chapa Support: support@chapa.co


