import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, MapPin, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<'traditional' | 'ai'>('ai');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      if (searchMode === 'ai') {
        navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      } else {
        navigate(`/properties?search=${encodeURIComponent(searchTerm.trim())}`);
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.25,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const suggestions = {
    traditional: ['Jalandhar', 'Ludhiana', 'Plot', 'Villa'],
    ai: ['3 BHK under 50 Lakhs', 'Villa near Bus Stand', 'House in Model Town', 'Plot for investment'],
  };

  return (
    <section className="relative w-full h-[85vh] sm:h-[90vh] lg:h-[100vh] overflow-hidden bg-[#1F3A5F]">

      {/* LAYER 1: Background Image (Buildings & Sky) */}
      <div className="absolute inset-0 w-full h-full z-0">
        <img
          src="https://res.cloudinary.com/diidko3fa/image/upload/q_auto/f_auto/v1776629396/Gemini_Generated_Image_bncobnbncobnbnco_ivcdgz.png"
          alt="Hanumant Properties Luxury Real Estate"
          className="w-full h-full object-cover object-center scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1F3A5F]/60 via-[#1F3A5F]/20 to-transparent" />
      </div>

      {/* LAYER 2: Animated Text (Behind the Statue) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-8 mt-[calc(-45vh-30px)] sm:mt-[-10vh] z-10 pointer-events-none">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-12 sm:mb-16 w-full flex flex-col items-center"
        >
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-8 bg-white/80" />
            <span className="font-red-hat text-white text-[10px] sm:text-xs font-bold uppercase tracking-[4px] drop-shadow-md">
              Curated Real Estate
            </span>
            <div className="h-px w-8 bg-white/80" />
          </motion.div>

          <motion.h1 className="font-fraunces font-bold text-[16vw] lg:mb-32 mb-[-60px] sm:text-[14vw] lg:text-[12vw] text-white/95 uppercase leading-[0.85] tracking-tight drop-shadow-2xl flex flex-col items-center w-full">
            <motion.span variants={itemVariants} className="block mb-3">
              HANUMANT
            </motion.span>
            <motion.span variants={itemVariants} className="block ">
              PROPERTIES
            </motion.span>
          </motion.h1>
        </motion.div>
      </div>

      {/* LAYER 3: Foreground Statue (FIXED SCALE) */}
      <div className="absolute inset-0 w-full h-full z-20 pointer-events-none">
        <img
          src="https://res.cloudinary.com/diidko3fa/image/upload/f_webp,q_auto/v1776630316/Gemini_Generated_Image_5xpy8y5xpy8y5xpy-Photoroom_na4dxw.png"
          alt="Lord Hanuman Statue"
          className="w-full h-full object-cover object-center scale-105 drop-shadow-2xl"
        />
      </div>

      {/* LAYER 4: Interactive UI (Search Bar) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-8 mt-[5vh] z-30 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="w-full max-w-2xl relative mt-[35vh] sm:mt-[40vh] pointer-events-auto"
        >
          {/* Search Mode Tabs */}
          <div className="flex items-center gap-2 mb-4 ml-2">
            <button
              onClick={() => { setSearchMode('traditional'); setSearchTerm(''); }}
              className={cn(
                "px-6 py-2.5 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all glass-effect flex items-center gap-2",
                searchMode === 'traditional'
                  ? "bg-white text-[#1F3A5F] shadow-[0_-4px_20px_rgba(255,255,255,0.2)]"
                  : "bg-black/40 text-white/60 hover:text-white"
              )}
            >
              <MapPin className={cn("w-3 h-3", searchMode === 'traditional' ? "text-[#C5A059]" : "text-white/40")} />
              Standard
            </button>
            <button
              onClick={() => { setSearchMode('ai'); setSearchTerm(''); }}
              className={cn(
                "px-6 py-2.5 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all glass-effect flex items-center gap-2 relative overflow-hidden group",
                searchMode === 'ai'
                  ? "bg-white text-[#1F3A5F] shadow-[0_-4px_20px_rgba(197,160,89,0.3)]"
                  : "bg-black/40 text-white/60 hover:text-white grayscale"
              )}
            >
              {searchMode === 'ai' && (
                <motion.div
                  layoutId="ai-glow"
                  className="absolute inset-0 bg-gradient-to-r from-[#C5A059]/10 via-transparent to-[#C5A059]/10"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                />
              )}
              <Sparkles className={cn("w-3 h-3", searchMode === 'ai' ? "text-[#C5A059]" : "text-white/40")} />
              AI Finder
              <span className="ml-1 px-1 py-0.5 bg-[#C5A059] text-white text-[7px] rounded-sm font-bold flex items-center">
                BETA
              </span>
            </button>
          </div>

          {/* Search Form */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {searchMode === 'ai' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="absolute -inset-1 blur-xl bg-gradient-to-r from-[#C5A059]/40 via-[#B89345]/20 to-[#C5A059]/40 rounded-2xl z-[-1]"
                />
              )}
            </AnimatePresence>

            <form
              onSubmit={handleSearch}
              className={cn(
                "group relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white/20 backdrop-blur-xl border p-2 rounded-2xl shadow-3xl transition-all duration-500",
                searchMode === 'ai' ? "border-[#C5A059]/50 shadow-[#C5A059]/10" : "border-white/30 hover:border-white/50"
              )}
            >
              <div className="flex-1 flex items-center gap-4 px-4 sm:px-6">
                {searchMode === 'traditional' ? (
                  <Search className="w-5 h-5 text-white/90 group-focus-within:text-white transition-colors" />
                ) : (
                  <Zap className="w-5 h-5 text-[#C5A059] animate-pulse" />
                )}
                <input
                  type="text"
                  placeholder={searchMode === 'traditional'
                    ? "Search city, project name, or property type..."
                    : "Describe your dream home (e.g. '3 BHK near the temple under 1 Cr')..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-none py-4 sm:py-5 font-red-hat text-sm sm:text-base text-white placeholder:text-white/70 focus:outline-none focus:ring-0"
                />
              </div>
              <button
                type="submit"
                className={cn(
                  "font-red-hat text-[10px] sm:text-xs font-black uppercase tracking-widest px-5 sm:px-9 py-2.5 sm:py-3.5 rounded-xl transition-all duration-500 shadow-xl active:scale-95 flex items-center justify-center gap-2 mt-3 sm:mt-0",
                  searchMode === 'ai'
                    ? "bg-white text-[#1F3A5F] hover:bg-[#FAF8F4]"
                    : "bg-white text-[#1F3A5F] hover:bg-[#FAF8F4]"
                )}
              >
                {searchMode === 'ai' && <Sparkles className="w-3.5 h-3.5" />}
                {searchMode === 'ai' ? 'Magic Search' : 'Discover'}
              </button>
            </form>
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <p className="font-red-hat text-[9px] text-[#C5A059] font-black uppercase tracking-[3px] mr-2 drop-shadow-md">
              Try This:
            </p>
            {suggestions[searchMode].map(item => (
              <button
                key={item}
                onClick={() => { setSearchTerm(item); }}
                className="font-red-hat text-[10px] text-white hover:text-[#1C1B1A] bg-white/5 hover:bg-white px-5 py-2 rounded-full border border-white/20 transition-all font-bold backdrop-blur-md shadow-lg"
              >
                {item}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Floating Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 z-30 pointer-events-none"
      >
        <div className="w-[1px] h-14 bg-[#C5A059]" />
        <span className="font-red-hat text-[8px] text-[#C5A059] font-black uppercase tracking-[5px] rotate-90 translate-y-10">
          Scroll
        </span>
      </motion.div>

    </section>
  );
};

export default HeroSection;