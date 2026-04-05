-- Phase 4E: Employer/group plans

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  admin_user_id uuid REFERENCES auth.users(id),
  seats integer NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can read own org" ON public.organizations
  FOR SELECT USING (auth.uid() = admin_user_id);
CREATE POLICY "Members can read own membership" ON public.organization_members
  FOR SELECT USING (auth.uid() = user_id);
