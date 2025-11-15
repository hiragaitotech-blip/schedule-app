export type Tenant = {
  id: string;
  name: string;
  mailbox_address: string | null;
  is_active: boolean;
  created_at: string;
};

export type TenantInsert = {
  id?: string;
  name: string;
  mailbox_address?: string | null;
  is_active?: boolean;
  created_at?: string;
};

export type Profile = {
  id: string;
  tenant_id: string | null;
  role: string | null;
  is_active: boolean;
  force_password_reset: boolean;
  email: string | null;
  created_at: string;
};

export type ProfileInsert = {
  id: string;
  tenant_id?: string | null;
  role?: string | null;
  is_active?: boolean;
  force_password_reset?: boolean;
  email?: string | null;
  created_at?: string;
};

export type Case = {
  id: string;
  public_id: string | null;
  tenant_id: string | null;
  created_by: string | null;
  title: string | null;
  candidate_name: string | null;
  raw_email_body: string | null;
  stage: string | null;
  status: string | null;
  created_at: string;
};

export type CaseInsert = {
  id?: string;
  public_id?: string | null;
  tenant_id?: string | null;
  created_by?: string | null;
  title?: string | null;
  candidate_name?: string | null;
  raw_email_body?: string | null;
  stage?: string | null;
  status?: string | null;
  created_at?: string;
};

export type Slot = {
  id: string;
  case_id: string;
  start_time: string;
  end_time: string;
  note: string | null;
  created_at: string;
};

export type SlotInsert = {
  id?: string;
  case_id: string;
  start_time: string;
  end_time: string;
  note?: string | null;
  created_at?: string;
};

export type CandidateAvailability = {
  id: string;
  case_id: string;
  slot_id: string;
  candidate_name: string | null;
  email: string | null;
  status: string | null;
  created_at: string;
};

export type CandidateAvailabilityInsert = {
  id?: string;
  case_id: string;
  slot_id: string;
  candidate_name?: string | null;
  email?: string | null;
  status?: string | null;
  created_at?: string;
};

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: Tenant;
        Insert: TenantInsert;
        Update: TenantInsert;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileInsert;
        Relationships: [];
      };
      cases: {
        Row: Case;
        Insert: CaseInsert;
        Update: CaseInsert;
        Relationships: [];
      };
      slots: {
        Row: Slot;
        Insert: SlotInsert;
        Update: SlotInsert;
        Relationships: [];
      };
      candidate_availabilities: {
        Row: CandidateAvailability;
        Insert: CandidateAvailabilityInsert;
        Update: CandidateAvailabilityInsert;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

