const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const LETTERS = ['a','b','c','d','e','f','g','h','i','j','k','l','m'];

let recipes = [];
let plan = JSON.parse(localStorage.getItem('mealPlan') || '{}');
let activeSlot = null;

// Fetch recipes from API
async function loadRecipes() {
  const all = await Promise.all(
    LETTERS.map(l =>
      fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${l}`)
        .then(r => r.json()).then(d => d.meals || []).catch(() => [])
    )
  );
  const seen = new Set();
  recipes = all.flat().filter(m => {
    if (seen.has(m.idMeal)) return false;
    seen.add(m.idMeal); return true;
  });
  renderModal('');
}

// Build the grid
function buildGrid() {
  const grid = document.getElementById('week-grid');
  grid.innerHTML = '';
  DAYS.forEach(day => {
    const col = document.createElement('div');
    col.className = 'day-card';
    col.innerHTML = `<div class="day-name">${day}</div>`;
    TYPES.forEach(type => {
      const key = `${day}-${type}`;
      const meal = plan[key];
      const slot = document.createElement('div');
      slot.className = 'meal-slot';
      slot.innerHTML = `<div class="slot-type">${type}</div>`;
      if (meal) {
        slot.innerHTML += `
          <div class="slot-filled">
            <img src="${meal.img}/preview" alt="${meal.name}">
            <span class="slot-meal-name">${meal.name}</span>
            <button class="slot-remove" onclick="remove('${key}')">✕</button>
          </div>`;
      } else {
        slot.innerHTML += `<button class="slot-add" onclick="openModal('${day}','${type}')">+</button>`;
      }
      col.appendChild(slot);
    });
    grid.appendChild(col);
  });
}

// Open modal
function openModal(day, type) {
  activeSlot = `${day}-${type}`;
  document.getElementById('modal-label').textContent = `${day} – ${type}`;
  document.getElementById('modal-search').value = '';
  renderModal('');
  document.getElementById('modal-bg').classList.add('open');
}

// Render modal results
function renderModal(query) {
  const filtered = recipes.filter(m =>
    m.strMeal.toLowerCase().includes(query.toLowerCase()) ||
    (m.strCategory || '').toLowerCase().includes(query.toLowerCase())
  ).slice(0, 40);

  document.getElementById('modal-results').innerHTML = filtered.map(m => `
    <div class="modal-item" onclick="pick('${m.idMeal}')">
      <img src="${m.strMealThumb}/preview" alt="${m.strMeal}">
      <div>
        <p class="modal-item-name">${m.strMeal}</p>
        <p class="modal-item-cat">${m.strCategory || ''} · ${m.strArea || ''}</p>
      </div>
    </div>
  `).join('');
}

// Pick a meal
function pick(id) {
  const meal = recipes.find(m => m.idMeal === id);
  if (!meal || !activeSlot) return;
  plan[activeSlot] = {
    name: meal.strMeal,
    img: meal.strMealThumb,
    ingredients: getIngredients(meal)
  };
  localStorage.setItem('mealPlan', JSON.stringify(plan));
  buildGrid();
  document.getElementById('modal-bg').classList.remove('open');
}

// Remove meal
function remove(key) {
  delete plan[key];
  localStorage.setItem('mealPlan', JSON.stringify(plan));
  buildGrid();
}

// Get ingredients
function getIngredients(meal) {
  const list = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && ing.trim()) list.push(`${(measure || '').trim()} ${ing.trim()}`.trim());
  }
  return list;
}

// Generate shopping list
document.getElementById('gen-btn').addEventListener('click', () => {
  const all = Object.values(plan).flatMap(m => m.ingredients || []);
  const unique = [...new Set(all)].sort();
  const box = document.getElementById('shopping-list');
  if (unique.length === 0) {
    box.innerHTML = '<p class="empty-msg">Add some meals first, then generate your list.</p>';
    return;
  }
  box.innerHTML = `<div class="shopping-items">${
    unique.map(ing => `
      <label class="shopping-item">
        <input type="checkbox" onchange="this.closest('.shopping-item').classList.toggle('done', this.checked)">
        <span>${ing}</span>
      </label>
    `).join('')
  }</div>`;
});

// Clear all
document.getElementById('clear-btn').addEventListener('click', () => {
  if (!confirm('Clear the whole week?')) return;
  plan = {};
  localStorage.setItem('mealPlan', JSON.stringify(plan));
  buildGrid();
  document.getElementById('shopping-list').innerHTML =
    '<p class="empty-msg">Add some meals first, then generate your list.</p>';
});

// Modal close
document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('modal-bg').classList.remove('open');
});
document.getElementById('modal-bg').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-bg'))
    document.getElementById('modal-bg').classList.remove('open');
});
document.getElementById('modal-search').addEventListener('input', e => {
  renderModal(e.target.value);
});

// Init
buildGrid();
loadRecipes();