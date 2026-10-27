// Local Python server bridge; reuses the exact Vercel chat handler.
import handler from './api/chat.mjs';
let input = '';
for await (const chunk of process.stdin) input += chunk;
const request = JSON.parse(input);
const result = { code: 200, data: null };
await handler(request, {
  setHeader() {},
  status(code) { result.code = code; return this; },
  json(data) { result.data = data; return this; },
});
process.stdout.write(JSON.stringify(result));
