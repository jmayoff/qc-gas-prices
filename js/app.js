/**
 * Québec Gas Prices - Dashboard Logic
 * Version: 3.0 (Modern UI + External Timestamp)
 */

console.log("Dashboard Engine: Initialized");

// Configuration: Matches the headers in the Régie Excel files
const REGION_KEY = "Région";
const PRICE_KEY = "Prix Régulier";
const BANNER_KEY = "Bannière";
const ADDRESS_KEY = "Adresse";

async function initDashboard() {
  const statusLine = document.getElementById("lastUpdated");
  const cb = new Date().getTime(); // Cache-buster to ensure fresh data

  try {
    statusLine.textContent = "Updating dashboard...";

    // 1. Fetch Timestamp from last-updated.txt
    let displayDate = null;
    try {
      const txtRes = await fetch(`last-updated.txt?t=${cb}`);
      if (txtRes.ok) {
        const rawContent = await txtRes.text();
        const match = rawContent.match(/(\d{14})/); // Looks for YYYYMMDDHHMMSS
        if (match) {
          const ts = match[1];
          displayDate = new Date(Date.UTC(
            ts.substring(0, 4),
            parseInt(ts.substring(4, 6)) - 1, // Months are 0-indexed in JS
            ts.substring(6, 8),
            ts.substring(8, 10),
            ts.substring(10, 12),
            ts.substring(12, 14)
          ));
        }
      }
    } catch (e) {
      console.warn("Timestamp record not found. Falling back to file headers.");
    }

    // 2. Fetch the Excel Data
    const res = await fetch(`gas-prices.xlsx?t=${cb}`);
    if (!res.ok) throw new Error("Data file (gas-prices.xlsx) not found. Please upload a file.");
    
    const buf = await res.arrayBuffer();
    const workbook = XLSX.read(buf, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    if (!rows || rows.length === 0) throw new Error("The uploaded Excel file appears to be empty.");

    // 3. Process the Data
    processGasData(rows);

    // 4. Final UI Update (Timestamp)
    if (displayDate) {
      statusLine.textContent = "Data last updated: " + displayDate.toLocaleString("en-CA", {
        timeZone: "America/Toronto",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
    } else {
      statusLine.textContent = "Live Data Loaded";
    }

  } catch (err) {
    console.error("Critical Dashboard Error:", err);
    statusLine.textContent = "Status: " + err.message;
  }
}

/**
 * Handles all math and regional filtering
 */
function processGasData(rows) {
  // Clean and parse prices
  const cleaned = rows
    .filter(row => row[PRICE_KEY])
    .map(row => {
      // Strips '¢' and spaces, then converts to number
      let rawPrice = String(row[PRICE_KEY]).replace("¢", "").trim();
      return {
        ...row,
        numericPrice: parseFloat(rawPrice)
      };
    })
    .filter(row => !isNaN(row.numericPrice));

  // Average Calculation Helper
  const calcAvg = (list) => {
    if (!list.length) return "—";
    const sum = list.reduce((acc, r) => acc + r.numericPrice, 0);
    return (sum / list.length).toFixed(1);
  };

  // Regional Filtering
  const mtRows = cleaned.filter(r => String(r[REGION_KEY]).includes("Montréal"));
  const lvRows = cleaned.filter(r => String(r[REGION_KEY]).includes("Laval"));
  const mrRows = cleaned.filter(r => String(r[REGION_KEY]).includes("Montérégie"));
  
  // Update Individual Cards
  document.getElementById("avgQC").textContent = calcAvg(cleaned) + "¢";
  document.getElementById("avgMTL").textContent = calcAvg(mtRows) + "¢";
  document.getElementById("avgLaval").textContent = calcAvg(lvRows) + "¢";
  document.getElementById("avgMonteregie").textContent = calcAvg(mrRows) + "¢";

  // GMA Average (Montréal + Laval + Montérégie)
  const gmaRows = [...mtRows, ...lvRows, ...mrRows];
  document.getElementById("avgGMA").textContent = calcAvg(gmaRows) + "¢";

  // Sort by price for Rankings (Montréal specific)
  const sortedMTL = [...mtRows].sort((a, b) => a.numericPrice - b.numericPrice);

  // Update Lowest 5 (Best Prices)
  document.getElementById("lowest5").textContent = sortedMTL.slice(0, 5)
    .map(r => `${r.numericPrice}¢  •  ${r[BANNER_KEY] || 'Stn'}  •  ${r[ADDRESS_KEY] || 'No Address'}`)
    .join("\n");

  // Update Highest 5 (Worst Prices)
  document.getElementById("highest5").textContent = sortedMTL.slice(-5).reverse()
    .map(r => `${r.numericPrice}¢  •  ${r[BANNER_KEY] || 'Stn'}  •  ${r[ADDRESS_KEY] || 'No Address'}`)
    .join("\n");

  console.log(`Processed ${cleaned.length} stations successfully.`);
}

// Kick off the dashboard
window.onload = initDashboard;
