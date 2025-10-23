# AdVenue Mock Backend Server

This is a lightweight Express.js server that provides a REST API for testing the AdVenue platform across multiple devices.

## Purpose

By default, AdVenue uses `localStorage` for data persistence. This works great for single-device testing, but makes it impossible to test the TV screen display on one device (e.g., a real TV) while managing campaigns from another device (e.g., your laptop).

This mock backend server solves that problem by:
- Providing a centralized API for data storage
- Enabling communication between multiple devices
- Supporting ngrok for testing across different networks

## Quick Start

```bash
# Install dependencies (first time only)
npm install

# Start the server
npm start

# For auto-reload during development
npm run dev
```

The server runs on **http://localhost:3001**

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Pairing
- `POST /api/pairing/request` - Create pairing request
- `GET /api/pairing/request/:screenId` - Get pairing request
- `POST /api/pairing/validate` - Validate and pair screen
- `GET /api/pairing/status/:screenId` - Check pairing status
- `POST /api/pairing/validate-token` - Validate session token
- `GET /api/pairing/owner/:ownerId` - Get owner's screens
- `DELETE /api/pairing/:screenId` - Unpair screen

### Campaigns
- `GET /api/campaigns` - Get all campaigns
- `GET /api/campaigns/:campaignId` - Get campaign by ID
- `GET /api/campaigns/advertiser/:advertiserId` - Get advertiser campaigns
- `GET /api/campaigns/status/active` - Get active campaigns
- `POST /api/campaigns` - Create campaign
- `PUT /api/campaigns/:campaignId` - Update campaign
- `DELETE /api/campaigns/:campaignId` - Delete campaign

### Media
- `POST /api/campaigns/:campaignId/media` - Add media to campaign
- `DELETE /api/campaigns/:campaignId/media/:mediaId` - Remove media
- `POST /api/media` - Store media file (base64)
- `GET /api/media/:mediaId` - Get media file
- `DELETE /api/media/:mediaId` - Delete media file

### Screen Settings
- `GET /api/screens/:screenId/settings` - Get screen settings
- `PUT /api/screens/:screenId/settings` - Update screen settings
- `GET /api/screens/:screenId/media` - Get media to display on screen

### Analytics
- `POST /api/analytics/impressions` - Track impression start
- `PUT /api/analytics/impressions/:impressionId` - Update impression (end)
- `GET /api/analytics/campaigns/:campaignId/impressions` - Get campaign impressions
- `GET /api/analytics/screens/:screenId/impressions` - Get screen impressions
- `POST /api/analytics/qr-scans` - Track QR code scan
- `GET /api/analytics/campaigns/:campaignId/qr-scans` - Get campaign QR scans
- `GET /api/analytics/screens/:screenId/qr-scans` - Get screen QR scans
- `GET /api/analytics/campaigns/:campaignId` - Get campaign analytics

### Users & Venues (Simplified)
- `GET /api/users` - Get all users
- `GET /api/users/:userId` - Get user by ID
- `POST /api/users` - Create/update user
- `GET /api/venues` - Get all venues
- `GET /api/venues/:venueId` - Get venue by ID
- `POST /api/venues` - Create/update venue

## Data Storage

All data is stored **in-memory** using JavaScript Maps and Arrays. This means:

✅ **Pros:**
- Fast and simple
- No database setup required
- Perfect for testing and development

❌ **Cons:**
- Data is lost when server restarts
- Not suitable for production
- Memory usage grows with data

## Configuration

The server can be configured via environment variables:

```bash
PORT=3001  # Server port (default: 3001)
```

## Using with ngrok

To test across different networks:

1. Start the server:
   ```bash
   npm start
   ```

2. In another terminal, start ngrok:
   ```bash
   ngrok http 3001
   ```

3. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)

4. Update your frontend `.env.ngrok`:
   ```env
   VITE_USE_BACKEND=true
   VITE_API_URL=https://abc123.ngrok.io
   ```

5. Start the frontend in ngrok mode:
   ```bash
   npm run dev:ngrok
   ```

See [../QUICK_START_NGROK.md](../QUICK_START_NGROK.md) for detailed instructions.

## CORS

The server has CORS enabled for all origins to facilitate testing. In production, you should restrict this to specific domains.

## Development

The server uses ES modules (`"type": "module"` in package.json).

To modify the server:
1. Edit `index.js`
2. Restart the server (or use `npm run dev` for auto-reload)

## Architecture

```
Frontend (React/Vite)
    ↓
API Client (src/lib/api/*)
    ↓
Express Server (this server)
    ↓
In-Memory Storage (Maps/Arrays)
```

## Limitations

This is a **mock backend** for testing purposes only. For production use, you would need:

- Database persistence (PostgreSQL, MongoDB, etc.)
- File storage (S3, Cloudinary, etc.)
- Authentication and authorization
- Input validation and sanitization
- Rate limiting
- Proper error handling
- Logging
- Security headers
- Environment-based configuration
- API documentation (Swagger/OpenAPI)
- Unit and integration tests

## Troubleshooting

### Server won't start
- Check if port 3001 is already in use
- Try a different port: `PORT=3002 npm start`

### CORS errors
- Verify the server is running
- Check the API URL in frontend .env file
- Clear browser cache

### Data disappears
- This is expected - data is in memory
- Restart the server and re-create test data
- For persistent testing, consider adding file-based storage

## License

Same as parent project.
