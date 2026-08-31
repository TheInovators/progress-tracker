import mongoose from 'mongoose';

const platformStatsSchema = new mongoose.Schema(
  {
    stats: { type: mongoose.Schema.Types.Mixed, default: {} },
    fetchErrors: { type: mongoose.Schema.Types.Mixed, default: {} },
    fetchedAt: Date,
  },
  { _id: false },
);

// A monthly snapshot of the composite score. Monthly Top Performers is computed
// from the delta between consecutive snapshots, so the history has to be kept
// rather than recomputed from live stats.
const snapshotSchema = new mongoose.Schema(
  { month: String, composite: Number, takenAt: { type: Date, default: Date.now } },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    rollNo: { type: String, required: true, unique: true, uppercase: true },
    branch: { type: String, default: '', trim: true },
    section: { type: String, default: '', trim: true },
    college: { type: String, default: '', trim: true },
    // Locked once written. The route layer enforces this for admins too.
    dob: { type: Date, default: null },
    isAdmin: { type: Boolean, default: false },
    handles: {
      leetcode: { type: String, default: '', trim: true },
      codeforces: { type: String, default: '', trim: true },
      gfg: { type: String, default: '', trim: true },
      codechef: { type: String, default: '', trim: true },
      github: { type: String, default: '', trim: true },
    },
    platformData: { type: platformStatsSchema, default: () => ({}) },
    composite: { type: Number, default: 0, index: true },
    breakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    history: { type: [snapshotSchema], default: [] },
  },
  { timestamps: true },
);

userSchema.index({ branch: 1, section: 1, college: 1 });

userSchema.methods.toPublic = function toPublic() {
  const o = this.toObject();
  delete o.passwordHash;
  delete o.__v;
  return o;
};

export default mongoose.model('User', userSchema);
