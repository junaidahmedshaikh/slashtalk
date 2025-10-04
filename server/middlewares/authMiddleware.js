const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // console.log("token: ", decoded.id);
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.log("Error: ", error.message);
  }
};
module.exports = authMiddleware;
