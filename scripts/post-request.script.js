import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/2.2.0/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

// ----- Test Options -----
export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% under 2s
    http_req_failed: ['rate<0.01'],    // Less than 1% failures
    checks: ['rate>0.95'],             // 95% checks must pass (more realistic)
  },
  tags: {
    template: 'dynamic-k6-enhanced',
    test_type: '',
  },
};

// ----- Custom Metrics -----
const endpoint_duration = new Trend('endpoint_duration');
const response_size = new Trend('response_size');

// ----- Helper Functions -----
function parseOrNull(raw) {
  if (!raw || raw === 'null' || raw === '') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw; // allow plain string payloads
  }
}

function isGraphQLRequest(payload) {
  if (!payload || typeof payload !== 'object') return false;
  return payload.hasOwnProperty('query') || payload.hasOwnProperty('mutation');
}

function getContentType(headers, payload, method) {
  // If Content-Type is explicitly set, use it
  const explicitContentType = headers['Content-Type'] || headers['content-type'];
  if (explicitContentType) return explicitContentType;
  
  // Auto-detect based on payload and method
  if (method === 'GET' || method === 'DELETE') return null;
  if (payload && typeof payload === 'object') return 'application/json';
  if (payload && typeof payload === 'string') {
    try {
      JSON.parse(payload);
      return 'application/json';
    } catch {
      return 'text/plain';
    }
  }
  return 'application/json';
}

function validateGraphQLResponse(response) {
  try {
    const body = JSON.parse(response.body);
    return {
      hasData: !!body.data,
      hasErrors: !!(body.errors && body.errors.length > 0),
      errorCount: body.errors ? body.errors.length : 0,
    };
  } catch {
    return { hasData: false, hasErrors: true, errorCount: 1 };
  }
}

