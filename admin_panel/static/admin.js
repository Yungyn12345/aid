const searchInput = document.querySelector("[data-lead-search]");
const statusFilter = document.querySelector("[data-status-filter]");
const rows = Array.from(document.querySelectorAll("[data-lead-row]"));
const visibleCounter = document.querySelector("[data-visible-count]");
const noResults = document.querySelector("[data-no-results]");

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function applyFilters() {
  const searchValue = normalize(searchInput?.value);
  const statusValue = normalize(statusFilter?.value);
  let visibleCount = 0;

  rows.forEach((row) => {
    const matchesSearch = !searchValue || row.dataset.search.includes(searchValue);
    const matchesStatus = !statusValue || row.dataset.status === statusValue;
    const isVisible = matchesSearch && matchesStatus;

    row.hidden = !isVisible;
    if (isVisible) {
      visibleCount += 1;
    }
  });

  if (visibleCounter) {
    visibleCounter.textContent = String(visibleCount);
  }

  if (noResults) {
    noResults.classList.toggle("is-hidden", visibleCount !== 0);
  }
}

searchInput?.addEventListener("input", applyFilters);
statusFilter?.addEventListener("change", applyFilters);
