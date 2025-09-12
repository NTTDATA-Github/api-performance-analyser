import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/2.2.0/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

// ----- Test Options -----
export const options = {
  vus: 5,
  duration: '20s',
  thresholds: {
    http_req_duration: ['p(95)<2500'], // Slightly higher threshold for POST
    checks: ['rate>0.99'],
  },
  tags: {
    template: 'dynamic-k6',
  },
};

// ----- Custom Metric -----
const endpoint_duration = new Trend('post_api_duration');

// ----- Main Test -----
export default function () {
  const url = 'https://jsonplaceholder.typicode.com/posts';
  const method = 'POST';
  const payload = JSON.stringify({
    title: 'k6 is awesome',
    body: 'This is a test post from k6.',
    userId: 1,
  });
  const headers = {
    'Content-Type': 'application/json',
  };
  const params = { headers: headers };

  const res = http.request(method, url, payload, params);
  endpoint_duration.add(res.timings.duration);

  // ----- Basic Checks -----
  const ok = check(res, {
    'status is 201 Created': (r) => r.status === 201,
    'content-type is json': (r) =>
      String(r.headers['Content-Type'] || '').includes('application/json'),
    'response body contains "id"': (r) => r.json().id !== undefined,
  });

  if (!ok) {
    console.error(`Test failed for ${method} ${url} - Status: ${res.status}`);
  }

  sleep(1);
}

// ----- HTML Report -----
export function handleSummary(data) {
  return {
    "post-api-report.html": htmlReport(data, { title: "k6 POST Test Report" }),
    stdout: textSummary(data, { enableColors: true }),
  };
}