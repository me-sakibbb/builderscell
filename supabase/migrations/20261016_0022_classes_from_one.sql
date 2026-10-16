-- Open every form to students from class 1.

-- Leads: accept class_1 to class_5 alongside the existing grades.
alter table public.leads drop constraint leads_grade;
alter table public.leads
  add constraint leads_grade check (
    grade in (
      'class_1','class_2','class_3','class_4','class_5',
      'class_6','class_7','class_8','class_9','class_10','class_11','class_12',
      'o_level','a_level','other'
    )
  );

comment on column public.leads.grade is 'Class or grade picked from a fixed list, e.g. class_3, class_9 or o_level.';

-- Builders' Bootcamp: take registrations from class 1 to class 12.
update public.campaigns
set
  min_class_level = 1,
  summary = 'Transform your curiosity into innovation through our comprehensive robotics bootcamp, crafted specially for students from Class 1 to Class 12.'
where slug = 'builders-bootcamp';
