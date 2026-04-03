document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("status");

  if (!fileInput.files.length) {
    status.textContent = "Please select a file.";
    return;
  }

  const file = fileInput.files[0];
  const originalName = file.name; // Captures "stations-20260403224505.xlsx"
  status.textContent = "Processing " + originalName + "...";

  // Helper function to convert file to Base64
  const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });

  try {
    const base64 = await toBase64(file);
    status.textContent = "Uploading to GitHub...";

    // We always save it as gas-prices.xlsx so app.js knows where to look
    const targetName = "gas-prices.xlsx"; 
    const url = `https://api.github.com/repos/jmayoff/qc-gas-prices/contents/${targetName}`;

    // 1. Check if the file already exists to get its 'sha' (required for overwriting)
    let sha = "";
    const getRes = await fetch(url, {
        headers: { "Authorization": "Bearer __UPLOAD_TOKEN__" }
    });
    
    if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
    }

    // 2. Perform the "Direct Commit" upload
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": "Bearer __UPLOAD_TOKEN__",
      },
      body: JSON.stringify({
        // We include the original filename in the message for your records
        message: `Manual Upload: ${originalName}`,
        content: base64,
        sha: sha // Only included if the file already existed
      })
    });

    if (res.ok) {
      status.textContent = "Success! Dashboard will update in ~60 seconds.";
      fileInput.value = ""; // Clear the input
    } else {
      const errorData = await res.json();
      console.error("GitHub API Error:", errorData);
      status.textContent = "Upload failed: " + (errorData.message || "Unknown error");
    }
  } catch (err) {
    console.error("Upload Process Error:", err);
    status.textContent = "An error occurred during the upload process.";
  }
});
