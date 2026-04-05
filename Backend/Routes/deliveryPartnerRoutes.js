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

// All routes require authentication and admin role
router.use(protect);
router.use(admin);

// Stats route (must be before :id route)
router.get('/stats', getPartnerStats);

// Main routes
router.post('/register', registerDeliveryPartner);
router.get('/', getAllDeliveryPartners);
router.get('/:id', getDeliveryPartnerById);
router.put('/:id', updateDeliveryPartner);
router.delete('/:id', deleteDeliveryPartner);
router.patch('/:id/status', updatePartnerStatus);

export default router;