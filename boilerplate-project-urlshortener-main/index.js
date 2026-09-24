const express = require("express");
const cors = require("cors");
const dns = require("dns");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  "/public",
  express.static(path.join(process.cwd(), "public"))
);

app.get("/", (req, res) => {
  res.sendFile(
    path.join(process.cwd(), "views", "index.html")
  );
});

// Store URLs in memory
const urlDatabase = [];
let id = 1;

// Create short URL
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  if (!originalUrl) {
    return res.json({ error: "invalid url" });
  }

  let url;

  try {
    url = new URL(originalUrl);
  } catch (error) {
    return res.json({ error: "invalid url" });
  }

  // Only allow HTTP and HTTPS
  if (
    url.protocol !== "http:" &&
    url.protocol !== "https:"
  ) {
    return res.json({ error: "invalid url" });
  }

  // Verify hostname
  dns.lookup(url.hostname, (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    const existing = urlDatabase.find(
      (item) => item.original_url === originalUrl
    );

    if (existing) {
      return res.json(existing);
    }

    const shortUrl = {
      original_url: originalUrl,
      short_url: id
    };

    urlDatabase.push(shortUrl);
    id++;

    res.json(shortUrl);
  });
});

// Redirect short URL
app.get("/api/shorturl/:short_url", (req, res) => {
  const shortUrl = Number(req.params.short_url);

  const found = urlDatabase.find(
    (item) => item.short_url === shortUrl
  );

  if (!found) {
    return res.json({
      error: "No short URL found"
    });
  }

  res.redirect(found.original_url);
});

// Local development only
if (require.main === module) {
  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}

// Vercel
module.exports = app;