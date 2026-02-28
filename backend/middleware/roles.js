const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    console.log('authorizeRoles check - User role:', req.user.role, 'Required roles:', roles);
    if (!roles.includes(req.user.role)) {
      console.log('Access denied - role mismatch');
      return res.status(403).json({ message: "Access denied" });
    }
    console.log('Access granted');
    next();
  };
};

module.exports = authorizeRoles;
