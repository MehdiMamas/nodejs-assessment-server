const logger = (req, res, next) => {
  if (process.env.NODE_ENV !== "development") {
    return next();
  }
  console.log(`${req.method} ${req.url}`);
  next();
};

module.exports = logger;
