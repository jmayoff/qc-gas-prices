console.log("Checking for gas data with Local Area filter...");

async function initDashboard() {
    const statusLine = document.getElementById("lastUpdated");
    const cb = new Date().getTime();

    try {
        // 1. Timestamp logic
        try {
            const txtRes = await fetch(`last-updated.txt?t=${cb}`);
            if (txtRes.ok) {
                const filename = await txtRes.text();
                const match = filename.match(/(\d{14})/);
                if (match) {
                    const ts = match[1];
                    const d = new Date(Date.UTC(ts.substring(0,4), parseInt(ts.substring(4,6))-1, ts.substring(6,8), ts.substring(8,10), ts.substring(10,12), ts.substring(12,14)));
                    statusLine.textContent = "Data last updated: " + d.toLocaleString("en-CA", { timeZone: "America/Toronto", hour12: true, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
                }
            }
        } catch (e) { console.log("Timestamp file skipped."); }

        // 2. Fetch the Excel file
        const res = await fetch(`gas-prices.xlsx?t=${cb}`);
        if (!res.ok) {
            statusLine.textContent = "Error: gas-prices.xlsx not found.";
            return;
        }

        const buf = await res.arrayBuffer();
        const workbook = XLSX.read(buf, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        
        if (rows.length > 0) {
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

    const mtl = clean.filter(r => String(r[REGION]).includes("Montréal"));
    const lav = clean.filter(r => String(r[REGION]).includes("Laval"));
    const mon = clean.filter(r => String(r[REGION]).includes("Montérégie"));

    // Update Global/Regional Averages
    document.getElementById("avgQC").textContent = avg(clean);
    document.getElementById("avgMTL").textContent = avg(mtl);
    document.getElementById("avgLaval").textContent = avg(lav);
    document.getElementById("avgMonteregie").textContent = avg(mon);
    document.getElementById("avgGMA").textContent = avg([...mtl, ...lav, ...mon]);

    // Montréal Rankings
    const sortedMtl = [...mtl].sort((a, b) => a.numPrice - b.numPrice);
    document.getElementById("lowest5").textContent = sortedMtl.slice(0, 5).map(r => `${r.numPrice}¢ • ${r[BANNER]} • ${r[ADDRESS]}`).join("\n");
    document.getElementById("highest5").textContent = sortedMtl.slice(-5).reverse().map(r => `${r.numPrice}¢ • ${r[BANNER]} • ${r[ADDRESS]}`).join("\n");

    /** * NEW: LOCAL AREA FILTER
     * Searches the address field for our specific local towns
     */
    const localKeywords = ["Pincourt", "L'Ile-Perrot", "Notre-Dame-de-l'Ile-Perrot"];
    const localStations = clean.filter(r => {
        const addr = String(r[ADDRESS] || "").toLowerCase();
        return localKeywords.some(keyword => addr.includes(keyword.toLowerCase()));
    }).sort((a, b) => a.numPrice - b.numPrice);

    const localDisplay = document.getElementById("localStations");
    if (localStations.length > 0) {
        localDisplay.textContent = localStations.map(r => 
            `${r.numPrice}¢  •  ${r[BANNER] || 'Stn'}  •  ${r[ADDRESS]}`
        ).join("\n");
    } else {
        localDisplay.textContent = "No stations found for the local area in this dataset.";
    }
}

window.onload = initDashboard;
