import express from 'express';
import {
    createEvent,
    getAllEvents,
    getEventById,
    registerTeamForEvent
} from '../controllers/event.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
    .get(getAllEvents)
    .post(protect, createEvent); // Protect event creation

router.route('/:id')
    .get(getEventById);

router.post('/:id/register', protect, registerTeamForEvent);

export default router;