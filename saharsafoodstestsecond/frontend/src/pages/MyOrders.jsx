import React, { useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [socket, setSocket] = useState(null);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_API_URL);
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('orderStatusChanged', (updatedOrder) => {
            setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
        });

        socket.on('orderDeleted', (deletedOrderId) => {
            setOrders(prev => prev.filter(o => o._id !== deletedOrderId));
        });
    }, [socket]);

    useEffect(() => {
        if (user) {
            api.get('/api/orders/myorders')
                .then(res => setOrders(res.data))
                .catch(err => {
                    console.error(err);
                    // toast.error('Failed to fetch orders'); // Optional: Add toast if desired
                });
        }
    }, [user]);

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Order Status</h2>
            <div className="space-y-4">
                {orders.map(order => (
                    <div key={order._id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col md:flex-row justify-between items-center">
                        <div>
                            <p className="font-bold text-lg">Order #{order._id.slice(-6)}</p>
                            <p className="text-gray-400 text-sm">{new Date(order.createdAt).toLocaleString()}</p>
                            <p className="text-gray-300 mt-2">{order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                        </div>
                        <div className="mt-4 md:mt-0 text-right">
                            <span className={`px-4 py-2 rounded-full font-bold text-sm ${order.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                order.status === 'Confirmed' ? 'bg-purple-500/20 text-purple-500' :
                                    order.status === 'Processing' ? 'bg-blue-500/20 text-blue-500' :
                                        order.status === 'Delivered' ? 'bg-green-500/20 text-green-500' :
                                            'bg-red-500/20 text-red-500'
                                }`}>
                                {order.status}
                            </span>
                            {['Pending', 'Confirmed', 'Processing'].includes(order.status) && order.estimatedDeliveryTime > 0 && (
                                <p className="text-sm text-purple-400 mt-2 font-semibold animate-pulse">
                                    Your estimated delivery time is {order.estimatedDeliveryTime} minutes
                                </p>
                            )}
                            <p className="font-bold text-xl mt-2">₹{order.totalAmount}</p>
                            <p className={`text-xs mt-1 font-semibold ${order.paymentStatus === 'Paid' ? 'text-green-500' : 'text-yellow-500'}`}>
                                {order.paymentMethod} - {order.paymentStatus}
                            </p>
                        </div>
                    </div>
                ))}
                {orders.length === 0 && <p className="text-center text-gray-500">No orders found.</p>}
            </div>
        </div>
    );
};

export default MyOrders;
