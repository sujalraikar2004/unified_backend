import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Event name is required"], trim: true },
  description: { type: String, required: [true, "Event description is required"] },
  category: { type: [String], required: [true, "Event category is required"] },
  date: { type: Date, required: [true, "Event date is required"] },
  startTime: { type: String, required: [true, "Start time is required"] },
  endTime: { type: String, required: [true, "End time is required"] },
  location: { type: String, required: [true, "Event location is required"] },
  maxSeats: {
    type: Number,
    required: [true, "Maximum seats are required"],
    default: 100,
    min: [1, "An event must have at least one seat"],
  },
  registeredTeams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

eventSchema.virtual('seatsAvailable').get(function() {
  return this.maxSeats - this.registeredTeams.length;
});

const Event = mongoose.model('Event', eventSchema);
export default Event;