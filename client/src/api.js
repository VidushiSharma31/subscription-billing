const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export { API_URL };

export const apiRequest = async (path, { token, headers, body, ...options } = {}) => {
    const requestHeaders = { ...headers };

    if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
    }

    if (body !== undefined && !(body instanceof FormData)) {
        requestHeaders["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: requestHeaders,
        body: body !== undefined && !(body instanceof FormData)
            ? JSON.stringify(body)
            : body
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const message = typeof data === "object" && data?.message
            ? data.message
            : "Request failed";
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    return data;
};
