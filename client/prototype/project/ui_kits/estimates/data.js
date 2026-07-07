// Shared fake data + helpers for the Boncom Estimates UI kit.
window.EstData = (function () {
  const estimates = [
    { id: 'RVB-004', client: 'Riverbend Foundation', project: 'Brand film — 90s', owner: 'M. Alvarez', status: 'draft',    total: 48200, updated: 'Today' },
    { id: 'CLN-118', client: 'Cleanwater Alliance', project: 'Annual report + microsite', owner: 'S. Okafor', status: 'sent',     total: 63400, updated: 'Yesterday' },
    { id: 'HOP-052', client: 'Hope Collective', project: 'Fundraising campaign', owner: 'M. Alvarez', status: 'approved', total: 122000, updated: '2 days ago' },
    { id: 'GRN-231', client: 'Greenline Trust', project: 'Social video series', owner: 'J. Pike', status: 'sent',     total: 27500, updated: '3 days ago' },
    { id: 'LIT-009', client: 'Literacy Now', project: 'Website redesign', owner: 'S. Okafor', status: 'revised',  total: 89100, updated: 'Last week' },
    { id: 'FDB-077', client: 'Foodbank Regional', project: 'PSA broadcast spot', owner: 'J. Pike', status: 'rejected', total: 54000, updated: 'Last week' },
    { id: 'SHL-045', client: 'Shelter First', project: 'Donor stewardship kit', owner: 'M. Alvarez', status: 'draft',    total: 18750, updated: 'Last week' },
    { id: 'EDU-300', client: 'EdReach', project: 'Explainer animation', owner: 'J. Pike', status: 'approved', total: 41200, updated: '2 weeks ago' },
  ];

  const lineItems = [
    { section: 'Pre-production', desc: 'Creative direction & scripting', qty: 3, unit: 'days', rate: 1250, },
    { section: 'Pre-production', desc: 'Storyboarding', qty: 2, unit: 'days', rate: 950 },
    { section: 'Production', desc: 'Director', qty: 2, unit: 'days', rate: 1800 },
    { section: 'Production', desc: 'Crew & equipment', qty: 2, unit: 'days', rate: 4200 },
    { section: 'Production', desc: 'Location & permits', qty: 1, unit: 'flat', rate: 2400 },
    { section: 'Post-production', desc: 'Editorial', qty: 5, unit: 'days', rate: 1100 },
    { section: 'Post-production', desc: 'Color & sound mix', qty: 2, unit: 'days', rate: 1350 },
    { section: 'Post-production', desc: 'Motion graphics', qty: 3, unit: 'days', rate: 1150 },
  ];

  const money = (n) => '$' + n.toLocaleString('en-US');

  return { estimates, lineItems, money };
})();
