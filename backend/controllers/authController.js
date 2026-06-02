// backend/controllers/authController.js
const usuarioModel = require("../models/usuarioModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET || "ofimundo123";

const AuthController = {
  /**
   * Iniciar sesión (incluye RUT en respuesta)
   */
  login: async (req, res) => {
    try {
      const { usuario, password } = req.body;

      console.log("=================================");
      console.log(`🔐 Intento de login: "${usuario}"`);
      console.log("=================================");

      if (!usuario || !password) {
        return res.status(400).json({
          success: false,
          message: "Usuario y contraseña son requeridos",
        });
      }

      const usuarioLimpio = usuario.trim();
      const user = await usuarioModel.findByUsername(usuarioLimpio);

      if (!user) {
        console.log(`❌ Usuario NO encontrado: ${usuarioLimpio}`);
        return res.status(401).json({
          success: false,
          message: "Usuario o contraseña incorrectos",
        });
      }

      console.log("✅ Usuario encontrado, verificando contraseña...");

      const isValidPassword = await usuarioModel.comparePassword(
        password,
        user.contraseña,
      );

      if (!isValidPassword) {
        console.log(`❌ Contraseña incorrecta`);
        return res.status(401).json({
          success: false,
          message: "Usuario o contraseña incorrectos",
        });
      }

      console.log(`✅ Login exitoso para: ${usuarioLimpio}`);

      const token = jwt.sign(
        {
          id: user.id,
          usuario: user.usuario,
          rol: user.rol || "usuario",
        },
        JWT_SECRET,
        { expiresIn: "7d" },  // Token válido por 7 días
      );

      res.json({
        success: true,
        message: "Login exitoso",
        token,
        usuario: {
          id: user.id,
          usuario: user.usuario,
          nombre: user.nombre || user.usuario,
          email: user.email || "",
          cargo: user.cargo || "",
          departamento: user.departamento || "",
          rol: user.rol || "usuario",
          rut: user.rut || "",  // ← Incluir RUT
        },
      });
    } catch (error) {
      console.error("❌ Error en login:", error);
      res.status(500).json({
        success: false,
        message: "Error en el servidor",
      });
    }
  },

  /**
   * Registrar nuevo usuario (incluye RUT)
   */
  register: async (req, res) => {
    try {
      const {
        usuario,
        password,
        nombre,
        email,
        cargo,
        departamento,
        rut,  // ← Agregar RUT
        rol = "usuario",
      } = req.body;

      console.log(`📝 Intento de registro:`, {
        usuario,
        nombre,
        email,
        cargo,
        departamento,
        rut
      });

      if (!usuario || !password || !nombre || !email) {
        return res.status(400).json({
          success: false,
          message: "Todos los campos requeridos deben estar presentes",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "La contraseña debe tener al menos 6 caracteres",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "El email no es válido",
        });
      }

      const usuarioExistente = await usuarioModel.findByUsername(usuario);
      if (usuarioExistente) {
        return res.status(400).json({
          success: false,
          message: "El nombre de usuario ya está en uso",
        });
      }

      const emailExistente = await usuarioModel.findByEmail(email);
      if (emailExistente) {
        return res.status(400).json({
          success: false,
          message: "El email ya está registrado",
        });
      }

      const newUser = await usuarioModel.create({
        usuario,
        password,
        nombre,
        email,
        cargo: cargo || null,
        departamento: departamento || null,
        rut: rut || null,  // ← Guardar RUT
        rol,
      });

      console.log(`✅ Usuario registrado: ${usuario} (ID: ${newUser.id})`);

      const token = jwt.sign(
        {
          id: newUser.id,
          usuario: newUser.usuario,
          rol: newUser.rol || "usuario",
        },
        JWT_SECRET,
        { expiresIn: "7d" },
      );

      res.status(201).json({
        success: true,
        message: "Usuario registrado exitosamente",
        token,
        user: {
          id: newUser.id,
          usuario: newUser.usuario,
          nombre: newUser.nombre,
          email: newUser.email,
          cargo: newUser.cargo || "",
          departamento: newUser.departamento || "",
          rol: newUser.rol || "usuario",
          rut: newUser.rut || "",  // ← Incluir RUT en respuesta
        },
      });
    } catch (error) {
      console.error("❌ Error en registro:", error);

      if (
        error.message &&
        (error.message.includes("UNIQUE") || error.number === 2627)
      ) {
        return res.status(400).json({
          success: false,
          message: "El email o usuario ya está registrado",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error al registrar usuario: " + error.message,
      });
    }
  },

  /**
   * Verificar token (incluye RUT)
   */
  verifyToken: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1] || null;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Token no proporcionado",
        });
      }

      console.log("🔍 Verificando token...");

      const decoded = jwt.verify(token, JWT_SECRET);

      console.log(`✅ Token válido, buscando usuario ID: ${decoded.id}`);

      const user = await usuarioModel.findById(decoded.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      res.json({
        success: true,
        usuario: {
          id: user.id,
          usuario: user.usuario,
          nombre: user.nombre || user.usuario,
          email: user.email || "",
          cargo: user.cargo || "",
          departamento: user.departamento || "",
          rol: user.rol || "usuario",
          rut: user.rut || "",  // ← Incluir RUT
        },
      });
    } catch (error) {
      console.error("❌ Error verificando token:", error);

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expirado",
        });
      }

      res.status(401).json({
        success: false,
        message: "Token inválido",
      });
    }
  },

  /**
   * Cerrar sesión
   */
  logout: async (req, res) => {
    try {
      console.log("📤 POST /api/auth/logout - Usuario:", req.user?.usuario);

      res.json({
        success: true,
        message: "Sesión cerrada exitosamente",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error en logout:", error);
      res.status(500).json({
        success: false,
        message: "Error al cerrar sesión",
      });
    }
  },

  /**
   * Cambiar contraseña
   */
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Contraseña actual y nueva son requeridas",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "La nueva contraseña debe tener al menos 6 caracteres",
        });
      }

      const user = await usuarioModel.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      const isValidPassword = await usuarioModel.comparePassword(
        currentPassword,
        user.contraseña,
      );

      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: "Contraseña actual incorrecta",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await usuarioModel.updatePassword(userId, hashedPassword);

      console.log("✅ Contraseña actualizada para usuario:", user.usuario);

      res.json({
        success: true,
        message: "Contraseña actualizada exitosamente",
      });
    } catch (error) {
      console.error("❌ Error cambiando contraseña:", error);
      res.status(500).json({
        success: false,
        message: "Error al cambiar contraseña",
      });
    }
  },

  /**
   * Actualizar perfil - CORREGIDO PARA INCLUIR RUT Y NO CERRAR SESIÓN
   */
  updateProfile: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { nombre, email, cargo, departamento, rut } = req.body;  // ← Incluir rut

      console.log('📝 Actualizando perfil:', { userId, nombre, email, cargo, departamento, rut });

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      if (!nombre || !email) {
        return res.status(400).json({
          success: false,
          message: "Nombre y email son requeridos",
        });
      }

      const user = await usuarioModel.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      if (email !== user.email) {
        const emailExistente = await usuarioModel.findByEmail(email);
        if (emailExistente && emailExistente.id !== userId) {
          return res.status(400).json({
            success: false,
            message: "El email ya está registrado por otro usuario",
          });
        }
      }

      const updatedUser = await usuarioModel.update(userId, {
        nombre,
        email,
        cargo: cargo || null,
        departamento: departamento || null,
        rut: rut || user.rut || null,  // ← PERMITIR ACTUALIZAR RUT
      });

      console.log("✅ Perfil actualizado para usuario:", updatedUser.usuario);

      res.json({
        success: true,
        message: "Perfil actualizado exitosamente",
        user: {
          id: updatedUser.id,
          usuario: updatedUser.usuario,
          nombre: updatedUser.nombre,
          email: updatedUser.email,
          cargo: updatedUser.cargo || "",
          departamento: updatedUser.departamento || "",
          rol: updatedUser.rol || "usuario",
          rut: updatedUser.rut || "",  // ← Incluir RUT actualizado
        },
      });
    } catch (error) {
      console.error("❌ Error actualizando perfil:", error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar perfil",
      });
    }
  },
};

module.exports = AuthController;