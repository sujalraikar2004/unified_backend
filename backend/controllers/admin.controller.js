import Event from '../models/event.model.js';
import ExcelJS from 'exceljs';

// @desc    Get all registration details for all events
// @route   GET /api/v1/admin/registrations
// @access  Private/Admin
export const getRegistrationDetails = async (req, res, next) => {
    try {
        const events = await Event.find().populate({
            path: 'registeredTeams',
            populate: [
                { 
                    path: 'teamLeader',
                    select: 'fullName email usn semester department' // Select fields for team leader
                },
                // Members are embedded, so they are fetched automatically with the team
            ]
        });

        res.status(200).json({ 
            success: true, 
            count: events.length, 
            data: events 
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Download all registration details as an Excel file
// @route   GET /api/admin/registrations/download
// @access  Private/Admin
export const downloadRegistrations = async (req, res, next) => {
    try {
        const events = await Event.find().populate({
            path: 'registeredTeams',
            populate: [
                {
                    path: 'teamLeader',
                    select: 'fullName email usn semester department'
                },
            ]
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Registrations');

        worksheet.columns = [
            { header: 'Event Name', key: 'eventName', width: 30 },
            { header: 'Team Name', key: 'teamName', width: 20 },
            { header: 'Role', key: 'role', width: 15 },
            { header: 'Full Name', key: 'fullName', width: 25 },
            { header: 'USN', key: 'usn', width: 15 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Semester', key: 'semester', width: 10 },
            { header: 'Department', key: 'department', width: 20 },
        ];

        events.forEach(event => {
            if (event.registeredTeams.length > 0) {
                event.registeredTeams.forEach(team => {
                    if (team.teamLeader) {
                        worksheet.addRow({
                            eventName: event.name,
                            teamName: team.teamName,
                            role: 'Leader',
                            fullName: team.teamLeader.fullName,
                            usn: team.teamLeader.usn,
                            email: team.teamLeader.email,
                            semester: team.teamLeader.semester,
                            department: team.teamLeader.department,
                        });
                    }
                    team.members.forEach(member => {
                        worksheet.addRow({
                            eventName: event.name,
                            teamName: team.teamName,
                            role: 'Member',
                            fullName: member.fullName,
                            usn: member.usn,
                            email: '', // Member model doesn't have email
                            semester: member.currentSemester,
                            department: member.department,
                        });
                    });
                });
            }
        });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="registrations.xlsx"'
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        next(err);
    }
};
