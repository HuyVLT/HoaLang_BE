import { Router } from 'express';
import {
  getPayOSConfig,
  updatePayOSConfig,
  deletePayOSConfig
} from './payosConfig.controller';
import { resolveTenant, requireTenantDb } from '../../middleware/tenant.middleware';
import { checkAccessToken } from '../../middleware/auth.middleware';
import { restrictTo } from '../../middleware/role.middleware';

const router = Router();

// Apply dynamic tenant context resolution first, then verify JWT token, and check if user is VILLAGE_OWNER or ADMIN
router.use(resolveTenant);
router.use(requireTenantDb);
router.use(checkAccessToken);
router.use(restrictTo('VILLAGE_OWNER', 'ADMIN'));

// Merchant PayOS settings endpoints
router.get('/payos/config', getPayOSConfig);
router.post('/payos/config', updatePayOSConfig);
router.delete('/payos/config', deletePayOSConfig);

export default router;
