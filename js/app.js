/**
 * Québec Gas Prices - Dashboard Engine
 * Location: js/app.js
 * Feature: Address-Specific Manual Pinning (Dorval Petro-Canada)
 */

async function initDashboard() {
    const statusLine = document.getElementById("lastUpdated");
    const cb = new Date().getTime();

    try {
        // 1. Fetch Timestamp
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
        const res = await fetch(`gas-prices.xlsx?t=${cb}`);
        if (!res.ok) {
            statusLine.textContent = "Error: gas-prices.xlsx not found.";
            return;
        }

        const buf = await res.arrayBuffer();
        const workbook = XLSX.read(buf, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        
        if (rows && rows.length > 0) processGasData(rows);
    } catch (err) {
        statusLine.textContent = "Status: Connection Error.";
    }
}

function processGasData(rows) {
    const getCol = (possibilities) => {
        const firstRow = Object.keys(rows[0]);
        return firstRow.find(k => possibilities.includes(k.toLowerCase().trim()));
    };

    const REGION = getCol(['région', 'region']);
    const PRICE = getCol(['prix régulier', 'prix regulier', 'prix']);
    const BANNER = getCol(['bannière', 'banniere', 'banner']);
    const ADDRESS = getCol(['adresse', 'address']);

    const clean = rows.map(r => ({
        ...r,
        numPrice: parseFloat(String(r[PRICE] || "0").replace("¢", "").replace(",", ".").trim())
    })).filter(r => r.numPrice > 0);

    const avg = (list) => {
        if (!list.length) return "—";
        return (list.reduce((acc, r) => acc + r.numPrice, 0) / list.length).toFixed(1) + "¢";
    };

    const mtl = clean.filter(r => String(r[REGION] || "").includes("Montréal"));
    const lav = clean.filter(r => String(r[REGION] || "").includes("Laval"));
    const mon = clean.filter(r => String(r[REGION] || "").includes("Montérégie"));

    document.getElementById("avgQC").textContent = avg(clean);
    document.getElementById("avgMTL").textContent = avg(mtl);
    document.getElementById("avgLaval").textContent = avg(lav);
    document.getElementById("avgMonteregie").textContent = avg(mon);
    document.getElementById("avgGMA").textContent = avg([...mtl, ...lav, ...mon]);

    const sortedMtl = [...mtl].sort((a, b) => a.numPrice - b.numPrice);
    document.getElementById("lowest5").textContent = sortedMtl.slice(0, 5).map(r => `${r.numPrice}¢ • ${r[BANNER] || 'Stn'} • ${r[ADDRESS]}`).join("\n");
    document.getElementById("highest5").textContent = sortedMtl.slice(-5).reverse().map(r => `${r.numPrice}¢ • ${r[BANNER] || 'Stn'} • ${r[ADDRESS]}`).join("\n");

    /**
     * UPDATED LOCAL FILTER (The Dorval Pin)
     * We use a specific address string to ensure we get the right Petro-Canada.
     */
    const localKeywords = ["pincourt", "perrot", "ndip"];
    const pinnedAddress = "995 Montreal-Toronto"; // Unique identifier for Dorval station
    
    let localStations = clean.filter(r => {
        // Normalize the address in the row for comparison
        const addr = String(r[ADDRESS] || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        
        const isLocalTown = localKeywords.some(key => addr.includes(key));
        const isPinnedStation = addr.includes(pinnedAddress.toLowerCase());
        
        return isLocalTown || isPinnedStation;
    });

    // Custom Sort: Ensure Dorval is ALWAYS at the very top
    localStations.sort((a, b) => {
        const aAddr = String(a[ADDRESS] || "").toLowerCase();
        const bAddr = String(b[ADDRESS] || "").toLowerCase();
        
        const aPinned = aAddr.includes(pinnedAddress.toLowerCase());
        const bPinned = bAddr.includes(pinnedAddress.toLowerCase());
        
        if (aPinned) return -1;
        if (bPinned) return 1;
        return a.numPrice - b.numPrice;
    });

    const localDisplay = document.getElementById("localStations");
    if (localStations.length > 0) {
        localDisplay.textContent = localStations.map(r => 
            `${r.numPrice}¢ • ${r[BANNER] || 'Stn'} • ${r[ADDRESS]}`
        ).join("\n");
    } else {
        localDisplay.textContent = "No local island stations found.";
    }
}

window.onload = initDashboard;
