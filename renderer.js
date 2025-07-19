window.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fs = require('fs');
  const { clipboard } = require('electron');

  console.log("✅ renderer.js loaded and DOM is ready");

  if (!dropZone) {
    console.error("🚫 Drop zone element not found in DOM");
    return;
  }

  dropZone.ondragover = (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = 'rgba(255,153,0,0.2)';
    console.log("🎯 Dragover detected");
  };

  dropZone.ondragleave = () => {
    dropZone.style.backgroundColor = 'rgba(255,153,0,0.05)';
  };

  dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = 'rgba(255,153,0,0.05)';
    const file = e.dataTransfer.files[0];
    if (!file) return alert("⚠️ No file detected.");
    if (!file.path.endsWith('.csv')) return alert("⚠️ Please drop a CSV file.");
    parseCSV(file.path);
  };

  function parseHours(str) {
    if (!str) return 0;
    return parseFloat(String(str).toLowerCase().replace("hrs", "").trim()) || 0;
  }

  function normalize(value) {
    return String(value || "").trim().toUpperCase();
  }

  function parseCSV(filePath) {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        alert('❌ Error reading file.');
        console.error('File read error:', err);
        return;
      }

      const lines = data.trim().split(/\r?\n/);
      if (lines.length < 2) {
        alert('❌ CSV appears to be empty or malformed.');
        return;
      }

      // Handle quoted headers properly
      const rawHeaders = lines.shift().split(',');
      const headers = rawHeaders.map(h => h.replace(/['"]/g, '').trim().toUpperCase());
      const idx = {};
      headers.forEach((h, i) => (idx[h] = i));

      const requiredHeaders = [
        "LOCATION", "CARRIER LOAD TYPE", "APPOINTMENT TYPE", "CARRIER",
        "YARD DWELL", "PALLETS", "UNITS"
      ];

      const missing = requiredHeaders.filter(h => !(h in idx));
      if (missing.length > 0) {
        alert(`❌ Missing headers: ${missing.join(", ")}`);
        return;
      }

      let dropPallets = 0, dropFloor = 0, parcelsDock = 0, parcelsYard = 0;
      let transshipYard = 0, azngOver72 = 0, livesHanded = 0;
      let volumeDoors = 0, volumeYard = 0;

      lines.forEach((line, i) => {
        const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length < headers.length) return;

        const location    = normalize(cols[idx["LOCATION"]]);
        const type        = normalize(cols[idx["CARRIER LOAD TYPE"]]);
        const appointment = normalize(cols[idx["APPOINTMENT TYPE"]]);
        const carrier     = normalize(cols[idx["CARRIER"]]);
        const dwell       = parseHours(cols[idx["YARD DWELL"]]);
        const pallets     = parseFloat(cols[idx["PALLETS"]]) || 0;
        const units       = parseInt(cols[idx["UNITS"]]) || 0;

        // Filtering Logic
        if (type === "DROP" && appointment === "CARP" && location.startsWith("PS") && pallets > 0)
          dropPallets++;

        if (type === "DROP" && appointment === "CARP" && location.startsWith("PS") && pallets === 0)
          dropFloor++;

        const cleanCarrier = normalize(carrier);
        const cleanLocation = normalize(location);

        if (cleanCarrier.includes("UNITED PARCEL") && cleanLocation.startsWith("DD"))
          parcelsDock++;

        if (cleanCarrier.includes("UNITED PARCEL") && cleanLocation.startsWith("PS"))
          parcelsYard++;

        if (appointment === "TRANSSHIP" && location.startsWith("PS"))
          transshipYard++;

        if (carrier.charAt(0).toUpperCase() === "A" && dwell >= 72)
          azngOver72++

        if (type === "LIVE" && location.startsWith("DD"))
          livesHanded++

        if (location.startsWith("DD")) volumeDoors += units;
        if (location.startsWith("PS")) volumeYard += units;
      });

      updateStat("dropPallets", dropPallets);
      updateStat("dropFloor", dropFloor);
      updateStat("parcelsDock", parcelsDock);
      updateStat("parcelsYard", parcelsYard);
      updateStat("totalParcels", parcelsDock + parcelsYard);
      updateStat("transshipYard", transshipYard);
      updateStat("azngOver72", azngOver72);
      updateStat("livesHanded", livesHanded);
      updateStat("volumeDoors", volumeDoors.toLocaleString());
      updateStat("volumeYard", volumeYard.toLocaleString());

      const summary = [
        dropPallets,
        dropFloor,
        parcelsDock,
        parcelsYard,
        parcelsDock + parcelsYard,
        transshipYard,
        azngOver72,
        "",
        livesHanded,
        "",
        "",
        volumeDoors,
        volumeYard
      ].join('\n');

      // Copy to clipboard
      clipboard.writeText(summary);

      console.log("✅ Dashboard updated from:", filePath);
    });
  }

  function updateStat(id, value) {
    const el = document.getElementById(id);
    if (el) {
      const val = el.querySelector(".value");
      if (val) {
        val.textContent = value;
      } else {
        console.warn(`⚠️ Tile "${id}" missing .value element`);
      }
    } else {
      console.warn(`⚠️ Stat tile "${id}" not found`);
    }
  }
});
