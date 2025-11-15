# Embedded Wallet Architecture

This implementation provides a Privy-like embedded wallet experience with email/password authentication.

## Features

✅ **Email/Password Authentication**
- Simple sign-up and login
- No seed phrases to manage
- Session persistence

✅ **Embedded Wallets**
- Automatically created on sign-up
- Stored securely (encrypted in production)
- No browser extensions needed

✅ **Seamless Web3 Integration**
- Wallets work with all smart contracts
- Automatic provider setup
- Full ethers.js compatibility

## Architecture

### Authentication Flow

1. **Sign Up**
   - User enters email/password
   - System generates embedded wallet
   - Wallet private key stored (encrypted in production)
   - User session created

2. **Login**
   - User enters email/password
   - System retrieves stored wallet
   - Wallet re-instantiated
   - User session restored

3. **Wallet Usage**
   - Embedded wallet automatically connected
   - Works with all contract interactions
   - No manual connection needed

### Security Considerations

**Current Implementation (Development):**
- Private keys stored in localStorage (unencrypted)
- Passwords base64 encoded (not hashed)
- Suitable for testnet/development only

**Production Recommendations:**
1. **Backend API**: Move auth to secure backend
2. **Encryption**: Encrypt private keys before storage
3. **Password Hashing**: Use bcrypt or similar
4. **Secure Storage**: Use httpOnly cookies or encrypted storage
5. **Key Management**: Consider using services like:
   - Privy (managed service)
   - Magic (passwordless auth + wallets)
   - Custom backend with key encryption

### File Structure

```
src/
├── services/
│   └── auth.js          # Authentication service
├── hooks/
│   └── useAuth.js       # Auth hook + embedded wallet hook
├── pages/
│   ├── Login.jsx        # Login page
│   ├── SignUp.jsx       # Sign-up page
│   └── Dashboard.jsx   # Uses embedded wallet
```

## Usage

### Sign Up
```jsx
const { register } = useAuth()
await register(email, password)
// Wallet automatically created and connected
```

### Login
```jsx
const { login } = useAuth()
await login(email, password)
// Wallet automatically restored and connected
```

### Use Embedded Wallet
```jsx
const { signer, address, isConnected } = useEmbeddedWallet()
// Use signer for contract interactions
```

## Production Setup

To make this production-ready:

1. **Create Backend API**
   ```javascript
   POST /api/auth/register
   POST /api/auth/login
   GET /api/auth/session
   ```

2. **Encrypt Private Keys**
   ```javascript
   // Use AES encryption
   const encrypted = encrypt(privateKey, userPassword)
   ```

3. **Hash Passwords**
   ```javascript
   // Use bcrypt
   const hash = await bcrypt.hash(password, 10)
   ```

4. **Secure Storage**
   - Use httpOnly cookies for tokens
   - Encrypt sensitive data
   - Never expose private keys to frontend

## Alternative: Use Privy

For production, consider using Privy SDK:

```bash
npm install @privy-io/react-auth
```

```jsx
import { PrivyProvider } from '@privy-io/react-auth'

<PrivyProvider appId="your-app-id">
  <App />
</PrivyProvider>
```

This provides:
- Managed embedded wallets
- Social login options
- Secure key management
- Production-ready infrastructure

## Current Implementation

The current implementation works for:
- ✅ Development/testing
- ✅ Testnet usage
- ✅ Prototyping
- ✅ Hackathons

For production, implement proper security measures or use a managed service.


