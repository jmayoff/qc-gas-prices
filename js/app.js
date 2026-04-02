document.getElementById("load").onclick = async () => {
  const res = await fetch("PASTE_XLSX_URL_HERE");
  const buf = await res.arrayBuffer();

  const workbook = XLSX.read(buf, { type: "array" });
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];

  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log("Rows:", rows);
  console.log("Row count:", rows.length);

  document.getElementById("output").textContent =
    "Parsed " + rows.length + " rows";
};
