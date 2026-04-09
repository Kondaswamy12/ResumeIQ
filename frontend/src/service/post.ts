// src/services/post.ts

export const postRequest = async (url: string, body: any) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`POST request failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("POST request error:", error);
    throw error;
  }
};