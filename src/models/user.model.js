const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { Schema } = mongoose;

const userSchema = new Schema({
    firstName: { type: String },
    lastName: { type: String },
    middleName: { type: String },
    email: { type: String, unique: true },
    gender: { type: String },
    password: { type: String },
    refreshToken: { type: String },
    status: { type: String, enum: ["Pending", "Active", "Disabled"], default: "Active" },
    dob: { type: Date },
    photo: { type: String },
    phoneNumber: { type: String },
    emergencyContact: { type: String },
    department: { type: String, enum: ["Business_Development", "ICT", "Operations", "Admin", "Accounts", "Finance/Audit", "Planning"] },
    nNumber: { type: String },
    ApptType: { type: String, enum: ["Permanent", "Temporary", "Adhoc", "Nysc"] },
    designation: { type: String, enum: ["Department_Head", "Staff", "DG"], default: "Staff" },
    role: { type: String, enum: ["Admin", "Auditor", "Accounts", "DG", "User", "Administrator"], default: "User" },
    bankAccountNumber: { type: String },
    bankName: { type: String },
    psn: { type: String },
    openFileNum: { type: String },
    secFileNum: { type: String },
    cadre: { type: String },
    rank: { type: String },
    gradeLevel: { type: String },
    step: { type: String },
    LGA: { type: String },
    state: { type: String },
    bvn: { type: String },
    nin: { type: String },
    highestQualification: { type: String },
    employmentDate: { type: Date },
    dateofFirstAppointment: { type: Date },
    dateofConfirmation: { type: Date },
    dateofpresentappointment: { type: Date },
    dateOfRetirement: { type: Date },
    leaveRequests: [{ type: mongoose.Types.ObjectId, ref: "LeaveRequest" }],
}, { timestamps: true, strictPopulate: false });

userSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password) return next();
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.isValidPassword = function (password) {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
