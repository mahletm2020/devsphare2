import React from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useHackathonStore } from '../../stores/hackathonStore';

const categorySchema = yup.object({
  name: yup.string().required('Category name is required').max(255),
  description: yup.string().max(500),
  max_teams: yup.number().min(1).nullable(),
});

const CategoryModal = ({ hackathonId, onClose }) => {
  const { createCategory, isLoading } = useHackathonStore();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      max_teams: '',
    } 
  });

  const onSubmit = async (data) => {
    try {
      await createCategory(hackathonId, data);
      reset();
      onClose();
    } catch (error) {
      // Error handled in store
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Add New Category</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Category Name *"
              placeholder="Enter category name"
              error={errors.name?.message}
              {...register('name')}
              disabled={isLoading}
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Describe this category..."
                {...register('description')}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <Input
              label="Max Teams (Optional)"
              type="number"
              placeholder="Leave empty for unlimited"
              error={errors.max_teams?.message}
              {...register('max_teams')}
              disabled={isLoading}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
              >
                Create Category
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;