const express  = require("express");
const cors     = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app       = express();
const PORT      = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";


//VERIF BACKEND: accepte seulement certains fields pour le sort et l'ordre 
const ALLOWED_SORT_FIELDS = new Set(["createdAt", "price", "name", "stock"]);
const ALLOWED_ORDER = new Set(["asc", "desc"]);

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return parsed;
}
//force la valeur dans une range safe
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

async function start() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log("Connecté à MongoDB");

  const db = client.db("shop");
  app.locals.db = db;

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/products", async (req, res) => {
    try {
      const productsCollection = req.app.locals.db.collection("products");

      const rawPage = parsePositiveInt(req.query.page, 1);
      const rawLimit = parsePositiveInt(req.query.limit, 10);  //la limite des items sera 10 si bad input
      const page = rawPage < 1 ? 1 : rawPage;
      const limit = clamp(rawLimit < 1 ? 10 : rawLimit, 1, 100);

      const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
      const sort = typeof req.query.sort === "string" ? req.query.sort : "createdAt";
      const order = typeof req.query.order === "string" ? req.query.order : "desc";

      if (!ALLOWED_SORT_FIELDS.has(sort)) {
        return res.status(400).json({
          error: "Invalid sort value",
          details: "Allowed values: createdAt, price, name, stock",
        });
      }

      if (!ALLOWED_ORDER.has(order)) {
        return res.status(400).json({
          error: "Invalid order value",
          details: "Allowed values: asc, desc",
        });
      }

      const filter = {};
      if (category) {
        filter.category = category;
      }

      const sortDirection = order === "asc" ? 1 : -1;
      //si 2 prodeuits sont les meme, les tri par leurs ids
      const sortQuery = { [sort]: sortDirection, _id: 1 };

      const total = await productsCollection.countDocuments(filter);
      const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
      const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1;
      const skip = (safePage - 1) * limit;

      const items = await productsCollection
        .find(filter)
        .sort(sortQuery)
        .skip(skip) //skipe les x blocks
        .limit(limit) //assure que la database est charge par block grace a limit
        .toArray();

      res.json({
        items,
        pagination: {
          page: safePage,
          limit,
          total,
          totalPages,
          hasPrev: safePage > 1,
          hasNext: totalPages > 0 && safePage < totalPages,
        },
        filters: {
          category: category || null,
          sort,
          order,
        },
      });
    } catch (error) {
      console.error("Erreur sur /api/products:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.listen(PORT, () => console.log("Serveur demarre sur http://localhost:" + PORT));
}

start().catch((err) => {
  console.error("Erreur de connexion MongoDB :", err.message);
  process.exit(1);
});
