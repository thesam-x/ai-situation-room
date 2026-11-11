# AI Situation Room

A one-page dashboard that tracks the frontier AI labs (OpenAI, Anthropic, Google DeepMind, xAI, Meta, Mistral, DeepSeek and Alibaba/Qwen): models, benchmarks, economics, products, news and compute, with every item dated and sourced.

**Live:** https://ai-situation-room.vercel.app

![Dashboard](screenshots/live-v1.3-dash-light-1280x800.png)

## Views
- **Dashboard**: a card for each lab, with filter chips, lab toggles, sorting and a monthly activity strip
- **Compare**: the labs side by side
- **Model progression**: each lab's model lineage and benchmark deltas
- **Timeline**: May 2026 to now, with clearly labelled estimates beyond
- **Beneath the Surface**: what labs say compared with what the data shows
- **Compute & chips**
- **Agent-Driven Delivery**: a weekly brief

## Run it
It's a plain static site with no build step and no external JavaScript. Open `index.html` in a browser, or run:

```
python3 -m http.server
```

Styles are Tailwind CSS v4, compiled to `style.css`. The data lives in `data/`.
