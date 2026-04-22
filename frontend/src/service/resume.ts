// src/service/resume.ts

export const uploadResume = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("https://resumeiq-606i.onrender.com/api/upload-resume", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload resume");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error uploading resume:", error);
    throw error;
  }
};
