const API_URL = process.env.NEXORA_API_URL ?? 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

/** Dashboard API client — all data flows through the internal API */
export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const url = new URL(path, API_URL);

  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error?.message ?? 'API request failed');
  }

  return data.data as T;
}

export const api = {
  health: () => apiFetch<{ status: string }>('/api/health'),
  me: () => apiFetch<{ user: unknown }>('/api/me'),
  guildSettings: (guildId: string) =>
    apiFetch<Record<string, unknown>>(`/api/guilds/${guildId}/settings`),
  guildLogs: (guildId: string) => apiFetch<unknown[]>(`/api/guilds/${guildId}/logs`),
};
