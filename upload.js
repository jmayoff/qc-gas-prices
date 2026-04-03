document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("status");

  if (!fileInput.files.length) {
    status.textContent = "Please select a file.";
    return;
  }

  const file = fileInput.files[0];
  status.textContent = "Preparing file...";

  // This helper function converts the file to Base64 safely
  const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // The result looks like "data:application/vnd.ms-excel;base64,XXXX..."
      // We only want the part after the comma
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });

  try {
    const base64 = await toBase64(file);
    status.textContent = "Uploading to GitHub...";

    const res = await fetch("https://api.github.com/repos/jmayoff/qc-gas-prices/dispatches", {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": "Bearer __UPLOAD_TOKEN__",
      },
      body: JSON.stringify({
        event_type: "upload-xlsx",
        client_payload: {
          file: base64,
          filename: file.name
        }
      })
    });

    if (res.ok) {
      status.textContent = "Upload successful!";
    } else {
      const errorResponse = await res.json();
      console.error("GitHub API Error:", errorResponse);
      status.textContent = "Upload failed: " + (errorResponse.message || "Check console");
    }
  } catch (err) {
    console.error("Local Process Error:", err);
    status.textContent = "An error occurred during the upload process.";
  }
});
