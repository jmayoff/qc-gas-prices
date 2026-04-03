document.getElementById("load").onclick = async () => {
  const res = await fetch("https://regieessencequebec.ca/data/stations-20260402233505.xlsx");
  const buf = await res.arrayBuffer();

  const workbook = XLSX.read(buf, { type: "array" });
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];

  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log("Row count:", rows.length);

  if (rows.length === 0) {
    document.getElementById("output").textContent = "No rows found.";
    return;
  }

  // --- STEP 1: Inspect structure ---
  const firstRow = rows[0];
  const columnNames = Object.keys(firstRow);

  console.log("Column names:", columnNames);
  console.log("First row:", firstRow);
  console.table(rows.slice(0, 5));



  // --- STEP 2: Extract numeric regular gasoline price safely ---
  const cleaned = rows
    .filter(row => row["Prix Régulier"]) // skip blank/malformed rows
    .map(row => {
      const raw = row["Prix Régulier"]; // e.g. "190.9¢"
      const numeric = parseFloat(raw.replace("¢", "")); // → 190.9

      return {
        ...row,
        regularPrice: numeric
      };
    });

  console.log("Cleaned row sample:", cleaned[0]);
  console.log("Cleaned count:", cleaned.length);

  // --- STEP 3: Compute averages ---

// 3A: Average for all of Québec
const totalQC = cleaned.reduce((sum, row) => sum + row.regularPrice, 0);
const avgQC = totalQC / cleaned.length;

// 3B: Average for Montréal region only
const montrealRows = cleaned.filter(row => row["Région"] === "Montréal");

let avgMontreal = null;
if (montrealRows.length > 0) {
  const totalMTL = montrealRows.reduce((sum, row) => sum + row.regularPrice, 0);
  avgMontreal = totalMTL / montrealRows.length;
}

console.log("Average QC:", avgQC);
console.log("Average Montréal:", avgMontreal);
const out = document.getElementById("output");
  
  // Display on website
out.textContent +=
  "\n\nAverage Québec: " + avgQC.toFixed(1) + "¢" +
  "\nAverage Montréal: " + (avgMontreal ? avgMontreal.toFixed(1) + "¢" : "N/A");


  
// --- STEP 4: Greater Montréal Area (Montréal + Laval + Montérégie) ---
const gmaRows = cleaned.filter(row =>
  row["Région"] === "Montréal" ||
  row["Région"] === "Laval" ||
  row["Région"] === "Montérégie"
);

let avgGMA = null;
if (gmaRows.length > 0) {
  const totalGMA = gmaRows.reduce((sum, row) => sum + row.regularPrice, 0);
  avgGMA = totalGMA / gmaRows.length;
}

console.log("Average GMA:", avgGMA);

out.textContent +=
  "\nAverage Greater Montréal Area: " +
  (avgGMA ? avgGMA.toFixed(1) + "¢" : "N/A");


// --- STEP X: 5 lowest and 5 highest Montréal stations ---
const montrealSorted = [...montrealRows].sort((a, b) => a.regularPrice - b.regularPrice);

const lowest5 = montrealSorted.slice(0, 5);
const highest5 = montrealSorted.slice(-5);

out.textContent += "\n\nLowest 5 Montréal stations:\n";
lowest5.forEach(row => {
  out.textContent += `${row.regularPrice}¢ — ${row.Bannière} — ${row.Adresse}\n`;
});

out.textContent += "\nHighest 5 Montréal stations:\n";
highest5.forEach(row => {
  out.textContent += `${row.regularPrice}¢ — ${row.Bannière} — ${row.Adresse}\n`;
});

  
};
