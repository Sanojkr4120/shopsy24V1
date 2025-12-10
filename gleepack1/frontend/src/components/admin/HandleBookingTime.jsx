import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Clock, Save } from 'lucide-react';

const HandleBookingTime = () => {
    const [openingTime, setOpeningTime] = useState('09:00');
    const [closingTime, setClosingTime] = useState('21:00');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/api/admin/settings');
            if (res.data) {
                setOpeningTime(res.data.openingTime || '09:00');
                setClosingTime(res.data.closingTime || '21:00');
            }
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load settings');
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await api.put('/api/admin/settings', {
                openingTime,
                closingTime
            });
            toast.success('Booking time updated successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update booking time');
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [hour, minute] = timeStr.split(':');
        const h = parseInt(hour, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minute} ${ampm}`;
    };

    if (loading) return <div className="text-center text-white p-10">Loading settings...</div>;

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden max-w-2xl mx-auto">
            <div className="p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-orange-500 flex items-center gap-2">
                    <Clock size={28} /> Booking Time Controller
                </h2>
                <p className="text-gray-400 mt-1">Set the daily opening and closing hours for accepting orders.</p>
            </div>

            <div className="p-8 space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Opening Time</label>
                        <input
                            type="time"
                            value={openingTime}
                            onChange={(e) => setOpeningTime(e.target.value)}
                            className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:border-orange-500 text-lg"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Orders will be accepted starting from <span className="text-orange-400 font-bold">{formatTime(openingTime)}</span>.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Closing Time</label>
                        <input
                            type="time"
                            value={closingTime}
                            onChange={(e) => setClosingTime(e.target.value)}
                            className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:border-orange-500 text-lg"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Orders will not be accepted after <span className="text-orange-400 font-bold">{formatTime(closingTime)}</span>.
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-700 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition transform hover:scale-105"
                    >
                        <Save size={20} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HandleBookingTime;
