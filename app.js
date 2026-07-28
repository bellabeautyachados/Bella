const state = {
  category: "Todos",
  search: "",
  favoritesOnly: false,
  sort: "featured",
  favorites: JSON.parse(localStorage.getItem("achadinhos-favorites") || "[]")
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

const formatBRL = value => value.toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
const discount = p => Math.round((1 - p.price / p.oldPrice) * 100);

function saveFavorites(){
  localStorage.setItem("achadinhos-favorites", JSON.stringify(state.favorites));
  favoriteCount.textContent = state.favorites.length;
}

function showToast(message){
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

function renderCategories(){
  const categories = ["Todos", ...new Set(PRODUCTS.map(p => p.category))];
  categoryList.innerHTML = categories.map(cat =>
    `<button class="chip ${cat === state.category && !state.favoritesOnly ? "active" : ""}" data-category="${cat}">${cat}</button>`
  ).join("");
  categoryList.querySelectorAll(".chip").forEach(btn => {
    btn.addEventListener("click", () => {
      state.category = btn.dataset.category;
      state.favoritesOnly = false;
      document.querySelectorAll(".nav-item").forEach(x => x.classList.remove("active"));
      document.querySelector('[data-view="home"]').classList.add("active");
      render();
    });
  });
}

function filteredProducts(){
  let items = PRODUCTS.filter(p => {
    const categoryMatch = state.category === "Todos" || p.category === state.category;
    const text = `${p.name} ${p.category} ${p.store} ${p.description}`.toLowerCase();
    const searchMatch = text.includes(state.search.toLowerCase());
    const favoriteMatch = !state.favoritesOnly || state.favorites.includes(p.id);
    return categoryMatch && searchMatch && favoriteMatch;
  });

  if(state.sort === "lowest") items.sort((a,b) => a.price - b.price);
  if(state.sort === "discount") items.sort((a,b) => discount(b) - discount(a));
  if(state.sort === "featured") items.sort((a,b) => b.featured - a.featured);
  return items;
}

function toggleFavorite(id){
  if(state.favorites.includes(id)){
    state.favorites = state.favorites.filter(x => x !== id);
    showToast("Removido dos favoritos");
  } else {
    state.favorites.push(id);
    showToast("Adicionado aos favoritos");
  }
  saveFavorites();
  renderProducts();
}

function shareProduct(id){
  const p = PRODUCTS.find(x => x.id === id);
  const message = `Olha este achadinho da BELLA: ${p.name} por ${formatBRL(p.price)} - ${p.link}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
}

function renderProducts(){
  const items = filteredProducts();
  listTitle.textContent = state.favoritesOnly ? "Meus favoritos" : "Ofertas em destaque";
  resultText.textContent = `${items.length} produto(s) encontrado(s)`;
  productCount.textContent = PRODUCTS.length;

  if(!items.length){
    grid.innerHTML = `<div class="empty">Nenhum produto encontrado. Tente outra busca ou categoria.</div>`;
    return;
  }

  grid.innerHTML = items.map(p => `
    <article class="card">
      <div class="card-media">
  ${
    p.image
      ? `<img src="${p.image}" alt="${p.name}" loading="lazy">`
      : `<span class="product-emoji">${p.emoji || "🛍️"}</span>`
  }
</div>
      <div class="card-body">
        <div class="card-top">
          <span class="store">${p.store} • ${p.category}</span>
          <button class="favorite" aria-label="Favoritar produto" onclick="toggleFavorite(${p.id})">${state.favorites.includes(p.id) ? "♥" : "♡"}</button>
        </div>
        <h3>${p.name}</h3>
        <p class="card-desc">${p.description}</p>
        <div class="prices">
          <span class="old-price">${formatBRL(p.oldPrice)}</span>
          <span class="current-price">${formatBRL(p.price)}</span>
          <span class="discount">${discount(p)}% de desconto</span>
        </div>
        <div class="card-actions">
          <a class="buy-btn" href="${p.link}" target="_blank" rel="noopener noreferrer sponsored">Ver oferta</a>
          <button class="share-btn" onclick="shareProduct(${p.id})">↗</button>
        </div>
      </div>
    </article>
  `).join("");
}

function render(){
  renderCategories();
  renderProducts();
  saveFavorites();
}

searchInput.addEventListener("input", e => {
  state.search = e.target.value;
  renderProducts();
});

sortSelect.addEventListener("change", e => {
  state.sort = e.target.value;
  renderProducts();
});

document.getElementById("showFavorites").addEventListener("click", () => {
  state.favoritesOnly = true;
  render();
});

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    const view = btn.dataset.view;
    if(view === "favorites"){
      state.favoritesOnly = true;
      render();
      window.scrollTo({top: 300, behavior: "smooth"});
    }
    if(view === "home"){
      state.favoritesOnly = false;
      state.category = "Todos";
      render();
      window.scrollTo({top: 0, behavior: "smooth"});
    }
    if(view === "share"){
      const message = "Conheça a BELLA e descubra ofertas e achadinhos selecionados para você!";
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    }
  });
});

const whatsappNumber = "5511999999999";
document.getElementById("whatsappButton").href =
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Olá! Quero receber as ofertas e novidades da BELLA.")}`;

window.toggleFavorite = toggleFavorite;
window.shareProduct = shareProduct;

let deferredPrompt;
const installBtn = document.getElementById("installBtn");
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.classList.remove("hidden");
});
installBtn.addEventListener("click", async () => {
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.classList.add("hidden");
});

if("serviceWorker" in navigator){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}

render();
