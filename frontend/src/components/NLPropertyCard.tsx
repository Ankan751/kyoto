import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Maximize, TrendingUp } from 'lucide-react';

interface NLPropertyCardProps {
  property: {
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
    scoreDetails?: {
      priceScore: number;
      bhkScore: number;
      amenitiesScore: number;
      typeScore: number;
      isWithinBudget: boolean;
      matchesBHK: boolean;
      amenitiesSpecified?: boolean;
    };
  };
  rank: number;
}

const formatPrice = (price: number): string => {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
};

const NLPropertyCard: React.FC<NLPropertyCardProps> = ({ property, rank }) => {
  const matchPercent = Math.round((property.score || 0) * 100);
  const beds = property.bhk || property.beds || 0;

  return (
    <Link
      to={`/property/${property._id}`}
      className="group block bg-white rounded-2xl border border-[#E8E2DA] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={property.image?.[0] || '/placeholder.jpg'}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />

        {/* Match Score Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-2.5 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-bold rounded-full">
            #{rank}
          </span>
          <span className={`px-2.5 py-1 backdrop-blur-sm text-xs font-bold rounded-full flex items-center gap-1 ${
            matchPercent >= 80 ? 'bg-emerald-500/90 text-white' :
            matchPercent >= 60 ? 'bg-amber-500/90 text-white' :
            'bg-orange-500/90 text-white'
          }`}>
            <TrendingUp className="w-3 h-3" />
            {matchPercent}% Match
          </span>
        </div>

        {/* Type Badge */}
        {property.type && (
          <span className="absolute top-3 right-3 px-2.5 py-1 bg-[#C5A059]/90 backdrop-blur-sm text-white text-xs font-bold rounded-full uppercase tracking-wider">
            {property.type}
          </span>
        )}

        {/* Price */}
        <div className="absolute bottom-3 left-3">
          <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm text-[#1C1B1A] text-sm font-bold rounded-xl shadow-sm">
            {formatPrice(property.price)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-[#1C1B1A] text-base mb-1.5 line-clamp-1 group-hover:text-[#C5A059] transition-colors">
          {property.title}
        </h3>

        <div className="flex items-center gap-1 text-[#6B7280] text-sm mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{property.location}{property.city ? `, ${property.city}` : ''}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-[#6B7280]">
          {beds > 0 && (
            <div className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" />
              <span>{beds} BHK</span>
            </div>
          )}
          {(property.baths ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />
              <span>{property.baths}</span>
            </div>
          )}
          {(property.sqft ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <Maximize className="w-3.5 h-3.5" />
              <span>{property.sqft?.toLocaleString()} sqft</span>
            </div>
          )}
        </div>

        {/* Score Breakdown */}
        {property.scoreDetails && (
          <div className="mt-3 pt-3 border-t border-[#F0ECE6]">
            <div className="flex gap-2 flex-wrap">
              {property.scoreDetails.isWithinBudget && (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
                  Within Budget
                </span>
              )}
              {property.scoreDetails.matchesBHK && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
                  Exact BHK
                </span>
              )}
              {property.scoreDetails.amenitiesSpecified && property.scoreDetails.amenitiesScore > 0.7 && (
                <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
                  Amenities Match
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default NLPropertyCard;
