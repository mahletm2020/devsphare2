import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { FiUpload, FiX, FiBriefcase, FiGlobe, FiFileText, FiArrowLeft } from 'react-icons/fi';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useOrganizationStore } from '../../stores/organizationStore';

/* ===========================
   Yup Validation Schema
=========================== */
const organizationSchema = yup.object({
  name: yup
    .string()
    .required('Organization name is required')
    .max(255, 'Name is too long'),

  description: yup
    .string()
    .max(1000, 'Description is too long')
    .nullable(),

  website: yup
    .string()
    .url('Please enter a valid URL')
    .nullable(),

  logo: yup
    .mixed()
    .test(
      'fileType',
      'Only PNG or JPG images are allowed',
      (value) => {
        if (!value || !value.length) return true;
        return ['image/png', 'image/jpeg'].includes(value[0].type);
      }
    )
    .test(
      'fileSize',
      'File size must be less than 2MB',
      (value) => {
        if (!value || !value.length) return true;
        return value[0].size <= 2 * 1024 * 1024;
      }
    ),
});

/* ===========================
   Component
=========================== */
const OrganizationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const fileInputRef = useRef(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const {
    currentOrganization,
    isLoading,
    fetchOrganization,
    createOrganization,
    updateOrganization,
  } = useOrganizationStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(organizationSchema),
    defaultValues: {
      name: '',
      description: '',
      website: '',
      logo: null,
    },
  });

  const logoFile = watch('logo');
  
  // Register logo with custom ref handling
  const { ref: logoRef, ...logoRegisterProps } = register('logo');

  /* ===========================
     Fetch organization for edit
  =========================== */
  useEffect(() => {
    if (isEdit) {
      fetchOrganization(id);
    }
  }, [id, isEdit, fetchOrganization]);

  /* ===========================
     Fill form when data loads
  =========================== */
  useEffect(() => {
    if (isEdit && currentOrganization) {
      reset({
        name: currentOrganization.name || '',
        description: currentOrganization.description || '',
        website: currentOrganization.website || '',
        logo: null, // file inputs cannot be prefilled
      });
      
      // Set logo preview if organization has logo
      if (currentOrganization.logo_url || currentOrganization.logo) {
        const logoUrl = currentOrganization.logo_url || 
          `http://localhost:8000/storage/${currentOrganization.logo}`;
        setLogoPreview(logoUrl);
      }
    }
  }, [currentOrganization, isEdit, reset]);

  // Logo preview is now handled in the input onChange handler

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /* ===========================
     Submit Handler
  =========================== */
  const onSubmit = async (data) => {
    try {
      console.log('[OrganizationForm] Form submission data:', {
        name: data.name,
        description: data.description,
        website: data.website,
        logo: data.logo,
        logoType: typeof data.logo,
        logoIsFileList: data.logo instanceof FileList,
        logoLength: data.logo?.length,
      });

      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description || '');
      formData.append('website', data.website || '');

      // Handle logo file - react-hook-form returns FileList
      const logoFile = data.logo;
      if (logoFile) {
        // FileList is array-like, so we can access [0]
        const file = logoFile instanceof FileList ? logoFile[0] : (Array.isArray(logoFile) ? logoFile[0] : logoFile);
        if (file instanceof File) {
          console.log('[OrganizationForm] Appending logo file:', {
            name: file.name,
            size: file.size,
            type: file.type,
          });
          formData.append('logo', file);
        } else {
          console.warn('[OrganizationForm] Logo is not a File:', file);
        }
      } else {
        console.log('[OrganizationForm] No logo file provided');
      }

      // Log FormData contents for debugging
      console.log('[OrganizationForm] FormData contents:');
      for (let pair of formData.entries()) {
        const value = pair[1];
        if (value instanceof File) {
          console.log(`  ${pair[0]}: [File: ${value.name}, ${(value.size / 1024).toFixed(2)} KB]`);
        } else {
          console.log(`  ${pair[0]}: ${value}`);
        }
      }

      if (isEdit) {
        await updateOrganization(id, formData);
        toast.success('Organization updated successfully!');
      } else {
        await createOrganization(formData);
        toast.success('Organization created successfully!');
      }

      navigate('/my-organizations');
    } catch (error) {
      console.error('Organization submit error:', error);
      const errorMsg = error.response?.data?.message || 'Something went wrong';
      toast.error(errorMsg);
    }
  };

  /* ===========================
     JSX
  =========================== */
  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/my-organizations')}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="mr-2" />
          Back to Organizations
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit Organization' : 'Create New Organization'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {isEdit
            ? 'Update your organization details and settings'
            : 'Create an organization to host and manage hackathons'}
        </p>
      </div>

      <Card className="p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Logo Upload Section */}
          <div className="flex flex-col items-center md:flex-row md:items-start gap-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-shrink-0">
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Organization logo"
                    className="w-32 h-32 rounded-xl object-cover border-4 border-primary shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center border-4 border-gray-200 dark:border-gray-700 shadow-lg">
                  <FiBriefcase className="w-16 h-16 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Organization Logo
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                {...logoRegisterProps}
                ref={(e) => {
                  fileInputRef.current = e;
                  logoRef(e);
                }}
                onChange={(e) => {
                  logoRegisterProps.onChange(e);
                  // Handle preview update when file changes
                  if (e.target.files && e.target.files.length > 0) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setLogoPreview(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                disabled={isLoading}
                className="hidden"
                id="logo-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center"
              >
                <FiUpload className="mr-2" />
                {logoPreview ? 'Change Logo' : 'Upload Logo'}
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                PNG or JPG, max 2MB. Recommended: 512x512px
              </p>
              {errors.logo && (
                <p className="text-sm text-red-600 mt-1">{errors.logo.message}</p>
              )}
            </div>
          </div>

          {/* Organization Name */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiBriefcase className="mr-2" />
              Organization Name *
            </label>
            <Input
              placeholder="Enter organization name"
              error={errors.name?.message}
              {...register('name')}
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiFileText className="mr-2" />
              Description
            </label>
            <textarea
              rows={4}
              placeholder="Describe your organization, its mission, and what makes it unique..."
              {...register('description')}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Website */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiGlobe className="mr-2" />
              Website URL
            </label>
            <Input
              type="url"
              placeholder="https://example.com"
              error={errors.website?.message}
              {...register('website')}
              disabled={isLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/my-organizations')}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="min-w-[140px]"
            >
              {isEdit ? 'Update Organization' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default OrganizationForm;
