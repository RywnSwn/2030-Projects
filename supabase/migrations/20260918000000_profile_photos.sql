-- Phase 5: profile photos.
--
-- The bucket is PRIVATE. A public bucket would put 39 real students' faces on
-- the open web behind nothing but an unguessable URL, and the whole premise of
-- this site is that the grade's data is not public. Reads go through
-- short-lived signed URLs instead (see src/lib/profiles.ts).
--
-- Because of that, people.photo_url never held a URL: it holds the object's
-- path inside the bucket. Renamed to match. (Column-level grants follow the
-- rename, so `grant update (photo_url, bio)` from the Phase 4 migration keeps
-- working as `photo_path`.)

alter table public.people rename column photo_url to photo_path;

comment on column public.people.photo_path is
  'Object path inside the private profile-photos bucket, e.g. "kai-jensen/8f2c….jpg". Signed at read time; never a public URL.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  false,
  5242880, -- 5 MB, same ceiling the upload form enforces
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Object access. Every file lives under <personId>/, and only the account that
-- claimed that person may write there. Any signed-in member may read.
-- ---------------------------------------------------------------------------

-- Security INVOKER on purpose: members can already read every people row, so
-- this needs no extra rights, and a definer function here would be a callable
-- /rest/v1/rpc endpoint running with the table owner's privileges for nothing.
create or replace function public.owns_person_folder(object_name text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
      from public.people p
     where p.id = (storage.foldername(object_name))[1]
       and p.owner_uid = auth.uid()
  );
$$;

comment on function public.owns_person_folder(text) is
  'True when the caller claimed the person whose slug is the first folder of a profile-photos object path.';

-- Supabase grants EXECUTE on new public-schema functions to anon and
-- authenticated, so revoking from PUBLIC alone leaves anon able to call it.
revoke all on function public.owns_person_folder(text) from public, anon;
grant execute on function public.owns_person_folder(text) to authenticated;

drop policy if exists "members can read profile photos" on storage.objects;
create policy "members can read profile photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'profile-photos');

drop policy if exists "owners can add their own profile photo" on storage.objects;
create policy "owners can add their own profile photo"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'profile-photos' and public.owns_person_folder(name));

drop policy if exists "owners can replace their own profile photo" on storage.objects;
create policy "owners can replace their own profile photo"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'profile-photos' and public.owns_person_folder(name))
  with check (bucket_id = 'profile-photos' and public.owns_person_folder(name));

drop policy if exists "owners can delete their own profile photo" on storage.objects;
create policy "owners can delete their own profile photo"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'profile-photos' and public.owns_person_folder(name));
