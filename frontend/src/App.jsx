import { useState, useEffect, useMemo } from "react";

const API_URL = "/api/products";
const SORT_LABELS = {
  createdAt: "Date",
  price: "Prix",
  name: "Nom",
  stock: "Stock",
};

function getPageTokens(page, total) {
  if (total <= 1) return [1];
  
  const start = Math.max(1, page - 2);
  const end = Math.min(total, page + 2);
  const tokens = [];
  
  if (start > 1) {
    tokens.push(1);
    if (start > 2) tokens.push("...");
  }
  
  for (let i = start; i <= end; i++) tokens.push(i);
  
  if (end < total) {
    if (end < total - 1) tokens.push("...");
    tokens.push(total);
  }
  
  return tokens;
}

function PaginationButton({ onClick, disabled, ariaLabel, className, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </button>
  );
}

export default function App() {
  const limit = 12;
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    page: 1,
    category: "",
    sort: "price",
    order: "desc",
  });

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(filters.page),
          limit: String(limit),
          sort: filters.sort,
          order: filters.order,
        });

        if (filters.category) {
          params.set("category", filters.category);
        }

        const response = await fetch(`${API_URL}?${params.toString()}`);

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Impossible de charger le catalogue.");
        }

        const payload = await response.json();
        setProducts(payload.items || []);
        setPagination(payload.pagination || null);
      } catch (err) {
        setError(err.message || "Une erreur est survenue.");
        setProducts([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [filters]);

  function handleCategoryChange(event) {
    setFilters((prev) => ({ ...prev, category: event.target.value, page: 1 }));
  }

  function handleSortFieldClick(nextSort) {
    if (nextSort === filters.sort) {
      setFilters((prev) => ({
        ...prev,
        order: prev.order === "asc" ? "desc" : "asc",
        page: 1,
      }));
      return;
    }

    setFilters((prev) => ({ ...prev, sort: nextSort, page: 1 }));
  }

  const pageTokens = useMemo(
    () => getPageTokens(pagination?.page || 1, pagination?.totalPages || 1),
    [pagination?.page, pagination?.totalPages]
  );

  return (
    <div className="app">
      <div className="header">
        <h1>Catalogue produits</h1>
        <div className="toolbar">
          <div className="filter-block">
            <select id="category-filter" value={filters.category} onChange={handleCategoryChange}>
              <option value="">Toutes categories</option>
              <option value="shoes">Chaussures</option>
              <option value="clothing">Vetements</option>
              <option value="accessories">Accessoires</option>
              <option value="bags">Sacs</option>
            </select>
          </div>

          <div className="filter-block">
            <div className="sort-fields" aria-label="Champ de tri">
              {Object.entries(SORT_LABELS).map(([key, label]) => {
                const isActive = filters.sort === key;
                const arrow = filters.order === "asc" ? "↑" : "↓";

                return (
                  <button
                    key={key}
                    type="button"
                    className={`sort-pill${isActive ? " active" : ""}`}
                    onClick={() => handleSortFieldClick(key)}
                  >
                    {label} {isActive ? arrow : ""}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {loading && <p className="loading">Chargement...</p>}
      {error   && <p className="error">Erreur : {error}</p>}
      {!loading && !error && (
        <>
          {products.length === 0 ? (
            <p className="empty">Aucun produit trouve.</p>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <article key={product._id} className="product-card">
                  <h2>{product.name}</h2>
                  <p className="category">{product.category}</p>
                  <p className="description">{product.description}</p>
                  <p className="meta">Stock: {product.stock}</p>
                  <p className="price">{product.price.toFixed(2)} EUR</p>
                </article>
              ))}
            </div>
          )}
          {pagination && (
            <div className="pagination">
              {(() => {
                const displayTotalPages = Math.max(pagination.totalPages, 1);
                return (
                  <>
                    <PaginationButton
                      onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                      disabled={!pagination.hasPrev || loading}
                      ariaLabel="Page precedente"
                    >
                      {'<'}
                    </PaginationButton>

                    {pageTokens.map((token) => {
                      if (token === "...") {
                        return (
                          <span key={`ellipsis-${Math.random()}`} className="ellipsis">...</span>
                        );
                      }

                      return (
                        <PaginationButton
                          key={token}
                          onClick={() => setFilters((prev) => ({ ...prev, page: token }))}
                          disabled={loading}
                          ariaLabel={`Page ${token}`}
                          className={token === pagination.page ? "active" : ""}
                        >
                          {token}
                        </PaginationButton>
                      );
                    })}

                    <PaginationButton
                      onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                      disabled={!pagination.hasNext || loading}
                      ariaLabel="Page suivante"
                    >
                      {'>'}
                    </PaginationButton>
                    <span className="page-info">
                      Page {pagination.page} / {displayTotalPages} ({pagination.total} resultats)
                    </span>
                  </>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}
