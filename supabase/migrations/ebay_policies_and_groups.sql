-- BUNDLE_C — eBay business policies + variant-group tracking
-- Applied via MCP apply_migration on project oiywxhmhabqjvswdwrzc.

-- Policies live on channels.metadata.ebay_policies; expose a helper view so
-- the admin UI (and downstream reporting) can see provisioning state without
-- jsonb gymnastics.
create or replace view public.v_ebay_channel_policies as
  select
    user_id,
    id as channel_id,
    (metadata -> 'ebay_policies' ->> 'paymentPolicyId')     as payment_policy_id,
    (metadata -> 'ebay_policies' ->> 'returnPolicyId')      as return_policy_id,
    (metadata -> 'ebay_policies' ->> 'fulfillmentPolicyId') as fulfillment_policy_id,
    (metadata -> 'ebay_policies' ->> 'provisioned_at')      as provisioned_at
  from public.channels
  where type = 'ebay';

-- Execute as querying user so RLS / grants apply as expected (not SECURITY DEFINER).
alter view public.v_ebay_channel_policies set (security_invoker = true);

-- Track Shopify → eBay InventoryItemGroup publishes so the listings UI can
-- show that a multi-variant product produced a single grouped eBay listing.
create table if not exists public.listing_channel_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  listing_id uuid not null,
  channel text not null default 'ebay',
  group_sku text not null,
  group_external_id text,
  variation_axes text[] not null default '{}',
  child_skus text[] not null default '{}',
  last_published_at timestamptz,
  unique (user_id, listing_id, channel, group_sku)
);

create index if not exists listing_channel_groups_user_idx
  on public.listing_channel_groups (user_id);

alter table public.listing_channel_groups enable row level security;

drop policy if exists "users select own groups" on public.listing_channel_groups;
create policy "users select own groups"
  on public.listing_channel_groups
  for select
  using (auth.uid() = user_id);
