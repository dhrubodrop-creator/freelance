-- Sample catalog data for local development. Safe to re-run.

insert into public.courses (slug, title, price, description, track) values
  ('ai-outreach-agent', 'AI Outreach & Lead-Gen Agent', 24999, 'Build and sell AI-powered outreach systems that book meetings on autopilot for local businesses and B2B teams.', 'outreach'),
  ('process-automation', 'Process Automation for Ops Teams', 29999, 'Turn manual, spreadsheet-driven workflows into automated systems using n8n, APIs, and AI — the track built for operations and supply-chain professionals.', 'automation'),
  ('nocode-foundations', 'No-Code Foundations', 14999, 'The starting track for anyone new to no-code and AI tooling — ship your first automation in week one.', 'foundations')
on conflict (slug) do nothing;

insert into public.case_studies (title, summary, image_url) values
  ('From spreadsheets to a systems business', '[TESTIMONIAL PLACEHOLDER — replace with real student quote] A former ops manager describes moving from manual reporting to a retainer-based automation practice.', null),
  ('Booking meetings while I sleep', '[TESTIMONIAL PLACEHOLDER — replace with real student quote] A sales rep on building an outreach agent for a local client base.', null)
on conflict do nothing;

insert into public.announcements (title, body) values
  ('Welcome to the Ropes community', 'This is where weekly live session links, resource drops, and community updates will show up.')
on conflict do nothing;
