import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Quote from "./pages/Quote";

const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminQuotes = lazy(() => import("./pages/admin/AdminQuotes"));

function RouteFallback() {
  return (
    <div className="flex-1 flex items-center justify-center py-24 text-text-secondary">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Routes>
        {/* Admin routes — own layout, no public header/footer */}
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<RouteFallback />}>
              <AdminLogin />
            </Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<RouteFallback />}>
              <AdminLayout />
            </Suspense>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<RouteFallback />}>
                <AdminDashboard />
              </Suspense>
            }
          />
          <Route
            path="products"
            element={
              <Suspense fallback={<RouteFallback />}>
                <AdminProducts />
              </Suspense>
            }
          />
          <Route
            path="messages"
            element={
              <Suspense fallback={<RouteFallback />}>
                <AdminMessages />
              </Suspense>
            }
          />
          <Route
            path="quotes"
            element={
              <Suspense fallback={<RouteFallback />}>
                <AdminQuotes />
              </Suspense>
            }
          />
        </Route>

        {/* Public routes */}
        <Route
          path="*"
          element={
            <>
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route
                    path="/catalog/:seoSlug"
                    element={
                      <Suspense fallback={<RouteFallback />}>
                        <ProductDetail />
                      </Suspense>
                    }
                  />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/quote" element={<Quote />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </>
          }
        />
      </Routes>
    </div>
  );
}
