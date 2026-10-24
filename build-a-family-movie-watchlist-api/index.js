
import express from "express";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import watchlistRoutes from "./routes/watchlist.js";
import { findByUsername } from "./utils/db.js";

const PORT = process.env.PORT || 3000;
const app = express();

app.use(helmet());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Family Movie Watchlist API");
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      error: "Username and password are required"
    });
  }

  const user = findByUsername(username);

  if (!user) {
    return res.status(401).json({
      error: "Invalid username or password"
    });
  }

  let passwordMatches = false;

  try {
    passwordMatches = await bcrypt.compare(password, user.passwordHash);
  } catch (error) {
    passwordMatches = false;
  }

  if (!passwordMatches) {
    return res.status(401).json({
      error: "Invalid username or password"
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    process.env.JWT_SECRET || "family-movie-secret",
    { expiresIn: "1h" }
  );

  return res.status(200).json({ token });
});

app.use("/api/watchlist", watchlistRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});