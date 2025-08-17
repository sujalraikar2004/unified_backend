import express from 'express';
import { getRegistrationDetails, downloadRegistrations } from '../controllers/admin.controller.js';

const router = express.Router();

// All routes in this file are protected and should be restricted to admins.
// You would typically add an additional middleware here to check for an 'admin' role.

router.route('/registrations').get(getRegistrationDetails);
router.route('/registrations/download').get(downloadRegistrations);

export default router;
