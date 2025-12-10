// src/core/api/client.ts

export const API_CONFIG = {
  BASE_URL: import.meta.env.PUBLIC_API_URL || "http://localhost:4001/v1",
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

export const apiClient = {
  get: async <T>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<T> => {
    const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: API_CONFIG.HEADERS,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API Error (${response.status}): ${errorBody}`);
    }

    return await response.json();
  },

  post: async <T>(endpoint: string, body: any): Promise<T> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: "POST",
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API Error (${response.status})`);
    }

    return await response.json();
  },
};
