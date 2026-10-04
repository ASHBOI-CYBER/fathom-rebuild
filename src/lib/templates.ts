export type TemplateDef = { id: string; name: string; blurb: string; fits: string[] };

/** Note templates. `fits` lists the meeting types each template is written for. */
export const TEMPLATES: TemplateDef[] = [
  { id: 'general', name: 'General', blurb: 'Purpose, takeaways, topics and next steps', fits: [] },
  { id: 'decisions', name: 'Decision log', blurb: 'Every decision, who made it, and what is still open', fits: ['Planning', 'Retro', 'Design review', 'Customer'] },
  { id: 'project_update', name: 'Project update', blurb: 'Status, progress, risks and blockers', fits: ['Planning', 'Sync', 'Design review'] },
  { id: 'sales_meddpicc', name: 'Sales · MEDDPICC', blurb: 'Qualification by metrics, buyer, criteria, process', fits: ['Sales'] },
  { id: 'sales_bant', name: 'Sales · BANT', blurb: 'Budget, authority, need, timeline', fits: ['Sales', 'Demo'] },
  { id: 'demo', name: 'Demo', blurb: 'What was shown, reactions and objections', fits: ['Demo'] },
  { id: 'customer_success', name: 'Customer success', blurb: 'Account health, goals, risks, expansion', fits: ['Customer'] },
  { id: 'one_on_one', name: 'One-on-one', blurb: 'Wins, challenges, feedback, growth', fits: ['1:1'] },
  { id: 'standup', name: 'Stand-up', blurb: 'Yesterday, today and blockers per person', fits: ['Stand-up'] },
  { id: 'interview', name: 'Candidate interview', blurb: 'Strengths, concerns, signal, recommendation', fits: ['Interview'] },
  { id: 'retrospective', name: 'Retrospective', blurb: 'Timeline, what went well and wrong, root cause', fits: ['Retro'] },
];

export const templateName = (id: string) => TEMPLATES.find((t) => t.id === id)?.name ?? id;

/**
 * Best template for a meeting type. Types with a purpose-built template (sales,
 * demo, 1:1…) get it; open-ended ones like planning start on General, which
 * leads with purpose and takeaways — the right first read.
 */
export function suggestedTemplate(type: string, available: string[]) {
  const generic = new Set(['decisions', 'project_update']);
  const fit = TEMPLATES.find((t) => !generic.has(t.id) && t.fits.includes(type) && available.includes(t.id));
  return fit?.id ?? 'general';
}
