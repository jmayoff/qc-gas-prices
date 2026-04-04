console.log("app.js loaded");

const REGION_KEY = "Région";
const PRICE_KEY = "Prix Régulier";

async function initDashboard() {
  const statusLine = document.getElementById("lastUpdated");
  const cb = new Date().getTime();

  try {
    // 1. Get the timestamp from the text file
    const txtRes = await fetch(`last-updated.txt?t=${cb}`);
    let displayDate = new Date();

    if (txtRes.ok) {
      const filename = await txtRes.text();
      const match = filename.match(/(\d{14})/);
      if (match) {
        const ts = match[1];
        displayDate = new Date(Date.UTC(
          ts.substring(0, 4),
          parseInt(ts.substring(4, 6)) - 1,
          ts.substring(6, 8),
          ts.substring(8, 10),
          ts.substring(10, 12),
          ts.substring(12, 14)
        ));
      }
    }

    // 2. Get and Process Excel
    const res = await fetch(`gas-prices.xlsx?t=${cb}`);
    if (!res.ok) throw new Error("File not found");
    
    const buf = await res.arrayBuffer();
    const workbook = XLSX.read(buf, { type: "array" });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    
    processGasData(rows);

    statusLine.textContent = "Data last updated: " + displayDate.toLocaleString("en-CA", {
      timeZone: "America/Toronto",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });

} catch (err) {
    console.error("Dashboard Error:", err);
    statusLine.textContent = "Status: Please upload a stations-YYYYMMDDHHMMSS.xlsx file to begin.";
  }
}

// ... include your processGasData function from before ...
