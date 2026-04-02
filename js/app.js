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

  // --- STEP 1: Inspect the structure ---
  const firstRow = rows[0];
  const columnNames = Object.keys(firstRow);

  console.log("Column names:", columnNames);
  console.log("First row:", firstRow);
  console.table(rows.slice(0, 5));

  // Show column names on the page
  document.getElementById("output").textContent =
    "Column names:\n" + columnNames.join("\n");
};
