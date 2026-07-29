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
const showFavoritesButton = document.getElementById("showFavorites");

function hasValidPrice(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number(value) > 0
  );
}

function formatBRL(value) {
  if (!hasValidPrice(value)) {
    return "";
  }

  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function calculateDiscount(product) {
  if (
    !hasValidPrice(product.oldPrice) ||
    !hasValidPrice(product.price) ||
    Number(product.oldPrice) <= Number(product.price)
  ) {
    return 0;
  }

  return Math.round(
    (1 - Number(product.price) / Number(product.oldPrice)) * 100
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
  if (!categoryList || !Array.isArray(PRODUCTS)) {
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
  if (!Array.isArray(PRODUCTS)) {
    return [];
  }

  const items = PRODUCTS.filter(product => {
    const categoryMatches =
      state.category === "Todos" ||
      product.category === state.category;

    const favoriteMatches =
      !state.favoritesOnly ||
      state.favorites.includes(product.id);

    return categoryMatches && favoriteMatches;
  });

  if (state.sort === "lowest") {
    items.sort((a, b) => {
      const priceA = hasValidPrice(a.price)
        ? Number(a.price)
        : Number.MAX_SAFE_INTEGER;

      const priceB = hasValidPrice(b.price)
        ? Number(b.price)
        : Number.MAX_SAFE_INTEGER;

      return priceA - priceB;
    });
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

  const priceText = hasValidPrice(product.price)
    ? ` por ${formatBRL(product.price)}`
    : "";

  const message =
    `Olha este achadinho da BELLA: ` +
    `${product.name}${priceText}. ` +
    `${product.link}`;

  window.open(
    `https://wa.me/?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}

function getStoreButtonText(store) {
  if (store === "Shopee") {
    return "Ver na Shopee";
  }

  if (store === "Mercado Livre") {
    return "Ver no Mercado Livre";
  }

  return "Ver achadinhos";
}

function getStoreClass(store) {
  if (store === "Shopee") {
    return "buy-btn shopee-buy";
  }

  if (store === "Mercado Livre") {
    return "buy-btn mercado-livre-buy";
  }

  return "buy-btn";
}

function renderProducts() {
  if (!grid) {
    return;
  }

  const items = getFilteredProducts();

  if (productCount) {
    productCount.textContent = Array.isArray(PRODUCTS)
      ? PRODUCTS.length
      : 0;
  }

  if (favoriteCount) {
    favoriteCount.textContent = state.favorites.length;
  }

  if (listTitle) {
    if (state.favoritesOnly) {
      listTitle.textContent = "Meus favoritos";
    } else if (state.category !== "Todos") {
      listTitle.textContent = `Achadinhos de ${state.category}`;
    } else {
      listTitle.textContent = "Achadinhos em destaque";
    }
  }

  if (resultText) {
    resultText.textContent =
      `${items.length} opção(ões) encontrada(s)`;
  }

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="empty">
        Nenhum achadinho encontrado.
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
      class="product-image"
      loading="lazy"
      onerror="
        this.style.display='none';
        this.nextElementSibling.style.display='flex';
      "
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
      const pricesHtml = hasValidPrice(product.price)
        ? `
          <div class="prices">

            ${
              hasValidPrice(product.oldPrice)
                ? `
                  <span class="old-price">
                    ${formatBRL(product.oldPrice)}
                  </span>
                `
                : ""
            }

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
        `
        : `
          <div class="prices">
            <span class="current-price">
              Confira as ofertas
            </span>
          </div>
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
              ${product.description || ""}
            </p>

            ${pricesHtml}

            <div class="card-actions">

              <a
                class="${getStoreClass(product.store)}"
                href="${product.link}"
                target="_blank"
                rel="noopener noreferrer sponsored"
              >
                ${getStoreButtonText(product.store)}
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
          `Conheça a BELLA e encontre achadinhos ` +
          `da Shopee e do Mercado Livre: ${siteLink}`;

        window.open(
          `https://wa.me/?text=${encodeURIComponent(message)}`,
          "_blank"
        );
      }
    });
  });

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
