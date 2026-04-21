import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Search, Sparkles, Loader2, ArrowRight, Building2, Brain, Zap } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import NLPropertyCard from '../components/NLPropertyCard';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const EXAMPLE_QUERIES = [
  "3 BHK flat in Model Town under 50 lakh",
  "2 BHK near bus stand with parking",
  "Villa in Urban Estate with garden",
  "Affordable house in Jalandhar under 30 lakh",
];

interface SearchResult {
  _id: string;
  title: string;
  location: string;
  city?: string;
  price: number;
  image: string[];
  beds?: number;
  bhk?: number;
  baths?: number;
  sqft?: number;
  type?: string;
  score?: number;
  scoreDetails?: any;
}

const NLSearch: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [parsedQuery, setParsedQuery] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      handleSearch(q);
    }
  }, []);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const response = await axios.post(`${API_BASE}/api/nl/search`, { query: q });
      if (response.data.success) {
        setResults(response.data.results || []);
        setParsedQuery(response.data.parsed || null);
      } else {
        setError(response.data.message || 'Search failed');
        setResults([]);
      }
    } catch (err: any) {
      console.error('NL Search error:', err);
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative pt-12 pb-16 px-4 overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0" style={{ 
            background: 'linear-gradient(135deg, #f8f5f0 0%, #e8e2d9 50%, #d6ccc2 100%)' 
          }} />
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 30% 20%, #8b6f47 0%, transparent 50%), radial-gradient(circle at 70% 80%, #8b6f47 0%, transparent 50%)'
          }} />

          <div className="relative max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#8b6f47]/10 border border-[#8b6f47]/20 rounded-full mb-6"
            >
              <Brain className="w-4 h-4 text-[#8b6f47]" />
              <span className="text-sm font-medium text-[#8b6f47]">Powered by AI</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1C1B1A] mb-4 font-playfair"
            >
              Find Your Dream Property
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-[#5A5856] mb-10 max-w-2xl mx-auto"
            >
              Describe what you're looking for in plain English — our AI will understand and find the best matches.
            </motion.p>

            {/* Search Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSubmit}
              className="relative max-w-3xl mx-auto"
            >
              <div className="relative flex items-center bg-white rounded-2xl shadow-2xl shadow-black/5 border border-[#8b6f47]/20 overflow-hidden">
                <Sparkles className="absolute left-5 w-5 h-5 text-[#8b6f47]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Try: "3 BHK in Model Town under 50 lakh"'
                  className="w-full py-5 pl-14 pr-36 text-base text-[#1C1B1A] placeholder-[#9CA3AF] focus:outline-none bg-transparent"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="absolute right-2.5 flex items-center gap-2 px-6 py-3 bg-[#1C1B1A] hover:bg-[#8b6f47] text-white text-sm font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Search
                    </>
                  )}
                </button>
              </div>
            </motion.form>

            {/* Example Queries */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 flex flex-wrap justify-center gap-2"
            >
              {EXAMPLE_QUERIES.map((eq, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(eq); handleSearch(eq); }}
                  className="px-3.5 py-1.5 bg-[#8b6f47]/5 hover:bg-[#8b6f47]/10 text-[#8b6f47]/70 hover:text-[#8b6f47] text-xs rounded-full transition-all border border-[#8b6f47]/10 hover:border-[#8b6f47]/20"
                >
                  {eq}
                </button>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features - shown only before search */}
        {!searched && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-5xl mx-auto px-4 py-16"
          >
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Brain,
                  title: "Natural Language",
                  description: "Search in plain English. No need for filters — just describe what you want."
                },
                {
                  icon: Zap,
                  title: "Smart Matching",
                  description: "AI scores each property on price, location, BHK, and amenities to find the best fit."
                },
                {
                  icon: Building2,
                  title: "Locality Expansion",
                  description: "Suggest properties in nearby areas you may not have considered."
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-[#E8E2DA] text-center">
                  <div className="w-12 h-12 bg-[#8b6f47]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-[#8b6f47]" />
                  </div>
                  <h3 className="font-bold text-[#1C1B1A] mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#6B7280]">{feature.description}</p>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Results Section */}
        {searched && (
          <section className="max-w-6xl mx-auto px-4 py-10">
            {/* Parsed Query Info */}
            {parsedQuery && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-[#8b6f47]/5 border border-[#8b6f47]/15 rounded-xl"
              >
                <p className="text-sm text-[#5A5856]">
                  <span className="font-bold text-[#8b6f47]">AI understood: </span>
                  {parsedQuery.city && <span>City: <strong>{parsedQuery.city}</strong> · </span>}
                  {parsedQuery.locality && <span>Area: <strong>{parsedQuery.locality}</strong> · </span>}
                  {parsedQuery.bhk?.preferred && <span>BHK: <strong>{parsedQuery.bhk.preferred.join(', ')}</strong> · </span>}
                  {parsedQuery.budget?.max && <span>Budget: <strong>Up to ₹{(parsedQuery.budget.max / 100000).toFixed(0)}L</strong></span>}
                </p>
              </motion.div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-[#E8E2DA] rounded-full" />
                  <div className="absolute inset-0 w-16 h-16 border-4 border-[#8b6f47] border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="mt-6 text-[#6B7280] font-medium">AI is analyzing your query...</p>
                <p className="text-sm text-[#9CA3AF] mt-1">This may take a few seconds</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <p className="text-[#1C1B1A] font-bold text-lg mb-2">Search Error</p>
                <p className="text-[#6B7280] max-w-md mx-auto">{error}</p>
              </motion.div>
            )}

            {/* Results Grid */}
            {!loading && !error && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#1C1B1A]">
                    {results.length} {results.length === 1 ? 'Match' : 'Matches'} Found
                  </h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <AnimatePresence>
                    {results.map((property, index) => (
                      <motion.div
                        key={property._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                      >
                        <NLPropertyCard property={property} rank={index + 1} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* No Results */}
            {!loading && !error && results.length === 0 && searched && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 bg-[#F5F0EA] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-[#9CA3AF]" />
                </div>
                <p className="text-[#1C1B1A] font-bold text-lg mb-2">No matching properties found</p>
                <p className="text-[#6B7280] max-w-md mx-auto">
                  Try broadening your search — for example, increase your budget or consider nearby areas.
                </p>
              </motion.div>
            )}
          </section>
        )}
      </div>
      <Footer />
    </>
  );
};

export default NLSearch;
