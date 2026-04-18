import express from 'express';
import {
  loginPartner,
  getPartnerStats,
  getPartnerOrders,
  updateDeliveryStatus,
  updateAvailability,
} from '../Controllers/deliveryPartnerAuthController.js';

import { protectDeliveryPartner } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginPartner);

router.use(protectDeliveryPartner);

router.get('/stats', getPartnerStats);
router.get('/orders', getPartnerOrders);
router.put('/orders/:orderId/status', updateDeliveryStatus);
router.put('/availability', updateAvailability);

export default router;