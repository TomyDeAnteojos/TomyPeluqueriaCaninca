(function () {
  var CONFIG = {
    spreadsheetId: "1x10iL4j4GBjGl2DuDv1Xe3sgUS-DLYL2eTPIJ65LAq4",
    sheets: {
      asistente: { sheet: "asistente", gid: "" },
      servicios: { sheet: "servicios", gid: "" }
    }
  };

  var QUESTIONS = [
    {
      key: "tamano",
      title: "Tamaño de la mascota",
      sub: "Elegí una opción",
      options: [
        { label: "Pequeño", value: "pequeno" },
        { label: "Mediano", value: "mediano" },
        { label: "Grande", value: "grande" }
      ]
    },
    {
      key: "pelo",
      title: "Tipo de pelo",
      sub: "Seleccioná el tipo de pelaje",
      options: [
        { label: "Corto", value: "corto" },
        { label: "Medio", value: "medio" },
        { label: "Largo", value: "largo" },
        { label: "Doble capa", value: "doble_capa" }
      ]
    },
    {
      key: "nudos",
      title: "Estado del pelo",
      sub: "¿Hay nudos?",
      options: [
        { label: "Normal", value: "no" },
        { label: "Con nudos", value: "si" }
      ]
    },
    {
      key: "objetivo",
      title: "Objetivo principal",
      sub: "¿Qué buscás?",
      options: [
        { label: "Higiene", value: "higiene" },
        { label: "Corte", value: "corte" },
        { label: "Deslanado", value: "deslanado" },
        { label: "Piel sensible", value: "piel_sensible" },
        { label: "Antipulgas", value: "antipulgas" },
        { label: "Uñas", value: "unas" }
      ]
    },
    {
      key: "comportamiento",
      title: "Comportamiento",
      sub: "Elija uno",
      options: [
        { label: "Tranquilo", value: "tranquilo" },
        { label: "Nervioso", value: "nervioso" }
      ]
    },
    {
      key: "preferencia",
      title: "Preferencia",
      sub: "Opcional",
      options: [
        { label: "Bien cortito", value: "cortito" },
        { label: "Solo prolijo", value: "prolijo" },
        { label: "Sin preferencia", value: "" }
      ]
    }
  ];

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

  function normalizeValue(value) {
    return value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
  }

  function normalizeCategory(value) {
    return normalizeKey(value).replace(/\s+/g, "_");
  }

  function parseConditions(raw) {
    var conditions = {};
    if (!raw) {
      return conditions;
    }
    raw.split(";").forEach(function (pair) {
      var parts = pair.split("=");
      if (parts.length < 2) {
        return;
      }
      var key = normalizeValue(parts[0]);
      var value = normalizeValue(parts.slice(1).join("="));
      conditions[key] = value;
    });
    return conditions;
  }

  function parseTags(raw) {
    return (raw || "")
      .split(",")
      .map(function (tag) {
        return tag.trim();
      })
      .filter(Boolean);
  }

  function mapCategoryKey(raw) {
    if (!raw) {
      return "";
    }
    var key = normalizeCategory(raw);
    if (key === "tamano" || key === "tamaño" || key === "size") {
      return "tamano";
    }
    if (key === "pelo" || key === "pelaje" || key === "hair") {
      return "pelo";
    }
    if (key === "estado_pelo" || key === "estado" || key === "nudos") {
      return "nudos";
    }
    if (key === "objetivo" || key === "goal") {
      return "objetivo";
    }
    if (key === "comportamiento" || key === "temperamento" || key === "conducta") {
      return "comportamiento";
    }
    if (key === "preferencia" || key === "estilo" || key === "preferido") {
      return "preferencia";
    }
    return "";
  }

  function buildRulesFromRows(rows) {
    var rulesById = {};
    rows.forEach(function (row, index) {
      var id = row.id || row.regla || row.rule || row.servicio_slug || row.servicio || "regla_" + (index + 1);
      var record = rulesById[id];
      if (!record) {
        record = {
          id: id,
          prioridad: parseInt(row.prioridad || "99", 10),
          condiciones: {},
          servicio_slug: normalizeValue(row.servicio_slug || row.servicio || ""),
          mensaje: row.mensaje || "",
          desde_precio: row.precio_desde || row.desde_precio || "",
          tags_extras: parseTags(row.tags_extras || row.extras || "")
        };
        rulesById[id] = record;
      } else {
        if (!record.servicio_slug && (row.servicio_slug || row.servicio)) {
          record.servicio_slug = normalizeValue(row.servicio_slug || row.servicio || "");
        }
        if (!record.mensaje && row.mensaje) {
          record.mensaje = row.mensaje;
        }
        if (!record.desde_precio && (row.precio_desde || row.desde_precio)) {
          record.desde_precio = row.precio_desde || row.desde_precio || "";
        }
        if (!record.tags_extras.length && (row.tags_extras || row.extras)) {
          record.tags_extras = parseTags(row.tags_extras || row.extras || "");
        }
        if (row.prioridad && parseInt(row.prioridad, 10) < record.prioridad) {
          record.prioridad = parseInt(row.prioridad, 10);
        }
      }

      var categoriaRaw = pickField(row, ["categoria", "category", "criterio"]);
      var valorRaw = pickField(row, ["valor", "value", "condicion", "condiciones"]);
      var categoria = mapCategoryKey(categoriaRaw);
      if (categoria && valorRaw) {
        record.condiciones[categoria] = normalizeValue(valorRaw);
      }
    });

    return Object.keys(rulesById).map(function (key) {
      return rulesById[key];
    });
  }

  function buildConditionsFromColumns(row) {
    var mapping = {
      tamano: ["tamano", "tamaño", "size"],
      pelo: ["pelo", "pelaje", "hair"],
      nudos: ["nudos", "estado", "nudo"],
      objetivo: ["objetivo", "meta", "goal"],
      comportamiento: ["comportamiento", "temperamento", "conducta"],
      preferencia: ["preferencia", "preferido", "estilo"]
    };
    var conditions = {};
    Object.keys(mapping).forEach(function (key) {
      var value = pickField(row, mapping[key]);
      if (value) {
        conditions[key] = normalizeValue(value);
      }
    });
    return conditions;
  }

  async function loadRules() {
    try {
      var data = await window.Sheets.fetchSheetCSV({
        spreadsheetId: CONFIG.spreadsheetId,
        sheet: CONFIG.sheets.asistente.sheet,
        gid: CONFIG.sheets.asistente.gid
      });
      var hasCategoryRows = data.some(function (row) {
        return pickField(row, ["categoria", "category", "criterio"]);
      });
      if (hasCategoryRows) {
        return buildRulesFromRows(data);
      }
      return data.map(function (row) {
        var condiciones = {};
        var rawCondiciones = row.condiciones || row.condicion || "";
        if (rawCondiciones) {
          condiciones = parseConditions(rawCondiciones);
        } else {
          condiciones = buildConditionsFromColumns(row);
        }
        return {
          id: row.id || "",
          prioridad: parseInt(row.prioridad || "99", 10),
          condiciones: condiciones,
          servicio_slug: normalizeValue(row.servicio_slug || row.servicio || ""),
          mensaje: row.mensaje || "",
          desde_precio: row.precio_desde || row.desde_precio || "",
          tags_extras: parseTags(row.tags_extras || "")
        };
      });
    } catch (err) {
      var res = await fetch("data/asistente.json");
      var json = await res.json();
      return json.rules || [];
    }
  }

  async function loadBasePrices() {
    try {
      var res = await fetch("data/asistente.json");
      var json = await res.json();
      return json.base_precios || {};
    } catch (err) {
      return {};
    }
  }

  async function loadServicios() {
    try {
      var data = await window.Sheets.fetchSheetCSV({
        spreadsheetId: CONFIG.spreadsheetId,
        sheet: CONFIG.sheets.servicios.sheet,
        gid: CONFIG.sheets.servicios.gid
      });
      return data.map(function (row) {
        return {
          nombre: row.nombre || row.servicio || "",
          precio: row.precio || "",
          imagen: row.imagen || "",
          descripcion: row.descripcion || ""
        };
      });
    } catch (err) {
      var res = await fetch("data/servicios.json");
      var json = await res.json();
      return json.items || [];
    }
  }

  function matchRule(answers, rule) {
    var conditions = rule.condiciones || {};
    var keys = Object.keys(conditions);
    if (!keys.length) {
      return true;
    }
    return keys.every(function (key) {
      var expected = conditions[key];
      if (!expected) {
        return true;
      }
      var actual = normalizeValue(answers[key] || "");
      if (!actual) {
        return false;
      }
      if (expected === "*") {
        return true;
      }
      var options = expected.split(/[|,]/).map(function (item) {
        return item.trim();
      });
      return options.indexOf(actual) !== -1;
    });
  }

  function pickService(services, slug) {
    if (!slug) {
      return null;
    }
    var normalized = normalizeValue(slug);
    return services.find(function (service) {
      return normalizeValue(service.nombre || "") === normalized;
    });
  }

  function formatPrice(value) {
    if (!value) {
      return "";
    }
    var str = value.toString().trim();
    if (!str) {
      return "";
    }
    if (!/\$/.test(str)) {
      return "$" + str;
    }
    return str;
  }

  function buildWhatsApp(text) {
    if (window.UI && window.UI.buildWhatsAppLink) {
      return window.UI.buildWhatsAppLink(text);
    }
    return "https://wa.me/5491123822819?text=" + encodeURIComponent(text);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var step = 0;
    var answers = {};
    var rules = [];
    var servicios = [];
    var basePrecios = {};

    var title = document.querySelector("#question-title");
    var sub = document.querySelector("#question-sub");
    var optionsWrap = document.querySelector("#question-options");
    var prev = document.querySelector("#prev-step");
    var next = document.querySelector("#next-step");
    var progressBar = document.querySelector("#progress-bar");
    var progressLabel = document.querySelector("#progress-label");
    var resultSection = document.querySelector("#assistant-result");
    var resultTitle = document.querySelector("#result-title");
    var resultNote = document.querySelector("#result-note");
    var resultExtras = document.querySelector("#result-extras");
    var resultPrice = document.querySelector("#result-price");
    var resultWhatsApp = document.querySelector("#result-whatsapp");
    var restart = document.querySelector("#restart");
    var icsSection = document.querySelector("#ics-section");
    var icsDate = document.querySelector("#ics-date");
    var icsTime = document.querySelector("#ics-time");
    var icsDownload = document.querySelector("#ics-download");

    Promise.all([loadRules(), loadServicios(), loadBasePrices()]).then(function (data) {
      rules = data[0].sort(function (a, b) {
        return a.prioridad - b.prioridad;
      });
      servicios = data[1];
      basePrecios = data[2];
      renderStep();
    });

    function renderStep() {
      var current = QUESTIONS[step];
      if (!current) {
        return;
      }
      title.textContent = current.title;
      sub.textContent = current.sub || "";
      optionsWrap.innerHTML = "";
      current.options.forEach(function (option) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-outline";
        btn.textContent = option.label;
        if (answers[current.key] === option.value) {
          btn.classList.add("is-selected");
        }
        btn.addEventListener("click", function () {
          answers[current.key] = option.value;
          renderStep();
        });
        optionsWrap.appendChild(btn);
      });
      prev.disabled = step === 0;
      next.textContent = step === QUESTIONS.length - 1 ? "Ver resultado" : "Siguiente";
      var progress = Math.round(((step + 1) / QUESTIONS.length) * 100);
      progressBar.style.width = progress + "%";
      progressLabel.textContent = (step + 1) + "/" + QUESTIONS.length;
    }

    function buildResult() {
      var match = rules.find(function (rule) {
        return matchRule(answers, rule);
      });
      var recomendado = match ? pickService(servicios, match.servicio_slug) : null;
      var nombre = recomendado ? recomendado.nombre : (match && match.servicio_slug ? match.servicio_slug : "Servicio personalizado");
      var nota = match && match.mensaje ? match.mensaje : "Recomendación basada en tus respuestas.";
      var extras = match && match.tags_extras ? match.tags_extras : [];
      var desde = match && match.desde_precio ? match.desde_precio : (recomendado && recomendado.precio ? recomendado.precio : "");
      if (!desde && answers.tamano && basePrecios[answers.tamano]) {
        desde = basePrecios[answers.tamano];
      }
      resultTitle.textContent = nombre;
      resultNote.textContent = nota;
      resultExtras.innerHTML = "";
      extras.forEach(function (extra) {
        var badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = extra;
        resultExtras.appendChild(badge);
      });
      if (desde) {
        resultPrice.textContent = "Estimado desde " + formatPrice(desde);
      } else {
        resultPrice.textContent = "";
      }

      var message = "Hola! Me recomendaste el servicio: " + nombre + "." +
        " Tamaño: " + (answers.tamano || "") +
        ", pelo: " + (answers.pelo || "") +
        ", estado: " + (answers.nudos || "") +
        ". Estoy en Del Viso/Pilar. Horarios 08 a 18. " + window.location.href;
      resultWhatsApp.href = buildWhatsApp(message);
      resultSection.style.display = "block";
      icsSection.style.display = "block";
    }

    next.addEventListener("click", function () {
      if (step < QUESTIONS.length - 1) {
        step += 1;
        renderStep();
        return;
      }
      buildResult();
      resultSection.scrollIntoView({ behavior: "smooth" });
    });

    prev.addEventListener("click", function () {
      if (step === 0) {
        return;
      }
      step -= 1;
      renderStep();
    });

    restart.addEventListener("click", function () {
      step = 0;
      answers = {};
      resultSection.style.display = "none";
      icsSection.style.display = "none";
      renderStep();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    icsDownload.addEventListener("click", function () {
      if (!icsDate.value || !icsTime.value) {
        return;
      }
      var dt = icsDate.value.replace(/-/g, "") + "T" + icsTime.value.replace(":", "") + "00";
      var content = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Tomi Peluquería Canina//ES",
        "BEGIN:VEVENT",
        "DTSTART:" + dt,
        "SUMMARY:Turno - Tomi Peluquería Canina",
        "LOCATION:Batalla de Caseros 164, Del Viso",
        "DESCRIPTION:" + (resultTitle.textContent || "Servicio") + " - WhatsApp 5491123822819",
        "END:VEVENT",
        "END:VCALENDAR"
      ].join("\n");
      var blob = new Blob([content], { type: "text/calendar" });
      var link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "turno-tomi.ics";
      link.click();
      URL.revokeObjectURL(link.href);
    });
  });
})();
