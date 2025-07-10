# Environment Setup for CCH Axcess OAuth

## Required Environment Variables

Create a `.env.local` file in the `cch` directory with the following variables:

```bash
# CCH Axcess OAuth Configuration
CCH_CLIENT_ID=f97cd42c-a033-8331-2003-d9d2401dc5ec
CCH_APP_SECRET=your_app_secret_here
CCH_ACCOUNT_NUMBER=162065
CCH_REDIRECT_URL=https://your-ngrok-url.ngrok-free.app/api/auth/callback

# ngrok URL for development
NGROK_URL=https://your-ngrok-url.ngrok-free.app

# CCH Axcess API Subscription Key (IntegratorKey) - REQUIRED FOR TAX RETURN EXPORT/IMPORT
CCH_SUBSCRIPTION_KEY=C6A47E0D-C402-4C01-9A70-E5E02591FE18

# CCH Axcess API Credentials for Tax Return Import - REQUIRED FOR V2 TAX RETURN CREATION
CCH_BEARER_TOKEN=your_bearer_token_here
CCH_INTEGRATOR_KEY=C6A47E0D-C402-4C01-9A70-E5E02591FE18

# Formations API Configuration - REQUIRED FOR V2 TAX RETURN CREATION
FORMATIONS_AUTH_TOKEN=your_formations_auth_token_here

# Next.js Configuration
NEXTAUTH_URL=https://your-ngrok-url.ngrok-free.app
NEXTAUTH_SECRET=your_nextauth_secret_here
```

## Important Notes

1. **CCH_SUBSCRIPTION_KEY**: This is the IntegratorKey required for making API calls to the CCH Axcess API. It should be set to: `C6A47E0D-C402-4C01-9A70-E5E02591FE18`

2. **CCH_BEARER_TOKEN**: Required for V2 tax return creation. This is the Bearer token for authenticating with the CCH Axcess ReturnsImportBatch API.

3. **CCH_INTEGRATOR_KEY**: Same as CCH_SUBSCRIPTION_KEY, used for tax return import operations.

4. **FORMATIONS_AUTH_TOKEN**: Required for V2 tax return creation. This token allows fetching account data from the Formations API.

5. **NGROK_URL**: Replace `your-ngrok-url` with your actual ngrok URL (e.g., `https://4d4a42c423a0.ngrok-free.app`)

6. **CCH_REDIRECT_URL**: Must match the redirect URL configured in your CCH Axcess application

## Testing the Tax Return Export

Once the environment variables are set, you can test the tax return export functionality:

1. Log in to the dashboard
2. Navigate to the "Tax Return Export" section
3. The default Return ID is pre-filled: `2024S:KAR1367:V1`
4. The Configuration XML is pre-populated with the required export options
5. Click "Export Tax Return" to test the API call

The system will automatically handle token refresh if needed and make the authenticated request to the CCH Axcess API.

## Testing the V2 Tax Return Creation

To test the V2 tax return creation functionality:

1. Upload an existing tax return XML file
2. Navigate to the "V2 Tax Return Creation" section
3. Click "Create V2 Tax Return"
4. The system will:
   - Fetch fresh account data from Formations API
   - Fetch current P&L data from Hurdlr API
   - Reconstruct the XML with new data
   - Send the V2 tax return directly to CCH Axcess via API

The V2 tax return will be automatically imported into CCH Axcess with updated financial data.

## Testing Logout Functionality

To test the complete CCH Axcess logout flow:

1. Log in to the application using CCH Axcess credentials
2. Navigate to the dashboard or home page
3. Click the "Logout" button
4. You should be redirected to CCH Axcess logout page
5. After CCH logout, you'll be redirected back to the home page
6. Verify that you are no longer authenticated and must log in again

**Note**: Make sure your CCH application configuration includes your base URL as the post-logout redirect URI. 