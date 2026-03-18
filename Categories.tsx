import { Layout } from '@/components/Layout';
import { AdBanner } from '@/components/AdBanner';
import { useNavigate } from 'react-router-dom';
import { Clapperboard, Tv, Zap, Star } from 'lucide-react';

// Import category background images
import categoryMovies from '@/assets/category-movies.jpg';
import categorySeries from '@/assets/category-series.jpg';
import categoryAnime from '@/assets/category-anime.jpg';

interface CategoryCard {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  image: string;
  route: string;
}

const categoryCards: CategoryCard[] = [
  {
    id: 'movies',
    title: 'MOVIES',
    subtitle: 'THE MASTER COLLECTION',
    icon: <Clapperboard size={32} className="text-foreground" />,
    image: categoryMovies,
    route: '/categories/movies',
  },
  {
    id: 'series',
    title: 'SERIES',
    subtitle: 'HIGH FIDELITY STREAMS',
    icon: <Tv size={32} className="text-foreground" />,
    image: categorySeries,
    route: '/categories/series',
  },
  {
    id: 'anime',
    title: 'ANIME',
    subtitle: 'LEGENDARY ART NODES',
    icon: <Zap size={32} className="text-foreground" />,
    image: categoryAnime,
    route: '/categories/anime',
  },
];

const Categories = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="animate-fade-in px-4 py-6">
        {/* Page Title */}
        <h1 className="font-display text-2xl md:text-3xl text-center gold-gradient-text tracking-wider mb-8">
          THE GLOBAL GRID
        </h1>

        {/* Category Cards */}
        <div className="space-y-5">
          {categoryCards.map((category) => (
            <button
              key={category.id}
              onClick={() => navigate(category.route)}
              className="w-full relative overflow-hidden rounded-2xl aspect-[2/1] group focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {/* Background Image */}
              <img
                src={category.image}
                alt={category.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] group-hover:bg-background/30 transition-colors duration-300" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl border-2 border-foreground/50 flex items-center justify-center mb-3 group-hover:border-primary group-hover:scale-110 transition-all duration-300">
                  {category.icon}
                </div>
                
                {/* Title */}
                <h2 className="font-display text-2xl md:text-3xl text-foreground tracking-wider mb-1">
                  {category.title}
                </h2>
                
                {/* Subtitle */}
                <p className="text-xs md:text-sm text-primary font-medium tracking-[0.2em]">
                  {category.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Sponsored Ad Banner */}
        <div className="mt-6">
          <div className="w-full py-3 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 rounded-lg pointer-events-none">
            <div className="flex items-center justify-center gap-2">
              <Star size={14} className="text-primary" />
              <span className="text-xs text-primary font-semibold tracking-wider">
                SPONSORED CONTENT
              </span>
              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded">
                AD
              </span>
            </div>
          </div>
        </div>

        {/* Ad Banner */}
        <AdBanner />
      </div>
    </Layout>
  );
};

export default Categories;