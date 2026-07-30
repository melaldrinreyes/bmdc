import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendWhatsApp } from './whatsappService';
import { sendEmail } from './emailService';
import logger from '@/utils/logger';

interface VerificationRecord {
  id: string;
  email: string;
  phone?: string;
  code: string;
  expires_at: string;
  verified_at?: string;
  attempts: number;
  method: 'email' | 'whatsapp' | 'both';
  created_at: string;
}

export class VerificationService {
  /**
   * Generate a random 6-digit OTP code
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send verification code via email and/or WhatsApp
   */
  async sendVerificationCode(params: {
    email: string;
    phone?: string;
    method: 'email' | 'whatsapp' | 'both';
    firstName?: string;
  }): Promise<{ success: boolean; message: string; code?: string }> {
    try {
      const { email, phone, method, firstName = 'User' } = params;

      // Generate OTP
      const code = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      // Store verification code in database
      const { data: verificationRecord, error: insertError } = await supabaseAdmin
        .from('email_verifications')
        .insert({
          email: email.toLowerCase(),
          phone: phone || null,
          code,
          expires_at: expiresAt,
          method,
          attempts: 0,
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Failed to create verification record', { error: insertError });
        throw new Error('Failed to create verification record');
      }

      const results = {
        emailSent: false,
        whatsappSent: false,
        error: null as string | null,
      };

      // Send via Email
      if (method === 'email' || method === 'both') {
        try {
          await sendEmail({
            to: email,
            subject: 'Verify Your Email - BMDC Registration',
            template: 'verification',
            data: {
              firstName,
              code,
              expiresIn: '10 minutes',
            },
          });
          results.emailSent = true;
        } catch (emailError) {
          logger.warn('Failed to send verification email', { error: emailError, email });
          results.error = results.error ? `${results.error}, Email failed` : 'Email send failed';
        }
      }

      // Send via WhatsApp
      if ((method === 'whatsapp' || method === 'both') && phone) {
        try {
          await sendWhatsApp({
            phoneNumber: phone,
            templateName: 'verification_code',
            parameters: {
              code,
              expiresIn: '10 minutes',
            },
          });
          results.whatsappSent = true;
        } catch (whatsappError) {
          logger.warn('Failed to send verification WhatsApp', { error: whatsappError, phone });
          results.error = results.error ? `${results.error}, WhatsApp failed` : 'WhatsApp send failed';
        }
      }

      // If at least one channel succeeded
      if (results.emailSent || results.whatsappSent) {
        return {
          success: true,
          message: `Verification code sent via ${results.emailSent && results.whatsappSent ? 'email and WhatsApp' : results.emailSent ? 'email' : 'WhatsApp'}`,
          code: process.env.NODE_ENV === 'development' ? code : undefined, // Return code in dev for testing
        };
      } else {
        throw new Error(results.error || 'Failed to send verification code through any channel');
      }
    } catch (error) {
      logger.error('Error in sendVerificationCode', { error });
      throw error;
    }
  }

  /**
   * Verify the OTP code
   */
  async verifyCode(params: { email: string; code: string }): Promise<{ success: boolean; message: string }> {
    try {
      const { email, code } = params;

      // Find the verification record
      const { data: verificationRecord, error: fetchError } = await supabaseAdmin
        .from('email_verifications')
        .select('*')
        .eq('email', email.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !verificationRecord) {
        throw new Error('No verification request found. Please request a new code.');
      }

      // Check if expired
      if (new Date() > new Date(verificationRecord.expires_at)) {
        throw new Error('Verification code has expired. Please request a new one.');
      }

      // Check attempts
      if (verificationRecord.attempts >= 5) {
        throw new Error('Too many failed attempts. Please request a new verification code.');
      }

      // Verify code
      if (verificationRecord.code !== code) {
        // Increment attempts
        await supabaseAdmin
          .from('email_verifications')
          .update({ attempts: verificationRecord.attempts + 1 })
          .eq('id', verificationRecord.id);

        throw new Error('Invalid verification code. Please try again.');
      }

      // Mark as verified
      const { error: updateError } = await supabaseAdmin
        .from('email_verifications')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', verificationRecord.id);

      if (updateError) {
        throw updateError;
      }

      return {
        success: true,
        message: 'Email verified successfully!',
      };
    } catch (error) {
      logger.error('Error in verifyCode', { error });
      throw error;
    }
  }

  /**
   * Check if email is already verified
   */
  async isEmailVerified(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('email_verifications')
        .select('verified_at')
        .eq('email', email.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return false;
      return !!data.verified_at;
    } catch (error) {
      logger.warn('Error checking email verification', { error });
      return false;
    }
  }

  /**
   * Clear old verification codes
   */
  async cleanupExpiredCodes(): Promise<number> {
    try {
      const { data: deleted, error } = await supabaseAdmin
        .from('email_verifications')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) {
        logger.warn('Error cleaning up expired codes', { error });
        return 0;
      }

      return deleted?.length || 0;
    } catch (error) {
      logger.error('Error in cleanupExpiredCodes', { error });
      return 0;
    }
  }
}

export const verificationService = new VerificationService();
