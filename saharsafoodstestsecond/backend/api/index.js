import connectDB from '../config/db.js';

export default async (req, res) => {
  try {
    await connectDB();
    
    const serverModule = await import('../server.js');
    const app = serverModule.default;
    
    return app(req, res);
  } catch (error) {
    console.error("Vercel Function Error:", error);
    res.status(500).json({ 
      message: "Server Internal Error", 
      error: error.message
    });
  }
};
