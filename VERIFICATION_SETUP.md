# Quick Setup Guide - Email & WhatsApp Verification

## 🚀 Quick Start (5 minutes)

### Step 1: Apply Database Migration
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Go to your project
3. Click **SQL Editor**
4. Click **New Query**
5. Copy contents of: `Backend/migrations/add_email_verifications.sql`
6. Paste and click **Run**

✅ Done! Table is created.

### Step 2: Restart Backend
```bash
cd Backend
npm run dev
```

### Step 3: Restart Frontend
```bash
cd Frontend
npm run dev
```

## ✅ Verify It's Working

1. Open your app at http://localhost:3000
2. Click **Register** or **Enroll Now**
3. Fill out all 5 steps normally
4. **Step 6 should now appear**: "Verify"
5. Click "Send Verification Code"
6. Check your:
   - 📧 **Email** - Look for verification email
   - 💬 **WhatsApp** - Look for verification message
7. Enter the 6-digit code you received
8. Click "Verify Code"
9. ✅ Submit your registration!

## 🔧 Configuration

No additional configuration needed! The system uses your existing:
- Email service (already configured)
- WhatsApp service (already configured)

## 📋 Files Added

**Backend:**
- `src/services/verificationService.ts` - Core logic
- `src/app/api/verification/send-code/route.ts` - Send OTP endpoint
- `src/app/api/verification/verify-code/route.ts` - Verify OTP endpoint
- `src/app/api/verification/check-status/route.ts` - Check status endpoint
- `migrations/add_email_verifications.sql` - Database table

**Frontend:**
- `src/services/verificationService.ts` - Client service
- `src/components/RegistrationModal.tsx` - Updated with Step 6

## 🧪 Testing Tips

### In Development Mode:
- The API returns the verification code in the response
- Use this to test without checking email/WhatsApp
- Example:
  ```javascript
  const response = await verificationService.sendVerificationCode({
    email: 'test@example.com',
    phone: '+639171234567',
    method: 'both'
  });
  console.log(response.code); // Shows code in development
  ```

### Test Both Channels:
1. Try "Email only" - check inbox
2. Try "WhatsApp only" - check WhatsApp
3. Try "Both" - receive both (test failover)

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Failed to send code" | Check email & WhatsApp services configured in `.env` |
| "Invalid code" | Make sure you entered all 6 digits correctly |
| "Code expired" | Codes expire after 10 minutes, request a new one |
| "Too many attempts" | You tried 5+ wrong codes, request a new code |
| Step 6 doesn't appear | Clear cache, rebuild frontend, restart dev server |
| No email received | Check spam folder, verify EMAIL_* env vars |
| No WhatsApp received | Verify WHATSAPP_* env vars, check phone format |

## 📊 Database

The `email_verifications` table stores:
- Email and phone
- 6-digit codes (auto-generated)
- Verification status
- Attempt counter (max 5)
- Expiration time (10 minutes)

Table auto-indexes for fast lookups.

## 🔐 Security

Built-in protections:
- ✅ 6-digit OTP codes
- ✅ 10-minute expiration  
- ✅ Rate limiting (5 attempts)
- ✅ Email validation
- ✅ Phone validation

## 📞 Support

For issues, check:
1. Email service configuration
2. WhatsApp service configuration  
3. Database connection
4. Browser console for errors
5. Backend logs

## 🎉 Success!

You now have a production-ready dual-channel verification system for user registration!

**Next Steps:**
- Configure email template with verification code
- Configure WhatsApp template with verification code
- Test with real email/WhatsApp accounts
- Deploy to production
- Monitor verification success rates

---

**Need the detailed guide?** See `VERIFICATION_IMPLEMENTATION.md`
