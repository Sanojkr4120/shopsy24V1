import React, { useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Download, Trash2, Calendar, Share2, Search } from 'lucide-react';

const ManageOrders = () => {
    const [orders, setOrders] = useState([]);
    const [socket, setSocket] = useState(null);
    const { user } = useContext(AuthContext);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_API_URL);
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('newOrder', (order) => {
            toast.info(`New Order Received: #${order._id.slice(-6)}`);
            setOrders(prev => [order, ...prev]);
        });

        socket.on('orderStatusChanged', (updatedOrder) => {
            setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
        });

        socket.on('orderDeleted', (deletedOrderId) => {
            setOrders(prev => prev.filter(order => order._id !== deletedOrderId));
            toast.info(`Order #${deletedOrderId.slice(-6)} has been deleted`);
        });
    }, [socket]);

    useEffect(() => {
        if (user) {
            api.get('/api/orders')
                .then(res => setOrders(res.data))
                .catch(err => console.error(err));
        }
    }, [user]);

    const updateStatus = async (id, status, isPaymentUpdate = false) => {
        try {
            const endpoint = isPaymentUpdate ? `/api/orders/${id}/payment-status` : `/api/orders/${id}/status`;
            await api.put(endpoint, { status });
            toast.success(`Order ${isPaymentUpdate ? 'payment ' : ''}status updated to ${status}`);
        } catch (error) {
            toast.error(error.formattedMessage || 'Failed to update status');
        }
    };

    const deleteOrder = async (id) => {
        if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
            try {
                await api.delete(`/api/orders/${id}`);
                setOrders(prev => prev.filter(order => order._id !== id));
                toast.success('Order deleted successfully');
            } catch (error) {
                toast.error(error.formattedMessage || 'Failed to delete order');
            }
        }
    };

    const shareOrder = async (order) => {
        let shareText = `
*Order Details*
Order ID: #${order._id.slice(-6)}
Customer: ${order.customerName}
Contact: ${order.contactNumber}
Address: ${order.address}${order.flatBuilding ? `\nFlat/Building: ${order.flatBuilding}` : ''}${order.floorUnit ? `\nFloor/Unit: ${order.floorUnit}` : ''}${order.pincode ? `\nPincode: ${order.pincode}` : ''}
Location: ${order.location}
Items:
${order.items.map(i => `- ${i.quantity}x ${i.name}`).join('\n')}
Total Amount: ₹${order.totalAmount}
Payment: ${order.paymentMethod} (${order.paymentStatus})
Status: ${order.status}
`.trim();

        if (order.latitude && order.longitude) {
            shareText += `\nMap Location: https://www.google.com/maps?q=${order.latitude},${order.longitude}`;
        }

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Order #${order._id.slice(-6)}`,
                    text: shareText,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(shareText);
                toast.success('Order details copied to clipboard!');
            } catch (err) {
                toast.error('Failed to copy order details.');
            }
        }
    };

    const getFilteredOrders = () => {
        return orders.filter(order => {
            // Date Filter
            if (startDate && endDate) {
                const orderDate = new Date(order.createdAt);
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (orderDate < start || orderDate > end) return false;
            }

            // Search Filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const orderId = order._id.toLowerCase();
                const customerName = order.customerName.toLowerCase();
                const contactNumber = order.contactNumber.toLowerCase();
                const email = order.user?.email?.toLowerCase() || '';

                return orderId.includes(term) ||
                    customerName.includes(term) ||
                    contactNumber.includes(term) ||
                    email.includes(term);
            }

            return true;
        });
    };

    const filteredOrders = getFilteredOrders();

    const exportToExcel = () => {
        if (filteredOrders.length === 0) {
            toast.warn('No orders found for the selected date range.');
            return;
        }

        const dataToExport = filteredOrders.map(order => ({
            'Order ID': order._id,
            'Date': new Date(order.createdAt).toLocaleString(),
            'Customer Name': order.customerName,
            'Contact': order.contactNumber,
            'Address': order.address,
            'Flat/Building': order.flatBuilding || '',
            'Floor/Unit': order.floorUnit || '',
            'Pincode': order.pincode || '',
            'Location': order.location || '',
            'Items': order.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
            'Total Amount': order.totalAmount,
            'Payment Method': order.paymentMethod,
            'Payment Status': order.paymentStatus,
            'Order Status': order.status,
            'Handled By': order.handledBy ? `${order.handledBy.name} (${order.handledBy.role})` : 'N/A'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

        saveAs(data, `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Orders exported successfully!');
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-orange-500">Manage Orders</h2>

                <div className="flex flex-col md:flex-row items-center gap-2 bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search ID, Name, Email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-gray-700 text-white pl-10 pr-4 py-1.5 rounded border border-gray-600 focus:outline-none focus:border-orange-500 w-full text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-gray-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-orange-500"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-orange-500"
                        />
                    </div>
                    <button
                        onClick={exportToExcel}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm flex items-center gap-2 transition w-full md:w-auto justify-center"
                    >
                        <Download size={16} /> Export Excel
                    </button>
                </div>
            </div>

            <div className="grid gap-6">
                {filteredOrders.map(order => (
                    <div key={order._id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                        <div className="flex flex-col md:flex-row justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-orange-400">Order #{order._id.slice(-6)}</h3>
                                <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                                {order.handledBy && (
                                    <p className="text-sm text-gray-400 mt-1">
                                        Handled by: <span className="text-white font-medium">{order.handledBy.name}</span> <span className="text-xs bg-gray-700 px-1 rounded">{order.handledBy.role}</span>
                                    </p>
                                )}
                            </div>
                            <div className="mt-2 md:mt-0">
                                <span className={`px-3 py-1 rounded text-sm font-bold ${order.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                    order.status === 'Confirmed' ? 'bg-purple-500/20 text-purple-500' :
                                        order.status === 'Processing' ? 'bg-blue-500/20 text-blue-500' :
                                            order.status === 'Delivered' ? 'bg-green-500/20 text-green-500' :
                                                'bg-red-500/20 text-red-500'
                                    }`}>
                                    {order.status}
                                </span>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-gray-700/50 p-4 rounded">
                                <h4 className="font-bold mb-2 text-gray-300">Customer Details</h4>
                                <p><span className="text-gray-400">Name:</span> {order.customerName}</p>
                                <p><span className="text-gray-400">Contact:</span> <a href={`tel:${order.contactNumber}`} className="text-blue-400 hover:text-blue-300 hover:underline">{order.contactNumber}</a></p>
                                <p><span className="text-gray-400">Address:</span> {order.address}</p>
                                {order.flatBuilding && (
                                    <p><span className="text-gray-400">Flat/Building:</span> {order.flatBuilding}</p>
                                )}
                                {order.floorUnit && (
                                    <p><span className="text-gray-400">Floor/Unit:</span> {order.floorUnit}</p>
                                )}
                                {order.pincode && (
                                    <p><span className="text-gray-400">Pincode:</span> {order.pincode}</p>
                                )}
                                <p><span className="text-gray-400">Location:</span> {order.location}</p>
                                {order.latitude && order.longitude && (
                                    <p>
                                        <a
                                            href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 underline text-sm"
                                        >
                                            View on Map ({order.latitude}, {order.longitude})
                                        </a>
                                    </p>
                                )}
                                <p><span className="text-gray-400">Payment:</span> {order.paymentMethod} <span className={`text-xs px-2 py-0.5 rounded ${order.paymentStatus === 'Paid' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>{order.paymentStatus}</span></p>
                            </div>
                            <div className="bg-gray-700/50 p-4 rounded">
                                <h4 className="font-bold mb-2 text-gray-300">Order Items</h4>
                                <ul className="space-y-1">
                                    {order.items.map((item, idx) => (
                                        <li key={idx} className="flex justify-between">
                                            <span>{item.quantity}x {item.name}</span>
                                            <span>₹{item.price * item.quantity}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="border-t border-gray-600 mt-2 pt-2 flex justify-between font-bold text-orange-400">
                                    <span>Total</span>
                                    <span>₹{order.totalAmount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => updateStatus(order._id, 'Confirmed')} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition">Confirm</button>
                            <button onClick={() => updateStatus(order._id, 'Processing')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition">Process</button>
                            <button onClick={() => updateStatus(order._id, 'Delivered')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition">Delivered</button>
                            <button onClick={() => updateStatus(order._id, 'Cancelled')} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition">Cancel</button>
                            {order.paymentMethod === 'COD' && order.paymentStatus !== 'Paid' && (
                                <button onClick={() => updateStatus(order._id, 'Paid', true)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded transition">Mark Paid</button>
                            )}
                            {order.paymentMethod === 'COD' && order.paymentStatus === 'Paid' && (
                                <button onClick={() => updateStatus(order._id, 'Pending', true)} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded transition">Mark Pending</button>
                            )}
                            {user && user.role === 'admin' && (
                                <button
                                    onClick={() => deleteOrder(order._id)}
                                    className="bg-red-900/80 hover:bg-red-900 text-red-200 px-4 py-2 rounded transition flex items-center gap-1"
                                    title="Delete Order"
                                >
                                    <Trash2 size={18} /> Delete
                                </button>
                            )}
                            <button
                                onClick={() => shareOrder(order)}
                                className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded transition flex items-center gap-1 ml-auto"
                                title="Share Order Details"
                            >
                                <Share2 size={18} /> Share
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ManageOrders;
