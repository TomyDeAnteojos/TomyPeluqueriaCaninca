(function () {
  var CONFIG = {
    spreadsheetId: "1x10iL4j4GBjGl2DuDv1Xe3sgUS-DLYL2eTPIJ65LAq4",
    sheets: {
      productos: { sheet: "productos", gid: "" }, // Opcional: agrega el gid si lo necesitas.
      servicios: { sheet: "servicios", gid: "" } // Opcional: agrega el gid si lo necesitas.
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
      nombre: pickField(raw, ["nombre", "name", "producto", "servicio"]) || "",
      descripcion: pickField(raw, ["descripcion", "descripcioncorta", "detalle", "desc"]) || "",
      precio: pickField(raw, ["precio", "price", "valor"]) || "",
      imagen: pickField(raw, ["imagen", "image", "foto", "img"]) || "",
      categoria: pickField(raw, ["categoria", "category", "tipo"]) || "",
      duracion: type === "servicio" ? pickField(raw, ["duracion", "duration", "tiempo"]) || "" : ""
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
    var saved = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var initial = saved || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", initial);
    toggle.setAttribute("aria-pressed", initial === "dark" ? "true" : "false");
    toggle.textContent = initial === "dark" ? "Modo claro" : "Modo oscuro";

    toggle.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme");
      var next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      toggle.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
      toggle.textContent = next === "dark" ? "Modo claro" : "Modo oscuro";
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
    var generalMessage =
      "Hola! Quiero reservar un turno para mi mascota. Estoy en Del Viso/Pilar. \u00bfQué disponibilidad tienen?";
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

    if (!servicesContainer && !productsContainer) {
      return;
    }

    var servicios = await loadItems("servicio");
    var productos = await loadItems("producto");
    var galleryItems = servicios.concat(productos);

    if (servicesContainer) {
      window.UI.renderCards(servicesContainer, servicios.slice(0, 6), "servicio");
    }
    if (productsContainer) {
      window.UI.renderCards(productsContainer, productos.slice(0, 6), "producto");
    }
    if (galleryContainer) {
      var itemsWithImages = galleryItems.filter(function (item) {
        return item.imagen;
      });
      if (galleryFilters) {
        if (!itemsWithImages.length) {
          galleryFilters.style.display = "none";
        } else {
          var categories = Array.from(
            new Set(
              itemsWithImages
                .map(function (item) {
                  return item.categoria;
                })
                .filter(function (cat) {
                  return cat;
                })
            )
          );
          var allButton = document.createElement("button");
          allButton.type = "button";
          allButton.className = "badge is-active";
          allButton.textContent = "Todas";
          galleryFilters.appendChild(allButton);
          var buttons = [allButton];

          categories.forEach(function (cat) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "badge";
            btn.textContent = cat;
            btn.dataset.category = cat;
            galleryFilters.appendChild(btn);
            buttons.push(btn);
          });

          galleryFilters.addEventListener("click", function (event) {
            if (event.target.tagName !== "BUTTON") {
              return;
            }
            buttons.forEach(function (btn) {
              btn.classList.remove("is-active");
            });
            event.target.classList.add("is-active");
            var category = event.target.dataset.category;
            var filtered = category
              ? itemsWithImages.filter(function (item) {
                  return item.categoria === category;
                })
              : itemsWithImages;
            window.UI.renderGallery(galleryContainer, filtered);
            setupReveal();
          });
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
    setupGeneralWhatsApp();
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
