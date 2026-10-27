// Small fetch helpers for the data build scripts: retries, timeouts, a worker pool.

const UA = 'how-lucky-am-i-data-build/1.0 (educational project)';

export async function getText(url, { retries = 5, timeout = 90000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    try {
      const res = await fetch(url, { signal: ctl.signal, headers: { 'user-agent': UA }, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.text();
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

export async function getJSON(url, options) {
  return JSON.parse(await getText(url, options));
}

// Run async task functions with at most n in flight. Results keep input order.
export async function pool(tasks, n = 4) {
  const results = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: n }, worker));
  return results;
}
