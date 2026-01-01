import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { 
  FiCalendar, 
  FiPlus, 
  FiX, 
  FiDollarSign, 
  FiPackage, 
  FiBriefcase, 
  FiMail, 
  FiPhone, 
  FiGift,
  FiAward,
  FiUsers,
  FiMapPin,
  FiType,
  FiTag,
  FiUpload,
  FiGlobe,
  FiClock,
  FiCheckCircle,
  FiArrowLeft
} from 'react-icons/fi';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useHackathonStore } from '../../stores/hackathonStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import { HACKATHON_STATUS, HACKATHON_TYPES } from '../../config/constants';
import hackathonAPI from '../../api/hackathonAPI';

const hackathonSchema = yup.object({
  organization_id: yup.string().nullable(),
  title: yup.string().required('Title is required').max(255),
  description: yup.string().required('Description is required'),
  type: yup.string().oneOf(Object.values(HACKATHON_TYPES)).required('Type is required'),
  location: yup.string().nullable().max(500),
  need_sponsor: yup.boolean(),
  sponsor_visibility: yup.string().nullable().oneOf(['public', 'sponsors_only', null]),
  sponsor_listing_expiry: yup.date().nullable().when('sponsor_visibility', {
    is: 'public',
    then: (schema) => schema.min(new Date(), 'Expiry date must be in the future'),
    otherwise: (schema) => schema.nullable(),
  }),
  sponsorship_type_preferred: yup.string().nullable(),
  sponsorship_amount_preferred: yup.number().nullable().min(0),
  sponsorship_details: yup.string().nullable(),
  sponsor_benefits_offered: yup.string().nullable(),
  sponsor_requirements: yup.string().nullable(),
  sponsor_contact_email: yup.string().nullable().email('Invalid email'),
  sponsor_contact_phone: yup.string().nullable(),
  registration_start: yup.date().required('Registration start is required'),
  registration_end: yup.date().required('Registration end is required').min(
    yup.ref('registration_start'),
    'Registration end must be after registration start'
  ),
  submission_start: yup.date().required('Submission start is required').min(
    yup.ref('registration_end'),
    'Submission start must be after or equal to registration end'
  ),
  submission_end: yup.date().required('Submission end is required').min(
    yup.ref('submission_start'),
    'Submission end must be after submission start'
  ),
  mentor_assignment_start: yup.date().required('Mentor assignment start is required').min(
    yup.ref('registration_end'),
    'Mentor assignment start must be after or equal to registration end'
  ),
  mentor_assignment_end: yup.date().required('Mentor assignment end is required').min(
    yup.ref('mentor_assignment_start'),
    'Mentor assignment end must be after mentor assignment start'
  ),
  judging_start: yup.date().required('Judging start is required').min(
    yup.ref('submission_end'),
    'Judging start must be after or equal to submission end'
  ).min(
    yup.ref('mentor_assignment_end'),
    'Judging start must be after or equal to mentor assignment end'
  ),
  judging_end: yup.date().required('Judging end is required').min(
    yup.ref('judging_start'),
    'Judging end must be after judging start'
  ),
  status: yup.string().oneOf(Object.values(HACKATHON_STATUS)),
  max_team_size: yup.number().min(1).max(10).required('Max team size is required'),
});

const HackathonForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;
  
  const { 
    currentHackathon, 
    isLoading, 
    fetchHackathon, 
    createHackathon, 
    updateHackathon 
  } = useHackathonStore();
  
  const { organizations, fetchOrganizations } = useOrganizationStore();
  const [categories, setCategories] = useState([{ name: '', description: '', max_teams: '' }]);
  const [sponsorStatus, setSponsorStatus] = useState('none'); // 'none' or 'need_sponsor'
  const [sponsorLogos, setSponsorLogos] = useState([]);
  
  const { register, handleSubmit, formState: { errors }, watch, reset, setValue } = useForm({
    resolver: yupResolver(hackathonSchema),
    defaultValues: {
      need_sponsor: false,
      status: 'draft',
      max_team_size: 5,
    }
  });

  const hackathonType = watch('type');
  const sponsorVisibility = watch('sponsor_visibility');
  
  // Category handlers
  const handleCategoryChange = (index, field, value) => {
    const newCategories = [...categories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setCategories(newCategories);
  };

  const addCategory = () => {
    setCategories([...categories, { name: '', description: '', max_teams: '' }]);
  };

  const removeCategory = (index) => {
    if (categories.length > 1) {
      setCategories(categories.filter((_, i) => i !== index));
    }
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

  useEffect(() => {
    fetchOrganizations();
    if (isEdit) {
      fetchHackathon(id);
    }
    
    // Set organization from query params if exists
    const orgId = searchParams.get('organization_id');
    if (orgId && !isEdit) {
      setValue('organization_id', orgId);
    }
  }, [id, isEdit, fetchOrganizations, fetchHackathon, setValue, searchParams]);

  useEffect(() => {
    if (isEdit && currentHackathon) {
      const needSponsorValue = Boolean(currentHackathon.need_sponsor);
      const hasSponsorsValue = Boolean(currentHackathon.has_sponsors);
      
      // Determine sponsor status
      if (needSponsorValue) {
        setSponsorStatus('need_sponsor');
      } else if (hasSponsorsValue) {
        setSponsorStatus('none');
      } else {
        setSponsorStatus('none');
      }
      
      reset({
        organization_id: currentHackathon.organization_id?.toString() || '',
        title: currentHackathon.title,
        description: currentHackathon.description,
        type: currentHackathon.type,
        location: currentHackathon.location || '',
        need_sponsor: needSponsorValue,
        sponsor_visibility: currentHackathon.sponsor_visibility || '',
        sponsor_listing_expiry: currentHackathon.sponsor_listing_expiry ? 
          new Date(currentHackathon.sponsor_listing_expiry).toISOString().split('T')[0] : '',
        sponsorship_type_preferred: currentHackathon.sponsorship_type_preferred || '',
        sponsorship_amount_preferred: currentHackathon.sponsorship_amount_preferred || '',
        sponsorship_details: currentHackathon.sponsorship_details || '',
        sponsor_benefits_offered: currentHackathon.sponsor_benefits_offered || '',
        sponsor_requirements: currentHackathon.sponsor_requirements || '',
        sponsor_contact_email: currentHackathon.sponsor_contact_email || '',
        sponsor_contact_phone: currentHackathon.sponsor_contact_phone || '',
        registration_start: currentHackathon.team_joining_start ? 
          new Date(currentHackathon.team_joining_start).toISOString().slice(0, 16) : '',
        registration_end: currentHackathon.team_joining_end ? 
          new Date(currentHackathon.team_joining_end).toISOString().slice(0, 16) : 
          (currentHackathon.mentor_assignment_start ? 
            new Date(currentHackathon.mentor_assignment_start).toISOString().slice(0, 16) : ''),
        submission_start: currentHackathon.submission_start ? 
          new Date(currentHackathon.submission_start).toISOString().slice(0, 16) : 
          (currentHackathon.team_joining_start ? 
            new Date(currentHackathon.team_joining_start).toISOString().slice(0, 16) : ''),
        submission_end: currentHackathon.submission_end ? 
          new Date(currentHackathon.submission_end).toISOString().slice(0, 16) : 
          (currentHackathon.judging_start ? 
            new Date(currentHackathon.judging_start).toISOString().slice(0, 16) : ''),
        mentor_assignment_start: currentHackathon.mentor_assignment_start ? 
          new Date(currentHackathon.mentor_assignment_start).toISOString().slice(0, 16) : '',
        mentor_assignment_end: currentHackathon.mentor_assignment_end ? 
          new Date(currentHackathon.mentor_assignment_end).toISOString().slice(0, 16) : 
          (currentHackathon.judging_start ? 
            new Date(currentHackathon.judging_start).toISOString().slice(0, 16) : ''),
        judging_start: currentHackathon.judging_start ? 
          new Date(currentHackathon.judging_start).toISOString().slice(0, 16) : '',
        judging_end: currentHackathon.judging_end ? 
          new Date(currentHackathon.judging_end).toISOString().slice(0, 16) : '',
        status: currentHackathon.status,
        max_team_size: currentHackathon.max_team_size,
      });
      
      // Load existing categories if editing
      if (currentHackathon.categories && currentHackathon.categories.length > 0) {
        setCategories(currentHackathon.categories.map(cat => ({
          name: cat.name || '',
          description: cat.description || '',
          max_teams: cat.max_teams || '',
        })));
      } else {
        setCategories([{ name: '', description: '', max_teams: '' }]);
      }
    }
  }, [currentHackathon, isEdit, reset]);

  const onSubmit = async (data) => {
    console.log('Form submitted with data:', data);
    console.log('Form errors:', errors);
    try {
      // Determine sponsor status
      const needSponsor = sponsorStatus === 'need_sponsor';
      // If logos are uploaded (regardless of sponsor_status), set has_sponsors to true
      const hasSponsors = sponsorLogos.length > 0;
      
      // If submission_start is missing, default to registration_start (for backward compatibility with old hackathons)
      if (!data.submission_start && data.registration_start) {
        data.submission_start = data.registration_start;
      }
      
      // Validate timeline fields are present
      if (!data.registration_start || !data.registration_end || !data.submission_start || !data.submission_end || !data.mentor_assignment_start || !data.mentor_assignment_end || !data.judging_start || !data.judging_end) {
        console.error('Missing timeline fields:', {
          registration_start: data.registration_start,
          registration_end: data.registration_end,
          submission_start: data.submission_start,
          submission_end: data.submission_end,
          mentor_assignment_start: data.mentor_assignment_start,
          mentor_assignment_end: data.mentor_assignment_end,
          judging_start: data.judging_start,
          judging_end: data.judging_end
        });
        toast.error('Please fill in all timeline fields');
        return;
      }
      
      // Validate timeline order
      const regStart = new Date(data.registration_start);
      const regEnd = new Date(data.registration_end);
      const submissionStart = new Date(data.submission_start);
      const submissionEnd = new Date(data.submission_end);
      const mentorStart = new Date(data.mentor_assignment_start);
      const mentorEnd = new Date(data.mentor_assignment_end);
      const judgeStart = new Date(data.judging_start);
      const judgeEnd = new Date(data.judging_end);
      
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
      
      if (mentorStart >= judgeStart) {
        toast.error('Judging Start must be after Mentor Assignment Start');
        return;
      }
      
      if (judgeStart >= judgeEnd) {
        toast.error('Judging End must be after Judging Start');
        return;
      }

      // Convert dates to ISO string
      const formattedData = {
        ...data,
        organization_id: data.organization_id && data.organization_id !== '' ? parseInt(data.organization_id) : null,
        max_team_size: parseInt(data.max_team_size),
        need_sponsor: needSponsor,
        has_sponsors: hasSponsors,
        // Convert timeline dates to proper format for backend
        team_joining_start: new Date(data.registration_start).toISOString(),
        team_joining_end: new Date(data.registration_end).toISOString(), // Registration ends when organizer sets it
        submission_start: new Date(data.submission_start).toISOString(), // Submission starts when organizer sets it
        submission_end: new Date(data.submission_end).toISOString(), // Submission ends when organizer sets it
        mentor_assignment_start: new Date(data.mentor_assignment_start).toISOString(),
        mentor_assignment_end: new Date(data.mentor_assignment_end).toISOString(), // Mentoring ends when organizer sets it
        judging_start: new Date(data.judging_start).toISOString(),
        judging_end: new Date(data.judging_end).toISOString(),
        // Legacy deadline fields (for backward compatibility)
        team_deadline: new Date(data.mentor_assignment_start).toISOString(),
        submission_deadline: new Date(data.judging_start).toISOString(), // Submission deadline = judging start
        judging_deadline: new Date(data.judging_end).toISOString(),
      };
      
      // Remove the form field names from formattedData since we've mapped them to backend fields
      delete formattedData.registration_start;
      delete formattedData.registration_end;
      delete formattedData.submission_start;
      delete formattedData.submission_end;
      delete formattedData.mentor_assignment_start;
      delete formattedData.mentor_assignment_end;
      delete formattedData.judging_start;
      delete formattedData.judging_end;

      // Handle sponsor fields
      if (!needSponsor) {
        formattedData.sponsor_visibility = null;
        formattedData.sponsor_listing_expiry = null;
        formattedData.sponsorship_type_preferred = null;
        formattedData.sponsorship_amount_preferred = null;
        formattedData.sponsorship_details = null;
        formattedData.sponsor_benefits_offered = null;
        formattedData.sponsor_requirements = null;
        formattedData.sponsor_contact_email = null;
        formattedData.sponsor_contact_phone = null;
      } else if (formattedData.sponsor_visibility !== 'public') {
        formattedData.sponsor_listing_expiry = null;
      } else if (formattedData.sponsor_listing_expiry) {
        // Convert sponsor listing expiry date if provided
        formattedData.sponsor_listing_expiry = new Date(formattedData.sponsor_listing_expiry).toISOString();
      }
      
      // Convert sponsorship amount to number if present
      if (formattedData.sponsorship_amount_preferred) {
        formattedData.sponsorship_amount_preferred = parseFloat(formattedData.sponsorship_amount_preferred);
      }

      // Remove empty string values and convert to null
      Object.keys(formattedData).forEach(key => {
        if (formattedData[key] === '') {
          formattedData[key] = null;
        }
      });

      let hackathonId;
      let response;
      
      // Handle file upload if has sponsors and logos are provided
      if (hasSponsors && sponsorLogos.length > 0) {
        const formData = new FormData();
        
        // Always include boolean fields first
        formData.append('need_sponsor', needSponsor ? '1' : '0');
        formData.append('has_sponsors', hasSponsors ? '1' : '0');
        
        // Add all form fields with proper type conversion for FormData
        Object.keys(formattedData).forEach(key => {
          // Skip boolean fields as we've already added them
          if (key === 'need_sponsor' || key === 'has_sponsors') {
            return;
          }
          
          if (formattedData[key] !== null && formattedData[key] !== undefined) {
            if (key === 'organization_id' && formattedData[key] === null) {
              // Skip null organization_id
            } else if (typeof formattedData[key] === 'boolean') {
              // Convert boolean to "1" or "0" for Laravel
              formData.append(key, formattedData[key] ? '1' : '0');
            } else if (Array.isArray(formattedData[key])) {
              formData.append(key, JSON.stringify(formattedData[key]));
            } else {
              formData.append(key, String(formattedData[key]));
            }
          }
        });
        
        sponsorLogos.forEach((logo) => {
          formData.append('sponsor_logos[]', logo);
        });
        
        // Debug: Log FormData contents
        console.log('FormData contents:');
        for (let pair of formData.entries()) {
          if (pair[1] instanceof File) {
            console.log(pair[0], ':', pair[1].name, `(${pair[1].size} bytes)`);
          } else {
            console.log(pair[0], ':', pair[1]);
          }
        }
        
        if (isEdit) {
          response = await hackathonAPI.updateHackathon(id, formData);
          hackathonId = id;
          toast.success('Hackathon updated successfully');
        } else {
          response = await hackathonAPI.createHackathon(formData);
          hackathonId = response.data?.data?.id || response.data?.id || response.id;
          toast.success('Hackathon created successfully');
        }
      } else {
        if (isEdit) {
          await updateHackathon(id, formattedData);
          hackathonId = id;
          toast.success('Hackathon updated successfully');
        } else {
          response = await createHackathon(formattedData);
          hackathonId = response.data?.data?.id || response.data?.id || response.id;
          toast.success('Hackathon created successfully');
        }
      }

      // Create categories after hackathon is created/updated
      const categoryNames = categories.filter(c => c.name && c.name.trim());
      if (categoryNames.length > 0 && hackathonId) {
        for (const category of categoryNames) {
          try {
            const categoryData = {
              name: category.name.trim(),
              description: category.description?.trim() || null,
              max_teams: category.max_teams && category.max_teams !== '' ? parseInt(category.max_teams) : null,
            };
            await hackathonAPI.createCategory(hackathonId, categoryData);
          } catch (catError) {
            console.error('Failed to create category:', catError);
            toast.error(`Failed to create category "${category.name}"`);
            // Continue with other categories even if one fails
          }
        }
        if (categoryNames.length > 0) {
          toast.success(`${categoryNames.length} categor${categoryNames.length === 1 ? 'y' : 'ies'} created successfully`);
        }
      }

      navigate(hackathonId ? `/hackathons/${hackathonId}` : '/organizer/dashboard'); 
    } catch (error) {
      console.error('Error submitting hackathon:', error);
      console.error('Error response:', error.response?.data);
      // Show detailed validation errors if available
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        errorMessages.forEach(msg => toast.error(msg));
        // Also log to console for debugging
        console.error('Validation errors:', error.response.data.errors);
      } else {
        const errorMsg = error.response?.data?.message || 'Failed to save hackathon';
        toast.error(errorMsg);
        console.error('Error message:', errorMsg);
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
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="absolute top-3 left-3 sm:top-4 sm:left-4 p-2 hover:bg-white/20 dark:hover:bg-gray-800/30 rounded-lg transition-all"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
            <div className="p-3 sm:p-4 bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl sm:rounded-2xl flex-shrink-0">
              <FiAward className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 break-words">
                {isEdit ? 'Edit Hackathon' : 'Create Hackathon'}
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300">
                {isEdit ? 'Update your hackathon details' : 'Build an amazing event and bring innovators together'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, (errors) => {
        console.error('Form validation errors:', errors);
        // Show first error to user
        const firstError = Object.values(errors)[0];
        if (firstError?.message) {
          toast.error(firstError.message);
        } else {
          toast.error('Please fix the form errors before submitting');
        }
      })} className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Basic Information Section */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary/10 dark:bg-primary/20 rounded-lg flex-shrink-0">
                <FiType className="w-4 h-4 sm:w-5 sm:h-5 text-primary dark:text-blue-400" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Basic Information</h2>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Organization Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Organization <span className="text-gray-500 dark:text-gray-400 text-xs font-normal">(Optional)</span>
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                {...register('organization_id')}
                disabled={isLoading || (searchParams.get('organization_id') && !isEdit)}
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
              {errors.organization_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.organization_id.message}</p>
              )}
            </div>

            <Input
              label="Title"
              placeholder="Enter hackathon title"
              error={errors.title?.message}
              {...register('title')}
              disabled={isLoading}
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-all"
                rows={5}
                placeholder="Describe the hackathon, its goals, themes, and what participants can expect..."
                {...register('description')}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <FiGlobe className="w-4 h-4 text-primary" />
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  {...register('type')}
                  disabled={isLoading}
                >
                  <option value="">Select Type</option>
                  {Object.entries(HACKATHON_TYPES).map(([key, value]) => (
                    <option key={key} value={value}>
                      {value.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <FiUsers className="w-4 h-4 text-primary" />
                  Max Team Size <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  {...register('max_team_size')}
                  disabled={isLoading}
                />
                {errors.max_team_size && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.max_team_size.message}</p>
                )}
              </div>
            </div>

            {/* Location Field - Show for in_person and hybrid */}
            {(hackathonType === 'in_person' || hackathonType === 'hybrid') && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <FiMapPin className="w-4 h-4 text-primary" />
                  Venue Location / Address <span className="text-gray-500 dark:text-gray-400 text-xs font-normal">(Optional)</span>
                </label>
                <Input
                  placeholder="e.g., 123 Main St, City, State, ZIP Code or Conference Center, Building Name, Room Number"
                  error={errors.location?.message}
                  {...register('location')}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
        </Card>

        {/* Team & Schedule Section */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg flex-shrink-0">
                <FiCalendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Team & Schedule</h2>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg sm:rounded-xl border border-blue-200 dark:border-blue-800">
                <label className="block text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1 sm:mb-2 uppercase tracking-wide">
                  Registration Start <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">When teams can start registering</p>
                <Input
                  type="datetime-local"
                  error={errors.registration_start?.message}
                  {...register('registration_start')}
                  disabled={isLoading}
                  className="bg-white dark:bg-gray-800"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg sm:rounded-xl border border-blue-200 dark:border-blue-800">
                <label className="block text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1 sm:mb-2 uppercase tracking-wide">
                  Registration End <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">When team registration closes</p>
                <Input
                  type="datetime-local"
                  error={errors.registration_end?.message}
                  {...register('registration_end')}
                  disabled={isLoading}
                  className="bg-white dark:bg-gray-800"
                  min={watch('registration_start') || new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg sm:rounded-xl border border-yellow-200 dark:border-yellow-800">
                <label className="block text-xs font-semibold text-yellow-900 dark:text-yellow-300 mb-1 sm:mb-2 uppercase tracking-wide">
                  Submission Start <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-2">When teams can start submitting</p>
                <Input
                  type="datetime-local"
                  error={errors.submission_start?.message}
                  {...register('submission_start')}
                  disabled={isLoading}
                  className="bg-white dark:bg-gray-800"
                  min={watch('registration_end') || new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg sm:rounded-xl border border-yellow-200 dark:border-yellow-800">
                <label className="block text-xs font-semibold text-yellow-900 dark:text-yellow-300 mb-1 sm:mb-2 uppercase tracking-wide">
                  Submission End <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-2">When teams must finish submitting</p>
                <Input
                  type="datetime-local"
                  error={errors.submission_end?.message}
                  {...register('submission_end')}
                  disabled={isLoading}
                  className="bg-white dark:bg-gray-800"
                  min={watch('submission_start') || new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg sm:rounded-xl border border-green-200 dark:border-green-800">
                <label className="block text-xs font-semibold text-green-900 dark:text-green-300 mb-1 sm:mb-2 uppercase tracking-wide">
                  Mentor Assignment Start <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-green-700 dark:text-green-400 mb-2">When mentor assignment begins</p>
                <Input
                  type="datetime-local"
                  error={errors.mentor_assignment_start?.message}
                  {...register('mentor_assignment_start')}
                  disabled={isLoading}
                  className="bg-white dark:bg-gray-800"
                  min={watch('registration_end') || new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg sm:rounded-xl border border-green-200 dark:border-green-800">
                <label className="block text-xs font-semibold text-green-900 dark:text-green-300 mb-1 sm:mb-2 uppercase tracking-wide">
                  Mentor Assignment End <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-green-700 dark:text-green-400 mb-2">When mentor assignment period ends</p>
                <Input
                  type="datetime-local"
                  error={errors.mentor_assignment_end?.message}
                  {...register('mentor_assignment_end')}
                  disabled={isLoading}
                  className="bg-white dark:bg-gray-800"
                  min={watch('mentor_assignment_start') || new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg sm:rounded-xl border border-purple-200 dark:border-purple-800">
                <label className="block text-xs font-semibold text-purple-900 dark:text-purple-300 mb-1 sm:mb-2 uppercase tracking-wide">
                  Judging Start <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-purple-700 dark:text-purple-400 mb-2">When judging period begins</p>
                <Input
                  type="datetime-local"
                  error={errors.judging_start?.message}
                  {...register('judging_start')}
                  disabled={isLoading}
                  className="bg-white dark:bg-gray-800"
                  min={watch('submission_end') || watch('mentor_assignment_end') || new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg sm:rounded-xl border border-purple-200 dark:border-purple-800">
                <label className="block text-xs font-semibold text-purple-900 dark:text-purple-300 mb-1 sm:mb-2 uppercase tracking-wide">
                  Judging End <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-purple-700 dark:text-purple-400 mb-2">When judging period ends</p>
                <Input
                  type="datetime-local"
                  error={errors.judging_end?.message}
                  {...register('judging_end')}
                  disabled={isLoading}
                  className="bg-white dark:bg-gray-800"
                  min={watch('judging_start') || new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Sponsorship Section */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-500/10 dark:bg-green-500/20 rounded-lg flex-shrink-0">
                <FiGift className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Sponsorship</h2>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Sponsor Status
              </label>
              <div className="flex flex-wrap gap-4">
                <Button
                  type="button"
                  variant={sponsorStatus === 'need_sponsor' ? 'primary' : 'outline'}
                  onClick={() => {
                    setSponsorStatus('need_sponsor');
                    setValue('need_sponsor', true, { shouldValidate: true, shouldDirty: true });
                  }}
                  disabled={isLoading || sponsorStatus === 'need_sponsor'}
                  className={`flex items-center gap-3 px-6 py-4 text-base font-semibold transition-all ${
                    sponsorStatus === 'need_sponsor'
                      ? 'shadow-lg scale-105 cursor-default'
                      : 'hover:scale-105'
                  }`}
                >
                  <FiBriefcase className="w-5 h-5" />
                  Need Sponsor
                </Button>
                
                <Button
                  type="button"
                  variant={sponsorStatus === 'none' ? 'primary' : 'outline'}
                  onClick={() => {
                    setSponsorStatus('none');
                    setValue('need_sponsor', false, { shouldValidate: true, shouldDirty: true });
                  }}
                  disabled={isLoading || sponsorStatus === 'none'}
                  className={`flex items-center gap-3 px-6 py-4 text-base font-semibold transition-all ${
                    sponsorStatus === 'none'
                      ? 'shadow-lg scale-105 cursor-default'
                      : 'hover:scale-105'
                  }`}
                >
                  <FiCheckCircle className="w-5 h-5" />
                  No Need Sponsor
                </Button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                {sponsorStatus === 'need_sponsor' 
                  ? 'You\'re looking for sponsors to support this hackathon'
                  : 'This hackathon doesn\'t need sponsors, but you can upload sponsor logos to display on homepage cards'}
              </p>
            </div>
            
            {/* Need Sponsor Section */}
            {sponsorStatus === 'need_sponsor' && (
              <div className="mt-6 p-6 bg-gradient-to-br from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10 rounded-xl border-2 border-primary/20 dark:border-primary/30 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Sponsor Visibility <span className="text-gray-500 dark:text-gray-400 text-xs font-normal">(Optional)</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    {...register('sponsor_visibility')}
                    disabled={isLoading}
                  >
                    <option value="">Select Visibility (Optional)</option>
                    <option value="public">Public</option>
                    <option value="sponsors_only">Sponsors Only</option>
                  </select>
                  {errors.sponsor_visibility && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.sponsor_visibility.message}</p>
                  )}
                </div>

                {sponsorVisibility === 'public' && (
                  <Input
                    label="Sponsor Listing Expiry"
                    type="date"
                    error={errors.sponsor_listing_expiry?.message}
                    {...register('sponsor_listing_expiry')}
                    disabled={isLoading}
                  />
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FiBriefcase className="w-5 h-5 text-primary" />
                    Sponsorship Requirements
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <FiDollarSign className="w-4 h-4 text-primary" />
                        Preferred Sponsorship Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        {...register('sponsorship_type_preferred')}
                        disabled={isLoading}
                      >
                        <option value="">Select Type</option>
                        <option value="financial">💰 Financial</option>
                        <option value="in_kind">📦 In-Kind</option>
                        <option value="both">💼 Both (Financial + In-Kind)</option>
                      </select>
                      {errors.sponsorship_type_preferred && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.sponsorship_type_preferred.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <FiDollarSign className="w-4 h-4 text-primary" />
                        Preferred Sponsorship Amount
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        error={errors.sponsorship_amount_preferred?.message}
                        {...register('sponsorship_amount_preferred')}
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Sponsorship Details <span className="text-gray-500 dark:text-gray-400 text-xs font-normal">(Optional)</span>
                      </label>
                      <textarea
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-all"
                        rows={5}
                        placeholder="Describe what you're looking for in a sponsor. What kind of support do you need? What are your expectations? (Optional)"
                        {...register('sponsorship_details')}
                        disabled={isLoading}
                      />
                      {errors.sponsorship_details && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.sponsorship_details.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Benefits Offered to Sponsors
                      </label>
                      <textarea
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-all"
                        rows={4}
                        placeholder="What benefits will sponsors receive? (e.g., logo placement, speaking opportunities, booth space, social media mentions, etc.)"
                        {...register('sponsor_benefits_offered')}
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Sponsor Requirements/Qualifications
                      </label>
                      <textarea
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-all"
                        rows={3}
                        placeholder="Any specific requirements or qualifications you're looking for in sponsors? (optional)"
                        {...register('sponsor_requirements')}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <FiMail className="w-4 h-4 text-primary" />
                        Sponsor Contact Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Contact Email (Optional)"
                          type="email"
                          placeholder="sponsors@hackathon.com"
                          error={errors.sponsor_contact_email?.message}
                          {...register('sponsor_contact_email')}
                          disabled={isLoading}
                        />
                        <Input
                          label="Contact Phone (Optional)"
                          type="tel"
                          placeholder="+000-000-000"
                          error={errors.sponsor_contact_phone?.message}
                          {...register('sponsor_contact_phone')}
                          disabled={isLoading}
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
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {sponsorLogos.map((logo, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(logo)}
                              alt={`Sponsor logo ${index + 1}`}
                              className="w-full h-32 object-contain border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-2"
                            />
                            <button
                              type="button"
                              onClick={() => removeSponsorLogo(index)}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* No Need Sponsor - Logo Upload Section */}
            {sponsorStatus === 'none' && (
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
                      id="sponsor-logo-upload"
                    />
                    <label
                      htmlFor="sponsor-logo-upload"
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
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </div>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 dark:bg-orange-500/20 rounded-lg">
                  <FiTag className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCategory}
                className="flex items-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                Add Category
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Categories help organize teams. You can add categories now or later from the hackathon detail page.
          </p>
          
          <div className="space-y-4">
            {categories.map((category, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Category {index + 1}</h4>
                  {categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCategory(index)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Input
                    label="Category Name"
                    placeholder="e.g., Web Development, Mobile App, AI/ML"
                    value={category.name}
                    onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                    disabled={isLoading}
                  />
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Description <span className="text-gray-500 dark:text-gray-400 text-xs font-normal">(Optional)</span>
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      rows={2}
                      placeholder="Brief description of this category..."
                      value={category.description}
                      onChange={(e) => handleCategoryChange(index, 'description', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <Input
                    label="Max Teams"
                    type="number"
                    min="1"
                    placeholder="Leave empty for unlimited"
                    value={category.max_teams}
                    onChange={(e) => handleCategoryChange(index, 'max_teams', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Status (only for edit) */}
        {isEdit && (
          <Card className="overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                  <FiClock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Status</h2>
              </div>
            </div>
            <div>
              <select
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                {...register('status')}
                disabled={isLoading}
              >
                {Object.entries(HACKATHON_STATUS).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value.replace('_', ' ')}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status.message}</p>
              )}
            </div>
          </Card>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(-1)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
          >
            {isEdit ? 'Update Hackathon' : 'Create Hackathon'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default HackathonForm;
