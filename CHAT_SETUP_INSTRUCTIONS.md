# Chat Setup - Quick Fix Guide

## Problem
Chat is not working and environment variables are showing as `null` in Laravel config.

## Solution Steps

### 1. Add Stream Chat Keys to .env File

Open `/home/ziana/projects/devsphare2/back/.env` and add these lines:

```env
STREAM_API_KEY=your_api_key_here
STREAM_API_SECRET=your_api_secret_here
STREAM_APP_ID=your_app_id_here
```

**Important Notes:**
- Replace `your_api_key_here`, `your_api_secret_here`, and `your_app_id_here` with your actual Stream Chat credentials
- Do NOT add quotes around the values
- Make sure there are NO spaces around the `=` sign
- The .env file should be in the `back` directory (NOT the root directory)

### 2. Clear Laravel Config Cache

After adding the keys, run this command in the `back` directory:

```bash
cd /home/ziana/projects/devsphare2/back
php artisan config:clear
php artisan config:cache
```

Or if you're in development mode, just clear the cache:

```bash
php artisan config:clear
```

### 3. Verify Configuration

Check if the config is reading the values:

```bash
php artisan config:show services.stream
```

You should see the actual values (not `null`).

### 4. Restart Backend Server

If you're running the Laravel server, restart it:

```bash
# Stop the server (Ctrl+C) and start again
php artisan serve
```

Or if using Docker:

```bash
docker-compose restart backend
```

### 5. Check Frontend

- Clear browser cache or do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for any errors
- Check Network tab to see if `/api/v1/chat/token` returns a 200 status (not 503)

## Getting Stream Chat Credentials

If you don't have Stream Chat credentials yet:

1. Go to https://getstream.io and sign up
2. Create a new app in the dashboard
3. Copy the API Key, API Secret, and App ID from the app settings

## Verification Checklist

- [ ] Added `STREAM_API_KEY` to `.env`
- [ ] Added `STREAM_API_SECRET` to `.env`
- [ ] Added `STREAM_APP_ID` to `.env`
- [ ] Ran `php artisan config:clear`
- [ ] Verified config shows values (not null): `php artisan config:show services.stream`
- [ ] Restarted backend server
- [ ] Cleared browser cache
- [ ] Checked browser console for errors

## Common Issues

### Issue: Config still shows null after adding keys
**Solution:** Make sure:
- The .env file is in the `back` directory
- No quotes around values
- No spaces around `=`
- Run `php artisan config:clear`

### Issue: 503 Service Unavailable error
**Solution:** This means the keys are still not configured. Follow all steps above.

### Issue: Chat not showing on Team Detail page
**Solution:** 
- Make sure you're logged in
- Make sure you're a member of the team
- Check browser console for JavaScript errors
- Verify the `/api/v1/chat/token` endpoint returns 200 status

### Issue: CORS errors
**Solution:** Make sure CORS is properly configured in Laravel for your frontend URL.




