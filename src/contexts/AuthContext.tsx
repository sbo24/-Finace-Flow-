import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { generateId } from '../utils/uuid';

// Simple user type without Firebase
interface User {
    id: string;
    email: string;
    displayName: string;
    createdAt: string;
}

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, displayName: string) => Promise<void>;
    logout: () => void;
    updateProfile: (displayName: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// LocalStorage keys
const USERS_KEY = 'financeflow_users';
const CURRENT_USER_KEY = 'financeflow_current_user';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Load current user from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem(CURRENT_USER_KEY);
        if (savedUser) {
            setCurrentUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    // Get all users from localStorage
    const getUsers = (): Record<string, { user: User; password: string }> => {
        const users = localStorage.getItem(USERS_KEY);
        return users ? JSON.parse(users) : {};
    };

    // Save users to localStorage
    const saveUsers = (users: Record<string, { user: User; password: string }>) => {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    };

    // Login
    const login = async (email: string, password: string): Promise<void> => {
        const users = getUsers();
        const userEntry = users[email.toLowerCase()];

        if (!userEntry) {
            throw new Error('Usuario no encontrado');
        }

        if (userEntry.password !== password) {
            throw new Error('Contraseña incorrecta');
        }

        setCurrentUser(userEntry.user);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userEntry.user));
    };

    // Register
    const register = async (email: string, password: string, displayName: string): Promise<void> => {
        const users = getUsers();
        const emailLower = email.toLowerCase();

        if (users[emailLower]) {
            throw new Error('El email ya está registrado');
        }

        const newUser: User = {
            id: generateId(),
            email: emailLower,
            displayName,
            createdAt: new Date().toISOString(),
        };

        users[emailLower] = { user: newUser, password };
        saveUsers(users);

        setCurrentUser(newUser);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    };

    // Logout
    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem(CURRENT_USER_KEY);
    };

    // Update profile
    const updateProfile = (displayName: string) => {
        if (!currentUser) return;

        const updatedUser = { ...currentUser, displayName };
        setCurrentUser(updatedUser);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

        // Update in users list too
        const users = getUsers();
        if (users[currentUser.email]) {
            users[currentUser.email].user = updatedUser;
            saveUsers(users);
        }
    };

    const value: AuthContextType = {
        currentUser,
        loading,
        login,
        register,
        logout,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
