import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Authentication middleware
 * Checks if user is authenticated via JWT token or session
 */
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
    let token;
    
    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } 
    // Or from cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Or from local storage through body (should be avoided in production)
    else if (req.body && req.body.token) {
      token = req.body.token;
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Not authenticated. Please log in." 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID from decoded token
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Attach user object to request
    req.user = user;

    /*if (user && user._id) {
      req.user = {
        _id: user._id,
        username: user.username,
        // other user properties
      };
    }*/

    next();
  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(401).json({ 
      success: false, 
      message: "Authentication failed. " + (error.name === "JsonWebTokenError" ? "Invalid token." : error.message)
    });
  }
};

/**
 * Admin authorization middleware
 * Checks if authenticated user is an admin
 * Must be used after protect middleware
 */
export const isAdmin = (req, res, next) => {
  // Ensure user is authenticated first
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: "Not authenticated" 
    });
  }

  // Check if user is an admin
  if (!req.user.isAdmin) {
    return res.status(403).json({ 
      success: false, 
      message: "Access denied. Admin privileges required." 
    });
  }

  next();
};

/**
 * Resource owner middleware
 * Checks if authenticated user owns the resource or is an admin
 * @param {Function} getOwnerIdFromRequest - Function to extract owner ID from request
 */
export const isResourceOwner = (getOwnerIdFromRequest) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: "Not authenticated" 
        });
      }

      // If user is admin, allow access regardless of ownership
      if (req.user.isAdmin) {
        return next();
      }

      // Get owner ID from request using the provided function
      const ownerId = await getOwnerIdFromRequest(req);
      
      // If ownerId could not be determined
      if (!ownerId) {
        return res.status(404).json({ 
          success: false, 
          message: "Resource not found" 
        });
      }

      // Check if authenticated user is the owner
      if (ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: "Access denied. You do not own this resource." 
        });
      }

      next();
    } catch (err) {
      console.error("Resource owner check error:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Error checking resource ownership", 
        error: err.message 
      });
    }
  };
};