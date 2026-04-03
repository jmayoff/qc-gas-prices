document.getElementById("load").onclick = async () => {
  const out = document.getElementById("output");

  // Clear output area
  out.textContent = "";

  // Load XLSX file
  const res = await fetch("https://regieessencequebec.ca/data/stations-20260402233505.xlsx");
  const buf = await res.arrayBuffer();

  const workbook = XLSX.read(buf, { type: "array" });
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];

  const rows = XLSX.utils.sheet_to_json(sheet);

  if (rows.length === 0) {
    out.textContent = "No rows found.";
    return;
  }

  // --- STEP 1: Clean rows and extract numeric regular price ---
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

  // --- STEP 2: Québec-wide average ---
  const totalQC = cleaned.reduce((sum, row) => sum + row.regularPrice, 0);
  const avgQC = totalQC / cleaned.length;
  document.getElementById("avgQC").textContent = avgQC.toFixed(1) + "¢";

  // --- STEP 3: Montréal average ---
  const montrealRows = cleaned.filter(row => row["Région"] === "Montréal");
  let avgMontreal = null;
  if (montrealRows.length > 0) {
    const totalMTL = montrealRows.reduce((sum, row) => sum + row.regularPrice, 0);
    avgMontreal = totalMTL / montrealRows.length;
  }
  document.getElementById("avgMTL").textContent =
    avgMontreal ? avgMontreal.toFixed(1) + "¢" : "N/A";

  // --- STEP 4: Laval average ---
  const lavalRows = cleaned.filter(row => row["Région"] === "Laval");
  let avgLaval = null;
  if (lavalRows.length > 0) {
    const totalLaval = lavalRows.reduce((sum, row) => sum + row.regularPrice, 0);
    avgLaval = totalLaval / lavalRows.length;
  }
  document.getElementById("avgLaval").textContent =
    avgLaval ? avgLaval.toFixed(1) + "¢" : "N/A";

  // --- STEP 5: Montérégie average ---
  const monteregieRows = cleaned.filter(row => row["Région"] === "Montérégie");
  let avgMonteregie = null;
  if (monteregieRows.length > 0) {
    const totalMonteregie = monteregieRows.reduce((sum, row) => sum + row.regularPrice, 0);
    avgMonteregie = totalMonteregie / monteregieRows.length;
  }
  document.getElementById("avgMonteregie").textContent =
    avgMonteregie ? avgMonteregie.toFixed(1) + "¢" : "N/A";

  // --- STEP 6: Greater Montréal Area (Montréal + Laval + Montérégie) ---
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
  document.getElementById("avgGMA").textContent =
    avgGMA ? avgGMA.toFixed(1) + "¢" : "N/A";

  // --- STEP 7: 5 lowest and 5 highest Montréal stations ---
  const montrealSorted = [...montrealRows].sort((a, b) => a.regularPrice - b.regularPrice);

  const lowest5 = montrealSorted.slice(0, 5);
  const highest5 = montrealSorted.slice(-5);

  document.getElementById("lowest5").textContent = lowest5
    .map(r => `${r.regularPrice}¢ — ${r.Bannière} — ${r.Adresse}`)
    .join("\n");

  document.getElementById("highest5").textContent = highest5
    .map(r => `${r.regularPrice}¢ — ${r.Bannière} — ${r.Adresse}`)
    .join("\n");
};
