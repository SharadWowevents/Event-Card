import { AttendeeLead } from '../types';

export function exportLeadsToCsv(leads: AttendeeLead[], eventName: string) {
  const headers = ['Lead ID', 'Full Name', 'Work Email', 'Mobile Number', 'Job Title', 'Company', 'Advocacy Role', 'Channels Used', 'Downloads', 'Shares', 'Generated Timestamp'];

  const rows = leads.map((lead) => [
    lead.id,
    `"${lead.name.replace(/"/g, '""')}"`,
    lead.email,
    lead.mobile || '',
    `"${lead.title.replace(/"/g, '""')}"`,
    `"${lead.company.replace(/"/g, '""')}"`,
    lead.role.toUpperCase(),
    // Join the array with commas inside a quote block so it stays in one cell
    `"${(lead.platformsShared || []).join(', ')}"`,
    lead.downloadsCount,
    lead.sharesCount,
    `"${lead.createdAt}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = eventName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  link.setAttribute('href', url);
  link.setAttribute('download', `${safeName}-advocacy-leads-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}