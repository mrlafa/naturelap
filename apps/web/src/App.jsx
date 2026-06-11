import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import ScrollToTop from './components/ScrollToTop';
import AnalyticsTracker from './components/AnalyticsTracker.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { CommerceProvider } from './contexts/CommerceContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';

import HomePage from './pages/HomePage.jsx';
import FeedPage from './pages/FeedPage.jsx';
import StorePage from './pages/StorePage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import ConfirmationPage from './pages/ConfirmationPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import MyBookingsPage from './pages/MyBookingsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SavedItemsPage from './pages/SavedItemsPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import ReferralsPage from './pages/ReferralsPage.jsx';
import SupportPage from './pages/SupportPage.jsx';
import OrderTrackingPage from './pages/OrderTrackingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import HostelListingsPage from './pages/HostelListingsPage.jsx';
import HostelDetailPage from './pages/HostelDetailPage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import ReviewsPage from './pages/ReviewsPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

function App() {
  return (
    <AuthProvider>
      <CommerceProvider>
        <Router>
          <ScrollToTop />
          <AnalyticsTracker />
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/feed" element={<FeedPage />} />
                <Route path="/store" element={<StorePage />} />
                <Route path="/store/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/confirmation" element={<ConfirmationPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/hostels" element={<HostelListingsPage />} />
                <Route path="/hostels/:id" element={<HostelDetailPage />} />

                <Route path="/checkout" element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                } />
                <Route path="/orders/:id" element={
                  <ProtectedRoute>
                    <OrderTrackingPage />
                  </ProtectedRoute>
                } />
                <Route path="/bookings" element={
                  <ProtectedRoute>
                    <MyBookingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/saved" element={
                  <ProtectedRoute>
                    <SavedItemsPage />
                  </ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                } />
                <Route path="/referrals" element={
                  <ProtectedRoute>
                    <ReferralsPage />
                  </ProtectedRoute>
                } />
                <Route path="/support" element={
                  <ProtectedRoute>
                    <SupportPage />
                  </ProtectedRoute>
                } />
                <Route path="/booking/:hostelId" element={
                  <ProtectedRoute>
                    <BookingPage />
                  </ProtectedRoute>
                } />

                <Route path="/reviews/:hostelId" element={<ReviewsPage />} />

                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                <Route path="*" element={
                  <div className="container mx-auto px-4 py-20 text-center">
                    <h1 className="text-4xl font-bold mb-4">404</h1>
                    <p>Page not found.</p>
                  </div>
                } />
              </Routes>
            </main>
            <Footer />
          </div>
          <Toaster position="top-center" />
        </Router>
      </CommerceProvider>
    </AuthProvider>
  );
}

export default App;
