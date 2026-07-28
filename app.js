const state = {
  category: "Todos",
  search: "",
  favoritesOnly: false,
  sort: "featured",
  favorites: JSON.parse(
    localStorage.getItem("achadinhos-favorites") || "[]"
  )
};

const grid = document.getElementById("productGrid");
const categoryList = document.getElementById("categoryList");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const listTitle = document.getElementById("listTitle");
const resultText = document.getElementById("resultText");
const favoriteCount = document.getElementById("favoriteCount");
const productCount = document.getElementById("productCount");
const toast = document.getElementById("toast");
const installBtn = document.getElementById("installBtn");
const whatsappButton = document.getElementById("whatsappButton");

const formatBRL = value =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

const discount = product => {
  if (!product.oldPrice || product.oldPrice <= product.price) {
    return 0;
  }

  return Math.round(
    (1 - product.price / product.oldPrice) * 100
  );
};

function saveFavorites() {
  localStorage.setItem(
    "achadinhos-favorites",
    JSON.stringify(state.favorites)
  );

  if (favoriteCount) {
    favoriteCount.textContent = state.favorites.length;
  }
}

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

function renderCategories() {
  if (!categoryList) return;

  const categories = [
    "Todos",
    ...new Set(PRODUCTS.map(product => product.category))
  ];

  categoryList.innerHTML = categories
    .map(category => `
      <button
        class="chip ${
          category === state.category &&
          !state.favoritesOnly
            ? "active"
            : ""
        }"
        data-category="${category}"
      >
        ${category}
      </button>
    `)
    .join("");

  categoryList
    .querySelectorAll(".chip")
    .forEach(button => {
      button.addEventListener("click", () => {
        state.category = button.dataset.category;
        state.favoritesOnly = false;

        document
          .querySelectorAll(".nav-item")
          .forEach(item => item.classList.remove("active"));

        const homeButton =
          document.querySelector('[data-view="home"]');

        if (homeButton) {
          homeButton.classList.add("active");
        }

        render();
      });
    });
}

function filteredProducts() {
  let items = PRODUCTS.filter(product => {
    const categoryMatch =
      state.category === "Todos" ||
      product.category === state.category;

    const text = `
      ${product.name}
      ${product.category}
      ${product.store}
      ${product.description}
    `.toLowerCase();

    const searchMatch = text.includes(
      state.search.toLowerCase()
    );

    const favoriteMatch =
      !state.favoritesOnly ||
      state.favorites.includes(product.id);

    return (
      categoryMatch &&
      searchMatch &&
      favoriteMatch
    );
  });

  if (state.sort === "lowest") {
    items.sort((a, b) => a.price - b.price);
  }

  if (state.sort === "discount") {
    items.sort(
      (a, b) => discount(b) - discount(a)
    );
  }

  if (state.sort === "featured") {
    items.sort(
      (a, b) => b.featured - a.featured
    );
  }

  return items;
}

function toggleFavorite(id) {
  if (state.favorites.includes(id)) {
    state.favorites =
      state.favorites.filter(item => item !== id);

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

  if (!product) return;

  const message =
    `Olha este achadinho da BELLA: ` +
    `${product.name} por ` +
    `${formatBRL(product.price)} - ` +
    `${product.link}`;

  window.open(
    `https://wa.me/?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}

function renderProducts() {
  if (!grid) return;

  const items = filteredProducts();

  if (listTitle) {
    listTitle.textContent =
      state.favoritesOnly
        ? "Meus favoritos"
        : "Ofertas em destaque";
  }

  if (resultText) {
    resultText.textContent =
      `${items.length} produto(s) encontrado(s)`;
  }

  if (productCount) {
    productCount.textContent = PRODUCTS.length;
  }

  if (!items.length) {
    grid.innerHTML = `
      <div class="empty">
        Nenhum produto encontrado.
        Tente outra busca ou categoria.
      </div>
    `;

    return;
  }

  grid.innerHTML = items
    .map(product => `
      <article class="card">

        <div class="card-media">
          ${
            product.image
              ? `
                <img
                  src="${product.image}"
                  alt="${product.name}"
                  loading="lazy"
                >
              `
              : `
                <span class="product-emoji">
                  ${product.emoji || "🛍️"}
                </span>
              `
          }
        </div>

        <div class="card-body">

          <div class="card-top">
            <span class="store">
              ${product.store} • ${product.category}
            </span>

            <button
              class="favorite"
              aria-label="Favoritar produto"
              onclick="toggleFavorite(${product.id})"
            >
              ${
                state.favorites.includes(product.id)
                  ? "♥"
                  : "♡"
              }
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

            <span class="discount">
              ${discount(product)}% de desconto
            </span>
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
              aria-label="Compartilhar produto"
              onclick="shareProduct(${product.id})"
            >
              ↗
            </button>
          </div>

        </div>
      </article>
    `)
    .join("");
}

function render() {
  renderCategories();
  renderProducts();
  saveFavorites();
}

if (searchInput) {
  searchInput.addEventListener("input", event => {
    state.search = event.target.value;
    renderProducts();
  });
}

if (sortSelect) {
  sortSelect.addEventListener("change", event => {
    state.sort = event.target.value;
    renderProducts();
  });
}

const showFavoritesButton =
  document.getElementById("showFavorites");

if (showFavoritesButton) {
  showFavoritesButton.addEventListener("click", () => {
    state.favoritesOnly = true;
    render();
  });
}

document
  .querySelectorAll(".nav-item")
  .forEach(button => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll(".nav-item")
        .forEach(item =>
          item.classList.remove("active")
        );

      button.classList.add("active");

      const view = button.dataset.view;

      if (view === "favorites") {
        state.favoritesOnly = true;
        render();

        window.scrollTo({
          top: 300,
          behavior: "smooth"
        });
      }

      if (view === "home") {
        state.favoritesOnly = false;
        state.category = "Todos";
        render();

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }

      if (view === "share") {
        const message =
          "Conheça a BELLA e descubra ofertas e " +
          "achadinhos selecionados para você! " +
          "https://bellabeautyachados.github.io/Bella/";

        window.open(
          `https://wa.me/?text=${encodeURIComponent(message)}`,
          "_blank"
        );
      }
    });
  });

const whatsappNumber = "5511999999999";

if (whatsappButton) {
  whatsappButton.href =
    `https://wa.me/${whatsappNumber}` +
    `?text=${encodeURIComponent(
      "Olá! Quero receber as ofertas e novidades da BELLA."
    )}`;
}

window.toggleFavorite = toggleFavorite;
window.shareProduct = shareProduct;

let deferredPrompt;

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
      if (!deferredPrompt) return;

      deferredPrompt.prompt();
      await deferredPrompt.userChoice;

      deferredPrompt = null;
      installBtn.classList.add("hidden");
    }
  );
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js");
  });
}

render();
