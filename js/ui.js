(function () {
  function buildWhatsAppLink(text) {
    var base = "https://wa.me/5491123822819?text=";
    return base + encodeURIComponent(text);
  }

  function createPlaceholder() {
    return "assets/img/og-cover.jpg";
  }

  function buildTag(label, icon) {
    var tag = document.createElement("span");
    tag.className = "tag";
    if (icon) {
      var img = document.createElement("img");
      img.className = "tag-icon";
      img.src = icon;
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      tag.appendChild(img);
    }
    var text = document.createElement("span");
    text.textContent = label;
    tag.appendChild(text);
    return tag;
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
    img.src = item.imagen ? item.imagen : createPlaceholder();
    card.appendChild(img);

    var body = document.createElement("div");

    var header = document.createElement("div");
    header.className = "card-header";

    var title = document.createElement("h3");
    title.className = "card-title";
    title.textContent = item.nombre || (type === "producto" ? "Producto" : "Servicio");
    header.appendChild(title);

    if (item.precio) {
      var price = document.createElement("div");
      price.className = "card-price";
      price.textContent = item.precio;
      header.appendChild(price);
    }

    body.appendChild(header);

    if (item.descripcion && type !== "servicio") {
      var desc = document.createElement("p");
      desc.className = "card-desc";
      desc.textContent = item.descripcion;
      body.appendChild(desc);
    }

    var tags = document.createElement("div");
    tags.className = "card-tags";
    if (item.duracion) {
      tags.appendChild(buildTag(item.duracion, "assets/img/icons/clock.svg"));
    }
    if (tags.children.length) {
      body.appendChild(tags);
    }

    card.appendChild(body);

    var message = "Hola! Quiero consultar por el " + (type === "producto" ? "producto" : "servicio") + ": " + (item.nombre || "");
    if (item.precio) {
      message += ". Precio: " + item.precio;
    }
    if (type === "servicio") {
      message += ". Mi mascota es {tamaño(opcional)}.";
    } else {
      message += ". ¿Precio y disponibilidad?";
    }
    message += " " + window.location.href;

    var cta = document.createElement("a");
    cta.className = "btn btn-primary";
    cta.href = buildWhatsAppLink(message);
    cta.target = "_blank";
    cta.rel = "noopener";
    cta.textContent = "WhatsApp";
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

  function extractYouTubeId(url) {
    try {
      var parsed = new URL(url);
      if (parsed.hostname.indexOf("youtu.be") !== -1) {
        return parsed.pathname.replace("/", "").split("?")[0];
      }
      var id = parsed.searchParams.get("v");
      if (id) {
        return id;
      }
      if (parsed.pathname.indexOf("/embed/") !== -1) {
        return parsed.pathname.split("/embed/")[1].split("/")[0];
      }
      return "";
    } catch (err) {
      var match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]+)/i);
      return match && match[1] ? match[1] : "";
    }
  }

  function renderGallery(container, items) {
    container.innerHTML = "";
    var galleryItems = items.filter(function (item) {
      return item.archivo;
    });
    if (!galleryItems.length) {
      for (var i = 0; i < 6; i++) {
        var placeholder = document.createElement("div");
        placeholder.className = "gallery-item reveal";
        var placeholderImg = document.createElement("img");
        placeholderImg.loading = "lazy";
        placeholderImg.alt = "Galería Tomi Peluquería Canina";
        placeholderImg.src = "assets/img/og-cover.jpg";
        placeholder.appendChild(placeholderImg);
        container.appendChild(placeholder);
      }
      return;
    }

    galleryItems.slice(0, 9).forEach(function (item) {
      var wrap = document.createElement("div");
      wrap.className = "gallery-item reveal";
      var source = item.archivo;
      var title = item.titulo || "Galería Tomi Peluquería Canina";
      var isVideo = /\.(mp4|webm|ogg)$/i.test(source);
      var isYouTube = /(?:youtube\.com|youtu\.be)/i.test(source);
      var isInstagram = /instagram\.com/i.test(source);

      if (isYouTube) {
        var videoId = extractYouTubeId(source);
        if (videoId) {
          var iframe = document.createElement("iframe");
          iframe.src = "https://www.youtube.com/embed/" + videoId;
          iframe.title = title;
          iframe.loading = "lazy";
          iframe.allow =
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
          iframe.allowFullscreen = true;
          wrap.appendChild(iframe);
        }
      } else if (isInstagram) {
        var block = document.createElement("blockquote");
        block.className = "instagram-media";
        block.setAttribute("data-instgrm-permalink", source);
        block.setAttribute("data-instgrm-captioned", "");
        var link = document.createElement("a");
        link.href = source;
        link.textContent = title;
        block.appendChild(link);
        wrap.appendChild(block);
        if (!document.querySelector("script[src*='instagram.com/embed.js']")) {
          var script = document.createElement("script");
          script.async = true;
          script.src = "https://www.instagram.com/embed.js";
          document.body.appendChild(script);
        } else if (window.instgrm && window.instgrm.Embeds) {
          window.instgrm.Embeds.process();
        }
      } else if (isVideo) {
        var video = document.createElement("video");
        video.src = source;
        video.controls = true;
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.setAttribute("title", title);
        wrap.appendChild(video);
      } else {
        var img = document.createElement("img");
        img.loading = "lazy";
        img.alt = title;
        img.src = source;
        wrap.appendChild(img);
      }
      container.appendChild(wrap);
    });
  }

  window.UI = {
    buildWhatsAppLink: buildWhatsAppLink,
    renderCards: renderCards,
    renderGallery: renderGallery
  };
})();
