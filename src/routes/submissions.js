const express = require('express');
const Submissions = require('../controllers/submissions');

const router = express.Router();

router.get('/', async (req, res) => {
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

router.get('/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const { submission } = await Submissions.getSubmission(hash);
    res.json({
      submission,
    });
  } catch (ex) {
    res.status(ex.status || 500);
    res.json({
      errors: [ex.message],
    });
  }
});

router.get('/:hash/events', async (req, res) => {
  try {
    const { hash } = req.params;
    const { events } = await Submissions.getSubmissionEvents(hash);
    res.json({
      events,
    });
  } catch (ex) {
    res.status(ex.status || 500);
    res.json({
      errors: [ex.message],
    });
  }
});

module.exports = router;
