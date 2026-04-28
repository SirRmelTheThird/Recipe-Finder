const LETTERS = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','r','s','t','v','w'];
let allMeals = [];
let filteredMeals = [];

const grid       = document.getElementById('browse-grid');
const loading    = document.getElementById('browse-loading');
const noResults  = document.getElementById('browse-no-results');
const countEl    = document.getElementById('browse-count');
const pillsWrap  = document.getElementById('browse-pills');
const catSelect  = document.getElementById('filter-category');
const areaSelect = document.getElementById('filter-area');
const sortSelect = document.getElementById('filter-sort');
const searchEl   = document.getElementById('browse-search');

// Fetch all meals across multiple letters
async function fetchAll() {
  loading.style.display = 'flex';
  grid.style.display = 'none';

  const promises = LETTERS.map(l =>
    fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${l}`)
      .then(r => r.json())
      .then(d => d.meals || [])
      .catch(() => [])
  );

  const results = await Promise.all(promises);
  allMeals = results.flat();

  // Remove duplicates
  const seen = new Set();
  allMeals = allMeals.filter(m => {
    if (seen.has(m.idMeal)) return false;
    seen.add(m.idMeal);
    return true;
  });

  buildFilters();
  buildPills();
  applyFilters();

  loading.style.display = 'none';
  grid.style.display = 'grid';
}

function buildFilters() {
  const cats  = [...new Set(allMeals.map(m => m.strCategory).filter(Boolean))].sort();
  const areas = [...new Set(allMeals.map(m => m.strArea).filter(Boolean))].sort();

  cats.forEach(c => {
    const o = document.createElement('option');
    o.value = c; o.textContent = c;
    catSelect.appendChild(o);
  });
  areas.forEach(a => {
    const o = document.createElement('option');
    o.value = a; o.textContent = a;
    areaSelect.appendChild(o);
  });
}

function buildPills() {
  const cats = [...new Set(allMeals.map(m => m.strCategory).filter(Boolean))].sort();
  cats.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'browse-pill';
    btn.dataset.cat = c;
    btn.textContent = c;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.browse-pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      catSelect.value = c;
      applyFilters();
    });
    pillsWrap.appendChild(btn);
  });
}

function applyFilters() {
  const query    = searchEl.value.toLowerCase().trim();
  const cat      = catSelect.value;
  const area     = areaSelect.value;
  const sort     = sortSelect.value;

  filteredMeals = allMeals.filter(m => {
    const matchSearch = !query ||
      m.strMeal.toLowerCase().includes(query) ||
      (m.strCategory || '').toLowerCase().includes(query) ||
      (m.strArea || '').toLowerCase().includes(query);
    const matchCat  = cat  === 'all' || m.strCategory === cat;
    const matchArea = area === 'all' || m.strArea === area;
    return matchSearch && matchCat && matchArea;
  });

  // Sort
  filteredMeals.sort((a, b) => {
    if (sort === 'az')       return a.strMeal.localeCompare(b.strMeal);
    if (sort === 'za')       return b.strMeal.localeCompare(a.strMeal);
    if (sort === 'area')     return (a.strArea || '').localeCompare(b.strArea || '');
    if (sort === 'category') return (a.strCategory || '').localeCompare(b.strCategory || '');
    return 0;
  });

  renderCards();
}

function renderCards() {
  grid.innerHTML = '';
  countEl.textContent = filteredMeals.length;

  if (filteredMeals.length === 0) {
    noResults.style.display = 'block';
    return;
  }
  noResults.style.display = 'none';

  filteredMeals.forEach((meal, i) => {
    const card = document.createElement('div');
    card.className = 'browse-card';
    card.style.animationDelay = `${(i % 20) * 30}ms`;
    card.innerHTML = `
      <div class="browse-card-img">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy">
        <span class="browse-card-cat">${meal.strCategory || ''}</span>
        <span class="browse-card-area">${meal.strArea || ''}</span>
      </div>
      <div class="browse-card-body">
        <h3 class="browse-card-title">${meal.strMeal}</h3>
        <ul class="browse-card-meta">
          <li><span class="browse-meta-icon">🍴</span> ${meal.strCategory || 'Various'}</li>
          <li><span class="browse-meta-icon">🌍</span> ${meal.strArea || 'International'}</li>
        </ul>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Sync pill with category select
catSelect.addEventListener('change', () => {
  document.querySelectorAll('.browse-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.cat === catSelect.value || (catSelect.value === 'all' && p.dataset.cat === 'all'));
  });
  applyFilters();
});

areaSelect.addEventListener('change', applyFilters);
sortSelect.addEventListener('change', applyFilters);
searchEl.addEventListener('input', applyFilters);

// All pill
document.querySelector('.browse-pill[data-cat="all"]').addEventListener('click', () => {
  document.querySelectorAll('.browse-pill').forEach(p => p.classList.remove('active'));
  document.querySelector('.browse-pill[data-cat="all"]').classList.add('active');
  catSelect.value = 'all';
  applyFilters();
});

// Back to top
const backTop = document.getElementById('browse-back-top');
window.addEventListener('scroll', () => {
  backTop.classList.toggle('visible', window.scrollY > 400);
});
backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// Init
fetchAll();