const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userModel = require("../models/user.model");
const { webToken } = require("../config");

class UserController {
    async registerUser(obj) {
        try {
            const found = await userModel.findOne({ email: obj.email });
            if (found) return { ok: false, message: "Email already registered" };
            const user = await new userModel(obj).save();
            user.password = "******";
            return { ok: true, payLoad: { data: user, message: "User registered successfully" } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async loginUser({ email, password }) {
        try {
            let user = await userModel.findOne({ email }).populate("leaveRequests");
            if (!user) return { ok: false, message: "User not found" };
            const isValid = await user.isValidPassword(password);
            if (!isValid) return { ok: false, message: "Password incorrect" };

            const token = jwt.sign(
                { id: user._id, email: user.email, role: user.role, department: user.department },
                webToken.secretKey,
                { expiresIn: webToken.expiresIn }
            );
            const userData = user.toJSON();
            userData.password = "******";
            userData.jwToken = token;
            return { ok: true, payLoad: { data: userData, message: "Logged in successfully" } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async getUser(id) {
        try {
            const user = await userModel.findById(id).populate("leaveRequests");
            if (!user) return { ok: false, message: "User not found" };
            return { ok: true, payLoad: user };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async getUsers() {
        try {
            const users = await userModel.find().populate({ path: "leaveRequests", model: "LeaveRequest" });
            return { ok: true, payLoad: users };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async getDepartmentUsers(dept) {
        try {
            const users = await userModel.find({ department: dept });
            return { ok: true, payLoad: users };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async updateUser(id, data) {
        try {
            delete data._id; delete data.__v; delete data.createdAt; delete data.updatedAt;
            if (data.password) {
                const salt = await bcrypt.genSalt();
                data.password = await bcrypt.hash(data.password, salt);
            }
            const user = await userModel.findByIdAndUpdate(id, { $set: data }, { new: true });
            if (!user) return { ok: false, message: "User not found" };
            return { ok: true, payLoad: { message: "User updated successfully" } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async registerUserLeave(id, leaveId) {
        try {
            const user = await userModel.findByIdAndUpdate(id, { $push: { leaveRequests: leaveId } }, { new: true });
            if (!user) return { ok: false, message: "User not found" };
            return { ok: true };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }

    async bulkUploadUsers(jsonData) {
        try {
            if (!Array.isArray(jsonData)) return { ok: false, message: "Expected array of users" };
            const result = await userModel.insertMany(jsonData, { ordered: false });
            return { ok: true, payLoad: { count: result.length, message: "Users uploaded successfully" } };
        } catch (err) {
            return { ok: false, message: err.message };
        }
    }
}

module.exports = new UserController();
