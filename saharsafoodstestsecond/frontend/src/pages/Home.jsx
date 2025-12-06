import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
            <motion.h1
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent"
            >
                Taste the Best Food <br /> in Saharsa
            </motion.h1>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-gray-300 mb-8 max-w-2xl"
            >
                Authentic flavors, fresh ingredients, and delivered hot to your door. Experience the joy of every bite.
            </motion.p>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
            >
                <Link to="/menu" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full text-lg transition shadow-lg hover:shadow-orange-500/50">
                    Order Now
                </Link>
            </motion.div>

            {/* Featured Image Placeholder */}
            <div className="mt-12 w-full max-w-4xl h-64 md:h-96 bg-gray-800 rounded-2xl overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=2069&auto=format&fit=crop" alt="Food" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
            </div>
        </div>
    );
};

export default Home;
