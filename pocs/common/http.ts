const DEFAULT_RETRIES = 3;

export async function getJson<T>(
  url: string,
  {
    retries = DEFAULT_RETRIES,
    signal,
  }: { retries?: number; signal?: AbortSignal } = {}
): Promise<T> {
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText} for ${url}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (retries > 0) {
      return getJson<T>(url, { retries: retries - 1, signal });
    }

    throw error;
  }
}
