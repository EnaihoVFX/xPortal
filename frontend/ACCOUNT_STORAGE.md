# Account Storage Documentation

## Current Storage Method

### Location
Accounts are currently stored in **localStorage** (browser's local storage).

### Storage Structure

1. **Users Data** (`users` key)
   ```json
   {
     "user@example.com": {
       "email": "user@example.com",
       "passwordHash": "base64_encoded_password",
       "user": {
         "id": "timestamp",
         "email": "user@example.com",
         "walletAddress": "0x...",
         "walletPrivateKey": "0x...",
         "createdAt": "ISO_timestamp"
       }
     }
   }
   ```

2. **Session Data**
   - `auth_token`: Base64 encoded token with email and timestamp
   - `user`: JSON stringified user object
   - `wallet_private_key`: Private key of embedded wallet (⚠️ unencrypted)

### Security Notes

**Current Implementation (Development/Testnet):**
- ⚠️ Private keys stored unencrypted in localStorage
- ⚠️ Passwords base64 encoded (not hashed)
- ⚠️ Suitable for testnet/development only

**Production Recommendations:**
1. **Backend Storage**: Move to secure backend database
2. **Encryption**: Encrypt private keys before storage
3. **Password Hashing**: Use bcrypt or similar
4. **Secure Sessions**: Use httpOnly cookies
5. **Key Management**: Consider services like Privy, Magic, or encrypted vaults

### Accessing Stored Data

You can view stored accounts in browser DevTools:
1. Open DevTools (F12)
2. Go to Application/Storage tab
3. Click "Local Storage"
4. View keys: `users`, `auth_token`, `user`, `wallet_private_key`

### Demo Account Creation

The demo feature creates accounts the same way, but with:
- Auto-generated email: `demo_${timestamp}_${random}@demo.com`
- Default password: `demo123`
- Instant wallet generation
- Automatic login

## Demo QR Code Feature

### How It Works

1. **Demo Page** (`/demo`)
   - Displays QR code with unique demo URL
   - Provides instant "Try Demo" button
   - Shows what users will get

2. **QR Code URL**
   - Format: `/demo/join?token=demo_${timestamp}_${random}`
   - When scanned, opens DemoJoin page
   - Automatically creates test account

3. **DemoJoin Page** (`/demo/join`)
   - Validates token
   - Creates test account instantly
   - Auto-logs in user
   - Redirects to dashboard

### Usage

**For Presenters:**
1. Go to `/demo` page
2. Show QR code to audience
3. They scan and get instant access

**For Quick Testing:**
1. Click "Try Demo Instantly" button
2. Account created in seconds
3. Automatically logged in

### Demo Account Details

- **Email**: Auto-generated (unique per demo)
- **Password**: `demo123` (for reference, not needed after auto-login)
- **Wallet**: Automatically created and connected
- **Balance**: 1,000,000 test USDC (from MockUSDC contract)
- **Access**: Full platform access

