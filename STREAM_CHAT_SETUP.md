# Stream Chat Integration Setup

Stream Chat has been integrated into the application for real-time messaging. Follow these steps to complete the setup:

## 1. Get Stream Chat API Credentials

1. Sign up for a Stream account at https://getstream.io
2. Create a new app in the Stream Dashboard
3. Go to your app settings and copy:
   - **API Key** (public key)
   - **API Secret** (private key)
   - **App ID** (usually shown in the dashboard)

## 2. Configure Environment Variables

Add the following to your `.env` file in the `back` directory:

```env
# Stream Chat
STREAM_API_KEY=your_api_key_here
STREAM_API_SECRET=your_api_secret_here
STREAM_APP_ID=your_app_id_here
```

## 3. How It Works

### Chat Types:

1. **Direct Messages (1-on-1)**:
   - Between sponsor and organizer
   - Between team members
   - Between any two users

2. **Team Channels (Group Chat)**:
   - Team members can chat together
   - All team members are automatically added

3. **Hackathon Channels**:
   - Group chat for hackathon participants
   - Can include organizers, sponsors, and participants

### API Endpoints:

- `GET /api/v1/chat/token` - Get Stream Chat token for authenticated user
- `GET /api/v1/chat/channel/direct/{userId}` - Get/create direct message channel
- `GET /api/v1/chat/channel/team/{teamId}` - Get/create team channel
- `GET /api/v1/chat/channel/hackathon/{hackathonId}` - Get/create hackathon channel

### Frontend Components:

- `StreamChatWrapper` - Main wrapper component that initializes Stream Chat
- Used in sponsor-organizer chat, team chat, and other chat interfaces

## 4. Integration Points

### Sponsor-Organizer Chat:
- Located in `SponsorTab.jsx` and `SponsorDetailsModal.jsx`
- Allows sponsors to chat with hackathon organizers

### Team Chat:
- Located in team detail pages
- Team members can communicate in real-time

### Direct Messages:
- Can be initiated from user profiles
- Used for private conversations

## 5. Testing

After setup:

1. Log in as a user
2. Navigate to a chat interface (sponsor tab, team page, etc.)
3. The chat should initialize and connect to Stream
4. Messages should appear in real-time

## Troubleshooting

### Chat not loading:
- Verify API credentials are correct
- Check browser console for errors
- Ensure user is authenticated
- Verify Stream Chat service is running

### Messages not sending:
- Check Stream Chat dashboard for errors
- Verify token generation is working
- Check network connectivity

### Users not appearing:
- Ensure users are synced to Stream (happens automatically on token generation)
- Check user IDs match between your app and Stream

## Stream Chat Documentation

- Stream Chat React SDK: https://getstream.io/chat/docs/react/
- Stream Chat API: https://getstream.io/chat/docs/
- Stream Dashboard: https://dashboard.getstream.io/

## Notes

- Stream Chat automatically handles user sync when generating tokens
- Channels are created on-demand when accessed
- Message history is stored by Stream Chat
- Real-time updates are handled automatically by the SDK


