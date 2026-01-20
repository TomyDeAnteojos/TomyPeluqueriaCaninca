(function () {
  function buildWhatsAppLink(text) {
    var base = "https://wa.me/5491123822819?text=";
    return base + encodeURIComponent(text);
  }

  function createPlaceholder(name) {
    return "assets/img/og-cover.jpg";
  }

  function buildCard(item, type, layout) {
    var card = document.createElement("article");
    card.className = "card reveal";
    if (layout === "list") {
      card.classList.add("list");
    }

    var img = document.createElement("img");
    img.loading = "lazy";
    img.alt = item.nombre ? item.nombre : "Tomi Peluquería Canina";
    img.src = item.imagen ? item.imagen : createPlaceholder(item.nombre);
    card.appendChild(img);

    var title = document.createElement("h3");
    title.className = "card-title";
    title.textContent = item.nombre || "Servicio";
    card.appendChild(title);

    if (item.descripcion) {
      var desc = document.createElement("p");
      desc.textContent = item.descripcion;
      card.appendChild(desc);
    }

    if (item.precio) {
      var price = document.createElement("div");
      price.className = "card-price";
      price.textContent = item.precio;
      card.appendChild(price);
    }

    var tags = document.createElement("div");
    tags.className = "card-tags";
    if (item.categoria) {
      var cat = document.createElement("span");
      cat.textContent = item.categoria;
      tags.appendChild(cat);
    }
    if (item.duracion) {
      var dur = document.createElement("span");
      dur.textContent = item.duracion;
      tags.appendChild(dur);
    }
    if (tags.children.length) {
      card.appendChild(tags);
    }

    var message = "Hola! Quiero consultar por el " + (type === "producto" ? "producto" : "servicio") + ": " + (item.nombre || "");
    if (item.precio) {
      message += ". Precio: " + item.precio;
    }
    if (type === "servicio") {
      message += ". Mi mascota es {tama\u00f1o(opcional)}.";
    } else {
      message += ". \u00bfPrecio y disponibilidad?";
    }
    message += " " + window.location.href;

    var cta = document.createElement("a");
    cta.className = "btn btn-primary";
    cta.href = buildWhatsAppLink(message);
    cta.target = "_blank";
    cta.rel = "noopener";
    cta.textContent = "Consultar por WhatsApp";
    card.appendChild(cta);

    return card;
  }

  function renderCards(container, items, type) {
    container.innerHTML = "";
    if (!items.length) {
      var notice = document.createElement("div");
      notice.className = "notice";
      notice.textContent = "No hay items para mostrar por ahora.";
      container.appendChild(notice);
      return;
    }
    var layout = container.dataset.layout || "";
    items.forEach(function (item) {
      container.appendChild(buildCard(item, type, layout));
    });
  }

  function renderGallery(container, items) {
    container.innerHTML = "";
    var galleryItems = items.filter(function (item) {
      return item.imagen;
    });
    if (!galleryItems.length) {
      for (var i = 0; i < 6; i++) {
        var placeholder = document.createElement("div");
        placeholder.className = "gallery-item reveal";
        var img = document.createElement("img");
        img.loading = "lazy";
        img.alt = "Galería Tomi Peluquería Canina";
        img.src = "assets/img/og-cover.jpg";
        placeholder.appendChild(img);
        container.appendChild(placeholder);
      }
      return;
    }

    galleryItems.slice(0, 9).forEach(function (item) {
      var wrap = document.createElement("div");
      wrap.className = "gallery-item reveal";
      var img = document.createElement("img");
      img.loading = "lazy";
      img.alt = item.nombre || "Galería Tomi Peluquería Canina";
      img.src = item.imagen;
      wrap.appendChild(img);
      container.appendChild(wrap);
    });
  }

  window.UI = {
    buildWhatsAppLink: buildWhatsAppLink,
    renderCards: renderCards,
    renderGallery: renderGallery
  };
})();
