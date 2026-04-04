/**
 * Québec Gas Prices - Dashboard Engine v3.5
 * Optimized for: NDIP, Pincourt, and L'Île-Perrot local filtering.
 */

console.log("Dashboard Engine: active");

// Constants for Excel Column Headers (Must match Row 1 of your XLSX)
const REGION_KEY = "Région";
const PRICE_KEY = "Prix Régulier";
const BANNER_KEY = "Bannière";
const ADDRESS_KEY = "Adresse";

async function initDashboard() {
    const statusLine = document.getElementById("lastUpdated");
    const cb = new Date().getTime(); // Prevents browser caching

    try {
        // 1. Attempt to fetch the automated timestamp
        try {
            const txtRes = await fetch(`last-updated.txt?t=${cb}`);
            if (txtRes.ok) {
                const rawContent = await txtRes.text();
                const match = rawContent.match(/(\d{14})/);
                if (match) {
                    const ts = match[1];
                    const d = new Date(Date.UTC(
                        ts.substring(0, 4),
                        parseInt(ts.substring(4, 6)) - 1,
                        ts.substring(6, 8),
                        ts.substring(8, 10),
                        ts.substring(10, 12),
                        ts.substring(12, 14)
                    ));
                    statusLine.textContent = "Data last updated: " + d.toLocaleString("en-CA", {
                        timeZone: "America/Toronto",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true
                    });
                }
            }
        } catch (e) {
            console.log("Timestamp file not found, skipping label.");
        }

        // 2. Fetch the actual Gas Data Excel file
        const res = await fetch(`gas-prices.xlsx?t=${cb}`);
        if (!res.ok) throw new Error("gas-prices.xlsx not found. Please upload a file.");

        const buf = await res.arrayBuffer();
        const workbook = XLSX.read(buf, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        if (rows && rows.length > 0) {
            processGasData(rows);
        } else {
            throw new Error("Excel file is empty or formatted incorrectly.");
        }

    } catch (err) {
        console.error("Initialization Error:", err);
        statusLine.textContent = "Status: " + err.message;
    }
}

/**
 * Main Logic: Filtering and Math
 */
function processGasData(rows) {
    // 1. Clean data: Remove '¢', handle empty prices, convert to numbers
    const clean = rows
        .map(r => ({
            ...r,
            numPrice: parseFloat(String(r[PRICE_KEY] || "0").replace("¢", "").trim())
        }))
        .filter(r => r.numPrice > 0 && !isNaN(r.numPrice));

    // Helper: Calculate Average String
    const getAvg = (list) => {
        if (!list.length) return "—";
        const sum = list.reduce((acc, r) => acc + r.numPrice, 0);
        return (sum / list.length).toFixed(1) + "¢";
    };

    // 2. Regional Subsets
    const mtl = clean.filter(r => String(r[REGION_KEY]).includes("Montréal"));
    const laval = clean.filter(r => String(r[REGION_KEY]).includes("Laval"));
    const mon = clean.filter(r => String(r[REGION_KEY]).includes("Montérégie"));
    const gma = [...mtl, ...laval, ...mon];

    // 3. Update UI Cards (Averages)
    document.getElementById("avgQC").textContent = getAvg(clean);
    document.getElementById("avgMTL").textContent = getAvg(mtl);
    document.getElementById("avgLaval").textContent = getAvg(laval);
    document.getElementById("avgMonteregie").textContent = getAvg(mon);
    document.getElementById("avgGMA").textContent = getAvg(gma);

    // 4. Update Montreal Rankings
    const sortedMtl = [...mtl].sort((a, b) => a.numPrice - b.numPrice);
    
    document.getElementById("lowest5").textContent = sortedMtl.slice(0, 5)
        .map(r => `${r.numPrice}¢  •  ${r[BANNER_KEY] || 'Stn'}  •  ${r[ADDRESS_KEY]}`)
        .join("\n");

    document.getElementById("highest5").textContent = sortedMtl.slice(-5).reverse()
        .map(r => `${r.numPrice}¢  •  ${r[BANNER_KEY] || 'Stn'}  •  ${r[ADDRESS_KEY]}`)
        .join("\n");

    // 5. Update Local Island Prices (NDIP, Pincourt, L'Île-Perrot)
    // We search for 'pincourt' and 'perrot' to catch all island stations
    const localKeywords = ["pincourt", "perrot"];
    
    const localStations = clean.filter(r => {
        const addr = String(r[ADDRESS_KEY] || "").toLowerCase();
        return localKeywords.some(key => addr.includes(key));
    }).sort((a, b) => a.numPrice - b.numPrice);

    const localDisplay = document.getElementById("localStations");
    if (localStations.length > 0) {
        localDisplay.textContent = localStations.map(r => 
            `${r.numPrice}¢  •  ${r[BANNER_KEY] || 'Stn'}  •  ${r[ADDRESS_KEY]}`
        ).join("\n");
    } else {
        localDisplay.textContent = "No local island stations found in current data.";
    }
}

// Start the app
window.onload = initDashboard;
