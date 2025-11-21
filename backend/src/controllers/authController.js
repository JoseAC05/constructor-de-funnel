import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findAdminByEmail, createAdmin } from "../models/adminModel.js";

export async function loginHandler(req, res, next) {
  try {
    const { email, password } = req.body;
    const admin = await findAdminByEmail(email);
    if (!admin) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { sub: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    res.json({ token });
  } catch (err) {
    next(err);
  }
}

// Ruta opcional para crear el primer admin
export async function registerAdminOnce(req, res, next) {
  try {
    const { email, password } = req.body;
    const existing = await findAdminByEmail(email);
    if (existing) {
      return res.status(400).json({ message: "Ya existe un admin con ese email" });
    }
    const hash = await bcrypt.hash(password, 10);
    const admin = await createAdmin({ email, password_hash: hash });
    res.status(201).json({ id: admin.id, email: admin.email });
  } catch (err) {
    next(err);
  }
}
