import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, User, Home, Check, X, Loader2,
  Search, Link as LinkIcon, Send, Phone, Mail,
  Clock, Building2, RefreshCw, ChevronDown, ChevronUp, TrendingUp, Sparkles, Star, Target
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "../services/apiClient";
import { cn, formatDate } from "../lib/utils";

const STATUS_CONFIG = {
  pending:   { label: "Pending",   cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  confirmed: { label: "Confirmed", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-700 border border-red-200" },
  completed: { label: "Completed", cls: "bg-blue-50 text-blue-700 border border-blue-200" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: "bg-gray-100 text-gray-700" };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", cfg.cls)}>
      {cfg.label}
    </span>
  );
};

// --- Lead Match Components ---

const MatchScoreBadge = ({ score }) => {
  const percentage = Math.round(score * 100);
  const isHighPriority = percentage >= 70;
  
  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className={cn(
        "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1",
        isHighPriority ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-600 border border-gray-200"
      )}>
        <Target className="w-3 h-3" />
        Match: {percentage}%
      </div>
      {isHighPriority && (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-md text-[9px] font-bold animate-pulse">
          <TrendingUp className="w-2.5 h-2.5" />
          HIGH PRIORITY
        </div>
      )}
    </div>
  );
};

const AIRequirementsSummary = ({ requirements }) => {
  if (!requirements || Object.keys(requirements).length === 0) return null;

  const { city, locality, budget, bhk } = requirements;
  
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="bg-white/50 border border-[#E6D5C3]/30 rounded-xl p-3">
        <p className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter mb-1">Target Area</p>
        <p className="text-xs font-semibold text-[#1C1B1A]">
          {locality ? `${locality}, ${city}` : city || 'Anywhere'}
        </p>
      </div>
      <div className="bg-white/50 border border-[#E6D5C3]/30 rounded-xl p-3">
        <p className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter mb-1">Budget Upper Bound</p>
        <p className="text-xs font-semibold text-[#1C1B1A]">
          {budget?.max ? `₹${(budget.max / 100000).toFixed(0)}L` : 'Flexible'}
        </p>
      </div>
      <div className="bg-white/50 border border-[#E6D5C3]/30 rounded-xl p-3">
        <p className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter mb-1">BHK Preference</p>
        <p className="text-xs font-semibold text-[#1C1B1A]">
          {bhk?.preferred?.length > 0 ? `${bhk.preferred.join('/')} BHK` : 'Flexible'}
          {bhk?.flexible && <span className="ml-1 opacity-60 text-[10px]">(Flexible)</span>}
        </p>
      </div>
      <div className="bg-white/50 border border-[#E6D5C3]/30 rounded-xl p-3">
        <p className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter mb-1">Key Preferences</p>
        <div className="flex flex-wrap gap-1 mt-0.5">
          {requirements.derived_preferences?.transport_access && (
            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold">Transport</span>
          )}
          {requirements.derived_preferences?.school_nearby && (
            <span className="px-1.5 py-0.5 bg-green-50 text-green-600 rounded text-[9px] font-bold">Schools</span>
          )}
        </div>
      </div>
    </div>
  );
};

