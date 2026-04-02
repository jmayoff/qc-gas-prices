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

  document.getElementById("output").textContent =
    "Column names:\n" + columnNames.join("\n");

  // --- STEP 2: Extract numeric regular gasoline price ---
  const cleaned = rows.map(row => {
    const raw = row["Prix Régulier"]; // e.g. "190.9¢"
    const numeric = parseFloat(raw.replace("¢", "")); // → 190.9

    return {
      ...row,
      regularPrice: numeric
    };
  });

  console.log("Sample with numeric price:", cleaned[0]);
};
