import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { CartProvider } from './CartContext';
import Header from './components/Header';
import Cart from './components/Cart';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Care from './pages/Care';

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return children;
}

function AppInner() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <Header onCartOpen={() => setCartOpen(true)} />
      <Cart open={cartOpen} onClose={() => setCartOpen(false)} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<Navigate to="/" />} />
        <Route path="/care" element={<Care />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppInner />
      </CartProvider>
    </AuthProvider>
  );
}
