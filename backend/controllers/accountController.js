const multer = require("multer"); 
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs"); 
const Account = require("../models/account");

// Konfigurasi multer untuk upload file
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Batas ukuran file 50MB
}).single("photo");

// Path ke foto default
const defaultPhotoPath = "D:/Capstone-Asli/frontend/src/gambar/profiledefault.png"

// Tambahkan akun
const addAccount = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File size exceeds the maximum limit of 50MB." });
      }
      return res.status(400).json({ message: "File upload error: " + err.message });
    }

    try {
      const { name, email, password, role, status } = req.body;

      if (!name || !email || !password || !role || !status) {
        return res.status(400).json({ message: "All fields are required." });
      }

      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format." });
      }

      const existingAccount = await Account.findOne({ email });
      if (existingAccount) {
        return res.status(400).json({ message: `Email ${email} is already in use.` });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Cek jika ada file foto yang diupload
      const photo = req.file ? req.file.buffer.toString('base64') : fs.readFileSync(defaultPhotoPath, 'base64'); // Jika tidak ada foto, gunakan foto default

      const newAccount = new Account({
        name,
        email,
        password: hashedPassword,
        role,
        status,
        photo: photo || '', // Jika tidak ada foto, gunakan string kosong
      });

      await newAccount.save();
      res.status(201).json({ message: "Account successfully created!", account: newAccount });
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(500).json({ message: "Error creating account" });
    }
  });
};

// Mendapatkan semua akun
const getAccounts = async (req, res) => {
  try {
    const { status, role } = req.query;
    const query = {};
    if (status) query.status = status;
    if (role) query.role = role;

    const accounts = await Account.find(query, "-password");
    res.json(accounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ message: "Error fetching accounts" });
  }
};

// Mendapatkan akun berdasar ID
const getAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await Account.findById(id);
    res.json(account);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ message: "Error fetching accounts" });
  }
};

// Menghapus akun berdasarkan ID
const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAccount = await Account.findByIdAndDelete(id);

    if (!deletedAccount) {
      return res.status(404).json({ message: "Account not found." });
    }

    res.json({ message: "Account successfully deleted!" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: "Error deleting account" });
  }
};

// Mengedit akun berdasarkan ID
const editAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status, password } = req.body;

    if (!name || !email || !role || !status) {
      return res.status(400).json({ message: "All fields are required." });
    }

    let updatedPhoto = req.file ? req.file.buffer.toString('base64') : null;

    if (!updatedPhoto) {
      updatedPhoto = req.body.photo || fs.readFileSync(defaultPhotoPath, 'base64');  // Foto lama atau default
    }

    let updatedPassword;
    if (password) {
      updatedPassword = await bcrypt.hash(password, 10);
    }

    const updatedData = {
      name,
      email,
      role,
      status,
      photo: updatedPhoto,
    };

    if (updatedPassword) {
      updatedData.password = updatedPassword;
    }

    const updatedAccount = await Account.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });

    if (!updatedAccount) {
      return res.status(404).json({ message: "Account not found or could not be updated." });
    }

    res.json({ message: "Account successfully updated!", account: updatedAccount });
  } catch (error) {
    console.error("Error updating account:", error);
    res.status(500).json({ message: "Error updating account" });
  }
};

module.exports = {
  addAccount,
  getAccounts,
  getAccount,
  deleteAccount,
  editAccount,
};
