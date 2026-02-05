# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the AutoSphere application.

## Prerequisites

1. A Google account
2. Access to the Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" and then "New Project"
3. Enter a project name (e.g., "AutoSphere OAuth")
4. Click "Create"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" and click on it
3. Click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type and click "Create"
3. Fill in the required information:
   - App name: AutoSphere
   - User support email: Your email
   - Developer contact information: Your email
4. Click "Save and Continue"
5. Skip the "Scopes" section for now
6. Add test users if needed (for development)
7. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Enter a name (e.g., "AutoSphere Web Client")
5. Add authorized redirect URIs:
   - For development: `http://localhost:5001/api/auth/google/callback`
   - For production: `https://yourdomain.com/api/auth/google/callback`
6. Click "Create"
7. Copy the Client ID and Client Secret

## Step 5: Configure Environment Variables

### Backend (.env file)

Add the following to your `backend/.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback

# Session Configuration
SESSION_SECRET=your-session-secret-key-change-in-production
```

### Frontend (.env file)

Add the following to your `frontend/.env` file:

```env
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:5001
```

## Step 6: Run Database Migration

Run the following command to add the Google OAuth fields to your database:

```bash
cd backend
npm run db:migrate
```

## Step 7: Test the Integration

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to the login page and click "Continue with Google"
4. Complete the Google OAuth flow

## Security Notes

1. **Never commit your Google Client Secret to version control**
2. Use different OAuth credentials for development and production
3. Regularly rotate your client secrets
4. Monitor your OAuth usage in the Google Cloud Console

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**: Make sure the redirect URI in your Google Cloud Console matches exactly with your backend URL
2. **"invalid_client" error**: Check that your Client ID and Client Secret are correct
3. **CORS errors**: Ensure your frontend URL is properly configured in the backend CORS settings

### Debug Mode

To enable debug logging for OAuth, add this to your backend `.env`:

```env
DEBUG=passport:*
```

## Production Deployment

When deploying to production:

1. Update the authorized redirect URIs in Google Cloud Console
2. Update the `GOOGLE_CALLBACK_URL` environment variable
3. Use HTTPS for all OAuth endpoints
4. Set `NODE_ENV=production` in your environment variables