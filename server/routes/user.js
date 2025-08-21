const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");

// Register API
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (result.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      "INSERT INTO users (name, email, password, role, status, created_at) VALUES (?, ?, ?, ?, 'active', NOW())",
      [name, email, hashedPassword, role],
      (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.status(200).json({ message: "Registered successfully" });
      }
    );
  });
});

// Login API
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err || result.length === 0) return res.status(400).json({ message: "Invalid credentials" });

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    res.json({ message: "Login successful", user });
  });
});

module.exports = router;
