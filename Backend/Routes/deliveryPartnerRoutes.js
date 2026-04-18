import express from 'express';
import {
  registerDeliveryPartner,
  getAllDeliveryPartners,
  getDeliveryPartnerById,
  updateDeliveryPartner,
  deleteDeliveryPartner,
  updatePartnerStatus,
  getPartnerStats
} from '../Controllers/deliveryPartnerController.js';
import { protect, admin } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(admin);

router.get('/stats', getPartnerStats);

router.post('/register', registerDeliveryPartner);
router.get('/', getAllDeliveryPartners);
router.get('/:id', getDeliveryPartnerById);
router.put('/:id', updateDeliveryPartner);
router.delete('/:id', deleteDeliveryPartner);
router.patch('/:id/status', updatePartnerStatus);

export default router;