import express from 'express';
import {
  loginPartner,
  getPartnerStats,
  getPartnerOrders,
  updateDeliveryStatus,
  updateAvailability,
  updateLocation,
} from '../Controllers/deliveryPartnerAuthController.js';

import { protectDeliveryPartner } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginPartner);
router.get('/ping', (req, res) => res.json({ success: true, message: 'Delivery Partner API is alive' }));

router.use(protectDeliveryPartner);

router.get('/stats', getPartnerStats);
router.get('/orders', getPartnerOrders);
router.put('/orders/:orderId/status', updateDeliveryStatus);
router.put('/availability', updateAvailability);
router.put('/location', updateLocation);

export default router;