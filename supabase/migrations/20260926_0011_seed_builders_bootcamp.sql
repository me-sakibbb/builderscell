-- The bootcamp campaign, worded from the registration form it replaces.
-- Dates and the seat cap are left null on purpose: set starts_on, ends_on,
-- registration_closes_at and capacity once they are decided.

insert into public.campaigns (
  slug, title, kind, status, eyebrow, summary, description,
  highlights, fee_lines, payment_instructions, payment_numbers,
  allows_individual, allows_team, individual_fee_bdt, team_fee_bdt,
  team_min_members, team_max_members, min_class_level, max_class_level
)
values (
  'builders-bootcamp',
  'Builders'' Bootcamp',
  'bootcamp',
  'open',
  'Registration open',
  'Transform your curiosity into innovation through our comprehensive robotics bootcamp, crafted specially for students from Class 6 to Class 12.',
  'Welcome to Builder''sCell. From core theories to hands-on projects, learn directly from the country''s top robotics experts with structured guidebooks and a complete project Build Box. Register on your own or bring a team of up to three builders.',
  jsonb_build_array(
    jsonb_build_object('title', 'Send the payment', 'body', 'Send the registration fee via bKash or Nagad to 01869452531 and keep your Transaction ID saved.'),
    jsonb_build_object('title', 'Submit your details', 'body', 'Fill in this form with your information and the Transaction ID to confirm your spot.'),
    jsonb_build_object('title', 'We take it from there', 'body', 'We verify your payment and get in touch with everything you need before the first session.')
  ),
  jsonb_build_array(
    jsonb_build_object('label', 'Individual registration', 'amount', 5000, 'note', 'Includes an individual Build Box'),
    jsonb_build_object('label', 'Team registration', 'amount', 7500, 'note', 'Up to 3 members, includes a team Build Box')
  ),
  'Send the registration fee via bKash or Nagad to 01869452531 before you submit this form, and keep the Transaction ID: you will be asked for it on the last step.',
  jsonb_build_array(
    jsonb_build_object('method', 'bkash', 'number', '01869452531'),
    jsonb_build_object('method', 'nagad', 'number', '01869452531')
  ),
  true, true, 5000, 7500, 2, 3, 6, 12
)
on conflict (slug) do nothing;
