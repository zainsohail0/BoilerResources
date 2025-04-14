import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  console.log("Auth Check - Session:", req.session);
  console.log("Auth Check - User:", req.user);
  console.log("Auth Check - Cookies:", req.cookies);

  // First check session-based auth
  if (req.isAuthenticated()) {
    return next();
  }

  // Then check JWT token
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the full user object
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Set the full user object in the request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ message: "Not authenticated" });
  }
};
