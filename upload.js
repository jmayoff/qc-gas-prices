document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("status");

  if (!fileInput.files.length) {
    status.textContent = "Please select a file.";
    return;
  }

  const file = fileInput.files[0];
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

  status.textContent = "Uploading…";

  const res = await fetch("https://api.github.com/repos/jmayoff/qc-gas-prices/dispatches", {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer __UPLOAD_TOKEN__",
    },
    body: JSON.stringify({
      event_type: "upload-xlsx",
      client_payload: {
        file: base64
      }
    })
  });

  status.textContent = res.ok ? "Upload successful!" : "Upload failed.";
});
