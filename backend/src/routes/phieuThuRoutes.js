const express = require('express');
const router = express.Router();
const phieuThuController = require('../controllers/phieuThuController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, phieuThuController.list);
router.post('/', authMiddleware, phieuThuController.create);

module.exports = router;