// ----- Main Test Function -----
export default function () {
  const url = 'https://staging-api.xchange.exclusive-networks.com/graphql';
  const method = 'POST'.toUpperCase();
  const rawPayload = parseOrNull(`{"query":"query GetResellerOrder { getResellerOrder(input: { orderId: \\"23570ac7-02df-4ca9-a65b-575af4f04bae\\" }) { status { success message } data { orderNumber } } }"}`);
  const baseHeaders = {"Authorization":"Bearer eyJhbGciOiJSU0EtT0FFUC0yNTYiLCJlbmMiOiJBMjU2R0NNIn0.kK1YNInTZhyudqwNTyvB4f4Jd9vk5KCEPRGtgeIcfvAARJDPhkumu5G-AT8EnxgMCTxsseNHHIsoFCdfeaKZj01PEBRYz3uAhFqg_gQ3FsdoB2rdB4AsKwed30fuUuFqHbSP1Q0q-_27rBtKCtUEKWinxbXsMDzw-v9c3AzMxrnDvuVReu3YSq2AHlpnh18O5fi64txgYAXbEGWcnup_58BQZGFhAqCj228Lnoa7QRrrkOjl4ZwEAqLwxQD5XPP2LwZKcKhqB3W_ntnC66fCvGWitK2WZ4pEZizu0HCoWcTCNAk4ZhfMJZ9P6q2e6Fro_aCPZt7RXJkA1k9RzGdCdQ.5bFPlDwcGmethFgu.DEgPTduo9w3C6VufxGXAeStHjaWGo0pAYFMZA4YM4iy1fDzVwQ7RRM54Ax-JjvSdYedGR4603oryZEHLYb8jUweC4Iwr4_864accse5-1jsHTc5vyzEX7hIr9rfBNiI15-NEM4k20-A_vrgZxoKN4GjCTYwHduYf74h-YYsvGSz_zAqUqYOixNBDVZWWxIzj9iBunZvFXdwBweDnQGxH-eceMIKLHyKygI4-UfQ_HpIZMWBuDR2s3hsOpiljG7n7UyzS6a_TduOXN0tqUNuaPHGxx74x6wMiS3LmDyAwaKSqnAHtXingJ1IAZs4lK_-ZzTYIOgDa9EBhI0aA6OOGV1Y2CHVxpA-hUsL6YhAsc03ykQkQ4HjpFiE4TrbiBkF5xaYBe6At75tX0qDN4BTeFOpGNkNv2ovecoH44vlhw5JG2XmntYCrqdaHOHweWgugnUs_-WDGVI0aO-TaJNJsfLnagoe0jG2J_4I4-93lIdlzUBTx4ml19T4N2hv-4H0U94JtmqKJouJVXrjqHDeWv_lycog0oT_KB3AykY23Iwrt3Xod2E3_tEU4xwxZhvr4b39M7kPlH9GVztF4rEGLkbbnlSllW5fDB3XodDFNByJh8b_eF8B6QUwzm-mwAHJ2f-2G3f9LGw5rD-CcYBFiBWY3DjsSkXjRV1xHVaIufQIVCT1ZUvJhnp_Z9ycHbHypPS_sk9X6XdCtMdRH5KispHwBdkoEfUIdaPL0HnSCPjJUIh31IpOeZ2WbjeyoQA0DAVTmhIpkRcUw0_Hx1bE_pAqe1vGDW81MJmsfeBRYagRqdgFFP1AnxfRzT0bbPAian-18eTlpwaeG5kCe4VCw9ERvJ63o4jdt5ZvPd30L-b11P7LsgiuWh1Rm7_fey5x_oRRGIbt1mmf_4UZDfbWCMZWx79XutUZu4f65Y3FdqSgqzLDCuk0GsSjtctKHhdYRY7u8u8oYEbTebYl44ZxZZ0n7SQ73lafsJANS_59oO5f7D1lAN4yDuTDQEpLOfh0jRl-ofuTurHmC35Wo691_2ADQPiNJ_l5dtCDXzV2ixFd3mikt_DaxUfAmgpCjVnRwW1Ryq2y7e4VGUad0sx8YtOf25eoW-aWnQOisMF5wCJOrtBUGc7U1GVr_SoIj8miGyncc-CF1Ih_5mFnuoNmUqlbhQPS1C6nrYUlDhOVLdUfAKhsPrOhckircYBpM411-XCypcsLif7flHB_y1ci7QF1zq-Ql-kt9HOLx1m827GNrr169RpGp-nL95Ps65vvfy-jkCjzSvO-GeiOTnuULt_jfNYd3nWjPcJPI51X0YHX_8o2KY09nq1ro3cwp34qwVGecui5ufDkxBGBmcmeSmw4rQB2luwbLckWu4_VfVemrs8PSrhGq_tC9RPWrgA3PrWrTObS1Rfek68WL20gE3EAzwDs6yzdp5i--eqBiygoIU7eGE9rHoohfdz93hBymbBQtHdZcpMCSGlPqCk9CmNcWLIkKIIWTGgAHKUXkivhqvfEeR95DZoPfqQdWNzpZ5eAlVRG-9oSdHoCP4J4IbYsTQf3fh6YgQfswaXz6yGg3hPlb5Kb5gXl-FZ0nTJ8eCyquV5CqZmfWABwLPoN9QNBB7Qkhfma0A5Eb3jULdoZx4ew8AtjhQ7U4Jorof24oDGwqFb07oNnbnccvrhsBiv45Zkq3EVdaFDiryde3asmxCEwoVep_YXdIC8I6Tg3nlbp-HOR0762-HHx8I8Xz6NKs8-D7R_GQg8NopLUuBFqw_dK9zFF8bTl6QNIebVNY4ViE0O9ffDRD3HJlO8b4Tr__YR0a4XI0er-19sVL72_IIjo1zCcnA68aK51ABtfpZWvqeQK-l83Yh3pUKLaDzuRLjJfISvAWPKDnxwKaM29-cWcYFzfFsGWWmzeH3-VFCEtnE1TV7N2sz7juzz-oqzq5p-18wAaA3hYzCPmISRB0hpkKXZkgChIGT5tf7Q4.Jd3rrrQnqIzCMFgEqm-7dg","Content-Type":"application/json"};
  const testType = '' || 'REST';
  
  // Prepare headers with auto-detection
  const headers = { ...baseHeaders };
  const autoContentType = getContentType(headers, rawPayload, method);
  if (autoContentType && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = autoContentType;
  }

  const params = { 
    headers,
    timeout: '30s', // Add timeout for better error handling
  };

  // Prepare body based on method and payload
  let body = null;
  if (method !== 'GET' && method !== 'DELETE' && rawPayload) {
    body = typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload);
  }

  // Make the request
  const res = http.request(method, url, body, params);
  
  // Record custom metrics
  endpoint_duration.add(res.timings.duration);
  response_size.add(res.body ? res.body.length : 0);

  // Determine if this is a GraphQL request
  const isGraphQL = testType === 'GRAPHQL' || isGraphQLRequest(rawPayload);

  // ----- Dynamic Checks Based on Request Type -----
  let checks = {};

  if (isGraphQL) {
    // GraphQL-specific checks
    const gqlValidation = validateGraphQLResponse(res);
    checks = {
      'GraphQL: status is 200': (r) => r.status === 200,
      'GraphQL: response is valid JSON': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
      'GraphQL: has data or errors field': (r) => {
        const validation = validateGraphQLResponse(r);
        return validation.hasData || validation.hasErrors;
      },
      'GraphQL: no server errors (5xx)': (r) => r.status < 500,
    };
  } else {
    // REST API checks
    checks = {
      'REST: status is successful': (r) => {
        // Different success criteria based on method
        switch (method) {
          case 'GET':
            return r.status === 200;
          case 'POST':
            return r.status === 200 || r.status === 201;
          case 'PUT':
            return r.status === 200 || r.status === 204;
          case 'PATCH':
            return r.status === 200 || r.status === 204;
          case 'DELETE':
            return r.status === 200 || r.status === 204 || r.status === 404;
          default:
            return r.status >= 200 && r.status < 300;
        }
      },
      'REST: response time under 5s': (r) => r.timings.duration < 5000,
      'REST: no server errors (5xx)': (r) => r.status < 500,
    };

    // Add content-type check for JSON APIs (optional)
    if (headers['Content-Type'] && headers['Content-Type'].includes('application/json')) {
      checks['REST: response is JSON'] = (r) => {
        const contentType = r.headers['Content-Type'] || r.headers['content-type'] || '';
        return contentType.includes('application/json') || r.status === 204; // 204 No Content is OK
      };
    }
  }

  // Run the checks
  const ok = check(res, checks);

  // Enhanced error logging
  if (!ok) {
    console.error(`Test failed for ${method} ${url}`);
    console.error(`   Status: ${res.status}`);
    console.error(`   Duration: ${res.timings.duration}ms`);
    
    if (isGraphQL) {
      const gqlValidation = validateGraphQLResponse(res);
      if (gqlValidation.hasErrors) {
        console.error(`   GraphQL Errors: ${gqlValidation.errorCount}`);
      }
    }
    
    // Truncate long responses for readability
    const responseBody = res.body || '';
    if (responseBody.length > 500) {
      console.error('   Response body (truncated):', responseBody.substring(0, 500) + '...');
    } else {
      console.error('   Response body:', responseBody);
    }
  } else if (__ENV.DEBUG) {
    // Optional debug logging when DEBUG=1 is set
    console.log(`${method} ${url} - ${res.status} (${res.timings.duration}ms)`);
  }

  // Variable sleep time based on test type
  const sleepTime = isGraphQL ? 0.5 : 1; // GraphQL can often handle higher throughput
  sleep(sleepTime);
}

// ----- Enhanced HTML Report -----
export function handleSummary(data) {
  const testType = '' || 'REST';
  const reportTitle = `k6 ${testType} API Test Report`;
  
  return {
    "C:\\Users\\sridar.cs\\api-performance-analyser\\dist\\k6\\reports\\result.html": htmlReport(data, { 
      title: reportTitle,
      debug: true,
    }),
    stdout: textSummary(data, { 
      enableColors: true,
      indent: ' ',
    }),
  };
}