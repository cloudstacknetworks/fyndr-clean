export const STAGES = [
  { id: 'INTAKE', label: 'Intake', color: 'bg-blue-100 text-blue-700' },
  { id: 'QUALIFICATION', label: 'Qualification', color: 'bg-blue-100 text-blue-700' },
  { id: 'DISCOVERY', label: 'Discovery', color: 'bg-blue-100 text-blue-700' },
  { id: 'DRAFTING', label: 'Drafting / Response', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'PRICING_LEGAL_REVIEW', label: 'Pricing & Legal Review', color: 'bg-amber-100 text-amber-700' },
  { id: 'EXEC_REVIEW', label: 'Executive Review', color: 'bg-amber-100 text-amber-700' },
  { id: 'SUBMISSION', label: 'Submission', color: 'bg-green-100 text-green-700' },
  { id: 'DEBRIEF', label: 'Debrief / Outcome', color: 'bg-green-100 text-green-700' },
  { id: 'ARCHIVED', label: 'Archived', color: 'bg-gray-100 text-gray-700' }
];

export const STAGE_ORDER = STAGES.map(s => s.id);

export const STAGE_LABELS: Record<string, string> = STAGES.reduce((acc, s) => {
  acc[s.id] = s.label;
  return acc;
}, {} as Record<string, string>);

export const STAGE_COLORS: Record<string, string> = STAGES.reduce((acc, s) => {
  acc[s.id] = s.color;
  return acc;
}, {} as Record<string, string>);

export const VALID_STAGES = STAGES.map(s => s.id);
