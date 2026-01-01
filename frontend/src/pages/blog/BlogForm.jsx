import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FiSave, FiX, FiUpload, FiImage } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import blogAPI from '../../api/blogAPI';
import hackathonAPI from '../../api/hackathonAPI';
import { useAuthStore } from '../../stores/authStore';
import { validateFile, createImagePreview } from '../../utils/fileUpload';
import { createFormData } from '../../utils/fileUpload';
import toast from 'react-hot-toast';

const schema = yup.object().shape({
  title: yup.string().required('Title is required').max(255),
  excerpt: yup.string().max(500),
  content: yup.string().required('Content is required'),
  featured_image: yup.string().nullable(),
  featured_image_url: yup.string().nullable(),
  type: yup.string().oneOf(['general', 'winner_announcement']).required(),
  status: yup.string().oneOf(['draft', 'published']).required(),
  hackathon_id: yup.number().nullable(),
  meta_keywords: yup.array().of(yup.string().max(50)),
  meta_description: yup.string().max(300),
  published_at: yup.date().nullable(),
});

export default function BlogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isEditing = !!id && id !== 'create';
  const [loading, setLoading] = useState(false);
  const [hackathons, setHackathons] = useState([]);
  const [showWinnerOptions, setShowWinnerOptions] = useState(false);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [winners, setWinners] = useState([]);
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState(null);
  const [imageInputType, setImageInputType] = useState('url'); // 'url' or 'file'
  const imageFileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      type: 'general',
      status: 'draft',
      hackathon_id: null,
      meta_keywords: [],
    },
  });

  const postType = watch('type');
  const featuredImageUrl = watch('featured_image');

  useEffect(() => {
    if (postType === 'winner_announcement') {
      setShowWinnerOptions(true);
      fetchHackathons();
    } else {
      setShowWinnerOptions(false);
      setValue('hackathon_id', null);
    }
  }, [postType, setValue]);

  useEffect(() => {
    if (isEditing) {
      fetchPost();
    }
  }, [id, isEditing]);
  
  // Watch featured_image URL for preview when using URL input
  useEffect(() => {
    if (imageInputType === 'url' && featuredImageUrl && featuredImageUrl.trim() !== '' && !featuredImageFile) {
      // Validate URL and set preview
      try {
        new URL(featuredImageUrl);
        setFeaturedImagePreview(featuredImageUrl);
      } catch {
        // Invalid URL, clear preview
        setFeaturedImagePreview(null);
      }
    } else if (imageInputType === 'url' && (!featuredImageUrl || featuredImageUrl.trim() === '') && !featuredImageFile) {
      setFeaturedImagePreview(null);
    }
  }, [featuredImageUrl, imageInputType, featuredImageFile]);

  const fetchPost = async () => {
    try {
      // Fetch the post - if id is numeric, fetch from my posts, otherwise try slug
      let post;
      if (!isNaN(id)) {
        // It's an ID, fetch from user's posts
        const response = await blogAPI.getMyPosts();
        const posts = response.data?.data || response.data || [];
        post = posts.find(p => p.id === Number(id));
        if (!post) {
          toast.error('Post not found');
          navigate('/blog');
          return;
        }
      } else {
        // It's a slug, fetch by slug
        const response = await blogAPI.getBySlug(id);
        post = response.data;
      }
      reset({
        title: post.title,
        excerpt: post.excerpt || '',
        content: post.content,
        featured_image: post.featured_image || '',
        type: post.type,
        status: post.status,
        hackathon_id: post.hackathon?.id || post.hackathon_id,
        meta_keywords: post.meta_keywords || [],
        meta_description: post.meta_description || '',
        published_at: post.published_at ? new Date(post.published_at).toISOString().split('T')[0] : '',
      });
      
      // Set image preview if featured_image exists
      if (post.featured_image) {
        setFeaturedImagePreview(post.featured_image);
        setImageInputType('url');
      }
      
      if (post.hackathon_id) {
        setSelectedHackathon(post.hackathon_id);
        fetchWinners(post.hackathon_id);
      }
    } catch (error) {
      toast.error('Failed to load blog post');
      navigate('/blog');
    }
  };

  const fetchHackathons = async () => {
    try {
      const response = await hackathonAPI.getAll({ status: 'results_published', per_page: 100 });
      setHackathons(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching hackathons:', error);
    }
  };

  const fetchWinners = async (hackathonId) => {
    try {
      const response = await blogAPI.getHackathonWinners(hackathonId);
      setWinners(response.data?.winners || []);
    } catch (error) {
      console.error('Error fetching winners:', error);
      toast.error('Failed to load hackathon winners');
    }
  };

  const handleHackathonChange = async (hackathonId) => {
    setSelectedHackathon(hackathonId);
    setValue('hackathon_id', hackathonId);
    if (hackathonId) {
      await fetchWinners(hackathonId);
    } else {
      setWinners([]);
    }
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB for blog images
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    });

    if (!validation.valid) {
      toast.error(validation.error);
      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = '';
      }
      return;
    }

    setFeaturedImageFile(file);
    try {
      const preview = await createImagePreview(file);
      setFeaturedImagePreview(preview);
    } catch (error) {
      console.error('Failed to create preview:', error);
      toast.error('Failed to create image preview');
    }
  };

  const handleRemoveImage = () => {
    setFeaturedImageFile(null);
    setFeaturedImagePreview(null);
    setValue('featured_image', '');
    if (imageFileInputRef.current) {
      imageFileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Prepare form data
      const formData = { ...data };
      
      // If there's a file, include it and remove the URL
      if (featuredImageFile) {
        // Will be handled by FormData
        delete formData.featured_image;
      } else if (imageInputType === 'url' && data.featured_image) {
        // Use URL if provided and no file
        formData.featured_image = data.featured_image;
      } else {
        formData.featured_image = null;
      }

      // Remove featured_image_url if it exists (it's just for the form state)
      delete formData.featured_image_url;

      if (isEditing) {
        // Get the post ID - if id is numeric use it, otherwise fetch to get ID
        let postId = id;
        if (isNaN(id)) {
          const postResponse = await blogAPI.getBySlug(id);
          postId = postResponse.data.id;
        }
        
        if (featuredImageFile) {
          // Use FormData for file upload
          const uploadData = createFormData({ ...formData, featured_image: featuredImageFile });
          await blogAPI.updateWithFile(postId, uploadData);
        } else {
          await blogAPI.update(postId, formData);
        }
        toast.success('Blog post updated successfully');
      } else {
        if (featuredImageFile) {
          // Use FormData for file upload
          const uploadData = createFormData({ ...formData, featured_image: featuredImageFile });
          await blogAPI.createWithFile(uploadData);
        } else {
          await blogAPI.create(formData);
        }
        toast.success('Blog post created successfully');
      }
      navigate('/blog');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to save blog post';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h1>
          <Button variant="outline" onClick={() => navigate('/blog')}>
            <FiX className="mr-2" />
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <Input
              {...register('title')}
              error={errors.title?.message}
              placeholder="Enter blog post title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Excerpt (Optional)
            </label>
            <textarea
              {...register('excerpt')}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Brief summary of the post..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content *
            </label>
            <textarea
              {...register('content')}
              rows="15"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
              placeholder="Write your blog post content here... (HTML supported)"
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Featured Image (Optional)
            </label>
            
            {/* Toggle between URL and File Upload */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  setImageInputType('url');
                  setFeaturedImageFile(null);
                  setFeaturedImagePreview(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  imageInputType === 'url'
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                From URL
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageInputType('file');
                  setValue('featured_image', '');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  imageInputType === 'file'
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Upload from Device
              </button>
            </div>

            {imageInputType === 'url' ? (
              <div>
                <Input
                  {...register('featured_image')}
                  error={errors.featured_image?.message}
                  placeholder="https://example.com/image.jpg"
                />
                {featuredImagePreview && (
                  <div className="mt-3">
                    <img
                      src={featuredImagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => imageFileInputRef.current?.click()}
                    className="flex items-center"
                  >
                    <FiUpload className="mr-2" />
                    Choose Image
                  </Button>
                  {featuredImagePreview && (
                    <div className="flex items-center gap-3">
                      <img
                        src={featuredImagePreview}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemoveImage}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FiX className="mr-1" />
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Max size: 5MB. Allowed formats: JPG, PNG, GIF, WebP
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type *
              </label>
              <select
                {...register('type')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="general">General</option>
                <option value="winner_announcement">Winner Announcement</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status *
              </label>
              <select
                {...register('status')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {showWinnerOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hackathon *
              </label>
              <select
                value={selectedHackathon || ''}
                onChange={(e) => handleHackathonChange(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select a hackathon with winners...</option>
                {hackathons.map((hackathon) => (
                  <option key={hackathon.id} value={hackathon.id}>
                    {hackathon.title}
                  </option>
                ))}
              </select>
              {winners.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">Winners:</p>
                  <ul className="space-y-1">
                    {winners.map((winner) => (
                      <li key={winner.position} className="text-sm text-gray-700 dark:text-gray-300">
                        {winner.position === 1 && '🥇'} {winner.position === 2 && '🥈'} {winner.position === 3 && '🥉'} 
                        {' '}{winner.team_name} - {winner.submission_title} (Score: {winner.average_score})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" variant="primary" isLoading={loading}>
              <FiSave className="mr-2" />
              {isEditing ? 'Update Post' : 'Create Post'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/blog')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

