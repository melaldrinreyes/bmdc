# Verification API - Usage Examples

## Backend API Endpoints

All endpoints are public (no authentication required) and return JSON responses.

---

## 1. Send Verification Code

**Endpoint:** `POST /api/verification/send-code`

**Purpose:** Generate and send a verification code via email and/or WhatsApp

### Request
```json
{
  "email": "user@example.com",
  "phone": "+639171234567",
  "method": "both",
  "firstName": "Juan"
}
```

### Parameters
| Parameter | Type | Required | Values | Description |
|-----------|------|----------|--------|-------------|
| email | string | Yes | Valid email | User's email address |
| phone | string | No | E.164 format | Phone number (e.g., +639171234567) |
| method | string | Yes | 'email' \| 'whatsapp' \| 'both' | Which channel(s) to use |
| firstName | string | No | Any string | User's first name (for email template) |

### Response (Success)
```json
{
  "success": true,
  "message": "Verification code sent via email and WhatsApp",
  "code": "123456"  // Only in development mode
}
```

### Response (Error)
```json
{
  "error": "Failed to send verification code through any channel"
}
```

### Error Cases
- Missing required fields → 400
- Invalid email format → 400
- Invalid phone format → 400
- Email service failed → 500 (if method includes email)
- WhatsApp service failed → 500 (if method includes whatsapp)

### Example Usage (Frontend)
```typescript
import { verificationService } from '@/services/verificationService';

try {
  const result = await verificationService.sendVerificationCode({
    email: 'juan@example.com',
    phone: '+639171234567',
    method: 'both',
    firstName: 'Juan'
  });
  
  console.log(result.message); // "Verification code sent via email and WhatsApp"
  if (process.env.NODE_ENV === 'development') {
    console.log('Code:', result.code); // For testing
  }
} catch (error) {
  console.error('Failed to send code:', error.message);
}
```

### Example Usage (Fetch API)
```javascript
const response = await fetch('/api/verification/send-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'juan@example.com',
    phone: '+639171234567',
    method: 'both',
    firstName: 'Juan'
  })
});

const data = await response.json();
if (response.ok) {
  console.log('Code sent:', data.message);
  // In development:
  console.log('Code for testing:', data.code);
}
```

---

## 2. Verify Code

**Endpoint:** `POST /api/verification/verify-code`

**Purpose:** Validate the 6-digit code user received

### Request
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

### Parameters
| Parameter | Type | Required | Format | Description |
|-----------|------|----------|--------|-------------|
| email | string | Yes | Valid email | User's email (must match sent-to email) |
| code | string | Yes | 6 digits | The code user received |

### Response (Success)
```json
{
  "success": true,
  "message": "Email verified successfully!"
}
```

### Response (Error)
```json
{
  "error": "Invalid verification code. Please try again."
}
```

### Error Cases
- No matching code found → "No verification request found. Please request a new code."
- Code expired → "Verification code has expired. Please request a new one."
- Invalid code → "Invalid verification code. Please try again."
- Too many attempts (5+) → "Too many failed attempts. Please request a new verification code."
- Missing fields → 400

### Example Usage (Frontend)
```typescript
import { verificationService } from '@/services/verificationService';

try {
  const result = await verificationService.verifyCode('juan@example.com', '123456');
  
  if (result.success) {
    console.log('✅ Email verified!');
    // Enable submit button
    setCodeVerified(true);
  }
} catch (error) {
  console.error('Verification failed:', error.message);
  // Show error message to user
}
```

### Example Usage (Fetch API)
```javascript
const response = await fetch('/api/verification/verify-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'juan@example.com',
    code: '123456'
  })
});

const data = await response.json();
if (response.ok) {
  console.log('✅ Code verified:', data.message);
} else {
  console.error('❌ Verification failed:', data.error);
}
```

---

## 3. Check Verification Status

**Endpoint:** `POST /api/verification/check-status`

**Purpose:** Check if an email is already verified

### Request
```json
{
  "email": "user@example.com"
}
```

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | Email to check |

### Response (Verified)
```json
{
  "email": "user@example.com",
  "isVerified": true
}
```

### Response (Not Verified)
```json
{
  "email": "user@example.com",
  "isVerified": false
}
```

### Example Usage (Frontend)
```typescript
import { verificationService } from '@/services/verificationService';

const status = await verificationService.checkVerificationStatus('juan@example.com');

if (status.isVerified) {
  console.log('✅ This email is already verified');
} else {
  console.log('⏳ This email needs verification');
}
```

