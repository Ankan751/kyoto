import React from 'react';
import { motion } from 'framer-motion';
import { Award, Feather, Users, MapPin, ShieldCheck, Building2, HardHat, Star } from 'lucide-react';
import { cn } from '../../lib/utils';

const WhyChooseSection: React.FC = () => {
  const reasons = [
    {
      icon: Building2,
      title: "PREMIUM PLOTS",
      description: "Exclusive plots available for residential, commercial, and rental investment purposes in prime sectors."
    },
    {
      icon: HardHat,
      title: "CONSTRUCTION EXPERTISE",
      description: "Expertise in providing construction-ready land and technical guidance for all types of development projects."
    },
    {
      icon: Users,
      title: "100+ SATISFIED CLIENTS",
      description: "A strong reputation built on quality and reliability, successfully serving over 100 satisfied clients with transparency."
    },
    {
      icon: Star,
      title: "ELITE TRUST",
      description: "Trusted by high-profile and celebrity clients who demand the highest standards of privacy and professionalism."
    },
    {
      icon: Award,
      title: "END-TO-END SUPPORT",
      description: "Comprehensive guidance including construction services, project management, and legal support from start to finish."
    },
    {
      icon: MapPin,
      title: "PRIME LOCATIONS",
      description: "Strategic focus on prime locations in Dehradun with the highest potential for value appreciation and luxury living."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section className="bg-transparent py-24 border-t border-[#E5E5E5]/50">
      <div className="max-w-[1280px] mx-auto px-8">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20 max-w-3xl mx-auto"
        >
          <p className="font-red-hat text-xs uppercase tracking-[4px] text-[#C5A059] mb-4 font-bold">
            Hanumant Properties
          </p>
          <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1F3A5F] mb-6"> Building Your Vision with Confidence </h2>
          <div className="w-12 h-[2px] bg-[#C5A059] mx-auto mb-8" />
          <p className="font-red-hat text-base text-[#4B5563] leading-relaxed">
            Hanumant Properties is a trusted Dehradun-based real estate firm specializing in premium construction land and end-to-end property solutions. With a strong reputation built on quality and reliability, we cater to a wide range of needs—from residential homes to high-return commercial investments.
          </p>
        </motion.div>

        {/* Reasons Grid - 2 columns on mobile */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-12"
        >
          {reasons.map((item, index) => (
            <motion.div 
              variants={itemVariants} 
              key={index} 
              className={cn(
                "flex flex-col items-start text-left group cursor-pointer p-4 sm:p-8 rounded-2xl sm:rounded-3xl transition-all duration-500 border border-[#1F3A5F]/5 bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-[0_20px_50px_rgba(31,58,95,0.08)] hover:-translate-y-2",
                index % 2 === 1 ? "lg:translate-y-8" : ""
              )}
            >
              {/* Icon Container */}
              <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center mb-4 sm:mb-8 group-hover:bg-[#C5A059] group-hover:border-[#C5A059] transition-all duration-500 shadow-sm">
                <item.icon className="w-5 h-5 sm:w-7 sm:h-7 text-[#C5A059] group-hover:text-white transition-colors duration-500" strokeWidth={1.5} />
              </div>

              {/* Title */}
              <div className="relative mb-2 sm:mb-4">
                <h3 className="font-red-hat font-bold text-[10px] sm:text-base text-[#1F3A5F] sm:tracking-[2px] uppercase">
                  {item.title}
                </h3>
                <div className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#C5A059] transition-all duration-500 group-hover:w-full" />
              </div>

              {/* Description */}
              <p className="font-red-hat font-medium text-[9px] sm:text-sm text-[#4B5563] leading-tight sm:leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Section Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-20 text-center max-w-2xl mx-auto"
        >
          <p className="font-cormorant italic text-2xl text-[#1F3A5F] leading-relaxed">
            "At Hanumant Properties, we don’t just sell land—we help you build your vision with confidence and long-term value."
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
