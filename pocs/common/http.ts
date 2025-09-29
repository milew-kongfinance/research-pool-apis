const DEFAULT_RETRIES = 3;

interface FetchJsonOptions {
  retries?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
}

async function fetchJson<T>(
  url: string,
  {
    retries = DEFAULT_RETRIES,
    signal,
    headers,
    method = "GET",
    body,
  }: FetchJsonOptions = {}
): Promise<T> {
  try {
    const response = await fetch(url, {
      method,
      signal,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText} for ${url}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (retries > 0) {
      return fetchJson<T>(url, {
        retries: retries - 1,
        signal,
        headers,
        method,
        body,
      });
    }

    throw error;
  }
}

export const getJson = <T>(
  url: string,
  options?: Omit<FetchJsonOptions, "method" | "body">
) => fetchJson<T>(url, { ...options, method: "GET" });

export const postJson = <T, U>(
  url: string,
  body: T,
  options?: Omit<FetchJsonOptions, "method" | "body">
) => fetchJson<U>(url, { ...options, method: "POST", body });
