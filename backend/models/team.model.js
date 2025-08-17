import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
  fullName: { type: String, required: [true, "Member's full name is required"], trim: true },
  usn: { type: String, required: [true, "Member's USN is required"], trim: true },
  currentSemester: { type: Number, required: [true, "Member's semester is required"] },
  department: { type: String, required: [true, "Member's department is required"], trim: true },
});

const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    unique: true,
  },
  teamLeader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: {
    type: [teamMemberSchema],
    validate: [
      {
        validator: (members) => members.length >= 2,
        message: 'A team must have at least 3 members (including leader).',
      },
      {
        validator: (members) => members.length <= 3,
        message: 'A team can have a maximum of 4 members (including leader).',
      },
    ],
  },
}, { timestamps: true });

const Team = mongoose.model('Team', teamSchema);
export default Team;