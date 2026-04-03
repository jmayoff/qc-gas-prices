document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("status");

  if (!fileInput.files.length) {
    status.textContent = "Please select a file.";
    return;
  }

  const file = fileInput.files[0];
  status.textContent = "Processing...";

  const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });

  try {
    const base64 = await toBase64(file);
    status.textContent = "Uploading directly to repository...";

    // We are now sending the file to the "data" folder (or root) as gas-prices.xlsx
    // Change "gas-prices.xlsx" below to whatever you want the file to be named
    const fileName = "gas-prices.xlsx"; 
    const url = `https://api.github.com/repos/jmayoff/qc-gas-prices/contents/${fileName}`;

    // First, we try to see if the file already exists to get its "sha" (unique ID)
    // This is required by GitHub to overwrite an existing file.
    let sha = "";
    const getRes = await fetch(url, {
        headers: { "Authorization": "Bearer __UPLOAD_TOKEN__" }
    });
    if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
    }

    // Now we "Commit" the file
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": "Bearer __UPLOAD_TOKEN__",
      },
      body: JSON.stringify({
        message: `Update ${fileName} via web uploader`,
        content: base64,
        sha: sha // Include the sha if the file exists, otherwise it's a new file
      })
    });

    if (res.ok) {
      status.textContent = "Upload successful! File updated in repository.";
    } else {
      const errorData = await res.json();
      console.error("GitHub API Error:", errorData);
      status.textContent = "Upload failed: " + (errorData.message || "Error");
    }
  } catch (err) {
    console.error("Process Error:", err);
    status.textContent = "An error occurred.";
  }
});
