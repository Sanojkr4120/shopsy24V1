import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';

export const SystemContext = createContext();

export const SystemProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        isOrderingDisabled: false,
        occasionName: '',
        occasionMessage: '',
        startDate: null,
        endDate: null
    });
    const [socket, setSocket] = useState(null);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/api/admin/settings');
            setSettings(data);
        } catch (error) {
            console.error("Failed to fetch system settings:", error);
        }
    };

    useEffect(() => {
        fetchSettings();

        // Initialize Socket.IO
        const newSocket = io(import.meta.env.VITE_API_URL);
        setSocket(newSocket);

        newSocket.on('settingsUpdated', (updatedSettings) => {
            setSettings(updatedSettings);
        });

        return () => {
            newSocket.off('settingsUpdated');
            newSocket.close();
        };
    }, []);

    return (
        <SystemContext.Provider value={{ settings, fetchSettings, socket }}>
            {children}
        </SystemContext.Provider>
    );
};
