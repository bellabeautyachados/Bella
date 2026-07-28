    const state = {
  category: "Todos",
  favoritesOnly: false,
  sort: "featured",
  favorites: JSON.parse(
    localStorage.getItem("bella-favorites") || "[]"
  )
};

const grid = document.getElementById("productGrid");
const categoryList = document.getElementById("categoryList");
const sortSelect = document.getElementById("sortSelect");
const listTitle = document.getElementById("listTitle");
const resultText = document.getElementById("resultText");
const favoriteCount = document.getElementById("favoriteCount");
const productCount = document.getElementById("productCount");
const toast = document.getElementById("toast");
const installBtn = document.getElementById("installBtn");
const whatsappButton = document.getElementById("whatsappButton");
const showFavoritesButton = document.getElementById("showFavorites");

function formatBRL(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function calculateDiscount(product) {
  if (
    !product.oldPrice ||
    product.oldPrice <= product.price
  ) {
    return 0;
  }

  return Math.round(
    (1 - product.price / product.oldPrice) * 100
  );
}

function saveFavorites() {
  localStorage.setItem(
    "bella-favorites",
    JSON.stringify(state.favorites)
  );

  if (favoriteCount) {
    favoriteCount.textContent = state.favorites.length;
  }
}

function showToast(message) {
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

function setActiveNavigation(view) {
  document
    .querySelectorAll(".nav-item")
    .forEach(button => {
      button.classList.remove("active");
    });

  const activeButton = document.querySelector(
    `[data-view="${view}"]`
  );

  if (activeButton) {
    activeButton.classList.add("active");
  }
}

function renderCategories() {
  if (!categoryList) {
    return;
  }

  const categories = [
    "Todos",
    ...new Set(
      PRODUCTS.map(product => product.category)
    )
  ];

  categoryList.innerHTML = categories
    .map(category => {
      const active =
        category === state.category &&
        !state.favoritesOnly;

      return `
        <button
          class="chip ${active ? "active" : ""}"
          data-category="${category}"
          type="button"
        >
          ${category}
        </button>
      `;
    })
    .join("");

  categoryList
    .querySelectorAll(".chip")
    .forEach(button => {
      button.addEventListener("click", () => {
        state.category = button.dataset.category;
        state.favoritesOnly = false;

        setActiveNavigation("home");
        render();
      });
    });
}

function getFilteredProducts() {
  let items = PRODUCTS.filter(product => {
    const categoryMatches =
      state.category === "Todos" ||
      product.category === state.category;

    const favoriteMatches =
      !state.favoritesOnly ||
      state.favorites.includes(product.id);

    return categoryMatches && favoriteMatches;
  });

  if (state.sort === "lowest") {
    items.sort((a, b) => a.price - b.price);
  }

  if (state.sort === "discount") {
    items.sort(
      (a, b) =>
        calculateDiscount(b) -
        calculateDiscount(a)
    );
  }

  if (state.sort === "featured") {
    items.sort(
      (a, b) =>
        (b.featured || 0) -
        (a.featured || 0)
    );
  }

  return items;
}

function toggleFavorite(id) {
  if (state.favorites.includes(id)) {
    state.favorites = state.favorites.filter(
      favoriteId => favoriteId !== id
    );

    showToast("Removido dos favoritos");
  } else {
    state.favorites.push(id);
    showToast("Adicionado aos favoritos");
  }

  saveFavorites();
  renderProducts();
}

function shareProduct(id) {
  const product = PRODUCTS.find(
    item => item.id === id
  );

  if (!product) {
    return;
  }

  const message =
    `Olha este achadinho da BELLA: ` +
    `${product.name} por ${formatBRL(product.price)}. ` +
    `${product.link}`;

  window.open(
    `https://wa.me/?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}

function renderProducts() {
  if (!grid) {
    return;
  }

  const items = getFilteredProducts();

  if (productCount) {
    productCount.textContent = PRODUCTS.length;
  }

  if (favoriteCount) {
    favoriteCount.textContent = state.favorites.length;
  }

  if (listTitle) {
    listTitle.textContent = state.favoritesOnly
      ? "Meus favoritos"
      : "Ofertas em destaque";
  }

  if (resultText) {
    resultText.textContent =
      `${items.length} produto(s) encontrado(s)`;
  }

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="empty">
        Nenhum produto encontrado.
      </div>
    `;

    return;
  }

  grid.innerHTML = items
    .map(product => {
      const discount = calculateDiscount(product);
      const isFavorite =
        state.favorites.includes(product.id);

      const media = product.image
        ? `
          <img
            src="${product.image}"
            alt="${product.name}"
            loading="lazy"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          >

          <span
            class="product-emoji"
            style="display:none"
          >
            ${product.emoji || "🛍️"}
          </span>
        `
        : `
          <span class="product-emoji">
            ${product.emoji || "🛍️"}
          </span>
        `;

      return `
        <article class="card">

          <div class="card-media">
            ${media}
          </div>

          <div class="card-body">

            <div class="card-top">

              <span class="store">
                ${product.store} • ${product.category}
              </span>

              <button
                class="favorite"
                type="button"
                aria-label="Favoritar ${product.name}"
                onclick="toggleFavorite(${product.id})"
              >
                ${isFavorite ? "♥" : "♡"}
              </button>

            </div>

            <h3>${product.name}</h3>

            <p class="card-desc">
              ${product.description}
            </p>

            <div class="prices">

              <span class="old-price">
                ${formatBRL(product.oldPrice)}
              </span>

              <span class="current-price">
                ${formatBRL(product.price)}
              </span>

              ${
                discount > 0
                  ? `
                    <span class="discount">
                      ${discount}% de desconto
                    </span>
                  `
                  : ""
              }

            </div>

            <div class="card-actions">

              <a
                class="buy-btn"
                href="${product.link}"
                target="_blank"
                rel="noopener noreferrer sponsored"
              >
                Ver oferta
              </a>

              <button
                class="share-btn"
                type="button"
                aria-label="Compartilhar ${product.name}"
                onclick="shareProduct(${product.id})"
              >
                ↗
              </button>

            </div>

          </div>

        </article>
      `;
    })
    .join("");
}

function render() {
  renderCategories();
  renderProducts();
  saveFavorites();
}

if (sortSelect) {
  sortSelect.addEventListener("change", event => {
    state.sort = event.target.value;
    renderProducts();
  });
}

if (showFavoritesButton) {
  showFavoritesButton.addEventListener("click", () => {
    state.favoritesOnly = true;
    setActiveNavigation("favorites");
    render();
  });
}

document
  .querySelectorAll(".nav-item")
  .forEach(button => {
    button.addEventListener("click", () => {
      const view = button.dataset.view;

      if (view === "home") {
        state.category = "Todos";
        state.favoritesOnly = false;

        setActiveNavigation("home");
        render();

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }

      if (view === "favorites") {
        state.favoritesOnly = true;

        setActiveNavigation("favorites");
        render();

        window.scrollTo({
          top: 300,
          behavior: "smooth"
        });
      }

      if (view === "share") {
        const siteLink =
          "https://bellabeautyachados.github.io/Bella/";

        const message =
          `Conheça a BELLA e descubra ofertas e ` +
          `achadinhos selecionados para você! ${siteLink}`;

        window.open(
          `https://wa.me/?text=${encodeURIComponent(message)}`,
          "_blank"
        );
      }
    });
  });

const whatsappNumber = "5511999999999";

if (whatsappButton) {
  const message =
    "Olá! Quero receber as ofertas e novidades da BELLA.";

  whatsappButton.href =
    `https://wa.me/${whatsappNumber}` +
    `?text=${encodeURIComponent(message)}`;
}

window.toggleFavorite = toggleFavorite;
window.shareProduct = shareProduct;

let deferredPrompt = null;

window.addEventListener(
  "beforeinstallprompt",
  event => {
    event.preventDefault();
    deferredPrompt = event;

    if (installBtn) {
      installBtn.classList.remove("hidden");
    }
  }
);

if (installBtn) {
  installBtn.addEventListener(
    "click",
    async () => {
      if (!deferredPrompt) {
        return;
      }

      deferredPrompt.prompt();
      await deferredPrompt.userChoice;

      deferredPrompt = null;
      installBtn.classList.add("hidden");
    }
  );
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .catch(error => {
        console.error(
          "Erro ao registrar o service worker:",
          error
        );
      });
  });
}

render();         