---

## Complete Registration Flow Example

```typescript
import { verificationService } from '@/services/verificationService';
import registrationService from '@/services/registrationService';

// Step 1: User enters email
const userEmail = 'juan@example.com';
const userPhone = '+639171234567';
const userFirstName = 'Juan';

// Step 2: Send verification code (on Step 6 of registration)
try {
  await verificationService.sendVerificationCode({
    email: userEmail,
    phone: userPhone,
    method: 'both',
    firstName: userFirstName
  });
  console.log('✅ Code sent to email and WhatsApp');
  
  // User receives code on their phone/email
  // User enters code in UI
  const userEnteredCode = '123456'; // From user input
  
  // Step 3: Verify the code
  await verificationService.verifyCode(userEmail, userEnteredCode);
  console.log('✅ Email verified!');
  
  // Step 4: Now submit registration with all data
  const registrationData = {
    username: 'juan_dela_cruz',
    email: userEmail,
    password: 'SecurePass123!',
    first_name: 'Juan',
    last_name: 'Dela Cruz',
    phone: userPhone,
    // ... other registration fields
  };
  
  const registration = await registrationService.submitRegistration(registrationData);
  console.log('✅ Registration submitted:', registration);
  
} catch (error) {
  console.error('❌ Registration failed:', error.message);
}
```

---

## Database Schema (Reference)

The verification codes are stored in `email_verifications` table:

```sql
{
  id: UUID,                    -- Unique identifier
  email: VARCHAR,              -- User's email
  phone: VARCHAR,              -- User's phone (optional)
  code: VARCHAR(6),            -- 6-digit OTP code
  method: VARCHAR,             -- 'email', 'whatsapp', or 'both'
  expires_at: TIMESTAMP,       -- Expires in 10 minutes
  verified_at: TIMESTAMP,      -- Null until verified, then timestamp
  attempts: INTEGER,           -- Failed attempt counter (max 5)
  created_at: TIMESTAMP,       -- When record created
  updated_at: TIMESTAMP        -- When record updated
}
```

---

## Rate Limiting

### Send Code
- No hard limit (but consider adding per-IP/per-email)
- Recommended: 3 attempts per email per 1 hour
- Default: Unlimited (add in production)

### Verify Code
- 5 failed attempts before lockout
- After 5 failures: "Too many failed attempts"
- User must request new code to retry

### Code Expiration
- Codes valid for 10 minutes
- After expiration: "Verification code has expired"
- User must request new code

---

## Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Code sent successfully |
| 400 | Bad request | Invalid email format |
| 422 | Validation error | Missing required field |
| 500 | Server error | Email service failed |

---

## Testing with cURL

### Send Code
```bash
curl -X POST http://localhost:3000/api/verification/send-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+639171234567",
    "method": "both",
    "firstName": "Test"
  }'
```

### Verify Code
```bash
curl -X POST http://localhost:3000/api/verification/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456"
  }'
```

### Check Status
```bash
curl -X POST http://localhost:3000/api/verification/check-status \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

---

## Environment Variables Used

Your existing services are used:
- `EMAIL_*` variables (for sending verification emails)
- `WHATSAPP_*` variables (for sending verification messages)

No additional configuration needed!

---

## Common Scenarios

### Scenario 1: User Only Has Email
```javascript
await verificationService.sendVerificationCode({
  email: 'user@example.com',
  method: 'email'  // Only via email
});
```

### Scenario 2: User Prefers WhatsApp
```javascript
await verificationService.sendVerificationCode({
  email: 'user@example.com',
  phone: '+639171234567',
  method: 'whatsapp'  // Only via WhatsApp
});
```

### Scenario 3: Redundancy (Both Channels)
```javascript
await verificationService.sendVerificationCode({
  email: 'user@example.com',
  phone: '+639171234567',
  method: 'both'  // Both email AND WhatsApp
});
```

### Scenario 4: Resend Code
```javascript
// User clicks "Resend Code"
await verificationService.sendVerificationCode({
  email: form.email,
  phone: form.phone,
  method: verificationMethod  // Use same method as before
});
```

---

## Notes

- All times are in UTC
- Codes are 6 random digits
- One active code per email address (new code overrides old)
- Verification codes are independent of registration submission
- User must verify BEFORE submitting registration
- Verification status persists in database
