# CCH Axcess OAuth Integration

A complete OAuth 2.0 implementation for CCH Axcess authentication in Next.js with TypeScript.

## Features

- ✅ Complete OAuth 2.0 Authorization Code Flow
- ✅ Secure token management with HTTP-only cookies
- ✅ Automatic token refresh with scheduling
- ✅ Account number and firm ID support
- ✅ Comprehensive error handling and debugging
- ✅ TypeScript support with full type definitions
- ✅ Modern React hooks for authentication state
- ✅ Responsive UI with shadcn/ui components
- ✅ Complete logging for debugging purposes

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# CCH Axcess OAuth Configuration
CCH_CLIENT_ID=your_client_id_here
CCH_APP_SECRET=your_client_secret_here
CCH_REDIRECT_URL=http://localhost:3000/api/auth/callback
CCH_ACCOUNT_NUMBER=your_6_digit_account_number
NGROK_URL=your_ngrok_url_here

# Optional: Override default CCH URLs (usually not needed)
CCH_AUTH_URL=https://login.cchaxcess.com/ps/auth/v1.0/core/connect/authorize
CCH_TOKEN_URL=https://login.cchaxcess.com/ps/auth/v1.0/core/connect/token
CCH_API_BASE_URL=https://api.cchaxcess.com

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your environment variables** (see above)

3. **Configure your CCH Axcess application:**
   - Register your application in CCH Axcess
   - Set the redirect URI to match your `CCH_REDIRECT_URL`
   - Note down your client ID and secret

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser** to [http://localhost:3000](http://localhost:3000)

## OAuth Flow Overview

### Part 1: Authorization Code Flow

1. **User Login**: User clicks "Sign in with CCH Axcess"
2. **Redirect to CCH**: Application redirects to CCH Axcess authorization endpoint
3. **User Authentication**: User enters credentials and account number
4. **Authorization**: User grants permission to the application
5. **Callback**: CCH Axcess redirects back with authorization code

### Part 2: Token Exchange

1. **Code Exchange**: Application exchanges authorization code for tokens
2. **Token Storage**: Tokens are stored in secure HTTP-only cookies
3. **User Redirect**: User is redirected to the dashboard

### Part 3: API Usage

1. **Token Validation**: Each API request validates the access token
2. **Authenticated Requests**: Access token is used for CCH API calls
3. **Error Handling**: Expired tokens trigger automatic refresh

### Part 4: Token Refresh

1. **Automatic Refresh**: Tokens are automatically refreshed before expiration
2. **Background Process**: Refresh happens silently in the background
3. **Fallback**: If refresh fails, user is prompted to re-authenticate

### Part 5: Logout

1. **Logout Trigger**: User clicks logout button or application detects logout need
2. **CCH Logout**: Application redirects to CCH Axcess logout endpoint with id_token_hint
3. **Token Invalidation**: CCH Axcess invalidates existing tokens
4. **Redirect Back**: CCH redirects user back to configured post-logout URL (home page)
5. **Local Cleanup**: Application clears all local session data and cookies

## API Routes

### Authentication Routes

- `GET /api/auth/login` - Start OAuth flow
- `GET /api/auth/callback` - Handle OAuth callback
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Clear all tokens
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/test-api` - Test authenticated API calls

### Route Details

#### `/api/auth/login`
Initiates the OAuth flow by redirecting to CCH Axcess authorization endpoint.

#### `/api/auth/callback`
Handles the OAuth callback, exchanges authorization code for tokens, and redirects to dashboard.

#### `/api/auth/refresh`
Refreshes expired access tokens using the refresh token.

#### `/api/auth/logout`
Initiates CCH Axcess logout flow by redirecting to CCH's logout endpoint, then clears all authentication cookies and ends the session.

#### `/api/auth/me`
Returns current user information and token status.

#### `/api/auth/test-api`
Tests authenticated API requests (replace with actual CCH API endpoints).

## Pages

### `/` (Home)
- Shows authentication status
- Login button if not authenticated
- User info and logout if authenticated
- Feature overview and setup instructions

### `/dashboard`
- Protected page showing user information
- Token status and expiration details
- Manual token refresh button
- API testing functionality
- Complete debug information

### `/auth/error`
- Error page for OAuth failures
- Detailed error messages
- Options to retry or return home

## Components and Hooks

### Custom Hooks

#### `useAuth()`
Manages authentication state and automatic token refresh:

```typescript
const {
  isAuthenticated,
  user,
  tokens,
  error,
  loading,
  login,
  logout,
  refreshTokens,
  clearError
} = useAuth();
```

### Service Classes

#### `CCHOAuthService`
Core OAuth service handling all authentication operations:

```typescript
const oauthService = createCCHOAuthService();
const authUrl = oauthService.getAuthorizationUrl();
const tokens = await oauthService.exchangeCodeForTokens(code);
```

## Security Features

- **HTTP-only Cookies**: Tokens are stored in secure, HTTP-only cookies
- **State Parameter**: CSRF protection with state parameter validation
- **Token Expiration**: Automatic handling of token expiration
- **Secure Headers**: Proper security headers for all requests
- **Input Validation**: All inputs are validated and sanitized

## Debugging

All operations are logged to the console with emojis for easy identification:

- 🚀 Starting operations
- ✅ Successful operations
- ❌ Errors and failures
- 🔄 Refresh operations
- 🎫 Token information
- 📥 API responses
- ⏰ Timing information

## Common Issues and Solutions

### Environment Variables
- Ensure all required environment variables are set
- Check that `CCH_REDIRECT_URL` matches your CCH application configuration
- Verify `CCH_CLIENT_ID` and `CCH_APP_SECRET` are correct

### Redirect URI Mismatch
- The redirect URI in your CCH application must exactly match `CCH_REDIRECT_URL`
- Include the full URL including protocol and port

### Post-Logout Redirect URI
- Configure your base URL (e.g., `https://yourdomain.com`) as the post-logout redirect URI in your CCH application
- This is where users will be redirected after logout from CCH Axcess

### Token Refresh Issues
- Check that your refresh token hasn't expired
- Verify the client credentials are correct
- Ensure the redirect URI matches during token refresh

### CORS Issues
- CCH Axcess APIs may have CORS restrictions
- API calls should be made from your server-side code, not client-side

## Making Authenticated API Calls

Use the OAuth service to make authenticated requests:

```typescript
const oauthService = createCCHOAuthService();
const response = await oauthService.makeAuthenticatedRequest(
  'https://api.cchaxcess.com/your-endpoint',
  {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  },
  tokens
);
```

## Project Structure

```
cch/
├── app/
│   ├── api/auth/          # OAuth API routes
│   ├── auth/error/        # Error page
│   ├── dashboard/         # Protected dashboard
│   └── page.tsx           # Home page
├── components/ui/         # shadcn/ui components
├── hooks/
│   └── use-auth.ts        # Authentication hook
├── lib/
│   ├── oauth-service.ts   # OAuth service class
│   ├── oauth-types.ts     # TypeScript types
│   └── utils.ts           # Utility functions
└── README.md
```

## Development

### Running the Development Server

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run type-check
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues with this implementation, check the browser console for detailed logging information. All operations are logged with descriptive messages to help with debugging.

For CCH Axcess API documentation, visit the [CCH Developer Portal](https://developer.cch.com).
