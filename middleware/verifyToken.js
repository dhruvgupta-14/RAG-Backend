import admin from "../utils/firebase.js";


const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const idToken = authHeader.split("Bearer ")[1];

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    req.user = decodedToken; 
    next(); 
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res.status(403).json({ message: "Unauthorized: Invalid or expired token" });
  }
};

export default verifyToken;
