import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import FilterSidebar from '../components/properties/FilterSidebar';
import PropertiesHeader from '../components/properties/PropertiesHeader';
import PropertiesGrid from '../components/properties/PropertiesGrid';
import LoadingState from '../components/common/LoadingState';
import { propertiesAPI } from '../services/api';
import { useSEO } from '../hooks/useSEO';

export interface Property {
  _id: string;
  title: string;
  location: string;
  price: number;
  image: string[];
  beds: number;
  baths: number;
  length?: number;
  breadth?: number;
  sqft: number;
  type: string;
  facing?: string;
  description: string;
  amenities: string[];
  phone: string;
  city?: string;
  googleMapLink?: string;
  mapEmbedUrl?: string;
  instagramLink?: string;
  youtubeLink?: string;
}

const PropertiesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  useSEO({
    title: 'Properties - Browse Listings',
    description: 'Browse apartments, houses, villas, and more. Filter by location, price, bedrooms, and amenities.',
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProperties, setTotalProperties] = useState(0);

  const [sortBy, setSortBy] = useState('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [locationSearch, setLocationSearch] = useState(urlSearch);

  const [filters, setFilters] = useState<{
    location?: string;
    propertyType?: string[];
    facing?: string;
    minPrice?: number | string;
    maxPrice?: number | string;
    bedrooms?: number;
    bathrooms?: number;
    amenities?: string[];
  }>({
    location: urlSearch
  });

  const abortControllerRef = React.useRef<AbortController | null>(null);

  useEffect(() => {
    if (urlSearch !== filters.location) {
      setFilters(prev => ({ ...prev, location: urlSearch }));
      setLocationSearch(urlSearch);
    }
  }, [urlSearch]);

  const fetchProperties = async (pageNum: number, isLoadMore = false) => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      if (!isLoadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const params: any = {
        page: pageNum,
        limit: 12
      };

      if (filters.location) params.search = filters.location;

      // Convert Lakhs to raw Rupees for the database
      if (filters.minPrice !== undefined && filters.minPrice !== '') {
        params.minPrice = Number(filters.minPrice) * 100000;
      }
      if (filters.maxPrice !== undefined && filters.maxPrice !== '') {
        params.maxPrice = Number(filters.maxPrice) * 100000;
      }

      if (filters.propertyType && filters.propertyType.length > 0) {
        params.propertyType = filters.propertyType;
      }
      if (filters.bedrooms && filters.bedrooms > 0) params.bedrooms = filters.bedrooms;
      if (filters.bathrooms && filters.bathrooms > 0) params.bathrooms = filters.bathrooms;
      if (filters.facing) params.facing = filters.facing;
      if (filters.amenities && filters.amenities.length > 0) params.amenities = filters.amenities;

      const { data } = await propertiesAPI.getAll(params, { signal: abortControllerRef.current.signal });

      if (data.success && data.property) {
        setProperties(prev => isLoadMore ? [...prev, ...data.property] : data.property);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalProperties(data.pagination?.totalProperties || 0);
        setPage(pageNum);
      }
    } catch (err: any) {
      if (err.name === 'CanceledError') {
        console.log('Request aborted due to new search instance.');
        return;
      }
      console.error('Failed to fetch properties:', err);
      setError('Failed to load properties. Please try again later.');
    } finally {
      if (!isLoadMore) setLoading(false);
      setLoadingMore(false);
    }
  };

  const observer = React.useRef<IntersectionObserver | null>(null);
  const lastElementRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && page < totalPages) {
          handleLoadMore();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loadingMore, page, totalPages]
  );

  const propertiesRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (filters.location && filters.location.length > 0 && filters.location.length < 2) {
      return;
    }

    // Instead of setProperties([]), we keep them visible to maintain height
    setPage(1);

    // Smooth scroll to top of properties section with offset for sticky header
    if (propertiesRef.current) {
      const yOffset = -100;
      const y = propertiesRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;

      // Only scroll if we are already scrolled down
      if (window.scrollY > y || Math.abs(window.scrollY - y) > 50) {
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }

    const timer = setTimeout(() => {
      fetchProperties(1, false);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    // Scroll handling or other side effects if needed when filters shown
  }, [mobileFilterOpen]);

  const handleSearch = (term: string) => {
    setLocationSearch(term);
    setFilters(prev => ({ ...prev, location: term }));

    if (term) {
      searchParams.set('search', term);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams, { replace: true });
  };

  const handleFilterChange = React.useCallback((newFilters: any) => {
    setFilters(prev => ({ ...newFilters, location: prev.location }));
  }, []);

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  const handleViewChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      fetchProperties(page + 1, true);
    }
  };

  return (
    <div className="bg-[#f8fdff] min-h-screen overflow-x-hidden relative">
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 flex flex-col lg:flex-row items-start gap-8 py-0 lg:py-8">
        {/* Main Content (Now Full Width) */}
        <div className="flex-1 min-w-0 pb-20" ref={propertiesRef}>
          <PropertiesHeader
            total={totalProperties}
            viewMode={viewMode}
            onViewModeChange={handleViewChange}
            onSortChange={handleSortChange}
            onMobileFilterOpen={() => setMobileFilterOpen(true)}
            onSearch={handleSearch}
            searchValue={locationSearch}
            isFilterOpen={mobileFilterOpen}
          />

          <div className={`min-h-[600px] relative transition-opacity duration-300 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
            {loading && !properties.length && <LoadingState message="Loading properties..." />}

            {error && !loading && (
              <div className="flex items-center justify-center py-24">
                <div className="text-center px-4">
                  <span className="material-icons text-4xl text-black mb-4">error_outline</span>
                  <p className="font-red-hat text-[#374151] mb-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-[#3B5B84] text-white font-red-hat font-bold px-8 py-3 rounded-xl hover:bg-[#1F3A5F] transition-all shadow-lg"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && properties.length === 0 && (
              <div className="flex items-center justify-center py-24">
                <div className="text-center px-4">
                  <span className="material-icons text-4xl text-[#9CA3AF] mb-4">search_off</span>
                  <p className="font-fraunces text-2xl text-[#1F2937] mb-2 font-bold">No properties found</p>
                  <p className="font-red-hat text-sm text-[#4B5563]">Try adjusting your search or filters to find what you're looking for.</p>
                </div>
              </div>
            )}

            {!error && properties.length > 0 && (
              <div className="flex flex-col mb-12">
                <PropertiesGrid properties={properties} viewMode={viewMode} />

                {page < totalPages && (
                  <div ref={lastElementRef} className="flex justify-center mt-8 mb-4 h-10">
                    {loadingMore && <span className="font-red-hat text-[var(--gold-400)] font-bold tracking-widest uppercase">Loading additional properties...</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {/* Sticky Bottom Filter Button for All Screens */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full px-8 pointer-events-none">
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="pointer-events-auto bg-[#3B5B84] text-white px-7 py-3.5 rounded-full font-red-hat text-xs font-bold uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 mx-auto border border-white/10 backdrop-blur-md active:scale-95 hover:scale-105 transition-all w-fit group"
        >
          <div className="relative group/icon">
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-[#38BDF8]/40 blur-md rounded-full group-hover:blur-lg transition-all duration-500" />
            
            <span className="relative w-7 h-7 flex items-center justify-center bg-gradient-to-br from-[#E1C288] via-[#38BDF8] to-[#0EA5E9] rounded-full border border-white/20 shadow-inner group-hover:rotate-[360deg] transition-transform duration-1000 ease-in-out overflow-hidden">
              <span className="material-icons text-[14px] text-white drop-shadow-md">tune</span>
              
              {/* Shine Sweep Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            </span>
          </div>
          Filter Results
        </button>
      </div>

      {/* Left Side Sliding Drawer */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 z-[110] bg-[#1C1B1A]/60 backdrop-blur-sm"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[120] w-[85vw] max-w-[380px] bg-white shadow-3xl flex flex-col"
            >
              <div className="flex items-center justify-between p-7 border-b border-[#E6E0DA]">
                <div>
                  <h2 className="font-fraunces text-3xl font-bold text-[#1F3A5F]">Discovery</h2>
                  <p className="font-red-hat text-[11px] text-[var(--gold-400)] uppercase tracking-widest font-bold">Refine Listings</p>
                </div>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#FAF8F4] text-[#1F3A5F] border border-[#E6E0DA] hover:bg-[#1F3A5F] hover:text-white active:scale-90 transition-all shadow-sm"
                >
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
                <FilterSidebar onFilterChange={handleFilterChange} filters={filters} isOpen={true} />
              </div>
              <div className="p-8 border-t border-[#E6E0DA] bg-[#FAF8F4]">
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full bg-[#1F3A5F] text-white py-5 rounded-2xl font-red-hat text-sm font-bold uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-[#1F3A5F]/20 hover:bg-[#14263D]"
                >
                  Show Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PropertiesPage;
