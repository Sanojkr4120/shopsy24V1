import connectDB from '../config/db.js';

export default async (req, res) => {
  try {
    console.log("Starting Vercel Function...");
    console.log("MONGO_URI:", process.env.MONGO_URI ? "Set" : "Not Set");
    
    await connectDB();
    
    // Dynamic import to catch initialization errors (like missing modules or syntax errors in server.js)
    const serverModule = await import('../server.js');
    const app = serverModule.default;
    
    return app(req, res);
  } catch (error) {
    console.error("CRITICAL ERROR IN VERCEL FUNCTION:", error);
    res.status(500).json({ 
      message: "Server Internal Error", 
      error: error.message,
      stack: process.env.NODE_ENV === "production" ? "Check Logs" : error.stack 
    });
  }
};
