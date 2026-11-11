// AI Situation Room release history.
// Add a new object at the top for a feature or editorial change.
window.AISR_RELEASES = [
  {
    version: "1.3",
    date: "2026-11-10",
    dateLabel: "Nov 10, 2026",
    title: "Compact redesign with Tailwind CSS",
    changes: [
      "Restyled the whole site with Tailwind CSS in a compact, information-dense theme: tighter spacing, smaller type, denser cards and tables, so more fits on screen (pages are roughly 10-25% shorter).",
      "All tabs, filters, the light/dark toggle and the 390px mobile layout work as before. Month strips on lab cards now show 3-letter month names, and selected filter chips use the lab colour with readable contrast in both themes."
    ]
  },
  {
    version: "1.2",
    date: "2026-11-10",
    dateLabel: "Nov 10, 2026",
    title: "New tab: Agent-Driven Delivery",
    changes: [
      "Added the Agent-Driven Delivery tab, a weekly brief (week of Nov 10, 2026) for teams delivering software with AI agents: headline, model updates that affect delivery, agent capability watch, lifecycle impact, SDLC and governance (including compliance), cost and economics, Try / Watch / Ignore, and a 3-month outlook labeled as an estimate.",
      "Dates, prices, benchmark scores and source links in the brief are read from the same dataset as the rest of the site; items not in the dataset are marked unknown. Direct link: #delivery."
    ]
  },
  {
    version: "1.1",
    date: "2026-11-10",
    dateLabel: "Nov 10, 2026",
    title: "Light/dark theme toggle",
    changes: [
      "Added a header button to switch between light and dark themes. The site follows the system color scheme by default and remembers your choice."
    ]
  },
  {
    version: "1.0",
    date: "2026-11-10",
    dateLabel: "Nov 10, 2026",
    title: "Initial launch",
    changes: [
      "Lab dashboard in columns, with activity heat, sourced items, and filters for category and lab.",
      "Compare view across labs.",
      "Model progression, both as a standalone chart and versus other labs.",
      "Timeline with a three-month estimate window clearly labeled as an analytic estimate.",
      "Beneath the Surface, comparing official narratives with sourced signals and a gap score.",
      "Compute & chips, covering reported compute, chip supply, and export-control notes in the dataset."
    ]
  }
];
