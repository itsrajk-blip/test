# Premier property website concept

Responsive property agency concept with sample listings, local demo text chat, and Retell browser voice calling using the existing Rayan Cleaning Services agent unchanged.

## Setup and run

Requires Node.js/npm and Python 3. From `/workspace/test`:

```sh
npm ci --cache /tmp/premier-npm --ignore-scripts
npm run build
python3 server.py
```

The server listens on port 3000 (override with PORT). Use HTTPS in a deployed browser for microphone access. The plain static Python HTTP server cannot handle voice calls.

## Credentials and calls

`RETELL_API_KEY` must be injected through cloud HTTP secrets for `api.retellai.com`; never put it in repository files or browser code. The server uses Retell's v3 create-web-call endpoint with fixed agent `agent_71e55befe1d7f8c935338a625d` and returns only ephemeral call connection fields. Browser audio uses the Retell SDK's gateway transport. Retell handles call data according to the agent's recording and retention settings. Calls may incur usage charges.

Choose AI receptionist, then Start test call, allow microphone access, speak, and use End call when finished. Text chat remains a local demo and does not send enquiries.

This is a private testing server, not a public production deployment. It permits one new session per 30 seconds globally and rejects cross-site browser requests, but has no user authentication. Add authentication, robust abuse controls, and deployment configuration before exposing billable calling publicly.

## Validation

Verified credentialed agent lookup and successful v3 browser-call session creation. Browser checks cover voice dialog, microphone denial and retry, closing, text-chat access, listing filters, mobile width, and blocked access to server/source configuration files. End-to-end human microphone/audio conversation is pending testing in the user's HTTPS browser.

## Reference

Requested reference: https://www.premierpropertyagents.com.au/. Initial access was blocked, so this is an original agency-style concept rather than a verified visual reproduction. CSS illustrations and listings are samples.

## Deploy to Vercel

1. Put this project's source files in the root of your GitHub repository. Include api/voice/call.mjs and api/voice/status.mjs, build.mjs, vercel.json, package.json, package-lock.json, index.html, style.css, app.js and voice.js. Do not upload node_modules, .env files or credentials.
2. In Vercel, Add New → Project → import the GitHub repository. Framework preset: Other. Root directory: the directory containing package.json (repository root if uploaded as above). Build command: npm run build. Output directory: dist. Install command: npm ci.
3. Add RETELL_API_KEY (Retell private API key) and TEST_ACCESS_CODE (a long private code you choose) to the project's Environment Variables for the deployment environments you use. Vercel's server runtime receives the real API key; this is separate from this cloud's HTTP-secret binding. Do not prefix either variable with NEXT_PUBLIC_ or VITE_.
4. Deploy. Open Vercel's generated HTTPS URL. AI receptionist → enter the private test code → Start test call → allow microphone → speak → End call.
5. Changing variables requires a new deployment. Share the test code only with intended testers. Keep Retell usage limits appropriate for testing. This shared code is prototype access protection, not per-user authentication or a durable distributed rate limiter.

Local builds now write dist/voice.bundle.js. The Python server serves that bundle. The local server enforces TEST_ACCESS_CODE if supplied; the Vercel endpoint requires it and fails closed without both variables.
