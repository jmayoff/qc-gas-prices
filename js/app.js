console.log("app.js loaded");

const REGION_KEY = "Région";
const PRICE_KEY = "Prix Régulier";
const BANNER_KEY = "Bannière";
const ADDRESS_KEY = "Adresse";

async function initDashboard() {
  const statusLine = document.getElementById("lastUpdated");
  
  try {
    statusLine.textContent = "Loading prices...";
    
    // We only fetch gas-prices.xlsx from the root now
    const cacheBuster = new Date().getTime();
    const response = await fetch(`gas-prices.xlsx?t=${cacheBuster}`);
    
    if (!response.ok) throw new Error("gas-prices.xlsx not found.");

    const buf = await response.arrayBuffer();
    const workbook = XLSX.read(buf, { type: "array" });
    const firstSheet = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheet];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      statusLine.textContent = "Data file is empty.";
      return;
    }

    processGasData(rows);
    
    statusLine.textContent = "Last updated: " + new Date().toLocaleString("en-CA", { 
      timeZone: "America/Toronto",
      hour12: true,
      minute: "2-digit",
      hour: "numeric"
    });

  } catch (err) {
    console.error("Dashboard Error:", err);
    statusLine.textContent = "Status: Data not yet available.";
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
