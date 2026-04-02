document.getElementById("load").onclick = async () => {
  const res = await fetch("PASTE_XLSX_URL_HERE");
  const buf = await res.arrayBuffer();
  console.log("Bytes received:", buf.byteLength);
  document.getElementById("output").textContent =
    "Downloaded " + buf.byteLength + " bytes";
};
