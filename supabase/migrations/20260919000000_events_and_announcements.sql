-- Events (Phase 8) and grade announcements (new, not in the original plan).
--
-- Events: any signed-in member can post one; the creator or a site admin can
-- edit/delete it. Announcements: admin-only broadcast, everyone reads.
--
-- Both need to know "is the caller a site admin" cheaply. people.owner_uid
-- already carries a unique index, so this is a single indexed lookup, not the
-- denormalized-doc workaround PLAN.md's open items flagged as a maybe-later.

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce((select is_admin from public.people where owner_uid = auth.uid()), false);
$$;

comment on function public.is_site_admin() is
  'True when the caller has claimed a people row with is_admin = true.';

-- SECURITY INVOKER (see owns_person_folder in the Phase 5 migration for why):
-- the caller can already read every people row, so this needs no elevated
-- rights, and DEFINER here would just be a callable RPC endpoint for nothing.
revoke all on function public.is_site_admin() from public, anon;
grant execute on function public.is_site_admin() to authenticated;

-- The site owner is the one person who should start as admin. Their row is
-- seeded with id 'you' (see data/people.json); everyone else defaults false.
update public.people set is_admin = true where id = 'you';

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------

create table public.events (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null check (char_length(title) between 1 and 120),
  description           text not null default '' check (char_length(description) <= 2000),
  location              text not null default '' check (char_length(location) <= 200),
  start_at              timestamptz not null,
  end_at                timestamptz,
  created_by_uid        uuid not null references auth.users (id) on delete cascade,
  created_by_person_id  text not null references public.people (id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint events_end_after_start check (end_at is null or end_at >= start_at)
);

comment on table public.events is 'Shared, grade-wide. Any member can post; the creator or an admin can edit/delete.';

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

alter table public.events enable row level security;

revoke all on table public.events from anon, authenticated;
grant select, insert, delete on table public.events to authenticated;
grant update (title, description, location, start_at, end_at) on table public.events to authenticated;

create policy "members can read every event"
  on public.events for select
  to authenticated
  using (true);

create policy "members can create events as themselves"
  on public.events for insert
  to authenticated
  with check (
    created_by_uid = auth.uid()
    and created_by_person_id = (select id from public.people where owner_uid = auth.uid())
  );

create policy "creators and admins can edit events"
  on public.events for update
  to authenticated
  using (created_by_uid = auth.uid() or public.is_site_admin())
  with check (created_by_uid = auth.uid() or public.is_site_admin());

create policy "creators and admins can delete events"
  on public.events for delete
  to authenticated
  using (created_by_uid = auth.uid() or public.is_site_admin());

-- ---------------------------------------------------------------------------
-- Announcements
-- ---------------------------------------------------------------------------

create table public.announcements (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null check (char_length(title) between 1 and 120),
  body                  text not null check (char_length(body) between 1 and 4000),
  pinned                boolean not null default false,
  created_by_uid        uuid not null references auth.users (id) on delete cascade,
  created_by_person_id  text not null references public.people (id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.announcements is 'Grade-wide broadcast. Only site admins can post, edit or delete; everyone signed in can read.';

create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

alter table public.announcements enable row level security;

revoke all on table public.announcements from anon, authenticated;
grant select, insert, delete on table public.announcements to authenticated;
grant update (title, body, pinned) on table public.announcements to authenticated;

create policy "members can read every announcement"
  on public.announcements for select
  to authenticated
  using (true);

create policy "admins can post announcements"
  on public.announcements for insert
  to authenticated
  with check (
    public.is_site_admin()
    and created_by_uid = auth.uid()
    and created_by_person_id = (select id from public.people where owner_uid = auth.uid())
  );

create policy "admins can edit announcements"
  on public.announcements for update
  to authenticated
  using (public.is_site_admin())
  with check (public.is_site_admin());

create policy "admins can delete announcements"
  on public.announcements for delete
  to authenticated
  using (public.is_site_admin());
