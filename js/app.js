console.log("app.js loaded");

// ------------------------------
// Extract timestamp from filename
// ------------------------------
function extractDateFromFilename(filename) {
  const match = filename.match(/(\d{14})/); // e.g. 20260402233505
  if (!match) return null;

  const ts = match[1];
  const year = parseInt(ts.substring(0, 4), 10);
  const month = parseInt(ts.substring(4, 6), 10) - 1; // 0-based
  const day = parseInt(ts.substring(6, 8), 10);
  const hour = parseInt(ts.substring(8, 10), 10);
  const min = parseInt(ts.substring(10, 12), 10);
  const sec = parseInt(ts.substring(12, 14), 10);

  // Interpret timestamp as UTC
  return new Date(Date.UTC(year, month, day, hour, min, sec));
}

// ------------------------------
// Main file loader
// ------------------------------
async function loadFile() {
  console.log("Load File triggered!");

  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select an XLSX file first.");
    return;
  }

  console.log("File selected:", file.name);

  // ------------------------------
  // Determine timestamp
  // ------------------------------
  let fileDate = extractDateFromFilename(file.name);

  if (!fileDate) {
    fileDate = new Date(file.lastModified);
  }

  const montrealTime = fileDate.toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    hour12: true,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit"
  });

  document.getElementById("lastUpdated").textContent =
    "Data last updated: " + montrealTime;

  // ------------------------------
  // Read uploaded XLSX file
  // ------------------------------
  const buf = await file.arrayBuffer();
  const workbook = XLSX.read(buf, { type: "array" });
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log("Rows loaded:", rows.length);

  if (rows.length === 0) {
    alert("No rows found in file.");
    return;
  }

  // ------------------------------
  // Clean rows + extract numeric price
  // ------------------------------
  const cleaned = rows
    .filter(row => row["Prix Régulier"])
    .map(row => ({
      ...row,
      regularPrice: parseFloat(row["Prix Rég
