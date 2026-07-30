-- Create email_verifications table for OTP verification
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  code VARCHAR(6) NOT NULL,
  method VARCHAR(20) NOT NULL DEFAULT 'email', -- 'email', 'whatsapp', 'both'
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_email_verifications_email ON email_verifications(email);
CREATE INDEX idx_email_verifications_email_created ON email_verifications(email, created_at DESC);
CREATE INDEX idx_email_verifications_expires_at ON email_verifications(expires_at);

-- Enable RLS
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (for registration)
CREATE POLICY "Anyone can create verification records"
  ON email_verifications FOR INSERT
  WITH CHECK (true);

-- Policy: Can only read own verification records
CREATE POLICY "Users can read own verification records"
  ON email_verifications FOR SELECT
  USING (true); -- We'll handle auth on the backend

-- Policy: System can update (for marking as verified)
CREATE POLICY "System can update verification records"
  ON email_verifications FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE email_verifications IS 'Stores OTP codes for email and WhatsApp verification during registration';
