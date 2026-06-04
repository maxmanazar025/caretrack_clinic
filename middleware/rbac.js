export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Avtorizatsiya talab qilinadi.',
        error_en: 'Authentication is required.'
      });
    }

    const { role } = req.user;

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        error: `Ruxsat etilmagan amal. Sizning rolingiz: ${role}`,
        error_en: `Access denied. Your role: ${role}`
      });
    }

    next();
  };
}
