/**
 * Starting suggestions for the position and source fields — a shortlist to
 * pick from instead of typing, not a closed vocabulary: both fields still
 * take arbitrary free text for anything not on the list (see PositionField
 * and SourceField). Kept short enough to scan in one dropdown; the field's
 * own text input doubles as the search box, so a longer list would still be
 * reachable by typing rather than needing a separate search control.
 */
export const POSITION_SUGGESTIONS: string[] = [
  'Software Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Full Stack Engineer',
  'Mobile Engineer',
  'Platform Engineer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Data Engineer',
  'Data Scientist',
  'Data Analyst',
  'Machine Learning Engineer',
  'QA Engineer',
  'Security Engineer',
  'Engineering Manager',
  'Product Manager',
  'Product Designer',
  'UX/UI Designer',
  'Technical Writer',
  'Solutions Engineer',
  'Support Engineer',
  'Business Analyst',
  'Project Manager',
]

/** Common channels an application gets sent through, in roughly the order most job seekers use them. */
export const SOURCE_SUGGESTIONS: string[] = [
  'LinkedIn',
  'Referral',
  'Company site',
  'Indeed',
  'Glassdoor',
  'HeadHunter',
  'AngelList / Wellfound',
  'Recruiter outreach',
  'Job fair',
  'X / Twitter',
]
