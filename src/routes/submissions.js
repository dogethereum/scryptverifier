const express = require('express');
const Submissions = require('../controllers/submissions');

const router = express.Router();

router.get('/', async (re, res) => {
  try {
    const { submissions } = await Submissions.listSubmissions();
    res.json({
      submissions,
    });
  } catch (ex) {
    res.status(ex.status || 500);
    res.json({
      errors: [ex.message],
    });
  }
});

module.exports = router;