const SuggestedPitches = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-emerald-500" />
        <h4 className="text-xs font-bold text-[#1C1B1A] uppercase tracking-wide">Suggested Pitches</h4>
      </div>
      <div className="space-y-2">
        {suggestions.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-2.5 bg-white border border-[#E6D5C3] rounded-xl hover:border-[#C5A059] transition-colors group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#FAF8F4] flex items-center justify-center rounded-lg border border-[#E6D5C3]/50">
                <Home className="w-3.5 h-3.5 text-[#C5A059]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1C1B1A] group-hover:text-[#C5A059] transition-colors">{item.title}</p>
                <p className="text-[10px] text-[#9CA3AF]">Better match for their budget</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
                <Star className="w-2.5 h-2.5 fill-emerald-600" />
                {Math.round(item.matchScore * 100)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingMeetingLink, setEditingMeetingLink] = useState(null);
  const [meetingLink, setMeetingLink] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedInsights, setExpandedInsights] = useState({});

  const toggleInsights = (id) => {
    setExpandedInsights(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchAppointments = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await apiClient.get("/api/appointments/all");
      if (response.data.success) {
        const valid = response.data.appointments.filter((apt) => apt.propertyId);
        setAppointments(valid);
      } else {
        toast.error(response.data.message || "Failed to fetch appointments");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to fetch appointments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      setUpdatingId(appointmentId);
      const response = await apiClient.put("/api/appointments/status", {
        appointmentId,
        status: newStatus,
      });
      if (response.data.success) {
        toast.success(`Appointment ${newStatus}`);
        fetchAppointments(true);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Failed to update appointment status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMeetingLinkUpdate = async (appointmentId) => {
    if (!meetingLink) { toast.error("Please enter a meeting link"); return; }
    try {
      const response = await apiClient.put("/api/appointments/update-meeting", {
        appointmentId,
        meetingLink,
      });
      if (response.data.success) {
        toast.success("Meeting link sent successfully");
        setEditingMeetingLink(null);
        setMeetingLink("");
        fetchAppointments(true);
      } else {
        toast.error(response.data.message);
      }
    } catch {
      toast.error("Failed to update meeting link");
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const filteredAppointments = appointments.filter((apt) => {
    const name  = apt.clientName  || "";
    const email = apt.clientEmail || "";
    const prop  = apt.propertyId?.title || "";
    const matchSearch =
      !searchTerm ||
      prop.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === "all" || apt.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all:       appointments.length,
    pending:   appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
    completed: appointments.filter((a) => a.status === "completed").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-8 flex items-center justify-center bg-[#FAF8F4]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#5A5856] font-medium">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 pb-12 px-4 bg-[#FAF8F4]">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8 flex-wrap gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-[#1C1B1A] mb-1">Appointments</h1>
            <p className="text-[#5A5856] text-sm">Manage and track property viewing requests</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fetchAppointments(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E6D5C3] text-[#1C1B1A] rounded-xl text-sm font-medium hover:border-[#C5A059] hover:text-[#C5A059] transition-all shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </motion.button>
        </motion.div>

        {/* Filters + Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 border border-[#E6D5C3] shadow-sm mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-1 bg-[#FAF8F4] rounded-xl p-1 flex-wrap">
              {["all", "pending", "confirmed", "cancelled", "completed"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize",
                    filter === s
                      ? "bg-[#1C1B1A] text-[#FAF8F4] shadow-sm"
                      : "text-[#5A5856] hover:text-[#1C1B1A]"
                  )}
                >
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                  <span className={cn(
                    "ml-1.5 text-xs px-1.5 py-0.5 rounded-full",
                    filter === s ? "bg-white/20" : "bg-[#E6D5C3] text-[#5A5856]"
                  )}>
                    {counts[s]}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search property, name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#FAF8F4] border border-[#E6D5C3] rounded-xl text-sm text-[#1C1B1A] placeholder-[#9CA3AF] outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/15 transition-all"
              />
            </div>
          </div>
        </motion.div>

        {/* Cards Grid */}
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#F5F1E8] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-[#E6D5C3]" />
            </div>
            <h3 className="text-base font-semibold text-[#1C1B1A] mb-1">No appointments found</h3>
            <p className="text-sm text-[#9CA3AF]">
              {searchTerm || filter !== "all"
                ? "Try adjusting your search or filters"
                : "No viewing requests have been submitted yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredAppointments.map((apt, idx) => (
                <motion.div
                  key={apt._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-white rounded-2xl border border-[#E6D5C3] shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col h-fit"
                >
                  {/* Property Banner */}
                  <Link to={`/update/${apt.propertyId?._id}`} className="block bg-[#1C1B1A] px-5 py-4 flex items-start gap-3 group/prop hover:bg-[#1C1B1A]/90 transition-colors">
                    <div className="w-9 h-9 bg-[#C5A059] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/prop:scale-110 transition-transform">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#FAF8F4] truncate group-hover/prop:text-[#C5A059] transition-colors">
                        {apt.propertyId?.title || "Unknown Property"}
                      </p>
                      <p className="text-xs text-[#9CA3AF] truncate mt-0.5">
                        {apt.propertyId?.location || "—"}
                      </p>
                    </div>
                    <MatchScoreBadge score={apt.matchingScore} />
                  </Link>

                  {/* Status Strip */}
                  <div className="px-5 py-2 bg-[#FAF8F4] border-b border-[#E6D5C3]/30 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={cn("w-2 h-2 rounded-full", apt.status === 'confirmed' ? 'bg-emerald-500' : apt.status === 'pending' ? 'bg-amber-500' : 'bg-gray-400')} />
                      <span className="text-[10px] font-bold text-[#5A5856] uppercase tracking-wider">{apt.status}</span>
                    </div>
                    <span className="text-[10px] text-[#9CA3AF] font-medium">{formatDate(apt.createdAt)}</span>
                  </div>

                  {/* Client Info */}
                  <div className="px-5 py-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", apt.isGuest ? "bg-amber-50" : "bg-blue-50")}>
                        <User className={cn("w-4 h-4", apt.isGuest ? "text-amber-500" : "text-blue-500")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1C1B1A] truncate">{apt.clientName}</p>
                        {apt.isGuest && <span className="text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full font-bold uppercase">Guest</span>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <Mail className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        <a href={`mailto:${apt.clientEmail}`} className="text-xs text-[#C5A059] font-medium truncate">{apt.clientEmail}</a>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        <a href={`tel:${apt.clientPhone}`} className="text-xs text-[#1C1B1A] font-medium">{apt.clientPhone}</a>
                      </div>
                    </div>
                  </div>

                  {/* AI Insights Section */}
                  {apt.description && (
                    <div className="px-5 pb-4">
                      <div className="bg-[#FAF8F4] rounded-2xl border border-[#E6D5C3]/50 overflow-hidden">
                        <button 
                          onClick={() => toggleInsights(apt._id)}
                          className="w-full px-4 py-3 flex items-center justify-between text-left group"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span className="text-[10px] font-black text-[#1C1B1A] uppercase tracking-wider">AI Lead Analysis</span>
                          </div>
                          {expandedInsights[apt._id] ? <ChevronUp className="w-3.5 h-3.5 text-[#9CA3AF]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />}
                        </button>
                        
                        <AnimatePresence>
                          {expandedInsights[apt._id] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-4 pb-4 overflow-hidden"
                            >
                              <div className="mb-4">
                                <p className="text-[10px] font-bold text-[#9CA3AF] uppercase mb-2">Original Request</p>
                                <p className="text-xs text-[#5A5856] leading-relaxed bg-white/50 p-2.5 rounded-xl border border-[#E6D5C3]/20">"{apt.description}"</p>
                              </div>
                              
                              <p className="text-[10px] font-bold text-[#9CA3AF] uppercase mb-2">Needs (AI Parsed)</p>
                              <AIRequirementsSummary requirements={apt.aiRequirements} />
                              
                              <SuggestedPitches suggestions={apt.suggestedProperties} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* Meeting Link */}
                  <div className="px-5 py-3 border-t border-[#F5F1E8] mt-auto">
                    {editingMeetingLink === apt._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={meetingLink}
                          onChange={(e) => setMeetingLink(e.target.value)}
                          placeholder="Meeting link..."
                          className="flex-1 px-3 py-1.5 border border-[#E6D5C3] rounded-lg text-xs outline-none focus:border-[#C5A059]"
                        />
                        <button onClick={() => handleMeetingLinkUpdate(apt._id)} className="p-1.5 bg-[#C5A059] text-white rounded-lg"><Send className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        {apt.meetingLink ? (
                          <a href={apt.meetingLink} target="_blank" className="flex items-center gap-1 text-[10px] text-[#C5A059] font-bold uppercase tracking-wider"><LinkIcon className="w-3 h-3" /> Link Sent</a>
                        ) : (
                          <span className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider">No Link Set</span>
                        )}
                        {apt.status === "confirmed" && (
                          <button onClick={() => { setEditingMeetingLink(apt._id); setMeetingLink(apt.meetingLink || ""); }} className="text-[10px] text-[#C5A059] font-bold uppercase tracking-wider hover:underline">{apt.meetingLink ? "Edit" : "Add Link"}</button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="px-5 py-4 border-t border-[#F5F1E8] bg-[#FAF8F4]/30">
                    {apt.status === "pending" ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleStatusChange(apt._id, "confirmed")} className="flex-1 py-2 bg-[#1C1B1A] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#C5A059] transition-colors">Approve</button>
                        <button onClick={() => handleStatusChange(apt._id, "cancelled")} className="flex-1 py-2 bg-white border border-[#E6D5C3] text-[#5A5856] rounded-xl text-xs font-bold uppercase tracking-widest hover:border-red-200 hover:text-red-500 transition-colors">Reject</button>
                      </div>
                    ) : apt.status === "confirmed" ? (
                      <button onClick={() => handleStatusChange(apt._id, "completed")} className="w-full py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors">Mark Completed</button>
                    ) : (
                      <div className="w-full py-2 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center">{apt.status}</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
