-- Modules need real, Ropes-authored substance beyond a bare video link — a
-- course whose entire paid content is a link to a free public video isn't a
-- defensible paid product. Adds a structured content block per module
-- (learning topics, the concrete build/deliverable, the stated outcome) plus
-- explicit attribution fields so any curated external video is labeled
-- honestly rather than presented as original production.

alter table public.modules
  add column if not exists topics text[] not null default '{}',
  add column if not exists build_deliverable text,
  add column if not exists outcome text,
  add column if not exists video_source_label text;
