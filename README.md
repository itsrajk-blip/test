# Premier property website concept

Replica of the Premier Property Agents reference homepage, with the original navy/gold styling, logo, section order, copy, property photographs and video embed. Includes local demo text chat and Retell browser voice calling using the configured Retell agent.

## Setup and run

Requires Node.js/npm and Python 3. From `/workspace/test`:

```sh
npm ci --cache /tmp/premier-npm --ignore-scripts
npm run build
python3 server.py
```

The server listens on port 3000 (override with PORT). Use HTTPS in a deployed browser for microphone access. The plain static Python HTTP server cannot handle voice calls.

## Credentials and calls

`RETELL_API_KEY` must be injected through cloud HTTP secrets for `api.retellai.com`; never put it in repository files or browser code. The server uses Retell's v3 create-web-call endpoint with agent `agent_71e55befe1d7f8c935338a625d` by default (override server-side with `RETELL_AGENT_ID`) and returns only ephemeral call connection fields. Browser audio uses the Retell SDK's gateway transport. Retell handles call data according to the agent's recording and retention settings. Calls may incur usage charges.

Choose AI receptionist below the property search to start connecting immediately, allow microphone access, speak, and use End call when finished. No access code or second start action is required. Text chat remains a local demo and does not send enquiries.

This is a private testing server, not a public production deployment. It permits one new session per 30 seconds globally and rejects cross-site browser requests, but has no user authentication. Add authentication, robust abuse controls, and deployment configuration before exposing billable calling publicly.

## Validation

Verified credentialed agent lookup and successful v3 browser-call session creation. Browser checks cover voice dialog, microphone denial and retry, closing, text-chat access, listing filters, mobile width, and blocked access to server/source configuration files. End-to-end human microphone/audio conversation is pending testing in the user's HTTPS browser.

## Reference

Reference: https://www.premierpropertyagents.com.au/. Reference homepage inspected on 24 October 2026. `public/reference.css` retains its original published stylesheet and license notices. `index.html` is a static, editable capture of the rendered homepage, with independent interactions in `app.js`. The original app bundle and backend are not copied. Logo and three listing photos are retained in `public/images`; service/team photos, Google font and YouTube video retain their original external URLs. Those external hosts are blocked in this cloud environment and could not be visually verified here. They are requested directly by the visitor browser on Vercel.

Listings are captured reference examples, not a live feed. Search filters the three captured sale listings; Sold/Lease show an explicit empty state. Internal links navigate to corresponding homepage sections rather than replicating every secondary page. Contact form submissions stay local and show a demo notice. No agency email or CRM is connected. Receptionist and chat controls are integrated below the property search in the hero section. Obtain the agency owner's approval before using their branding and content for a public launch.

## Deploy to Vercel

1. Put this project's source files in the root of your GitHub repository. Include api/voice/call.mjs and api/voice/status.mjs, build.mjs, vercel.json, package.json, package-lock.json, index.html, style.css, app.js and voice.js. Do not upload node_modules, .env files or credentials.
2. In Vercel, Add New → Project → import the GitHub repository. Framework preset: Other. Root directory: the directory containing package.json (repository root if uploaded as above). Build command: npm run build. Output directory: dist. Install command: npm ci.
3. Add RETELL_API_KEY (Retell private API key) and optionally RETELL_AGENT_ID (to override the default agent) to the project's Environment Variables for the deployment environments you use. Vercel's server runtime receives the real API key; this is separate from this cloud's HTTP-secret binding. Do not prefix either variable with NEXT_PUBLIC_ or VITE_.
4. Deploy. Open Vercel's generated HTTPS URL. AI receptionist → allow microphone → speak → End call.
5. Changing variables requires a new deployment. Keep Retell usage limits appropriate for testing. The password requirement was removed at the user’s request. Same-origin browser guards remain; they do not authenticate callers or provide durable distributed rate limiting.

Local builds now write dist/voice.bundle.js. The Python server serves that bundle. Neither server requires TEST_ACCESS_CODE; any previously saved value is ignored. Both require RETELL_API_KEY.
