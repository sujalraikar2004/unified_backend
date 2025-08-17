import Event from '../models/event.model.js';
import Team from '../models/team.model.js';
import ErrorResponse from '../utils/errorHandler.js';
import mongoose from 'mongoose';

// For simplicity, we assume any protected user can create an event.
// In a real app, you would add another role-based middleware (e.g., isAdmin).
export const createEvent = async (req, res, next) => {
    try {
        const event = await Event.create(req.body);
        res.status(201).json({ success: true, data: event });
    } catch (err) {
        next(err);
    }
};

export const getAllEvents = async (req, res, next) => {
    try {
        const events = await Event.find().populate('registeredTeams', 'teamName');
        res.status(200).json({ success: true, count: events.length, data: events });
    } catch (err) {
        next(err);
    }
};

export const getEventById = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id).populate('registeredTeams', 'teamName teamLeader');
        if (!event) {
            return next(new ErrorResponse(`Event not found with id of ${req.params.id}`, 404));
        }
        res.status(200).json({ success: true, data: event });
    } catch (err) {
        next(err);
    }
};


export const registerTeamForEvent = async (req, res, next) => {
    const { teamId } = req.body;
    const eventId = req.params.id;
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const team = await Team.findById(teamId).session(session);
        if (!team) throw new ErrorResponse('Team not found.', 404);
        if (team.teamLeader.toString() !== req.user.id) throw new ErrorResponse('Only the team leader can register.', 403);
        const event = await Event.findOneAndUpdate(
            {
                _id: eventId,
                registeredTeams: { $ne: teamId },
                $expr: { $lt: [{ $size: '$registeredTeams' }, '$maxSeats'] },
            },
            { $push: { registeredTeams: teamId } },
            { new: true, session }
        );
        if (!event) {
            // To provide a more specific error, we first check if the event exists.
            const existingEvent = await Event.findById(eventId).session(session);
            if (!existingEvent) {
                throw new ErrorResponse('Event not found.', 404);
            }
            // Now check for other failure reasons
            if (existingEvent.registeredTeams.includes(teamId)) {
                throw new ErrorResponse('This team is already registered.', 400);
            }
            if (existingEvent.registeredTeams.length >= existingEvent.maxSeats) {
                throw new ErrorResponse('Registration failed: The event is full.', 400);
            }
            // If none of the above, throw a generic error
            throw new ErrorResponse('Could not register for the event.', 500);
        }
        await session.commitTransaction();
        res.status(200).json({ success: true, message: 'Team successfully registered!', data: event });
    } catch (err) {
        await session.abortTransaction();
        next(err);
    } finally {
        session.endSession();
    }
};