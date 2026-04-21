import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { appointmentsAPI } from '../../services/api';
import { toast } from 'sonner';

interface ConsultationSectionProps {
  defaultPropertyId?: string;
}

const ConsultationSection: React.FC<ConsultationSectionProps> = ({ defaultPropertyId }) => {
  const [bookingData, setBookingData] = useState({
    fullName: '',
    email: '',
    phone: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleBookingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value
    });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      await appointmentsAPI.schedule({
        propertyId: defaultPropertyId || 'general',
        name: bookingData.fullName,
        email: bookingData.email,
        phone: bookingData.phone,
        message: 'General consultation request from the home page.',
        description: bookingData.description,
      });

      toast.success('Consultation Request Submitted!', {
        description: "We'll contact you shortly to schedule your call."
      });
      setBookingData({ fullName: '', email: '', phone: '', description: '' });
    } catch (err: any) {
      console.error('Failed to schedule consultation:', err);
      toast.error('Submission Failed', {
        description: err.response?.data?.message || 'Please try again later.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="consultation-section" className="w-full flex flex-col lg:flex-row mt-12">
      {/* Left Side Images */}
      <div className="lg:w-1/2 relative bg-gray-100 min-h-full">
        <div className="absolute inset-0">
          <img
            src="https://res.cloudinary.com/diidko3fa/image/upload/q_auto/f_auto/v1776632686/pexels-maksym-tymchyk-73327789-8554798_tqrgki.jpg"
            className="w-full h-full object-cover opacity-80"
            alt="House top"
          />

        </div>
        <div className="absolute bottom-6 right-6 flex gap-4">
          <button className="w-10 h-10 rounded-full border border-white flex items-center justify-center text-white backdrop-blur-sm bg-black/20 hover:bg-[#38BDF8] hover:border-[#38BDF8] transition-all duration-300">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-full border border-white flex items-center justify-center text-white backdrop-blur-sm bg-black/20 hover:bg-[#38BDF8] hover:border-[#38BDF8] transition-all duration-300">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right Side Form */}
      <div className="lg:w-1/2 bg-[#1F3A5F] text-white px-8 sm:px-16 py-16 flex flex-col justify-center">
        <h2 className="font-fraunces font-bold text-white text-3xl sm:text-4xl lg:text-5xl mb-12 tracking-tight leading-tight">
          Still haven't found what you're looking for?
        </h2>
        <form onSubmit={handleBookingSubmit} className="space-y-6">
          <div>
            <label className="block font-manrope  font-bold text-xs uppercase tracking-widest mb-2 opacity-100 text-white">Full Name</label>
            <input
              type="text"
              name="fullName"
              required
              value={bookingData.fullName}
              onChange={handleBookingInputChange}
              placeholder="Enter your full name"
              className="w-full bg-[#14263D] border border-white/10 rounded-lg p-4 font-red-hat text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-black outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block font-manrope  font-bold text-xs uppercase tracking-widest mb-2 opacity-100 text-white">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={bookingData.email}
                onChange={handleBookingInputChange}
                placeholder="your.email@example.com"
                className="w-full bg-[#14263D] border border-white/10 rounded-lg p-4 font-red-hat text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-black outline-none transition-all"
              />
            </div>
            <div>
              <label className="block font-manrope  font-bold text-xs uppercase tracking-widest mb-2 opacity-100 text-white">Phone Number</label>
              <input
                type="tel"
                name="phone"
                required
                value={bookingData.phone}
                onChange={handleBookingInputChange}
                placeholder="+91 98765 43210"
                className="w-full bg-[#14263D] border border-white/10 rounded-lg p-4 font-red-hat text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-black outline-none transition-all"
              />
            </div>
          </div>

          <div>
             <label className="flex items-center gap-1.5 font-manrope font-bold text-xs uppercase tracking-widest mb-2 text-white">
               Your Requirements
               <span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-400 rounded text-[10px] border border-sky-400/20">AI</span>
             </label>
             <textarea
               name="description"
               value={bookingData.description}
               onChange={handleBookingInputChange}
               placeholder="Tell us exactly what you're looking for (e.g., 3 BHK Villa in Model Town under 50 Lakh)..."
               rows={3}
               className="w-full bg-[#14263D] border border-white/10 rounded-lg p-4 font-red-hat text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-black outline-none transition-all resize-none shadow-inner"
             ></textarea>
           </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-black text-white font-manrope font-bold py-4 px-10 rounded-lg hover:bg-[#0EA5E9] transition-colors inline-block uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Requesting...' : 'Request a Call'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConsultationSection;
