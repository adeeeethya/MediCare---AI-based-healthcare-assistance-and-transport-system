import api from './api';
import { jwtDecode } from "jwt-decode"; // Need to install jwt-decode or just parse manually if simple

export const login = async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    try {
        const response = await api.post('/auth/token', formData);
        if (response.data.access_token) {
            const token = response.data.access_token;
            localStorage.setItem('token', token);

            // Decode token manually to avoid extra dependency
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const payload = JSON.parse(jsonPayload);

                localStorage.setItem('role', payload.role);
                return { ...response.data, role: payload.role };
            } catch (e) {
                console.error("Failed to decode token", e);
                return response.data;
            }
        }
    } catch (error) {
        throw error;
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
};

export const getCurrentUser = async () => {
    try {
        const response = await api.get('/users/me'); // Or caretakers/me depending on role?
        // Actually /users/me works for all users (since Caretaker is a User too)
        // But if we want caretaker specific details we might need /caretakers/me
        return response.data;
    } catch (error) {
        return null;
    }
};

export const registerUser = async (userData) => {
    return await api.post('/auth/register/user', userData);
};

export const registerCaretaker = async (caretakerData) => {
    return await api.post('/auth/register/caretaker', caretakerData);
};
