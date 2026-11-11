// AI Situation Room release history.
// Add a new object at the top for a feature or editorial change.
window.AISR_RELEASES = [
  {
    version: "1.5",
    date: "2026-11-10",
    dateLabel: "Nov 10, 2026",
    title: "Markets tab",
    changes: [
      "New Markets tab: 111 publicly traded AI-related companies (US and major foreign listings) with price, day change, market cap, 1-year change and a quote link, grouped by market-cap tier (>$1T down to <$1B) or by segment.",
      "Segment and market-cap filters with All / None and solo (Alt/Option-click or double-click), plus sort and a ticker/name search. A separate table lists private AI unicorns with their latest reported valuation, date and source; they are not tradable.",
      "Numbers come from delayed public market data refreshed by a script; anything that could not be fetched shows a dash. Not investment advice.",
      "Compare tab: new apples-to-apples benchmark table. Every text model is a row and every benchmark a column, using one metric and harness per column (independent Epoch AI runs and public leaderboards), each model at its highest evaluated reasoning effort. Gaps show n/r, columns are sortable, and vendor self-reported Terminal-Bench numbers are marked and kept separate."
    ]
  },
  {
    version: "1.4",
    date: "2026-11-10",
    dateLabel: "Nov 10, 2026",
    title: "Quick All / None for filters",
    changes: [
      "Added All and None buttons next to the Show (sections) and Labs filter chips on the Dashboard, so you can select or clear a whole group in one click.",
      "Alt/Option-click or double-click a chip to show only that one (hover a chip for the hint). Keyboard: Tab to a chip, then Alt+Enter. Chips now announce their on/off state to screen readers.",
      "Added a one-line support note in the page footer."
    ]
  },
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
