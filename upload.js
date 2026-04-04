document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("status");

  if (!fileInput.files.length) return;

  const file = fileInput.files[0];
  const originalName = file.name;
  status.textContent = "Uploading " + originalName + "...";

  const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = e => reject(e);
  });

  try {
    const base64 = await toBase64(file);
    const token = "__UPLOAD_TOKEN__";
    const repo = "jmayoff/qc-gas-prices";

    // Helper to upload/overwrite a file via GitHub API
    async function uploadFile(path, content, message) {
      const url = `https://api.github.com/repos/${repo}/contents/${path}`;
      let sha = "";
      const getRes = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
      if (getRes.ok) {
        const data = await getRes.ok ? await getRes.json() : null;
        sha = data ? data.sha : "";
      }

      return fetch(url, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message, content, sha })
      });
    }

    // 1. Upload the actual Excel data
    await uploadFile("gas-prices.xlsx", base64, `Data update: ${originalName}`);

    // 2. Upload the timestamp record (convert filename to base64 string)
    const textBase64 = btoa(originalName);
    await uploadFile("last-updated.txt", textBase64, `Timestamp update: ${originalName}`);

    status.textContent = "Success! File and timestamp updated.";
    fileInput.value = "";
  } catch (err) {
    console.error(err);
    status.textContent = "Upload failed.";
  }
});
