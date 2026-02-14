import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AdminUser {
  email: string;
  name: string;
  role: "admin";
}

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

// Default admin credentials (in production, use proper authentication)
const ADMIN_CREDENTIALS = {
  email: "admin@trendzone.com",
  password: "admin123",
  name: "Admin",
};

const AUTH_STORAGE_KEY = "trendzone_admin_auth";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        // Check if session is still valid (24 hours)
        if (parsed.expiresAt && new Date(parsed.expiresAt) > new Date()) {
          setUser(parsed.user);
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check credentials
    if (email.toLowerCase() === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      const adminUser: AdminUser = {
        email: ADMIN_CREDENTIALS.email,
        name: ADMIN_CREDENTIALS.name,
        role: "admin",
      };

      // Store session with 24-hour expiry
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ user: adminUser, expiresAt: expiresAt.toISOString() })
      );

      setUser(adminUser);
      return { success: true };
    }

    return { success: false, error: "Invalid email or password" };
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
