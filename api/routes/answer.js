const express = require('express');
const { answerController } = require('../controllers/answerController');

const router = express.Router();

router.post('/', answerController);

module.exports = router;

