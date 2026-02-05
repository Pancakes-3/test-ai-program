-- Enable extensions
create extension if not exists "uuid-ossp";

-- Custom types
create type party_type as enum ('liberty', 'freedom');

-- Profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  party party_type not null,
  role text not null,
  bio text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Posts table
create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  is_breaking boolean not null default false,
  created_at timestamptz not null default now()
);

-- Post media (logic only)
create table if not exists post_media (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  media_url text,
  media_type text,
  created_at timestamptz not null default now()
);

-- Follows
create table if not exists follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

-- Likes
create table if not exists likes (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Comments
create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Mentions
create table if not exists mentions (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  mentioned_user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- App config
create table if not exists app_config (
  key text primary key,
  value text not null
);

insert into app_config (key, value)
values ('allow_signups', 'false')
on conflict (key) do nothing;

-- Helper function for admin checks
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from profiles where id = auth.uid() and is_admin = true
  );
$$;

-- Enable RLS
alter table profiles enable row level security;
alter table posts enable row level security;
alter table post_media enable row level security;
alter table follows enable row level security;
alter table likes enable row level security;
alter table comments enable row level security;
alter table mentions enable row level security;
alter table app_config enable row level security;

-- Profiles policies
create policy "Profiles are viewable by authenticated"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own profile when signups allowed"
  on profiles for insert
  with check (
    auth.uid() = id
    and (select value = 'true' from app_config where key = 'allow_signups')
  );

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can update any profile"
  on profiles for update
  using (is_admin())
  with check (is_admin());

-- Posts policies
create policy "Posts viewable by authenticated"
  on posts for select
  using (auth.role() = 'authenticated');

create policy "Users can create posts"
  on posts for insert
  with check (auth.uid() = author_id and (not is_breaking or is_admin()));

create policy "Authors can update their posts"
  on posts for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id and (not is_breaking or is_admin()));

create policy "Admins can update breaking"
  on posts for update
  using (is_admin())
  with check (is_admin());

create policy "Authors can delete their posts"
  on posts for delete
  using (auth.uid() = author_id or is_admin());

-- Post media policies
create policy "Media viewable by authenticated"
  on post_media for select
  using (auth.role() = 'authenticated');

create policy "Authors can add media"
  on post_media for insert
  with check (
    auth.uid() = (select author_id from posts where id = post_id)
  );

-- Follows policies
create policy "Follows viewable by authenticated"
  on follows for select
  using (auth.role() = 'authenticated');

create policy "Users can follow others"
  on follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on follows for delete
  using (auth.uid() = follower_id);

-- Likes policies
create policy "Likes viewable by authenticated"
  on likes for select
  using (auth.role() = 'authenticated');

create policy "Users can like"
  on likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike"
  on likes for delete
  using (auth.uid() = user_id);

-- Comments policies
create policy "Comments viewable by authenticated"
  on comments for select
  using (auth.role() = 'authenticated');

create policy "Users can comment"
  on comments for insert
  with check (auth.uid() = author_id);

create policy "Users can delete their comments"
  on comments for delete
  using (auth.uid() = author_id or is_admin());

-- Mentions policies
create policy "Mentions viewable by authenticated"
  on mentions for select
  using (auth.role() = 'authenticated');

create policy "Authors can create mentions"
  on mentions for insert
  with check (auth.uid() = (select author_id from posts where id = post_id));

-- App config policies
create policy "App config viewable by authenticated"
  on app_config for select
  using (auth.role() = 'authenticated');

create policy "Admins can update config"
  on app_config for update
  using (is_admin())
  with check (is_admin());
