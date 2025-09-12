import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/2.2.0/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

// ----- Test Options -----
export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    checks: ['rate>0.99'],
  },
  tags: {
    template: 'dynamic-k6',
  },
};

// ----- Custom Metric -----
const endpoint_duration = new Trend('get_api_duration');

// ----- Helper Function to Parse Payload Safely -----
function parsePayload(payload) {
  if (!payload || payload === 'null') return null;
  try {
    return JSON.parse(payload);
  } catch (e) {
    console.error('Failed to parse payload:', e);
    return null;
  }
}

// ----- Main Test -----
export default function () {
  const url = 'https://jsonplaceholder.typicode.com/posts/1';
  const method = 'GET';
  const payload = null; // No payload for GET requests
  const headers = { 'Content-Type': 'application/json' };
  const params = { headers: headers };

  const res = http.request(method, url, payload, params);
  endpoint_duration.add(res.timings.duration);

  // ----- Basic Checks -----
  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
    'content-type is json': (r) =>
      String(r.headers['Content-Type'] || '').includes('application/json'),
    'response has "id" field': (r) => r.json().id !== undefined,
  });

  if (!ok) {
    console.error(`Test failed for ${method} ${url} - Status: ${res.status}`);
  }

  sleep(1);
}

// ----- HTML Report -----
export function handleSummary(data) {
  return {
    "get-api-report.html": htmlReport(data, { title: "k6 GET Test Report" }),
    stdout: textSummary(data, { enableColors: true }),
  };
}