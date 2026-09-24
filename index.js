const express = require("express");
const cors = require("cors");
const dns = require("dns");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/public", express.static(path.join(process.cwd(), "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "views", "index.html"));
});

const urls = [];
let nextId = 1;

// POST /api/shorturl
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  if (!originalUrl) {
    return res.json({ error: "invalid url" });
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(originalUrl);
  } catch (error) {
    return res.json({ error: "invalid url" });
  }

  if (
    parsedUrl.protocol !== "http:" &&
    parsedUrl.protocol !== "https:"
  ) {
    return res.json({ error: "invalid url" });
  }

  dns.lookup(parsedUrl.hostname, (error) => {
    if (error) {
      return res.json({ error: "invalid url" });
    }

    const existing = urls.find(
      (item) => item.original_url === originalUrl
    );

    if (existing) {
      return res.json(existing);
    }

    const result = {
      original_url: originalUrl,
      short_url: nextId
    };

    urls.push(result);
    nextId++;

    res.json(result);
  });
});

// GET /api/shorturl/:short_url
app.get("/api/shorturl/:short_url", (req, res) => {
  const shortUrl = Number(req.params.short_url);

  const found = urls.find(
    (item) => item.short_url === shortUrl
  );

  if (!found) {
    return res.json({ error: "No short URL found" });
  }

  res.redirect(found.original_url);
});

// Local development
if (require.main === module) {
  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}

// Vercel
module.exports = app;