import jwt from 'jsonwebtoken';

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Authorization token missing' });
  }

  if (!process.env.ACCESS_TOKEN_SECRET) {
    return res.status(500).json({ message: 'Access token secret not configured' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  });
};

export default protect;
