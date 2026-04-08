// routes/bangGiaRoutes.js
const express = require('express');
const router = express.Router();
const bangGiaController = require('../controllers/bangGiaController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, bangGiaController.list);
router.get('/:id', authMiddleware, bangGiaController.detail);
router.post('/', authMiddleware, bangGiaController.create);
router.put('/:id', authMiddleware, bangGiaController.update);
router.delete('/:id', authMiddleware, bangGiaController.delete);

module.exports = router;