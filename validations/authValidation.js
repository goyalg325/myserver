import vine from "@vinejs/vine";
import { CustomErrorReporter } from "./CustomErrorReporter.js";

// custom error
vine.errorReporter = () => new CustomErrorReporter()
const allowedRoles = ["Editor", "Admin"];

export const registerSchema = vine.object({
  username: vine.string().minLength(2).maxLength(150),
  password: vine
    .string()
    .minLength(8)
    .maxLength(100)
    .confirmed(),
  role: vine.string().in(allowedRoles, 'Invalid role. Allowed roles are Editor and Admin.')
});
export const loginSchema = vine.object({
    username: vine.string().minLength(1),
    password: vine.string().minLength(1)
  });