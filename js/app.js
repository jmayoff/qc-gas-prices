/**
 * Québec Gas Prices - Dashboard Engine
 * Location: js/app.js
 * Feature: Accent-Insensitive Local Island Search (NDIP, LIP, Pincourt)
 */

console.log("Dashboard Engine: Hyper-Fuzzy Local Search Active");

// Essential Header Mapping (Matches Row 1 of the Excel file)
const REGION_KEYS = ['région', 'region'];
const PRICE_KEYS = ['prix régulier', 'prix regulier', 'prix'];
const BANNER_KEYS = ['bannière', 'banniere', 'banner'];
const ADDRESS_KEYS = ['adresse', 'address'];

async function initDashboard() {
    const statusLine = document.getElementById("lastUpdated");
    const cb = new Date().getTime(); // Cache buster

    try {
        // 1. Fetch Timestamp (Fail-safe)
        try {
            const txtRes = await fetch(`last-updated.txt?t=${cb}`);
            if (txtRes.ok) {
                const raw = await txtRes.text();
                const match = raw.match(/(\d{14})/);
                if (match) {
                    const ts = match[1];
                    const d = new Date(Date.UTC(ts.substring(0,4), parseInt(ts.substring(4,6))-1, ts.substring(6,8), ts.substring(8,10), ts.substring(10,12), ts.substring(12,14)));
                    statusLine.textContent = "Data last updated: " + d.toLocaleString("en-CA", { timeZone: "America/Toronto", hour12: true, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
                }
            }
        } catch (e) { console.log("Timestamp skipped."); }

        // 2. Fetch Gas Data Excel File
        // Path assumes file is in the root directory relative to index.html
        const res = await fetch(`gas-prices.xlsx?t=${cb}`);
        if (!res.ok) {
            statusLine.textContent = "Error: gas-prices.xlsx not found in root.";
            return;
        }

        const buf = await res.arrayBuffer();
        const workbook = XLSX.read(buf, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        
        if (rows && rows.length > 0) {
            processGasData(rows);
        } else {
            statusLine.textContent = "Error: Excel file is empty.";
        }

    } catch (err) {
        console.error("Master Error:", err);
        statusLine.textContent = "Status: Connection Error.";
    }
}

function processGasData(rows) {
    // Column Finder Logic: Handles messy/changed headers
    const getCol = (possibilities) => {
        const firstRow = Object.keys(rows[0]);
        return firstRow.find(k => possibilities.includes(k.toLowerCase().trim()));
    };

    const REGION = getCol(REGION_KEYS);
    const PRICE = getCol(PRICE_KEYS);
    const BANNER = getCol(BANNER_KEYS);
    const ADDRESS = getCol(ADDRESS_KEYS);

    // Data Cleaning
    const clean = rows.map(r => ({
        ...r,
        numPrice: parseFloat(String(r[PRICE] || "0").replace("¢", "").replace(",", ".").trim())
    })).filter(r => r.numPrice > 0);

    const avg = (list) => {
        if (!list.length) return "—";
        return (list.reduce((acc, r) => acc + r.numPrice, 0) / list.length).toFixed(1) + "¢";
    };

    // Regional Filters
    const mtl = clean.filter(r => String(r[REGION] || "").includes("Montréal"));
    const lav = clean.filter(r => String(r[REGION] || "").includes("Laval"));
    const mon = clean.filter(r => String(r[REGION] || "").includes("Montérégie"));

    // Update Average Cards
    document.getElementById("avgQC").textContent = avg(clean);
    document.getElementById("avgMTL").textContent = avg(mtl);
    document.getElementById("avgLaval").textContent = avg(lav);
    document.getElementById("avgMonteregie").textContent = avg(mon);
    document.getElementById("avgGMA").textContent = avg([...mtl, ...lav, ...mon]);

    // Update Montreal High/Low
    const sortedMtl = [...mtl].sort((a, b) => a.numPrice - b.numPrice);
    document.getElementById("lowest5").textContent = sortedMtl.slice(0, 5).map(r => `${r.numPrice}¢ • ${r[BANNER] || 'Stn'} • ${r[ADDRESS]}`).join("\n");
    document.getElementById("highest5").textContent = sortedMtl.slice(-5).reverse().map(r => `${r.numPrice}¢ • ${r[BANNER] || 'Stn'} • ${r[ADDRESS]}`).join("\n");

    /**
     * HYPER-FUZZY LOCAL FILTER
     * This section normalizes strings to remove accents before searching.
     * This ensures 'Île' matches 'ile' and 'L'Île-Perrot' matches 'perrot'.
     */
    const localKeywords = ["pincourt", "perrot", "ndip"];
    
    const localStations = clean.filter(r => {
        const rawAddr = String(r[ADDRESS] || "");
        
        // Normalize: Strips accents like î -> i, é -> e
        const normalizedAddr = rawAddr
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
            
        return localKeywords.some(key => normalizedAddr.includes(key));
    }).sort((a, b) => a.numPrice - b.numPrice);

    const localDisplay = document.getElementById("localStations");
    if (localStations.length > 0) {
        localDisplay.textContent = localStations.map(r => 
            `${r.numPrice}¢ • ${r[BANNER] || 'Stn'} • ${r[ADDRESS]}`
        ).join("\n");
    } else {
        localDisplay.textContent = "No local island stations found.";
    }
}

// Kickoff
window.onload = initDashboard;
