import { supabaseAdmin } from '@/lib/supabase-admin';
import { hashPassword } from '@/lib/auth';
import { PendingRegistration } from '@/types';
import { TraineeRegistrationInput } from '@/utils/validators';
import { TenantContext } from '@/middleware/tenantContext';

/**
 * Custom error class for HTTP 409 Conflict responses
 * Used when a trainee has an incomplete enrollment blocking new applications
 */
export class ConflictError extends Error {
  public statusCode = 409;

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RegistrationService {
  private throwIfPendingRegistrationsMissing(error: any): void {
    const message = typeof error?.message === 'string' ? error.message : '';
    const isMissingPendingRegistrations =
      message.includes("public.pending_registrations") ||
      message.includes("relation \"pending_registrations\" does not exist");

    if (isMissingPendingRegistrations) {
      throw new Error(
        'Registration system is not initialized. Run Backend/database/pending_registrations.sql in your Supabase SQL Editor.'
      );
    }
  }

  /**
   * Check if a trainee has an incomplete enrollment in the same tenant.
   * An incomplete enrollment is defined as a trainee record with status 
   * IN ('active', 'inactive'). Completed or dropped enrollments do not 
   * block new applications.
   * 
   * @param email - Trainee email (will be normalized to lowercase)
   * @param tenantId - Tenant ID to scope the lookup
   * @returns Object with hasIncompleteEnrollment flag and optional trainee data
   * @throws Error if database query fails
   * 
   * Requirements: 1.1, 2.1, 2.3
   */
  private async checkIncompleteEnrollment(
    email: string,
    tenantId: string
  ): Promise<{ hasIncompleteEnrollment: boolean; trainee?: any }> {
    try {
      const { data: existingTrainee, error: existingTraineeError } = await supabaseAdmin
        .from('trainees')
        .select('id, email, status, program_id')
        .eq('tenant_id', tenantId)
        .eq('email', email.toLowerCase())
        .in('status', ['active', 'inactive'])
        .maybeSingle();

      if (existingTraineeError) {
        console.error('[Registration] Database error during incomplete enrollment check:', {
          email: email.toLowerCase(),
          tenant_id: tenantId,
          error: existingTraineeError.message,
        });
        throw existingTraineeError;
      }

      return {
        hasIncompleteEnrollment: !!existingTrainee,
        trainee: existingTrainee,
      };
    } catch (error: any) {
      console.error('[Registration] Error in checkIncompleteEnrollment:', error);
      throw error;
    }
  }

  /**
   * Submit a new trainee registration request (public - no auth)
   * Can be used for both new registrations and existing trainees applying to new programs
   * 
   * @param data Registration/application data
   * @param tenantId Tenant ID from the program
   * @param isExistingTrainee Whether this is an existing trainee applying to a new program (optional)
   */
  async submitRegistration(data: TraineeRegistrationInput, tenantId: string, isExistingTrainee: boolean = false): Promise<PendingRegistration> {
    // Check for duplicate email in pending_registrations
    const { data: existingPending, error: existingPendingError } = await supabaseAdmin
      .from('pending_registrations')
      .select('id, status')
      .eq('email', data.email.toLowerCase())
      .eq('tenant_id', tenantId)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (existingPendingError && existingPendingError.code !== 'PGRST116') {
      this.throwIfPendingRegistrationsMissing(existingPendingError);
      throw existingPendingError;
    }

    if (existingPending) {
      if (existingPending.status === 'approved') {
        throw new Error('An account with this email already exists. Please log in.');
      }
      throw new Error('A registration request with this email is already pending review.');
    }

    // Only check for existing user account if this is NOT an existing trainee applying to a new program
    // Existing trainees already have user accounts, so we don't need to check
    if (!isExistingTrainee) {
      // Check if email already has an active user account
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', data.email.toLowerCase())
        .maybeSingle();

      if (existingUser) {
        throw new Error('An account with this email already exists. Please log in.');
      }
    }

    // Check if username is taken
    const { data: existingUsername } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', data.username)
      .maybeSingle();

    if (existingUsername) {
      throw new Error('This username is already taken. Please choose another.');
    }

    // Check for pending registration with same username
    const { data: existingPendingUsername, error: existingPendingUsernameError } = await supabaseAdmin
      .from('pending_registrations')
      .select('id')
      .eq('username', data.username)
      .eq('status', 'pending')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (existingPendingUsernameError && existingPendingUsernameError.code !== 'PGRST116') {
      this.throwIfPendingRegistrationsMissing(existingPendingUsernameError);
      throw existingPendingUsernameError;
    }

    if (existingPendingUsername) {
      throw new Error('This username is already pending approval for another registration.');
    }

    // ========== NEW: Check for incomplete enrollment in trainees table ==========
    // Before allowing a new registration, verify the trainee doesn't have an 
    // active or inactive enrollment already. Completed/dropped enrollments are 
    // allowed since those trainees may be re-enrolling.
    // Requirements: 1.1, 1.2, 2.1, 4.3
    const incompleteEnrollmentCheck = await this.checkIncompleteEnrollment(
      data.email.toLowerCase(),
      tenantId
    );

    if (incompleteEnrollmentCheck.hasIncompleteEnrollment) {
      // Log the rejection for audit purposes
      const trainee = incompleteEnrollmentCheck.trainee;
      console.log('[Registration] CONFLICT: Incomplete enrollment blocks application', {
        email: data.email.toLowerCase(),
        program_id: data.program_id,
        existing_program_id: trainee?.program_id,
        existing_status: trainee?.status,
        tenant_id: tenantId,
        timestamp: new Date().toISOString(),
      });

      throw new ConflictError(
        `You have not finished taking your current program yet. Please complete or drop your current program before applying to a new one.`
      );
    }
    // ========== END: Incomplete enrollment check ==========

    // Hash password before storing
    const password_hash = await hashPassword(data.password);

    const { password, ...regData } = data;

    const { data: registration, error } = await supabaseAdmin
      .from('pending_registrations')
      .insert({
        ...regData,
        tenant_id: tenantId,
        email: data.email.toLowerCase(),
        password_hash,
        middle_name: data.middle_name || '',
        status: 'pending',
      })
      .select('*, program:programs(id, name, description, start_date, end_date, status)')
      .single();

    if (error) {
      this.throwIfPendingRegistrationsMissing(error);
      throw error;
    }
    return registration;
  }

  /**
   * Get all registrations (admin/staff only)
   */
  async getAllRegistrations(context: TenantContext | null, filters?: { status?: string; search?: string }): Promise<PendingRegistration[]> {
    let query = supabaseAdmin
      .from('pending_registrations')
      .select('*, program:programs(id, name, description, start_date, end_date, status)')
      .order('created_at', { ascending: false });

    // Apply tenant filtering for non-super-admin users
    if (context && !context.isSuperAdmin) {
      query = query.eq('tenant_id', context.tenantId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,username.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      this.throwIfPendingRegistrationsMissing(error);
      throw error;
    }
    return (data || []).map(r => {
      const { password_hash, ...safe } = r;
      return safe as PendingRegistration;
    });
  }

  /**
   * Get a single registration by ID
   */
  async getRegistrationById(context: TenantContext | null, id: string): Promise<PendingRegistration | null> {
    let query = supabaseAdmin
      .from('pending_registrations')
      .select('*, program:programs(id, name, description, start_date, end_date, status)')
      .eq('id', id);

    // Apply tenant filtering for non-super-admin users
    if (context && !context.isSuperAdmin) {
      query = query.eq('tenant_id', context.tenantId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      this.throwIfPendingRegistrationsMissing(error);
      throw error;
    }
    if (!data) return null;
    const { password_hash, ...safe } = data;
    return safe as PendingRegistration;
  }

  /**
   * Get trainee's own registrations (for trainee-only access)
   */
  async getTraineeRegistrations(email: string): Promise<PendingRegistration[]> {
    const { data, error } = await supabaseAdmin
      .from('pending_registrations')
      .select('*, program:programs(id, name, description, start_date, end_date, status)')
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) {
      this.throwIfPendingRegistrationsMissing(error);
      throw error;
    }

    return (data || []).map(r => {
      const { password_hash, ...safe } = r;
      return safe as PendingRegistration;
    });
  }

  /**
   * Approve a registration: create user + trainee account, mark as approved
   */
  async approveRegistration(id: string, reviewerId: string): Promise<{ user: any; trainee: any }> {
    // Fetch full registration (need password_hash)
    const { data: reg, error: fetchError } = await supabaseAdmin
      .from('pending_registrations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      this.throwIfPendingRegistrationsMissing(fetchError);
    }

    if (fetchError || !reg) throw new Error('Registration not found');
    if (reg.status !== 'pending') throw new Error(`Registration is already ${reg.status}`);

    // Check again for duplicate email (race condition safety)
    const { data: existingUserByEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', reg.email)
      .maybeSingle();

    if (existingUserByEmail) {
      throw new Error('Cannot approve registration: an account with this email already exists.');
    }

    // Check for duplicate username as well.
    const { data: existingUserByUsername } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', reg.username)
      .maybeSingle();

    if (existingUserByUsername) {
      throw new Error('Cannot approve registration: this username is already in use.');
    }

    // 1. Create user account
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email: reg.email,
        username: reg.username,
        password_hash: reg.password_hash,
        role: 'trainee',
      })
      .select()
      .single();

    if (userError) throw userError;

    // 2. Create trainee record
    const qrCode = `TRAINEE-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const { data: trainee, error: traineeError } = await supabaseAdmin
      .from('trainees')
      .insert({
        tenant_id: reg.tenant_id,
        first_name: reg.first_name,
        last_name: reg.last_name,
        middle_name: reg.middle_name || '',
        email: reg.email,
        phone: reg.phone,
        sex: reg.sex,
        birth_date: reg.birth_date,
        birth_place: reg.birth_place,
        civil_status: reg.civil_status,
        province: reg.province,
        municipality: reg.municipality,
        barangay: reg.barangay,
        street: reg.street,
        educational_attainment: reg.educational_attainment,
        course: reg.course,
        year_graduated: reg.year_graduated,
        classification: reg.classification,
        disability: reg.disability || null,
        employment_status: reg.employment_status,
        program_id: reg.program_id,
        qr_code: qrCode,
        status: 'active',
        enrollment_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (traineeError) {
      // Rollback user creation
      await supabaseAdmin.from('users').delete().eq('id', user.id);
      throw traineeError;
    }

    // 3. Create trainee_accounts link (user ↔ trainee)
    const { error: linkError } = await supabaseAdmin
      .from('trainee_accounts')
      .insert({ user_id: user.id, trainee_id: trainee.id, tenant_id: reg.tenant_id });

    if (linkError) {
      // Rollback both user and trainee
      await supabaseAdmin.from('trainees').delete().eq('id', trainee.id);
      await supabaseAdmin.from('users').delete().eq('id', user.id);
      throw linkError;
    }

    // 4. Mark registration as approved
    const { error: reviewUpdateError } = await supabaseAdmin
      .from('pending_registrations')
      .update({ status: 'approved', reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
      .eq('id', id);

    if (reviewUpdateError) throw reviewUpdateError;

    return { user: { id: user.id, email: user.email, username: user.username, role: user.role }, trainee };
  }

  /**
   * Reject a registration
   */
  async rejectRegistration(id: string, reviewerId: string, reason?: string): Promise<void> {
    const { data: reg, error: fetchError } = await supabaseAdmin
      .from('pending_registrations')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      this.throwIfPendingRegistrationsMissing(fetchError);
    }

    if (fetchError || !reg) throw new Error('Registration not found');
    if (reg.status !== 'pending') throw new Error(`Registration is already ${reg.status}`);

    const { error } = await supabaseAdmin
      .from('pending_registrations')
      .update({
        status: 'rejected',
        rejection_reason: reason || null,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Count pending registrations for a specific tenant
   */
  async countPendingByTenant(tenantId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('pending_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('tenant_id', tenantId);

    if (error) {
      this.throwIfPendingRegistrationsMissing(error);
      throw error;
    }
    return count || 0;
  }
}

export const registrationService = new RegistrationService();
