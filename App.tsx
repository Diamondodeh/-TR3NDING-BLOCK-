import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import Index from "./pages/Index";
import Categories from "./pages/Categories";
import CategoryList from "./pages/CategoryList";
import Downloads from "./pages/Downloads";
import Profile from "./pages/Profile";
import MovieDetails from "./pages/MovieDetails";
import WatchPlayer from "./pages/WatchPlayer";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Favorites from "./pages/Favorites";
import DeletedMovies from "./pages/DeletedMovies";
import PrivacySettings from "./pages/PrivacySettings";
import ImportMovies from "./pages/ImportMovies";
import TMDBDetails from "./pages/TMDBDetails";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/:category" element={<CategoryList />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/watch/:id" element={<WatchPlayer />} />
            <Route path="/login" element={<Login />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/deleted" element={<DeletedMovies />} />
            <Route path="/privacy" element={<PrivacySettings />} />
            <Route path="/import" element={<ImportMovies />} />
            <Route path="/tmdb/:type/:id" element={<TMDBDetails />} />
            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
