-- Trigger functions are SECURITY DEFINER and shouldn't be exposed via /rest/v1/rpc.
revoke execute on function public.enforce_allowlist() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
