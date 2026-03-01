-- Migration: Add RPC for safe member removal from household
-- Date: 2026-03-01

-- RPC to safely remove a member from a household
-- Enforces: requester must be owner/admin, cannot remove the owner
CREATE OR REPLACE FUNCTION public.remove_household_member(
  target_user_id uuid,
  target_household_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_role text;
  target_role text;
BEGIN
  -- Check requester's role in the household
  SELECT role INTO requester_role
  FROM public.memberships
  WHERE user_id = auth.uid() AND household_id = target_household_id;

  IF NOT FOUND OR requester_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Permission denied: you must be owner or admin to remove members';
  END IF;

  -- Check target member's role
  SELECT role INTO target_role
  FROM public.memberships
  WHERE user_id = target_user_id AND household_id = target_household_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found in this household';
  END IF;

  IF target_role = 'owner' THEN
    RAISE EXCEPTION 'Cannot remove the household owner';
  END IF;

  -- Prevent admin from removing another admin (only owner can do that)
  IF requester_role = 'admin' AND target_role = 'admin' THEN
    RAISE EXCEPTION 'Only the owner can remove an administrator';
  END IF;

  -- Remove the membership
  DELETE FROM public.memberships
  WHERE user_id = target_user_id AND household_id = target_household_id;

  RETURN true;
END;
$$;
