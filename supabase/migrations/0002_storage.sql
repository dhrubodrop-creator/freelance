-- Storage buckets for CV uploads and gated course content.
-- Objects are keyed by path convention:
--   cv-uploads/{clerk_id}/{filename}
--   course-content/{course_id}/{filename}   (playbooks + templates)

insert into storage.buckets (id, name, public)
values ('cv-uploads', 'cv-uploads', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('course-content', 'course-content', false)
on conflict (id) do nothing;

-- CV uploads: owner can read/write their own folder; admin reads all.
-- Server-side upload/read still goes through the service-role key in
-- practice, these policies cover any direct client-side access.
create policy "cv_uploads_owner_rw" on storage.objects
  for all using (
    bucket_id = 'cv-uploads'
    and (
      (storage.foldername(name))[1] = public.current_clerk_id()
      or public.is_admin()
    )
  )
  with check (
    bucket_id = 'cv-uploads'
    and (
      (storage.foldername(name))[1] = public.current_clerk_id()
      or public.is_admin()
    )
  );

-- Course content: readable by admins directly; regular access is brokered
-- through a signed-URL API route that checks active enrollment server-side.
create policy "course_content_admin_rw" on storage.objects
  for all using (bucket_id = 'course-content' and public.is_admin())
  with check (bucket_id = 'course-content' and public.is_admin());
