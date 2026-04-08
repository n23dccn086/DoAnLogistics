const express = require('express');
const router = express.Router();
const vanDonController = require('../controllers/vanDonController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, vanDonController.list);
router.get('/:id', authMiddleware, vanDonController.detail);
router.post('/', authMiddleware, vanDonController.create);
router.put('/:id', authMiddleware, vanDonController.update);
router.delete('/:id', authMiddleware, vanDonController.delete);

module.exports = router;