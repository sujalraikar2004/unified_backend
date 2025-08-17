import express from 'express';
import {
    createTeam,
    getMyTeams,
    getTeamById,
    updateTeam,
    deleteTeam
} from '../controllers/team.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes below are protected
router.use(protect);

router.route('/')
    .post(createTeam)
    .get(getMyTeams);

router.route('/:id')
    .get(getTeamById)
    .put(updateTeam)
    .delete(deleteTeam);

export default router;