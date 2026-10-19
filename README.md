# ReHarvest

A small, responsive prototype for exploring useful next steps for five agricultural residues: rice husk, corn husk, banana husk, coconut waste, and sugarcane bagasse.

## Configure your API key

1. Open `.env` in the project folder.
2. Replace `your_openrouter_api_key_here` with your OpenRouter key. Keep the key private; `.env` is excluded from Git.
3. The configured model is `openrouter/free`, which chooses a free model. The app requests image input and JSON output so OpenRouter can route to a compatible model, but free endpoints may still be rate-limited or temporarily unavailable.

## Run it

Use Python 3.9 or newer. No packages are required.

```sh
python3 server.py
```

Then open the URL printed in the terminal (normally <http://127.0.0.1:8000>). If that port is already busy, the server automatically tries the next available port. Do not open `index.html` directly; the page calls the local backend at `/api/analyze`.

## Image analysis

The browser previews the selected JPG, PNG, or WEBP image (up to 10 MB). On Analyze, the local backend sends it to OpenRouter over HTTPS and asks the configured vision model to identify one of five supported materials and suggest three possible products. The app does not save the image to disk. Model predictions and product suggestions can be wrong; verify the material and check local processing and safety requirements before acting on an idea.
