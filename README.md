# Character Tables

Interactive workbench for **condensed character tables** over finite fields in general **q**.

Hosted at **https://cable729.github.io/character-tables/**. Sage runs **on your machine** via local Jupyter.

See [ARCHITECTURE.md](ARCHITECTURE.md) for codebase orientation. [AGENTS.md](AGENTS.md) has tips for automated agents.

## Setup (once per machine)

1. Add Jupyter CORS config — copy [docs/jupyter_server_config_snippet.py](docs/jupyter_server_config_snippet.py) into `~/.jupyter/jupyter_server_config.py` and **restart** Sage/Jupyter.
2. Run `jupyter server list`, copy the `http://localhost:8888/?token=…` URL.
3. In the app → **Server settings** → paste → **Connect**.

Details: **[docs/jupyter-setup.md](docs/jupyter-setup.md)**

## Development

```bash
npm install
npm run dev
```

Same Jupyter config works for local dev and GitHub Pages (no separate proxy).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run test` | Unit tests |
| `npm run lint` | ESLint |
| `npm run benchmark:sage:quick` | Smoke-test combined Sage check run at q=2 |
| `npm run benchmark:sage:by-q` | Per-check timing benchmark (writes `docs/sage-check-timing-ut4.md`) |
