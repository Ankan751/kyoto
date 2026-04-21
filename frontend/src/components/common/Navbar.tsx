import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, Home, Building, Info, MessageCircle, Phone, Sparkles } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navLinks = [
    { title: 'Home', path: '/', icon: Home },
    { title: 'Properties', path: '/properties', icon: Building },
    { title: 'About Us', path: '/about', icon: Info },
    { title: 'Contact', path: '/contact', icon: Phone },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg h-[65px]' : 'bg-white h-[81px]'
      }`}>
      <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-8 flex items-center justify-between relative">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 h-full py-0 lg:static absolute left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0"
        >
          <img
            src="https://res.cloudinary.com/diidko3fa/image/upload/f_webp,q_auto/v1776714352/WhatsApp_Image_2026-04-19_at_8.58.17_PM-Photoroom_hpuhgx.png"
            alt="Hanumant Properties Logo"
            className="h-full w-auto object-contain py-1"
          />
          <span className="font-playfair font-medium text-2xl sm:text-3xl text-[#C5A059] hidden lg:block tracking-wide">
            Hanumant Properties
          </span>      </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.title}
              to={link.path}
              className={`font-red-hat text-sm font-bold uppercase tracking-widest transition-all duration-300 relative py-1 ${location.pathname === link.path
                ? 'text-black'
                : 'text-[#1F2937] hover:text-black'
                }`}
            >
              {link.title}
              {location.pathname === link.path && (
                <motion.div
                  layoutId="navUnderline"
                  className="absolute bottom-0 left-0 w-full h-[2px] bg-[#C5A059]"
                />
              )}
            </Link>
          ))}
          <Link
            to="/properties"
            className="bg-black text-white font-red-hat text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-lg hover:bg-[#B89345] transition-all duration-300 shadow-md"
          >
            Explore Listings
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden w-10 h-10 flex items-center justify-center text-[#C5A059]"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 w-full h-screen bg-white z-[90] lg:hidden flex flex-col items-center justify-center p-8 text-center"
          >
            {/* Close Button Inside Menu */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-[#C5A059]"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="space-y-8 w-full">
              {navLinks.map((link) => (
                <Link
                  key={link.title}
                  to={link.path}
                  className="flex items-center justify-center gap-4 group"
                >
                  <link.icon className="w-5 h-5 text-[#C5A059]" />
                  <span className="font-fraunces text-3xl font-bold text-[#C5A059] hover:text-[#C5A059] transition-colors">{link.title}</span>
                </Link>
              ))}
              <div className="pt-12">
                <Link
                  to="/properties"
                  className="block w-full bg-[#C5A059] text-[#1C1B1A] font-red-hat text-sm font-bold uppercase tracking-widest py-5 rounded-2xl shadow-xl"
                >
                  View All listings
                </Link>
              </div>
            </div>

            {/* Contact Support */}
            <div className="absolute bottom-12 text-center w-full">
              <p className="font-red-hat text-xs text-gray-500 uppercase tracking-widest mb-2 opacity-60">Need Assistance?</p>
              <p className="font-fraunces text-xl font-bold text-[#C5A059]">78190-81887</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
