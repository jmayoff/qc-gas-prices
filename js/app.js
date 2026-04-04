/**
 * Québec Gas Prices - Dashboard Logic
 * Feature: Local Island Filtering (Pincourt, LIP, NDIP)
 */

console.log("Dashboard Engine: Local Search Enabled");

async function initDashboard() {
    const statusLine = document.getElementById("lastUpdated");
    const cb = new Date().getTime();

    try {
        // 1. Timestamp Fetch (Optional Fail-safe)
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

        // 2. Main Data Fetch
        const res = await fetch(`gas-prices.xlsx?t=${cb}`);
        if (!res.ok) throw new Error("File gas-prices.xlsx not found.");

        const buf = await res.arrayBuffer();
        const workbook = XLSX.read(buf, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        
        if (rows.length > 0) {
            processGasData(rows);
        }

    } catch (err) {
        console.error("Dashboard Error:", err);
        statusLine.textContent = "Status: Data currently unavailable.";
    }
}

function processGasData(rows) {
    const REGION = "Région";
    const PRICE = "Prix Régulier";
    const BANNER = "Bannière";
    const ADDRESS = "Adresse";

    const clean = rows.map(r => ({
        ...r,
        numPrice: parseFloat(String(r[PRICE] || "0").replace("¢", "").trim())
    })).filter(r => r.numPrice > 0);

    const avg = (list) => {
        if (!list.length) return "—";
        return (list.reduce((acc, r) => acc + r.numPrice, 0) / list.length).toFixed(1) + "¢";
    };

    // Regional Filters
    const mtl = clean.filter(r => String(r[REGION]).includes("Montréal"));
    const lav = clean.filter(r => String(r[REGION]).includes("Laval"));
    const mon = clean.filter(r => String(r[REGION]).includes("Montérégie"));

    // Update Top Cards
    document.getElementById("avgQC").textContent = avg(clean);
    document.getElementById("avgMTL").textContent = avg(mtl);
    document.getElementById("avgLaval").textContent = avg(lav);
    document.getElementById("avgMonteregie").textContent = avg(mon);
    document.getElementById("avgGMA").textContent = avg([...mtl, ...lav, ...mon]);

    // Montréal Low/High
    const sortedMtl = [...mtl].sort((a, b) => a.numPrice - b.numPrice);
    document.getElementById("lowest5").textContent = sortedMtl.slice(0, 5).map(r => `${r.numPrice}¢ • ${r[BANNER]} • ${r[ADDRESS]}`).join("\n");
    document.getElementById("highest5").textContent = sortedMtl.slice(-5).reverse().map(r => `${r.numPrice}¢ • ${r[BANNER]} • ${r[ADDRESS]}`).join("\n");

    /**
     * LOCAL ISLAND FILTER (Pincourt, LIP, NDIP)
     * We scan the ADDRESS string for these specific keywords.
     */
    const islandKeywords = ["pincourt", "ile-perrot", "ile perrot"]; // Matches with or without dashes
    
    const localStations = clean.filter(r => {
        const addr = String(r[ADDRESS] || "").toLowerCase();
        // Returns true if any of our keywords are found inside the address string
        return islandKeywords.some(key => addr.includes(key));
    }).sort((a, b) => a.numPrice - b.numPrice);

    const localDisplay = document.getElementById("localStations");
    if (localStations.length > 0) {
        localDisplay.textContent = localStations.map(r => 
            `${r.numPrice}¢  •  ${r[BANNER] || 'Stn'}  •  ${r[ADDRESS]}`
        ).join("\n");
    } else {
        localDisplay.textContent = "No stations found for Pincourt/Island area in this data export.";
    }
}

window.onload = initDashboard;
