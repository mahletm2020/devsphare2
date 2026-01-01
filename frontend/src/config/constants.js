export const API_BASE_URL = 'http://localhost:8000/api/v1';

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ORGANIZER: 'organizer',
  SPONSOR: 'sponsor',
  PARTICIPANT: 'participant',
  JUDGE: 'judge',
  MENTOR: 'mentor',
};

export const HACKATHON_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  REGISTRATION_CLOSED: 'registration_closed',
  SUBMISSION_CLOSED: 'submission_closed',
  JUDGING: 'judging',
  RESULTS_PUBLISHED: 'results_published',
};

export const HACKATHON_TYPES = {
  ONLINE: 'online',
  IN_PERSON: 'in_person',
  HYBRID: 'hybrid',
};