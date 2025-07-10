import { QueryClient } from "@tanstack/react-query";

// Centralized error handling for API requests
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`${res.status}: ${errorText || res.statusText}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  body?: any,
  options: RequestInit = {}
): Promise<Response> {
  const requestOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, requestOptions);
  await throwIfResNotOk(response);
  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => (context: { queryKey: readonly unknown[] }) => Promise<T | null> =
  ({ on401 }) =>
  async ({ queryKey }) => {
    const [url] = queryKey as [string, ...unknown[]];
    try {
      const response = await fetch(url);
      if (response.status === 401) {
        if (on401 === "returnNull") {
          return null;
        }
        throw new Error("401: Unauthorized");
      }
      await throwIfResNotOk(response);
      return response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes("401") && on401 === "returnNull") {
        return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes("401")) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});
