(function () {
  function parseCSV(text) {
    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var char = text[i];
      if (inQuotes) {
        if (char === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          row.push(field);
          field = "";
        } else if (char === '\n') {
          row.push(field);
          if (row.length > 1 || row[0] !== "") {
            rows.push(row);
          }
          row = [];
          field = "";
        } else if (char === '\r') {
          continue;
        } else {
          field += char;
        }
      }
    }
    if (field.length > 0 || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }

  async function fetchSheetCSV(options) {
    var spreadsheetId = options.spreadsheetId;
    var sheet = options.sheet;
    var gid = options.gid;
    if (!spreadsheetId) {
      throw new Error("Missing spreadsheetId");
    }
    var url = "https://docs.google.com/spreadsheets/d/" + spreadsheetId + "/gviz/tq?tqx=out:csv";
    if (gid) {
      url += "&gid=" + encodeURIComponent(gid);
    } else if (sheet) {
      url += "&sheet=" + encodeURIComponent(sheet);
    }

    var res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Sheet request failed");
    }
    var text = await res.text();
    var rows = parseCSV(text);
    if (!rows.length) {
      return [];
    }
    var headers = rows.shift().map(function (h) {
      return h.trim();
    });
    return rows
      .filter(function (r) {
        return r.some(function (cell) {
          return cell && cell.trim() !== "";
        });
      })
      .map(function (row) {
        var obj = {};
        headers.forEach(function (key, idx) {
          obj[key] = row[idx] ? row[idx].trim() : "";
        });
        return obj;
      });
  }

  window.Sheets = {
    fetchSheetCSV: fetchSheetCSV,
    parseCSV: parseCSV
  };
})();
