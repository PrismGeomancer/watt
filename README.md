# WATT — Power the machine.

A responsive control room for a shared AI compute network, built with HTML, CSS and vanilla JavaScript.

## Run locally

Open `index.html` directly, or run:

```sh
python3 -m http.server 8080
```

Visit http://localhost:8080.

## Experience

- Animated GPU workload routing and power gauge
- Inspectable network topology and job filters
- GPU profile selection with capacity and power limits
- Persistent worker sessions, pause/resume, compute time and modeled rewards
- Local account sessions and reset controls
- Contributor overview and activity terminal
- Responsive layouts, accessible dialogs and reduced motion support

## Runtime

The interface runs entirely in the browser. Hardware, jobs, network telemetry, energy and rewards are modeled. It does not access GPUs, connect wallets, execute inference or issue payouts.

Local state uses `localStorage` under `watt-session-v2`. Activity accumulates only while the page is active. Older session data is not imported.

Set `socialUrl` in `js/data.js` to the official Twitter / X profile URL. All Twitter links use this value and open in a new tab. Until configured, the links have no destination.

The `inspo/` folder contains reference material and is not loaded by the site.
