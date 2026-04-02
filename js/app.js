document.getElementById("load").onclick = async () => {
  const res = await fetch("https://regieessencequebec.ca/data/stations-20260402214504.xlsx");
  const buf = await res.arrayBuffer();
  console.log("Bytes received:", buf.byteLength);
  document.getElementById("output").textContent =
    "Downloaded " + buf.byteLength + " bytes";
};
