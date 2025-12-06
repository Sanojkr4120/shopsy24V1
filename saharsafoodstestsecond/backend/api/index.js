import app from '../server.js';
import connectDB from '../config/db.js';

export default async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("Vercel Function Crash:", error);
    res.status(500).json({ 
      message: "Server Internal Error", 
      error: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack 
    });
  }
};
