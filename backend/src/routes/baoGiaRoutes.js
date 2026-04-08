const express = require('express');
const router = express.Router();
const baoGiaController = require('../controllers/baoGiaController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, baoGiaController.list);
router.get('/:id', authMiddleware, baoGiaController.detail);
router.post('/', authMiddleware, baoGiaController.create);
router.put('/:id/status', authMiddleware, baoGiaController.updateStatus);
router.delete('/:id', authMiddleware, baoGiaController.delete);

module.exports = router;