const admin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({
      status: 'error',
      message: 'Forbidden: Access is restricted to administrators.'
    });
  }
};

module.exports = { admin }; 