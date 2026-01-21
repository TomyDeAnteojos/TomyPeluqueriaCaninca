(function () {
  var CONFIG = {
    spreadsheetId: "1x10iL4j4GBjGl2DuDv1Xe3sgUS-DLYL2eTPIJ65LAq4",
    sheets: {
      productos: { sheet: "productos", gid: "" },
      servicios: { sheet: "servicios", gid: "" },
      galeria: { sheet: "galeria", gid: "" },
      venta: { sheet: "venta", gid: "" },
      faq: { sheet: "faq", gid: "" },
      sobre_tomi: { sheet: "sobre_tomi", gid: "" }
    }
  };

  function normalizeKey(key) {
    return key
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function pickField(obj, names) {
    var keys = Object.keys(obj || {});
    for (var i = 0; i < keys.length; i++) {
      var normalized = normalizeKey(keys[i]);
      if (names.indexOf(normalized) !== -1) {
        return obj[keys[i]];
      }
    }
    return "";
  }

  function isLowercaseStart(value) {
    if (!value) {
      return false;
    }
    return /^[a-záéíóúñ]/.test(value.trim());
  }

  function loadSheet(sheetKey, fallbackPath) {
    var sheetConfig = CONFIG.sheets[sheetKey];
    return window.Sheets.fetchSheetCSV({
      spreadsheetId: CONFIG.spreadsheetId,
      sheet: sheetConfig.sheet,
      gid: sheetConfig.gid
    })
      .catch(function () {
        if (!fallbackPath) {
          return [];
        }
        return fetch(fallbackPath)
          .then(function (res) {
            return res.json();
          })
          .then(function (json) {
            return json.items || json;
          })
          .catch(function () {
            return [];
          });
      });
  }

  function addReport(container, title, detail) {
    if (!container) {
      return;
    }
    var item = document.createElement("div");
    item.className = "report-item";
    var strong = document.createElement("strong");
    strong.textContent = title;
    var p = document.createElement("p");
    p.textContent = detail;
    item.appendChild(strong);
    item.appendChild(p);
    container.appendChild(item);
  }

  function addEmpty(container) {
    if (!container) {
      return;
    }
    var item = document.createElement("div");
    item.className = "report-item";
    item.textContent = "Sin observaciones";
    container.appendChild(item);
  }

  function analyzeTexts(texts, badWords) {
    var typos = {
      banio: "baño",
      tamano: "tamaño",
      sabado: "sábado",
      ubicacion: "ubicación",
      catalogo: "catálogo",
      peluqueria: "peluquería",
      galeria: "galería",
      telefono: "teléfono",
      direccion: "dirección",
      como: "cómo"
    };

    var typoHits = [];
    var badHits = [];
    var capsHits = [];

    texts.forEach(function (entry) {
      var value = (entry.value || "").toLowerCase();
      Object.keys(typos).forEach(function (wrong) {
        if (value.indexOf(wrong) !== -1) {
          typoHits.push({
            title: entry.title,
            detail: "Se detectó '" + wrong + "'. Sugerencia: '" + typos[wrong] + "'."
          });
        }
      });
      badWords.forEach(function (bad) {
        var re = new RegExp("\\b" + bad + "\\b", "i");
        if (re.test(value)) {
          badHits.push({
            title: entry.title,
            detail: "Se detectó lenguaje inapropiado: '" + bad + "'."
          });
        }
      });
      if (isLowercaseStart(entry.value)) {
        capsHits.push({
          title: entry.title,
          detail: "Revisar mayúscula inicial: '" + entry.value + "'."
        });
      }
    });

    return { typoHits: typoHits, badHits: badHits, capsHits: capsHits };
  }

  function findDuplicates(values, label) {
    var seen = {};
    var dups = [];
    values.forEach(function (entry) {
      var key = (entry.value || "").trim().toLowerCase();
      if (!key) {
        return;
      }
      if (seen[key]) {
        dups.push({
          title: label,
          detail: "Duplicado: '" + entry.value + "' (filas " + seen[key] + " y " + entry.row + ")"
        });
      } else {
        seen[key] = entry.row;
      }
    });
    return dups;
  }

  function updateSummary(summary, counts) {
    if (!summary) {
      return;
    }
    summary.innerHTML = "";
    Object.keys(counts).forEach(function (key) {
      var li = document.createElement("li");
      var strong = document.createElement("span");
      strong.textContent = key + ":";
      li.appendChild(strong);
      li.appendChild(document.createTextNode(" " + counts[key]));
      summary.appendChild(li);
    });
  }

  function isValidUrl(value) {
    if (!value) {
      return false;
    }
    try {
      var url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (err) {
      return false;
    }
  }

  function hasNumber(value) {
    return /[0-9]/.test(value || "");
  }

  function loadBadWords() {
    return fetch("insultos.txt")
      .then(function (res) {
        return res.text();
      })
      .then(function (text) {
        return text
          .split(/\r?\n/)
          .map(function (line) {
            return line.trim().toLowerCase();
          })
          .filter(function (line) {
            return line;
          });
      })
      .catch(function () {
        return ["puta", "puto", "mierda", "pelotudo", "concha", "culo"];
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var duplicatesList = document.querySelector("#duplicates-list");
    var missingList = document.querySelector("#missing-list");
    var typosList = document.querySelector("#typos-list");
    var badwordsList = document.querySelector("#badwords-list");
    var capsList = document.querySelector("#caps-list");
    var urlsList = document.querySelector("#urls-list");
    var pricesList = document.querySelector("#prices-list");
    var lengthList = document.querySelector("#length-list");
    var summary = document.querySelector("#summary");

    Promise.all([
      loadSheet("productos", "data/productos.json"),
      loadSheet("servicios", "data/servicios.json"),
      loadSheet("galeria", "data/galeria.json"),
      loadSheet("venta", "data/venta.json"),
      loadSheet("faq", "data/faq.json"),
      loadSheet("sobre_tomi", "data/sobre_tomi.json"),
      loadBadWords()
    ]).then(function (data) {
      var productos = data[0] || [];
      var servicios = data[1] || [];
      var galeria = data[2] || [];
      var venta = data[3] || [];
      var faq = data[4] || [];
      var sobre = data[5] || {};
      var badWords = data[6] || [];

      var missing = [];
      var allTexts = [];
      var productoNames = [];
      var servicioNames = [];
      var invalidUrls = [];
      var invalidPrices = [];
      var longTexts = [];

      productos.forEach(function (row, idx) {
        var nombre = pickField(row, ["nombre", "name", "producto"]);
        var precio = pickField(row, ["precio", "price", "valor"]);
        if (!nombre) {
          missing.push({ title: "Productos", detail: "Fila " + (idx + 2) + ": falta nombre." });
        }
        if (!precio) {
          missing.push({ title: "Productos", detail: "Fila " + (idx + 2) + ": falta precio." });
        } else if (!hasNumber(precio)) {
          invalidPrices.push({ title: "Productos", detail: "Fila " + (idx + 2) + ": precio sin número (" + precio + ")." });
        }
        var imagen = pickField(row, ["imagen", "image", "foto", "img"]);
        if (imagen && !isValidUrl(imagen)) {
          invalidUrls.push({ title: "Productos", detail: "Fila " + (idx + 2) + ": imagen con URL inválida." });
        }
        if (nombre) {
          productoNames.push({ value: nombre, row: idx + 2 });
          allTexts.push({ title: "Producto (fila " + (idx + 2) + ")", value: nombre });
        }
        var desc = pickField(row, ["descripcion", "descripcioncorta", "detalle", "desc"]);
        if (desc) {
          allTexts.push({ title: "Producto desc (fila " + (idx + 2) + ")", value: desc });
          if (desc.length > 140) {
            longTexts.push({ title: "Productos", detail: "Fila " + (idx + 2) + ": descripción muy larga." });
          }
        }
      });

      servicios.forEach(function (row, idx) {
        var nombre = pickField(row, ["servicio", "nombre", "name"]);
        var precio = pickField(row, ["precio", "price", "valor"]);
        if (!nombre) {
          missing.push({ title: "Servicios", detail: "Fila " + (idx + 2) + ": falta servicio." });
        }
        if (!precio) {
          missing.push({ title: "Servicios", detail: "Fila " + (idx + 2) + ": falta precio." });
        } else if (!hasNumber(precio)) {
          invalidPrices.push({ title: "Servicios", detail: "Fila " + (idx + 2) + ": precio sin número (" + precio + ")." });
        }
        var imagen = pickField(row, ["imagen", "image", "foto", "img"]);
        if (imagen && !isValidUrl(imagen)) {
          invalidUrls.push({ title: "Servicios", detail: "Fila " + (idx + 2) + ": imagen con URL inválida." });
        }
        if (nombre) {
          servicioNames.push({ value: nombre, row: idx + 2 });
          allTexts.push({ title: "Servicio (fila " + (idx + 2) + ")", value: nombre });
        }
      });

      galeria.forEach(function (row, idx) {
        var titulo = pickField(row, ["titulo", "title"]);
        var archivo = pickField(row, ["archivo", "url", "link", "media"]);
        if (!archivo) {
          missing.push({ title: "Galería", detail: "Fila " + (idx + 2) + ": falta archivo." });
        } else if (!isValidUrl(archivo)) {
          invalidUrls.push({ title: "Galería", detail: "Fila " + (idx + 2) + ": archivo con URL inválida." });
        }
        if (titulo) {
          allTexts.push({ title: "Galería (fila " + (idx + 2) + ")", value: titulo });
        }
      });

      if (Array.isArray(venta.items)) {
        venta.items.forEach(function (item, idx) {
          allTexts.push({ title: "Venta (item " + (idx + 1) + ")", value: item });
        });
      } else if (Array.isArray(venta)) {
        venta.forEach(function (row, idx) {
          var element = pickField(row, ["elementos", "elemento", "item", "nombre"]);
          if (element) {
            allTexts.push({ title: "Venta (fila " + (idx + 2) + ")", value: element });
          }
        });
      }

      if (Array.isArray(faq.items)) {
        faq.items.forEach(function (item, idx) {
          if (item.pregunta) {
            allTexts.push({ title: "FAQ (item " + (idx + 1) + ")", value: item.pregunta });
          }
          if (item.respuesta) {
            allTexts.push({ title: "FAQ resp (item " + (idx + 1) + ")", value: item.respuesta });
          }
        });
      } else if (Array.isArray(faq)) {
        faq.forEach(function (row, idx) {
          var pregunta = pickField(row, ["pregunta", "question", "q"]);
          var respuesta = pickField(row, ["respuesta", "answer", "a"]);
          if (pregunta) {
            allTexts.push({ title: "FAQ (fila " + (idx + 2) + ")", value: pregunta });
          }
          if (respuesta) {
            allTexts.push({ title: "FAQ resp (fila " + (idx + 2) + ")", value: respuesta });
          }
        });
      }

      if (sobre && sobre.descripcion) {
        allTexts.push({ title: "Sobre Tomi", value: sobre.descripcion });
      } else if (typeof sobre === "string") {
        allTexts.push({ title: "Sobre Tomi", value: sobre });
      }

      var duplicates = [];
      duplicates = duplicates.concat(findDuplicates(productoNames, "Productos"));
      duplicates = duplicates.concat(findDuplicates(servicioNames, "Servicios"));

      var analysis = analyzeTexts(allTexts, badWords);

      updateSummary(summary, {
        Duplicados: duplicates.length,
        Faltantes: missing.length,
        "Faltas posibles": analysis.typoHits.length,
        "Malas palabras": analysis.badHits.length,
        "Mayúsculas": analysis.capsHits.length,
        "URLs inválidas": invalidUrls.length,
        "Precios sin número": invalidPrices.length,
        "Textos largos": longTexts.length
      });

      duplicates.forEach(function (item) {
        addReport(duplicatesList, item.title, item.detail);
      });
      if (!duplicates.length) {
        addEmpty(duplicatesList);
      }

      missing.forEach(function (item) {
        addReport(missingList, item.title, item.detail);
      });
      if (!missing.length) {
        addEmpty(missingList);
      }

      analysis.typoHits.forEach(function (item) {
        addReport(typosList, item.title, item.detail);
      });
      if (!analysis.typoHits.length) {
        addEmpty(typosList);
      }

      analysis.badHits.forEach(function (item) {
        addReport(badwordsList, item.title, item.detail);
      });
      if (!analysis.badHits.length) {
        addEmpty(badwordsList);
      }

      analysis.capsHits.forEach(function (item) {
        addReport(capsList, item.title, item.detail);
      });
      if (!analysis.capsHits.length) {
        addEmpty(capsList);
      }

      invalidUrls.forEach(function (item) {
        addReport(urlsList, item.title, item.detail);
      });
      if (!invalidUrls.length) {
        addEmpty(urlsList);
      }

      invalidPrices.forEach(function (item) {
        addReport(pricesList, item.title, item.detail);
      });
      if (!invalidPrices.length) {
        addEmpty(pricesList);
      }

      longTexts.forEach(function (item) {
        addReport(lengthList, item.title, item.detail);
      });
      if (!longTexts.length) {
        addEmpty(lengthList);
      }
    });
  });
})();
