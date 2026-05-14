import { useState, useEffect } from "react";

const API_URL = "/api/products";
const SORT_LABELS = {
  createdAt: "Date",
  price: "Prix",
  name: "Nom",
  stock: "Stock",
};

function getPageTokens(currentPage, totalPages) {
  if (totalPages <= 1) {
    return [1];
  }

  const tokens = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  if (start > 1) {
    tokens.push(1);
    if (start > 2) {
      tokens.push("start-ellipsis");
    }
  }

  for (let i = start; i <= end; i += 1) {
    tokens.push(i);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      tokens.push("end-ellipsis");
    }
    tokens.push(totalPages);
  }

  return tokens;
}

function PaginationButton({ onClick, disabled, ariaLabel, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

export default function App() {
  const limit = 12;
  const [products,   setProducts]   = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const [page,     setPage]     = useState(1);
  const [category, setCategory] = useState("");
  const [sort,     setSort]     = useState("price");
  const [order,    setOrder]    = useState("desc");


  //protge et annule les requete obsoletes: si click sur 1 puis 2, annule la premiere requete
  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          sort,
          order,
        });

        if (category) {
          params.set("category", category);
        }

        const response = await fetch(`${API_URL}?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Impossible de charger le catalogue.");
        }

        const payload = await response.json();
        setProducts(payload.items || []);
        setPagination(payload.pagination || null);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Une erreur est survenue.");
          setProducts([]);
          setPagination(null);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();

    return () => {
      controller.abort();
    };
  }, [page, category, sort, order]);

  function handleCategoryChange(event) {
    setCategory(event.target.value);
    setPage(1);
  }


  function handleSortFieldClick(nextSort) {
    if (nextSort === sort) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      setPage(1);
      return;
    }

    setSort(nextSort);
    setPage(1);
  }

  return (
    <div className="app">
      <div className="header">
        <h1>Catalogue produits</h1>
        <div className="toolbar">
          <div className="filter-block">
            <select id="category-filter" value={category} onChange={handleCategoryChange}>
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
                const isActive = sort === key;
                const arrow = order === "asc" ? "↑" : "↓";

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
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={!pagination.hasPrev || loading}
                      ariaLabel="Page precedente"
                    >
                      {'<'}
                    </PaginationButton>

                    {getPageTokens(pagination.page, displayTotalPages).map((token) => {
                      if (typeof token === "string") {
                        return (
                          <span key={token} className="ellipsis">...</span>
                        );
                      }

                      return (
                        <PaginationButton
                          key={token}
                          onClick={() => setPage(token)}
                          disabled={loading}
                          ariaLabel={`Page ${token}`}
                        >
                          {token === pagination.page ? (
                            <span className="active">{token}</span>
                          ) : (
                            token
                          )}
                        </PaginationButton>
                      );
                    })}
                    
                    <PaginationButton
                      onClick={() => setPage((prev) => prev + 1)}
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
