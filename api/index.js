// Render deployment entry point (Express app)
const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

module.exports = app;
