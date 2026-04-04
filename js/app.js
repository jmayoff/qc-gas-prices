console.log("app.js loaded");

// Constants to match your Excel columns exactly
const REGION_KEY = "Région";
const PRICE_KEY = "Prix Régulier";
const BANNER_KEY = "Bannière";
const ADDRESS_KEY = "Adresse";

async function initDashboard() {
  const statusLine = document.getElementById("lastUpdated");
  const cb = new Date().getTime();

  try {
    statusLine.textContent = "Loading data...";

    // 1. Try to get the timestamp from last-updated.txt
    let displayDate = null;
    try {
      const txtRes = await fetch(`last-updated.txt?t=${cb}`);
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
    } catch (e) {
      console.warn("Timestamp file not found, skipping date logic.");
    }

    // 2. Fetch and Process the Excel File
    const res = await fetch(`gas-prices.xlsx?t=${cb}`);
    if (!res.ok) throw new Error("gas-prices.xlsx not found. Please upload a file.");
    
    const buf = await res.arrayBuffer();
    const workbook = XLSX.read(buf, { type: "array" });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    
    if (!rows || rows.length === 0) throw new Error("Excel file is empty.");

    processGasData(rows);

    // 3. Update the Header Timestamp
    if (displayDate) {
      statusLine.textContent = "Data last updated: " + displayDate.toLocaleString("en-CA", {
        timeZone: "America/Toronto",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    } else {
      statusLine.textContent = "Data Loaded (No timestamp found)";
    }

  } catch (err) {
    console.error(err);
    statusLine.textContent = "Status: " + err.message;
  }
}

function processGasData(rows) {
  const cleaned = rows
    .filter(row => row[PRICE_KEY])
    .map(row => ({
      ...row,
      numericPrice: parseFloat(String(row[PRICE_KEY]).replace("¢", "").trim())
    }))
    .filter(row => !isNaN(row.numericPrice));

  const calcAvg = (list) => {
    if (!list.length) return "—";
    const sum = list.reduce((acc, r) => acc + r.numericPrice, 0);
    return (sum / list.length).toFixed(1);
  };

  const mtRows = cleaned.filter(r => String(r[REGION_KEY]).includes("Montréal"));
  const lvRows = cleaned.filter(r => String(r[REGION_KEY]).includes("Laval"));
  const mrRows = cleaned.filter(r => String(r[REGION_KEY]).includes("Montérégie"));
  
  document.getElementById("avgQC").textContent = calcAvg(cleaned) + "¢";
  document.getElementById("avgMTL").textContent = calcAvg(mtRows) + "¢";
  document.getElementById("avgLaval").textContent = calcAvg(lvRows) + "¢";
  document.getElementById("avgMonteregie").textContent = calcAvg(mrRows) + "¢";

  const gmaRows = [...mtRows, ...lvRows, ...mrRows];
  document.getElementById("avgGMA").textContent = calcAvg(gmaRows) + "¢";

  const sortedMTL = [...mtRows].sort((a, b) => a.numericPrice - b.numericPrice);

  document.getElementById("lowest5").textContent = sortedMTL.slice(0, 5)
    .map(r => `${r.numericPrice}¢ — ${r[BANNER_KEY] || 'Stn'} — ${r[ADDRESS_KEY] || ''}`).join("\n");

  document.getElementById("highest5").textContent = sortedMTL.slice(-5).reverse()
    .map(r => `${r.numericPrice}¢ — ${r[BANNER_KEY] || 'Stn'} — ${r[ADDRESS_KEY] || ''}`).join("\n");
}

window.onload = initDashboard;
