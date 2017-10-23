const express = require('express');
const Submissions = require('./submissions');

const router = express.Router();

router.use('/submission', Submissions);

module.exports = router;
