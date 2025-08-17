import Team from '../models/team.model.js';
import ErrorResponse from '../utils/errorHandler.js';

export const createTeam = async (req, res, next) => {
  try {
    req.body.teamLeader = req.user.id; // From protect middleware
    const team = await Team.create(req.body);
    res.status(201).json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
};

export const getMyTeams = async (req, res, next) => {
  try {
    const teams = await Team.find({ teamLeader: req.user.id }).populate('teamLeader', 'fullName email usn semester department');
    res.status(200).json({ success: true, count: teams.length, data: teams });
  } catch (err) {
    next(err);
  }
};

export const getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id).populate('teamLeader', 'fullName email usn semester department');
    if (!team) {
      return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
};

export const updateTeam = async (req, res, next) => {
  try {
    let team = await Team.findById(req.params.id);
    if (!team) {
      return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
    }
    if (team.teamLeader.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to update this team', 401));
    }
    team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
};

export const deleteTeam = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
        }
        if (team.teamLeader.toString() !== req.user.id) {
            return next(new ErrorResponse('Not authorized to delete this team', 401));
        }
        await team.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};