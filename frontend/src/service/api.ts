// src/services/api.ts

export const getRequest = async (url: string) => {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("GET request error:", error);
    throw error;
  }
};