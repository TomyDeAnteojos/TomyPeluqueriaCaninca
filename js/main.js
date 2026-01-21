(function () {
  var CONFIG = {
    spreadsheetId: "1x10iL4j4GBjGl2DuDv1Xe3sgUS-DLYL2eTPIJ65LAq4",
    sheets: {
      productos: { sheet: "productos", gid: "" },
      servicios: { sheet: "servicios", gid: "" },
      estaticos: { sheet: "estaticos", gid: "" },
      galeria: { sheet: "galeria", gid: "" },
      horario: { sheet: "horario", gid: "" },
      sobre_tomi: { sheet: "sobre_tomi", gid: "" },
      venta: { sheet: "venta", gid: "" },
      faq: { sheet: "faq", gid: "" },
      animacion: { sheet: "animacion", gid: "" },
      seo: { sheet: "seo", gid: "" },
      asistente: { sheet: "asistente", gid: "" },
      promos: { sheet: "promos", gid: "" }
    }
  };

  function normalizeKey(key) {
    return key
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function capitalizeWords(value) {
    if (!value) {
      return "";
    }
    var text = value.toString().trim();
    if (!text) {
      return "";
    }
    var result = "";
    var shouldCap = true;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (shouldCap && /[a-zA-Z\u00C0-\u017F]/.test(ch)) {
        result += ch.toUpperCase();
        shouldCap = false;
        continue;
      }
      result += ch;
      if (ch === ".") {
        shouldCap = true;
      }
    }
    return result;
  }

  function pickField(obj, names) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      var normalized = normalizeKey(keys[i]);
      if (names.indexOf(normalized) !== -1) {
        return obj[keys[i]];
      }
    }
    return "";
  }

  function normalizeItem(raw, type) {
    return {
      nombre: capitalizeWords(pickField(raw, ["nombre", "name", "producto", "servicio"]) || ""),
      descripcion: capitalizeWords(pickField(raw, ["descripcion", "descripcioncorta", "detalle", "desc"]) || ""),
      precio: pickField(raw, ["precio", "price", "valor"]) || "",
      imagen: pickField(raw, ["imagen", "image", "foto", "img"]) || "",
      categoria: capitalizeWords(pickField(raw, ["categoria", "category", "tipo"]) || ""),
      duracion: type === "servicio" ? pickField(raw, ["duracion", "duration", "tiempo"]) || "" : ""
    };
  }

  function normalizeStatic(raw) {
    return {
      imagen: pickField(raw, ["imagen", "image", "foto", "img"]) || "",
      texto: capitalizeWords(pickField(raw, ["texto", "titulo", "label", "alt"]) || "")
    };
  }

  async function loadItems(type) {
    var sheetConfig = CONFIG.sheets[type === "producto" ? "productos" : "servicios"];
    try {
      var data = await window.Sheets.fetchSheetCSV({
        spreadsheetId: CONFIG.spreadsheetId,
        sheet: sheetConfig.sheet,
        gid: sheetConfig.gid
      });
      return data.map(function (item) {
        return normalizeItem(item, type);
      });
    } catch (err) {
      var fallbackPath = type === "producto" ? "data/productos.json" : "data/servicios.json";
      var res = await fetch(fallbackPath);
      var json = await res.json();
      return (json.items || []).map(function (item) {
        return normalizeItem(item, type);
      });
    }
  }

  async function loadStatics() {
    var sheetConfig = CONFIG.sheets.estaticos;
    try {
      var data = await window.Sheets.fetchSheetCSV({
        spreadsheetId: CONFIG.spreadsheetId,
        sheet: sheetConfig.sheet,
        gid: sheetConfig.gid
      });
      return data.map(normalizeStatic);
    } catch (err) {
      try {
        var res = await fetch("data/estaticos.json");
        var json = await res.json();
        return (json.items || []).map(normalizeStatic);
      } catch (fallbackErr) {
        return [];
      }
    }
  }

  async function loadGallery() {
    var sheetConfig = CONFIG.sheets.galeria;
    try {
      var data = await window.Sheets.fetchSheetCSV({
        spreadsheetId: CONFIG.spreadsheetId,
        sheet: sheetConfig.sheet,
        gid: sheetConfig.gid
      });
      return data.map(function (raw) {
        return {
          titulo: capitalizeWords(pickField(raw, ["titulo", "titulo", "title", "nombre"]) || ""),
          archivo: pickField(raw, ["archivo", "file", "url", "link", "media"]) || ""
        };
      });
    } catch (err) {
      try {
        var res = await fetch("data/galeria.json");
        var json = await res.json();
        return json.items || [];
      } catch (fallbackErr) {
        return [];
      }
    }
  }

  async function loadHorario() {
    var sheetConfig = CONFIG.sheets.horario;
    try {
      var data = await window.Sheets.fetchSheetCSV({
        spreadsheetId: CONFIG.spreadsheetId,
        sheet: sheetConfig.sheet,
        gid: sheetConfig.gid
      });
      var item = data[0] || {};
      return {
        inicio: pickField(item, ["inicio", "desde", "open"]) || "",
        cierre: pickField(item, ["cierre", "hasta", "close"]) || ""
      };
    } catch (err) {
      try {
        var res = await fetch("data/horario.json");
        return await res.json();
      } catch (fallbackErr) {
        return { inicio: "", cierre: "" };
      }
    }
  }

  async function loadSobreTomi() {
    var sheetConfig = CONFIG.sheets.sobre_tomi;
    try {
      var data = await window.Sheets.fetchSheetCSV({
        spreadsheetId: CONFIG.spreadsheetId,
        sheet: sheetConfig.sheet,
        gid: sheetConfig.gid
      });
      var item = data[0] || {};
      return capitalizeWords(pickField(item, ["descripcion", "texto", "contenido"]) || "");
    } catch (err) {
      try {
        var res = await fetch("data/sobre_tomi.json");
        var json = await res.json();
        return json.descripcion || "";
      } catch (fallbackErr) {
        return "";
      }
    }
  }

  async function loadVenta() {
    var sheetConfig = CONFIG.sheets.venta;
    try {
      var data = await window.Sheets.fetchSheetCSV({
        spreadsheetId: CONFIG.spreadsheetId,
        sheet: sheetConfig.sheet,
        gid: sheetConfig.gid
      });
      return data
        .map(function (item) {
          return capitalizeWords(pickField(item, ["elementos", "elemento", "item", "nombre"]) || "");
        })
        .filter(Boolean);
    } catch (err) {
      try {
        var res = await fetch("data/venta.json");
        var json = await res.json();
        return json.items || [];
      } catch (fallbackErr) {
        return [];
      }
    }
  }

  async function loadFaq() {
    var sheetConfig = CONFIG.sheets.faq;
    try {
      var data = await window.Sheets.fetchSheetCSV({
        spreadsheetId: CONFIG.spreadsheetId,
        sheet: sheetConfig.sheet,
        gid: sheetConfig.gid
      });
      return data
        .map(function (item) {
          return {
            pregunta: capitalizeWords(pickField(item, ["pregunta", "question", "q"]) || ""),
            respuesta: capitalizeWords(pickField(item, ["respuesta", "answer", "a"]) || "")
          };
        })
        .filter(function (item) {
          return item.pregunta || item.respuesta;
        });
    } catch (err) {
      try {
        var res = await fetch("data/faq.json");
        var json = await res.json();
        return json.items || [];
      } catch (fallbackErr) {
        return [];
      }
    }
  }

  
  async function loadSeo() {
    var sheetConfig = CONFIG.sheets.seo;
    try {
      var data = await window.Sheets.fetchSheetCSV({
        spreadsheetId: CONFIG.spreadsheetId,
        sheet: sheetConfig.sheet,
        gid: sheetConfig.gid
      });
      return data || [];
    } catch (err) {
      return [];
    }
  }

  async function loadPromos() {
    var sheetConfig = CONFIG.sheets.promos;
    try {
      var data = await window.Sheets.fetchSheetCSV({
        spreadsheetId: CONFIG.spreadsheetId,
        sheet: sheetConfig.sheet,
        gid: sheetConfig.gid
      });
      return data || [];
    } catch (err) {
      try {
        var res = await fetch("data/promos.json");
        var json = await res.json();
        return json.items || [];
      } catch (fallbackErr) {
        return [];
      }
    }
  }

  async function loadAnimacion() {
    var sheetConfig = CONFIG.sheets.animacion;
    try {
      var data = await window.Sheets.fetchSheetCSV({
        spreadsheetId: CONFIG.spreadsheetId,
        sheet: sheetConfig.sheet,
        gid: sheetConfig.gid
      });
      var item = data[0] || {};
      var value = pickField(item, ["animacion", "animation", "activar"]) || "";
      return value.toString().trim().toLowerCase() === "si";
    } catch (err) {
      try {
        var res = await fetch("data/animacion.json");
        var json = await res.json();
        return json.animacion === "si";
      } catch (fallbackErr) {
        return false;
      }
    }
  }
  function parsePrice(value) {
    if (!value) {
      return NaN;
    }
    var cleaned = value.toString().replace(/[^0-9.]/g, "");
    return parseFloat(cleaned);
  }

  function setupThemeToggle() {
    var toggle = document.querySelector("#theme-toggle");
    if (!toggle) {
      return;
    }
    var icon = toggle.querySelector("img");
    var label = toggle.querySelector(".sr-only");
    var saved = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var initial = saved || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", initial);
    toggle.setAttribute("aria-pressed", initial === "dark" ? "true" : "false");
    var initialLabel = initial === "dark" ? "Modo claro" : "Modo oscuro";
    toggle.setAttribute("aria-label", initialLabel);
    if (label) {
      label.textContent = initialLabel;
    }
    if (icon) {
      icon.src = initial === "dark" ? "assets/img/icons/sun.svg" : "assets/img/icons/moon.svg";
    }

    toggle.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme");
      var next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      toggle.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
      var nextLabel = next === "dark" ? "Modo claro" : "Modo oscuro";
      toggle.setAttribute("aria-label", nextLabel);
      if (label) {
        label.textContent = nextLabel;
      }
      if (icon) {
        icon.src = next === "dark" ? "assets/img/icons/sun.svg" : "assets/img/icons/moon.svg";
      }
    });
  }

  function setupMobileNav() {
    var toggle = document.querySelector("#nav-toggle");
    var mobile = document.querySelector("#nav-mobile");
    var closeBtn = document.querySelector("#nav-close");
    if (!toggle || !mobile) {
      return;
    }
    toggle.addEventListener("click", function () {
      document.body.classList.toggle("nav-open");
    });
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
      });
    }
    mobile.addEventListener("click", function (event) {
      if (event.target.tagName === "A") {
        document.body.classList.remove("nav-open");
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        document.body.classList.remove("nav-open");
      }
    });
  }

  function setupReveal() {
    var elements = document.querySelectorAll(".reveal");
    if (!elements.length) {
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  function setupGeneralWhatsApp() {
    var generalMessage = "Hola! Quiero reservar un turno para mi mascota. Estoy en Del Viso/Pilar. ?Qu? disponibilidad tienen?";
    var links = document.querySelectorAll("[data-wa='general']");
    links.forEach(function (link) {
      link.href = window.UI.buildWhatsAppLink(generalMessage);
    });
  }

  async function initHome() {
    var servicesContainer = document.querySelector("#home-servicios");
    var productsContainer = document.querySelector("#home-productos");
    var galleryContainer = document.querySelector("#home-galeria");
    var galleryFilters = document.querySelector("#home-galeria-filtros");
    var staticsContainer = document.querySelector("#home-estaticos");
    var sobreTomiText = document.querySelector("#sobre-tomi-text");
    var ventaList = document.querySelector("#venta-list");
    var faqList = document.querySelector("#faq-list");
    var horarioInicio = document.querySelector("#horario-inicio");
    var horarioCierre = document.querySelector("#horario-cierre");
    var promoBanner = document.querySelector("#promo-banner");

    if (!servicesContainer && !productsContainer) {
      return;
    }

    var servicios = await loadItems("servicio");
    var productos = await loadItems("producto");
    var galleryItems = await loadGallery();

    if (servicesContainer) {
      window.UI.renderCards(servicesContainer, servicios.slice(0, 3), "servicio");
    }
    if (productsContainer) {
      window.UI.renderCards(productsContainer, productos.slice(0, 3), "producto");
    }

    if (staticsContainer) {
      var statics = await loadStatics();
      staticsContainer.innerHTML = "";
      statics
        .filter(function (item) {
          return item.imagen;
        })
        .slice(0, 4)
        .forEach(function (item) {
          var wrap = document.createElement("div");
          wrap.className = "static-item";
          var img = document.createElement("img");
          img.loading = "lazy";
          img.alt = item.texto || "Tomi Peluquería Canina";
          img.src = item.imagen;
          wrap.appendChild(img);
          staticsContainer.appendChild(wrap);
        });
      if (!staticsContainer.children.length) {
        staticsContainer.style.display = "none";
      }
    }

    var sobre = await loadSobreTomi();
    if (sobreTomiText && sobre) {
      sobreTomiText.textContent = sobre;
    }

    var ventaItems = await loadVenta();
    if (ventaList) {
      ventaList.innerHTML = "";
      (ventaItems.length ? ventaItems : ["Collares", "Pastillas y pipetas", "Alimento balanceado", "Ropa y camitas", "Desparasitarios"])
        .forEach(function (item) {
          var li = document.createElement("li");
          var bullet = document.createElement("span");
          bullet.textContent = "•";
          li.appendChild(bullet);
          li.appendChild(document.createTextNode(" " + item));
          ventaList.appendChild(li);
        });
    }

    var faqItems = await loadFaq();
    if (faqList) {
      faqList.innerHTML = "";
      faqItems.slice(0, 6).forEach(function (item) {
        var block = document.createElement("div");
        block.className = "faq-item";
        var q = document.createElement("strong");
        q.textContent = item.pregunta;
        var a = document.createElement("p");
        a.textContent = item.respuesta;
        block.appendChild(q);
        if (item.respuesta) {
          block.appendChild(a);
        }
        faqList.appendChild(block);
      });
      if (!faqList.children.length) {
        faqList.parentElement.style.display = "none";
      }
    }
    if (faqItems.length) {
      var faqSchemaItems = faqItems
        .filter(function (item) {
          return item.pregunta && item.respuesta;
        })
        .slice(0, 6)
        .map(function (item) {
          return {
            "@type": "Question",
            "name": item.pregunta,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.respuesta
            }
          };
        });
      if (faqSchemaItems.length) {
        var script = document.querySelector("#faq-schema");
        if (!script) {
          script = document.createElement("script");
          script.type = "application/ld+json";
          script.id = "faq-schema";
          document.head.appendChild(script);
        }
        script.textContent = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqSchemaItems
        });
      }
    }

    var horario = await loadHorario();
    if (horarioInicio && horario.inicio) {
      horarioInicio.textContent = horario.inicio;
    }
    if (horarioCierre && horario.cierre) {
      horarioCierre.textContent = horario.cierre;
    }

    if (promoBanner) {
      var promos = await loadPromos();
      var promoActiva = promos.find(function (promo) {
        var activo = (promo.activo || "").toString().trim().toLowerCase();
        return activo === "si";
      });
      if (promoActiva) {
        promoBanner.style.display = "flex";
        promoBanner.querySelector("[data-promo-title]").textContent = promoActiva.titulo || "Promo";
        promoBanner.querySelector("[data-promo-desc]").textContent = promoActiva.descripcion || "";
        promoBanner.querySelector("[data-promo-tag]").textContent = promoActiva.etiqueta || "Nuevo";
      } else {
        promoBanner.style.display = "none";
      }
    }

    if (galleryContainer) {
      var itemsWithImages = galleryItems.filter(function (item) {
        return item.archivo;
      });
      if (galleryFilters) {
        if (!itemsWithImages.length) {
          galleryFilters.style.display = "none";
        } else {
          galleryFilters.style.display = "none";
        }
      }
      window.UI.renderGallery(galleryContainer, galleryItems);
    }
    setupReveal();
  }

  function populateCategories(select, items) {
    var categories = items
      .map(function (item) {
        return item.categoria;
      })
      .filter(function (cat) {
        return cat;
      });
    var unique = Array.from(new Set(categories));
    unique.sort();
    unique.forEach(function (cat) {
      var option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      select.appendChild(option);
    });
  }

  function filterItems(items, query, category, sort) {
    var filtered = items.filter(function (item) {
      var matchesQuery = true;
      if (query) {
        var target = (item.nombre + " " + item.descripcion).toLowerCase();
        matchesQuery = target.indexOf(query) !== -1;
      }
      var matchesCategory = category === "all" || !category || item.categoria === category;
      return matchesQuery && matchesCategory;
    });

    if (sort === "price-asc") {
      filtered.sort(function (a, b) {
        return parsePrice(a.precio) - parsePrice(b.precio);
      });
    }
    if (sort === "price-desc") {
      filtered.sort(function (a, b) {
        return parsePrice(b.precio) - parsePrice(a.precio);
      });
    }
    return filtered;
  }

  async function initCatalogo() {
    var grid = document.querySelector("#catalogo-grid");
    if (!grid) {
      return;
    }
    var searchInput = document.querySelector("#catalogo-search");
    var categorySelect = document.querySelector("#catalogo-category");
    var sortSelect = document.querySelector("#catalogo-sort");
    var count = document.querySelector("#catalogo-count");

    var items = await loadItems("producto");
    populateCategories(categorySelect, items);

    function render() {
      var query = searchInput.value.trim().toLowerCase();
      var category = categorySelect.value;
      var sort = sortSelect.value;
      var filtered = filterItems(items, query, category, sort);
      window.UI.renderCards(grid, filtered, "producto");
      if (count) {
        count.textContent = filtered.length + " productos";
      }
      setupReveal();
    }

    [searchInput, categorySelect, sortSelect].forEach(function (el) {
      el.addEventListener("input", render);
      el.addEventListener("change", render);
    });

    render();
  }

  async function initServicios() {
    var grid = document.querySelector("#servicios-grid");
    if (!grid) {
      return;
    }
    var searchInput = document.querySelector("#servicios-search");
    var categorySelect = document.querySelector("#servicios-category");
    var count = document.querySelector("#servicios-count");

    var items = await loadItems("servicio");
    populateCategories(categorySelect, items);

    function render() {
      var query = searchInput.value.trim().toLowerCase();
      var category = categorySelect.value;
      var filtered = filterItems(items, query, category, "");
      window.UI.renderCards(grid, filtered, "servicio");
      if (count) {
        count.textContent = filtered.length + " servicios";
      }
      setupReveal();
    }

    [searchInput, categorySelect].forEach(function (el) {
      el.addEventListener("input", render);
      el.addEventListener("change", render);
    });

    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupThemeToggle();
    setupMobileNav();
    setupGeneralWhatsApp();

    var baseKeywords = [
      "peluqueria canina",
      "peluqueria canina pilar",
      "peluqueria canina del viso",
      "peluqueria canina en pilar",
      "peluqueria canina en del viso",
      "peluqueria canina cerca",
      "peluqueria canina cerca de mi",
      "peluqueria canina zona norte",
      "peluqueria canina buenos aires",
      "peluqueria canina gba norte",
      "bano y corte canino",
      "bano y corte para perros",
      "bano y corte canino pilar",
      "bano y corte canino del viso",
      "bano para perros",
      "corte de pelo para perros",
      "corte canino profesional",
      "grooming canino",
      "grooming canino pilar",
      "grooming para perros",
      "grooming profesional perros",
      "groomer canino pilar",
      "groomer canino del viso",
      "peluqueria para perros",
      "peluqueria para perros pilar",
      "peluqueria para perros del viso",
      "peluqueria de mascotas",
      "peluqueria de mascotas pilar",
      "bano antipulgas para perros",
      "bano medicado para perros",
      "banos medicados caninos",
      "tratamiento antipulgas perros",
      "desparasitacion canina",
      "desparasitarios para perros",
      "deslanado canino",
      "deslanado para perros",
      "deslanado profesional",
      "deslanado perros pilar",
      "corte de unas para perros",
      "limpieza de oidos para perros",
      "higiene canina",
      "peluqueria canina economica",
      "peluqueria canina de confianza",
      "mejor peluqueria canina pilar",
      "peluqueria canina recomendada",
      "peluqueria canina con turnos",
      "turnos peluqueria canina",
      "turnos bano y corte perros",
      "venta de productos para mascotas",
      "productos para perros pilar",
      "productos para mascotas del viso",
      "venta de collares para perros",
      "venta de pipetas para perros",
      "venta de antipulgas perros",
      "venta de alimento balanceado",
      "alimento balanceado para perros",
      "ropa para perros",
      "camitas para perros",
      "accesorios para mascotas",
      "pet shop pilar",
      "pet shop del viso",
      "tienda para mascotas pilar",
      "peluqueria canina con whatsapp",
      "peluqueria canina turnos por whatsapp",
      "peluqueria canina instagram",
      "bano y corte perros cerca",
      "grooming perros cerca",
      "peluqueria canina abierta hoy",
      "cuidado canino profesional",
      "cuidado de mascotas",
      "estetica canina",
      "estetica canina pilar",
      "peluqueria canina para cachorros",
      "peluqueria canina perros grandes",
      "peluqueria canina perros chicos",
      "peluqueria canina zona del viso",
      "peluqueria canina barrio del viso",
      "peluqueria canina pilar centro"
    ];

    loadSeo().then(function (seoRows) {
      var seoText = "";
      if (seoRows.length) {
        var first = seoRows[0] || {};
        seoText = pickField(first, ["seo", "descripcion", "texto"]) || "";
      }
      if (!seoText) {
        return;
      }
      var description = document.querySelector('meta[name="description"]');
      if (description) {
        description.setAttribute("content", seoText);
      }
      var ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute("content", seoText);
      }
    });

    loadSeo().then(function (seoRows) {
      var extraKeywords = seoRows
        .map(function (row) {
          return pickField(row, ["seo", "keyword", "palabra", "termino"]) || "";
        })
        .map(function (value) {
          return value.toString().trim().toLowerCase();
        })
        .filter(Boolean);
      var keywords = baseKeywords.concat(extraKeywords);
      var unique = Array.from(new Set(keywords));
      var keywordsMeta = document.querySelector('meta[name="keywords"]');
      if (!keywordsMeta) {
        keywordsMeta = document.createElement("meta");
        keywordsMeta.setAttribute("name", "keywords");
        document.head.appendChild(keywordsMeta);
      }
      keywordsMeta.setAttribute("content", unique.join(", "));
    });
    loadAnimacion().then(function (enabled) {
      if (!enabled) {
        return;
      }
      document.body.classList.add("animaciones-max");
      if (!document.querySelector(".float-layer")) {
        var layer = document.createElement("div");
        layer.className = "float-layer";
        layer.setAttribute("aria-hidden", "true");
        layer.innerHTML =
          '<span class=\"float-shape shape-1\"></span>' +
          '<span class=\"float-shape shape-2\"></span>' +
          '<span class=\"float-shape shape-3\"></span>';
        document.body.appendChild(layer);
      }
    });
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("service-worker.js").catch(function () {});
    }
    var page = document.body.getAttribute("data-page");
    if (page === "home") {
      initHome();
    }
    if (page === "catalogo") {
      initCatalogo();
    }
    if (page === "servicios") {
      initServicios();
    }
    setupReveal();
  });
})();
