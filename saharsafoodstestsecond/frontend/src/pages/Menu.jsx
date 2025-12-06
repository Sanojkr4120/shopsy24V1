import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';

const Menu = () => {
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState({});

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const { data } = await api.get('/api/menu');
                setMenuItems(data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load menu items');
                setLoading(false);
            }
        };
        fetchMenu();
    }, []);

    const addToCart = (item) => {
        if (item.isAvailable === false) {
            toast.warning('This item is currently unavailable.');
            return;
        }
        setCart(prev => ({
            ...prev,
            [item._id]: { ...item, quantity: (prev[item._id]?.quantity || 0) + 1 }
        }));
        toast.success(`Added ${item.name} to cart!`);
    };

    const proceedToCheckout = () => {
        const items = Object.values(cart);
        if (items.length === 0) {
            toast.error("Cart is empty!");
            return;
        }
        navigate('/cart', { state: { items } });
    };

    const getEmbedUrl = (url) => {
        if (!url) return null;
        let videoId = null;
        if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1].split('&')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        } else if (url.includes('youtube.com/embed/')) {
            videoId = url.split('embed/')[1].split('?')[0];
        }

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0`;
        }
        return url;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-4xl font-bold mb-8 text-center text-orange-500">Our Menu</h2>
            {menuItems.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                    <p className="text-xl">No menu items available at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {menuItems.map(item => (
                        <div key={item._id} className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 border border-gray-700 group relative">
                            {!item.isAvailable && (
                                <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center pointer-events-none">
                                    <span className="bg-red-600 text-white px-4 py-2 rounded-full font-bold transform -rotate-12">SOLD OUT</span>
                                </div>
                            )}
                            <div className="h-48 overflow-hidden relative">
                                {item.video ? (
                                    (item.video.includes('youtube') || item.video.includes('youtu.be')) ? (
                                        <iframe
                                            src={getEmbedUrl(item.video)}
                                            className="w-full h-full object-cover"
                                            title={item.name}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    ) : (
                                        <video
                                            src={item.video}
                                            className="w-full h-full object-cover"
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                        />
                                    )
                                ) : (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                                )}
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold">{item.name}</h3>
                                    <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">{item.category}</span>
                                </div>
                                <p className="text-gray-400 mb-4 text-sm line-clamp-2">{item.description}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-2xl font-bold text-orange-400">₹{item.price}</span>
                                    <button
                                        onClick={() => addToCart(item)}
                                        disabled={!item.isAvailable}
                                        className={`px-4 py-2 rounded-lg transition ${item.isAvailable
                                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {item.isAvailable ? 'Add to Cart' : 'Unavailable'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {Object.keys(cart).length > 0 && (
                <div className="fixed bottom-8 right-8 z-50">
                    <button
                        onClick={proceedToCheckout}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full shadow-2xl flex items-center gap-2 animate-bounce"
                    >
                        Checkout ({Object.values(cart).reduce((a, b) => a + b.quantity, 0)} items)
                    </button>
                </div>
            )}
        </div>
    );
};

export default Menu;
