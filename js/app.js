document.getElementById("load").onclick = async () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  // Determine timestamp
let fileDate = extractDateFromFilename(file.name);

if (!fileDate) {
  fileDate = new Date(file.lastModified);
}

document.getElementById("lastUpdated").textContent =
  "Data last updated: " + fileDate.toLocaleString();


  if (!file) {
    alert("Please select an XLSX file first.");
    return;
  }

  // Read uploaded file
  const buf = await file.arrayBuffer();
  const workbook = XLSX.read(buf, { type: "array" });
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json(sheet);

  if (rows.length === 0) {
    alert("No rows found in file.");
    return;
  }

  // Clean rows
  const cleaned = rows
    .filter(row => row["Prix Régulier"])
    .map(row => ({
      ...row,
      regularPrice: parseFloat(row["Prix Régulier"].replace("¢", ""))
    }));

function extractDateFromFilename(filename) {
  const match = filename.match(/(\d{14})/); // 14 digits
  if (!match) return null;

  const ts = match[1];
  const year = ts.substring(0, 4);
  const month = ts.substring(4, 6);
  const day = ts.substring(6, 8);
  const hour = ts.substring(8, 10);
  const min = ts.substring(10, 12);
  const sec = ts.substring(12, 14);

  return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}`);
}

  

  // Québec average
  const totalQC = cleaned.reduce((sum, r) => sum + r.regularPrice, 0);
  const avgQC = totalQC / cleaned.length;
  document.getElementById("avgQC").textContent = avgQC.toFixed(1) + "¢";

  // Montréal average
  const montrealRows = cleaned.filter(r => r["Région"] === "Montréal");
  const avgMTL = montrealRows.reduce((s, r) => s + r.regularPrice, 0) / montrealRows.length;
  document.getElementById("avgMTL").textContent = avgMTL.toFixed(1) + "¢";

  // Laval average
  const lavalRows = cleaned.filter(r => r["Région"] === "Laval");
  const avgLaval = lavalRows.reduce((s, r) => s + r.regularPrice, 0) / lavalRows.length;
  document.getElementById("avgLaval").textContent = avgLaval.toFixed(1) + "¢";

  // Montérégie average
  const monteregieRows = cleaned.filter(r => r["Région"] === "Montérégie"]);
  const avgMonteregie = monteregieRows.reduce((s, r) => s + r.regularPrice, 0) / monteregieRows.length;
  document.getElementById("avgMonteregie").textContent = avgMonteregie.toFixed(1) + "¢";

  // GMA average
  const gmaRows = cleaned.filter(r =>
    r["Région"] === "Montréal" ||
    r["Région"] === "Laval" ||
    r["Région"] === "Montérégie"
  );
  const avgGMA = gmaRows.reduce((s, r) => s + r.regularPrice, 0) / gmaRows.length;
  document.getElementById("avgGMA").textContent = avgGMA.toFixed(1) + "¢";

  // Lowest 5 Montréal
  const sortedMTL = [...montrealRows].sort((a, b) => a.regularPrice - b.regularPrice);
  const lowest5 = sortedMTL.slice(0, 5);
  document.getElementById("lowest5").textContent = lowest5
    .map(r => `${r.regularPrice}¢ — ${r.Bannière} — ${r.Adresse}`)
    .join("\n");

  // Highest 5 Montréal
  const highest5 = sortedMTL.slice(-5);
  document.getElementById("highest5").textContent = highest5
    .map(r => `${r.regularPrice}¢ — ${r.Bannière} — ${r.Adresse}`)
    .join("\n");
};
