const express = require('express');
const router = express.Router();
const congNoController = require('../controllers/congNoController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, congNoController.getCongNo);
router.get('/:tenKhach', authMiddleware, congNoController.getChiTietCongNo);

module.exports = router;