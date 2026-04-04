import fs from "fs";

/**
 * Since the live fetch is disabled, this script now simply 
 * ensures the directory structure is clean or can be used 
 * to manually trigger a timestamp reset if needed.
 */

async function run() {
  console.log("Status: Live download from Régie is currently DISABLED.");
  console.log("Note: Please use the web uploader to refresh 'gas-prices.xlsx'.");
  
  // We check if the file exists. If not, we warn the user.
  if (!fs.existsSync("gas-prices.xlsx")) {
    console.warn("⚠️ Warning: gas-prices.xlsx is missing from the root.");
  } else {
    console.log("✅ gas-prices.xlsx is present in the repository.");
  }
}

run();
