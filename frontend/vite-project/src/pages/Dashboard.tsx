import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../Api/api";

interface UserProfile {
  id?: string;
  name: string;
  email: string;
  createdAt?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/");
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Profile Fetch Error:", err);
        // Invalid or expired token, clean up and redirect
        localStorage.removeItem("token");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-neutral-400 font-medium text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      
      {/* Navigation */}
      <nav className="border-b border-neutral-800 bg-neutral-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-xl font-bold text-transparent">
                Folder-Drive
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-700 hover:text-white transition-all duration-200"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-8 md:p-12 shadow-xl backdrop-blur-sm space-y-8">
          
          {/* Welcome Message */}
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Welcome back, {user?.name}! 👋
            </h2>
            <p className="text-lg text-neutral-400">
              Your session is securely connected to our MongoDB database.
            </p>
          </div>

          <div className="border-t border-neutral-800 my-6"></div>

          {/* User Info Details Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wider">
                Profile Details
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="block text-xs text-neutral-500 uppercase">Name</span>
                  <span className="text-white font-medium">{user?.name}</span>
                </div>
                <div>
                  <span className="block text-xs text-neutral-500 uppercase">Email</span>
                  <span className="text-white font-medium">{user?.email}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wider">
                Connection Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-white font-medium text-sm">Connected to Atlas Cluster</span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Authentication session is verified dynamically using JSON Web Tokens (JWT) signed by your Express backend server.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
};

export default Dashboard;
