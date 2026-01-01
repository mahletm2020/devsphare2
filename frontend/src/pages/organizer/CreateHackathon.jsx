import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHackathonStore } from '../../stores/hackathonStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import hackathonAPI from '../../api/hackathonAPI';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { 
  FiBriefcase, 
  FiDollarSign, 
  FiPackage, 
  FiMail, 
  FiPhone, 
  FiGift, 
  FiCalendar,
  FiUsers,
  FiMapPin,
  FiType,
  FiTag,
  FiUpload,
  FiX,
  FiPlus,
  FiAward,
  FiGlobe,
  FiClock,
  FiCheckCircle
} from 'react-icons/fi';

export default function CreateHackathon() {
  const navigate = useNavigate();
  const { createHackathon, isLoading } = useHackathonStore();
  const { organizations, fetchOrganizations } = useOrganizationStore();
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'online',
    location: '',
    status: 'draft',
    organization_id: '',
    max_team_size: 4,
    registration_start: '',
    registration_end: '',
    submission_start: '',
    submission_end: '',
    mentor_assignment_start: '',
    mentor_assignment_end: '',
    judging_start: '',
    judging_end: '',
    team_deadline: '',
    submission_deadline: '',
    judging_deadline: '',
    sponsor_status: 'none', // 'none' (No Need Sponsor) or 'need_sponsor' (Need Sponsor)
    sponsor_visibility: 'sponsors_only',
    sponsor_listing_expiry: '',
    sponsorship_type_preferred: '',
    sponsorship_amount_preferred: '',
    sponsorship_details: '',
    sponsor_benefits_offered: '',
    sponsor_requirements: '',
    sponsor_contact_email: '',
    sponsor_contact_phone: '',
  });
  const [categories, setCategories] = useState(['']);
  const [sponsorLogos, setSponsorLogos] = useState([]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCategoryChange = (index, value) => {
    const newCategories = [...categories];
    newCategories[index] = value;
    setCategories(newCategories);
  };

  const addCategory = () => {
    setCategories([...categories, '']);
  };

  const handleSponsorLogoChange = (e) => {
    const files = Array.from(e.target.files);
    setSponsorLogos(files);
  };

  const removeSponsorLogo = (index) => {
    const newLogos = [...sponsorLogos];
    newLogos.splice(index, 1);
    setSponsorLogos(newLogos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required timeline fields
      if (!form.registration_start || !form.registration_end || !form.submission_start || !form.submission_end || !form.mentor_assignment_start || !form.mentor_assignment_end || !form.judging_start || !form.judging_end) {
        toast.error('Please fill in all timeline fields');
        return;
      }
      
      // Validate timeline order
      const regStart = new Date(form.registration_start);
      const regEnd = new Date(form.registration_end);
      const submissionStart = new Date(form.submission_start);
      const submissionEnd = new Date(form.submission_end);
      const mentorStart = new Date(form.mentor_assignment_start);
      const mentorEnd = new Date(form.mentor_assignment_end);
      const judgeStart = new Date(form.judging_start);
      const judgeEnd = new Date(form.judging_end);
      
      if (regEnd <= regStart) {
        toast.error('Registration End must be after Registration Start');
        return;
      }
      
      if (submissionStart < regEnd) {
        toast.error('Submission Start must be after or equal to Registration End');
        return;
      }
      
      if (submissionEnd <= submissionStart) {
        toast.error('Submission End must be after Submission Start');
        return;
      }
      
      if (mentorStart < regEnd) {
        toast.error('Mentor Assignment Start must be after or equal to Registration End');
        return;
      }
      
      if (mentorEnd <= mentorStart) {
        toast.error('Mentor Assignment End must be after Mentor Assignment Start');
        return;
      }
      
      if (submissionEnd > judgeStart) {
        toast.error('Submission End must be before or equal to Judging Start');
        return;
      }
      
      if (mentorEnd > judgeStart) {
        toast.error('Mentor Assignment End must be before or equal to Judging Start');
        return;
      }
      
      if (judgeStart >= judgeEnd) {
        toast.error('Judging End must be after Judging Start');
        return;
      }

      // Determine sponsor status
      const needSponsor = form.sponsor_status === 'need_sponsor';
      // If logos are uploaded (regardless of sponsor_status), set has_sponsors to true
      // This allows organizers to upload logos when they need sponsors (to show who sponsored) or when they don't need sponsors (to display on cards)
      const hasSponsors = sponsorLogos.length > 0;

      // Prepare hackathon data
      const hackathonData = {
        ...form,
        organization_id: form.organization_id && form.organization_id !== '' ? parseInt(form.organization_id) : null,
        need_sponsor: needSponsor,
        has_sponsors: hasSponsors, // Will be true if logos are uploaded (even for "none")
        max_team_size: parseInt(form.max_team_size),
        // Convert timeline dates to ISO string format for Laravel
        team_joining_start: new Date(form.registration_start).toISOString(),
        team_joining_end: new Date(form.registration_end).toISOString(), // Registration ends when organizer sets it
        mentor_assignment_start: new Date(form.mentor_assignment_start).toISOString(),
        mentor_assignment_end: new Date(form.mentor_assignment_end).toISOString(), // Mentoring ends when organizer sets it
        submission_start: new Date(form.submission_start).toISOString(), // Submission starts when organizer sets it
        submission_end: new Date(form.submission_end).toISOString(), // Submission ends when organizer sets it
        judging_start: new Date(form.judging_start).toISOString(),
        judging_end: new Date(form.judging_end).toISOString(),
        // Legacy deadline fields (keep for backward compatibility)
        team_deadline: new Date(form.mentor_assignment_start).toISOString(),
        submission_deadline: new Date(form.judging_start).toISOString(), // Submission deadline = judging start
        judging_deadline: new Date(form.judging_end).toISOString(),
      };
      
      // Clean up sponsor fields based on status
      if (!needSponsor) {
        hackathonData.sponsor_visibility = null;
        hackathonData.sponsor_listing_expiry = null;
        hackathonData.sponsorship_type_preferred = null;
        hackathonData.sponsorship_amount_preferred = null;
        hackathonData.sponsorship_details = null;
        hackathonData.sponsor_benefits_offered = null;
        hackathonData.sponsor_requirements = null;
        hackathonData.sponsor_contact_email = null;
        hackathonData.sponsor_contact_phone = null;
      } else if (hackathonData.sponsor_visibility !== 'public') {
        hackathonData.sponsor_listing_expiry = null;
      } else if (hackathonData.sponsor_listing_expiry) {
        // Convert sponsor listing expiry date if provided
        hackathonData.sponsor_listing_expiry = new Date(hackathonData.sponsor_listing_expiry).toISOString();
      }
      
      // Convert sponsorship amount to number if present
      if (hackathonData.sponsorship_amount_preferred) {
        hackathonData.sponsorship_amount_preferred = parseFloat(hackathonData.sponsorship_amount_preferred);
      }

      // Remove empty string values and convert to null
      Object.keys(hackathonData).forEach(key => {
        if (hackathonData[key] === '') {
          hackathonData[key] = null;
        }
      });

      // Remove sponsor_status from data (it's not needed in backend)
      delete hackathonData.sponsor_status;

      // If we have sponsor logos (either from "none" with logos or "has_sponsors"), use FormData
      let response;
      if (sponsorLogos.length > 0) {
        const formData = new FormData();
        
        // Always include boolean fields first
        formData.append('need_sponsor', needSponsor ? '1' : '0');
        formData.append('has_sponsors', hasSponsors ? '1' : '0');
        
        // Add all form fields with proper type conversion for FormData
        Object.keys(hackathonData).forEach(key => {
          // Skip boolean fields as we've already added them
          if (key === 'need_sponsor' || key === 'has_sponsors') {
            return;
          }
          
          if (hackathonData[key] !== null && hackathonData[key] !== undefined) {
            if (typeof hackathonData[key] === 'boolean') {
              // Convert boolean to "1" or "0" for Laravel
              formData.append(key, hackathonData[key] ? '1' : '0');
            } else if (Array.isArray(hackathonData[key])) {
              formData.append(key, JSON.stringify(hackathonData[key]));
            } else {
              formData.append(key, String(hackathonData[key]));
            }
          }
        });

        // Add sponsor logo files - Laravel expects array format
        sponsorLogos.forEach((logo) => {
          formData.append('sponsor_logos[]', logo);
        });

        // Use hackathonAPI directly with FormData
        response = await hackathonAPI.createHackathon(formData);
      } else {
        response = await createHackathon(hackathonData);
      }
      const hackathonId = response.data?.data?.id || response.data?.id;
      
      // Create categories separately if any were provided
      const categoryNames = categories.filter(c => c.trim());
      if (categoryNames.length > 0 && hackathonId) {
        for (const categoryName of categoryNames) {
          try {
            await hackathonAPI.createCategory(hackathonId, { name: categoryName });
          } catch (catError) {
            console.error('Failed to create category:', catError);
            // Continue with other categories even if one fails
          }
        }
      }
      
      toast.success('Hackathon created successfully');
      navigate(`/organizer/hackathons/${hackathonId}`);
    } catch (error) {
      console.error('Error creating hackathon:', error);
      console.error('Error response data:', error.response?.data);
      // Show detailed validation errors if available
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
        const errorMessages = Object.values(error.response.data.errors).flat();
        errorMessages.forEach(msg => toast.error(msg));
      } else {
        toast.error(error.response?.data?.message || 'Failed to create hackathon');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 pb-6 sm:pb-8 md:pb-12 px-3 sm:px-4 md:px-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl sm:shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 dark:from-primary/30 dark:via-purple-500/30 dark:to-pink-500/30"></div>
        <div 
          className="absolute inset-0 opacity-30 dark:opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}
        ></div>
        
        <div className="relative p-4 sm:p-6 md:p-8 lg:p-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
            <div className="p-3 sm:p-4 bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl sm:rounded-2xl flex-shrink-0">
              <FiAward className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 break-words">
                Create Hackathon
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300">
                Build an amazing event and bring innovators together
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Basic Information Section */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary/10 dark:bg-primary/20 rounded-lg flex-shrink-0">
                <FiType className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Basic Information</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 ml-8 sm:ml-11">
              Essential details about your hackathon
            </p>
          </div>
          
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Organization Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Organization <span className="text-gray-500 dark:text-gray-400 text-xs font-normal">(Optional)</span>
              </label>
              <select
                name="organization_id"
                value={form.organization_id}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              >
                <option value="">Select Organization (Optional)</option>
                {organizations.length > 0 ? (
                  organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No organizations available</option>
                )}
              </select>
              {organizations.length === 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  No organizations available. You can create one from the Organizations page.
                </p>
              )}
            </div>

            <Input
              label="Hackathon Title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g., AI Innovation Challenge 2024"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
                placeholder="Describe your hackathon, its goals, themes, and what participants can expect..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <FiGlobe className="w-4 h-4 text-primary" />
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  required
                >
                  <option value="online">Online</option>
                  <option value="in_person">In Person</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-primary" />
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            {/* Location Field - Show for in_person and hybrid */}
            {(form.type === 'in_person' || form.type === 'hybrid') && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <FiMapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Venue Location <span className="text-gray-500 dark:text-gray-400 text-xs">(Optional)</span>
                </label>
                <Input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g., 123 Main St, City, State, ZIP Code or Conference Center, Building Name, Room Number"
                  className="w-full"
                />
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  Enter the physical location where the hackathon will take place
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Team & Schedule Section */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg">
                <FiUsers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Team & Schedule</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-11">
              Configure team settings and important deadlines
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <FiUsers className="w-4 h-4 text-primary" />
                  Max Team Size <span className="text-red-500">*</span>
                </label>
                <Input
                  name="max_team_size"
                  type="number"
                  value={form.max_team_size}
                  onChange={handleChange}
                  min="1"
                  placeholder="e.g., 4"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <FiClock className="w-4 h-4 text-primary" />
                Timeline Schedule <span className="text-red-500">*</span>
              </label>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <label className="block text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2 uppercase tracking-wide">
                      Registration Start <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">When teams can start registering</p>
                    <Input
                      name="registration_start"
                      type="datetime-local"
                      value={form.registration_start}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().slice(0, 16)}
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <label className="block text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2 uppercase tracking-wide">
                      Registration End <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">When team registration closes</p>
                    <Input
                      name="registration_end"
                      type="datetime-local"
                      value={form.registration_end}
                      onChange={handleChange}
                      required
                      min={form.registration_start || new Date().toISOString().slice(0, 16)}
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                    <label className="block text-xs font-semibold text-yellow-900 dark:text-yellow-300 mb-2 uppercase tracking-wide">
                      Submission Start <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-2">When teams can start submitting</p>
                    <Input
                      name="submission_start"
                      type="datetime-local"
                      value={form.submission_start}
                      onChange={handleChange}
                      required
                      min={form.registration_end || new Date().toISOString().slice(0, 16)}
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                    <label className="block text-xs font-semibold text-yellow-900 dark:text-yellow-300 mb-2 uppercase tracking-wide">
                      Submission End <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-2">When teams must finish submitting</p>
                    <Input
                      name="submission_end"
                      type="datetime-local"
                      value={form.submission_end}
                      onChange={handleChange}
                      required
                      min={form.submission_start || new Date().toISOString().slice(0, 16)}
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
                    <label className="block text-xs font-semibold text-green-900 dark:text-green-300 mb-2 uppercase tracking-wide">
                      Mentor Assignment Start <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-green-700 dark:text-green-400 mb-2">When mentor assignment begins</p>
                    <Input
                      name="mentor_assignment_start"
                      type="datetime-local"
                      value={form.mentor_assignment_start}
                      onChange={handleChange}
                      required
                      min={form.registration_end || new Date().toISOString().slice(0, 16)}
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
                    <label className="block text-xs font-semibold text-green-900 dark:text-green-300 mb-2 uppercase tracking-wide">
                      Mentor Assignment End <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-green-700 dark:text-green-400 mb-2">When mentor assignment period ends</p>
                    <Input
                      name="mentor_assignment_end"
                      type="datetime-local"
                      value={form.mentor_assignment_end}
                      onChange={handleChange}
                      required
                      min={form.mentor_assignment_start || new Date().toISOString().slice(0, 16)}
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <label className="block text-xs font-semibold text-purple-900 dark:text-purple-300 mb-2 uppercase tracking-wide">
                      Judging Start <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-purple-700 dark:text-purple-400 mb-2">When judging period begins</p>
                    <Input
                      name="judging_start"
                      type="datetime-local"
                      value={form.judging_start}
                      onChange={handleChange}
                      required
                      min={form.submission_end || form.mentor_assignment_end || new Date().toISOString().slice(0, 16)}
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <label className="block text-xs font-semibold text-purple-900 dark:text-purple-300 mb-2 uppercase tracking-wide">
                      Judging End <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-purple-700 dark:text-purple-400 mb-2">When judging period ends</p>
                    <Input
                      name="judging_end"
                      type="datetime-local"
                      value={form.judging_end}
                      onChange={handleChange}
                      required
                      min={form.judging_start || new Date().toISOString().slice(0, 16)}
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Sponsor Section */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 dark:bg-yellow-500/20 rounded-lg">
                <FiBriefcase className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sponsorship</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-11">
              Configure sponsorship settings for your hackathon
            </p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Sponsor Status
              </label>
              <div className="flex flex-wrap gap-4">
                <Button
                  type="button"
                  variant={form.sponsor_status === 'need_sponsor' ? 'primary' : 'outline'}
                  onClick={() => setForm(prev => ({ ...prev, sponsor_status: 'need_sponsor' }))}
                  disabled={form.sponsor_status === 'need_sponsor'}
                  className={`flex items-center gap-3 px-6 py-4 text-base font-semibold transition-all ${
                    form.sponsor_status === 'need_sponsor'
                      ? 'shadow-lg scale-105 cursor-default'
                      : 'hover:scale-105'
                  }`}
                >
                  <FiBriefcase className="w-5 h-5" />
                  Need Sponsor
                </Button>
                
                <Button
                  type="button"
                  variant={form.sponsor_status === 'none' ? 'primary' : 'outline'}
                  onClick={() => setForm(prev => ({ ...prev, sponsor_status: 'none' }))}
                  disabled={form.sponsor_status === 'none'}
                  className={`flex items-center gap-3 px-6 py-4 text-base font-semibold transition-all ${
                    form.sponsor_status === 'none'
                      ? 'shadow-lg scale-105 cursor-default'
                      : 'hover:scale-105'
                  }`}
                >
                  <FiCheckCircle className="w-5 h-5" />
                  No Need Sponsor
                </Button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                {form.sponsor_status === 'need_sponsor' 
                  ? 'You\'re looking for sponsors to support this hackathon'
                  : 'This hackathon doesn\'t need sponsors, but you can upload sponsor logos to display on homepage cards'}
              </p>
            </div>
            
            {/* Need Sponsor Section */}
            {form.sponsor_status === 'need_sponsor' && (
              <div className="mt-6 p-6 bg-gradient-to-br from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10 rounded-xl border-2 border-primary/20 dark:border-primary/30 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Sponsor Visibility <span className="text-gray-500 dark:text-gray-400 text-xs font-normal">(Optional)</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      form.sponsor_visibility === 'sponsors_only'
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}>
                      <input
                        type="radio"
                        name="sponsor_visibility"
                        value="sponsors_only"
                        checked={form.sponsor_visibility === 'sponsors_only'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1">Sponsors Only</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Show only on sponsor dashboard
                      </div>
                    </label>
                    <label className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      form.sponsor_visibility === 'public'
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}>
                      <input
                        type="radio"
                        name="sponsor_visibility"
                        value="public"
                        checked={form.sponsor_visibility === 'public'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1">Public</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Show on sponsor dashboard and home page
                      </div>
                    </label>
                  </div>
                </div>
                
                {form.sponsor_visibility === 'public' && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <FiCalendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Sponsor Listing Expiry <span className="text-gray-500 dark:text-gray-400 text-xs font-normal">(Optional)</span>
                    </label>
                    <Input
                      name="sponsor_listing_expiry"
                      type="datetime-local"
                      value={form.sponsor_listing_expiry}
                      onChange={handleChange}
                      placeholder="When should sponsor listing expire?"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Leave empty for no expiry. After this date, the hackathon will no longer appear on sponsor pages.
                    </p>
                  </div>
                )}
                {/* Sponsorship Requirements Section */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                      <FiBriefcase className="w-5 h-5 text-primary" />
                    </div>
                    Sponsorship Requirements
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <FiDollarSign className="w-4 h-4 text-primary" />
                        Preferred Sponsorship Type <span className="text-gray-500 dark:text-gray-400 text-xs font-normal">(Optional)</span>
                      </label>
                      <select
                        name="sponsorship_type_preferred"
                        value={form.sponsorship_type_preferred}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      >
                        <option value="">Select Type (Optional)</option>
                        <option value="financial">💰 Financial</option>
                        <option value="in_kind">📦 In-Kind</option>
                        <option value="both">💼 Both (Financial + In-Kind)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <FiDollarSign className="w-4 h-4 text-primary" />
                        Preferred Sponsorship Amount
                      </label>
                      <Input
                        name="sponsorship_amount_preferred"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={form.sponsorship_amount_preferred}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Sponsorship Details <span className="text-gray-500 dark:text-gray-400 text-xs font-normal">(Optional)</span>
                      </label>
                      <textarea
                        name="sponsorship_details"
                        value={form.sponsorship_details}
                        onChange={handleChange}
                        rows={5}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-all"
                        placeholder="Describe what you're looking for in a sponsor. What kind of support do you need? What are your expectations? (Optional)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Benefits Offered to Sponsors
                      </label>
                      <textarea
                        name="sponsor_benefits_offered"
                        value={form.sponsor_benefits_offered}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-all"
                        placeholder="What benefits will sponsors receive? (e.g., logo placement, speaking opportunities, booth space, social media mentions, etc.)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Sponsor Requirements/Qualifications
                      </label>
                      <textarea
                        name="sponsor_requirements"
                        value={form.sponsor_requirements}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-all"
                        placeholder="Any specific requirements or qualifications you're looking for in sponsors? (optional)"
                      />
                    </div>

                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 dark:bg-primary/20 rounded-lg">
                          <FiMail className="w-4 h-4 text-primary" />
                        </div>
                        Sponsor Contact Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <FiMail className="w-4 h-4 text-primary" />
                            Contact Email <span className="text-gray-500 dark:text-gray-400 text-xs font-normal">(Optional)</span>
                          </label>
                          <Input
                            name="sponsor_contact_email"
                            type="email"
                            placeholder="sponsors@hackathon.com"
                            value={form.sponsor_contact_email}
                            onChange={handleChange}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <FiPhone className="w-4 h-4 text-primary" />
                            Contact Phone
                          </label>
                          <Input
                            name="sponsor_contact_phone"
                            type="tel"
                            placeholder="+000-000-000"
                            value={form.sponsor_contact_phone}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sponsor Logo Upload (Optional) */}
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 dark:bg-primary/20 rounded-lg">
                          <FiUpload className="w-4 h-4 text-primary" />
                        </div>
                        Upload Sponsor Logos (Optional)
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Optionally upload logos of sponsors who have already sponsored this hackathon. 
                        These logos will be displayed on your hackathon cards and detail pages.
                      </p>
                      
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          multiple
                          onChange={handleSponsorLogoChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          id="sponsor-logo-upload-need-sponsor"
                        />
                        <label
                          htmlFor="sponsor-logo-upload-need-sponsor"
                          className="relative flex flex-col items-center justify-center w-full min-h-[140px] px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 hover:border-primary dark:hover:border-primary transition-all cursor-pointer"
                        >
                          <FiUpload className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-3" />
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PNG, JPG, GIF, WebP - max 5MB each (Optional)
                          </p>
                          {sponsorLogos.length > 0 && (
                            <p className="text-xs text-primary dark:text-blue-400 mt-2 font-semibold">
                              {sponsorLogos.length} file{sponsorLogos.length > 1 ? 's' : ''} selected
                            </p>
                          )}
                        </label>
                      </div>
                      
                      {/* Preview uploaded logos */}
                      {sponsorLogos.length > 0 && (
                        <div className="mt-6">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                            Uploaded Logos ({sponsorLogos.length}):
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {sponsorLogos.map((logo, index) => (
                              <div key={index} className="relative group">
                                <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 hover:border-primary dark:hover:border-primary transition-all">
                                  <img
                                    src={URL.createObjectURL(logo)}
                                    alt={`Sponsor logo ${index + 1}`}
                                    className="w-full h-20 object-contain"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeSponsorLogo(index)}
                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                  >
                                    <FiX className="w-4 h-4" />
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate text-center">
                                  {logo.name}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No Need Sponsor - Logo Upload Section */}
            {form.sponsor_status === 'none' && (
              <div className="mt-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl border-2 border-green-200 dark:border-green-800 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <div className="p-2 bg-green-500/10 dark:bg-green-500/20 rounded-lg">
                      <FiGift className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    Upload Sponsor Logos (Optional)
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Even though you don't need sponsors, you can upload sponsor logos to display on homepage hackathon cards. 
                    These logos will appear as "Sponsored by" on your hackathon cards.
                  </p>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      multiple
                      onChange={handleSponsorLogoChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      id="sponsor-logo-upload-create"
                    />
                    <label
                      htmlFor="sponsor-logo-upload-create"
                      className="relative flex flex-col items-center justify-center w-full min-h-[140px] px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 hover:border-primary dark:hover:border-primary transition-all cursor-pointer"
                    >
                      <FiUpload className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-3" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF, WebP - max 5MB each
                      </p>
                      {sponsorLogos.length > 0 && (
                        <p className="text-xs text-primary dark:text-blue-400 mt-2 font-semibold">
                          {sponsorLogos.length} file{sponsorLogos.length > 1 ? 's' : ''} selected
                        </p>
                      )}
                    </label>
                  </div>
                  
                  {/* Preview uploaded logos */}
                  {sponsorLogos.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        Uploaded Logos ({sponsorLogos.length}):
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {sponsorLogos.map((logo, index) => (
                          <div key={index} className="relative group">
                            <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 hover:border-primary dark:hover:border-primary transition-all">
                              <img
                                src={URL.createObjectURL(logo)}
                                alt={`Sponsor logo ${index + 1}`}
                                className="w-full h-20 object-contain"
                              />
                              <button
                                type="button"
                                onClick={() => removeSponsorLogo(index)}
                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate text-center">
                              {logo.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Categories Section */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/10 dark:bg-pink-500/20 rounded-lg">
                <FiTag className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-11">
              Add categories to help participants find relevant hackathons
            </p>
          </div>
          
          <div className="space-y-3">
            {categories.map((cat, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1">
                  <Input
                    value={cat}
                    onChange={(e) => handleCategoryChange(index, e.target.value)}
                    placeholder={`Category ${index + 1} (e.g., AI, Web Development, Mobile)`}
                  />
                </div>
                {index === categories.length - 1 && (
                  <Button 
                    type="button" 
                    onClick={addCategory} 
                    variant="outline"
                    className="mt-0 flex items-center gap-2 px-4"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add
                  </Button>
                )}
              </div>
            ))}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Categories are optional but help participants discover your hackathon
            </p>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-6">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => navigate(-1)}
            className="px-8"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="px-8 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <FiCheckCircle className="w-5 h-5" />
                Create Hackathon
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}


