const searchInput = document.querySelector('.search-input');
const viewMoreBtn = document.querySelector('.view-more-btn');
const moreFilters = document.querySelector('.more-filters');

viewMoreBtn.addEventListener('click', () => {
  const query = searchInput.value.trim();
  if (query) {
    console.log('Searching for:', query);
    // hook up your search logic here
  }
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    viewMoreBtn.click();
  }
});

moreFilters.addEventListener('click', () => {
  // expand filters panel here later
  console.log('More filters clicked');
});