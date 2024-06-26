import mongoose from "mongoose";
import validator from "validator";
const UserSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: [true, "Please enter your Id"],
    },
    name: {
      type: String,
      required: [true, "Enter your name"],
    },
    email: {
      type: String,
      unique: [true, "Email already exists"],
      required: [true, "Please enter your email"],
      validate: validator.default.isEmail,
    },
    photo: {
      type: String,
      required: [true, "Please add Photo"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: [true, "Please enter your gender"],
    },
    dob: {
      type: Date,
      required: [true, "Please enter your Date of birth"],
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.virtual("age").get(function () {
  const today = new Date();
  const dob = this.dob;
  let age = today.getFullYear - dob.getFullYear();
  if (
    today.getMonth() < dob.getMonth() ||
    (today.getMonth === dob.getMonth() && today.getDate() < dob.getDate())
  ) {
    age--;
  }
  return age;
});
export const User = mongoose.model("User", UserSchema);
