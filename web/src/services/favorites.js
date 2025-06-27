// Serviço utilitário para gerir vendedores favoritos no localStorage
const KEY = 'favorites';

export function getFavorites() {
  const data = localStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

export function addFavorite(id) {
  const favs = getFavorites();
  if (!favs.includes(id)) {
    favs.push(id);
    localStorage.setItem(KEY, JSON.stringify(favs));
  }
}

export function removeFavorite(id) {
  let favs = getFavorites();
  favs = favs.filter((v) => v !== id);
  localStorage.setItem(KEY, JSON.stringify(favs));
}

export function clearFavorites() {
  localStorage.removeItem(KEY);
}
