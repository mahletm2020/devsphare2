import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { FiArrowLeft, FiUsers, FiAward, FiInfo, FiUser } from 'react-icons/fi';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useTeamStore } from '../../stores/teamStore';
import { useHackathonStore } from '../../stores/hackathonStore';

const TeamForm = () => {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentHackathon, fetchHackathon } = useHackathonStore();
  const { createTeam, isLoading } = useTeamStore();
  const [categories, setCategories] = useState([]);
  const [isSolo, setIsSolo] = useState(searchParams.get('solo') === 'true');

  // Schema - category is optional, we'll validate manually if needed
  const teamSchema = yup.object({
    name: yup.string().when('is_solo', {
      is: true,
      then: (schema) => schema.nullable().max(255),
      otherwise: (schema) => schema.required('Team name is required').max(255),
    }),
    description: yup.string().max(500),
    category_id: yup.number().nullable().optional(),
    is_solo: yup.boolean().optional(),
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: yupResolver(teamSchema),
    defaultValues: {
      is_solo: searchParams.get('solo') === 'true',
    },
  });

  const watchedIsSolo = watch('is_solo', isSolo);

  useEffect(() => {
    if (hackathonId) {
      fetchHackathon(hackathonId);
    }
  }, [hackathonId, fetchHackathon]);

  useEffect(() => {
    if (currentHackathon?.categories) {
      setCategories(currentHackathon.categories);
    } else if (currentHackathon && !currentHackathon.categories) {
      setCategories([]);
    }
  }, [currentHackathon]);

  const onSubmit = async (data) => {
    try {
      const isSoloMode = data.is_solo || watchedIsSolo;
      
      // Validate category if categories exist and not solo
      if (categories.length > 0 && !isSoloMode && !data.category_id) {
        toast.error('Please select a category');
        return;
      }

      const teamData = {
        name: isSoloMode ? (data.name || null) : data.name,
        description: data.description || null,
        is_solo: isSoloMode,
      };

      // Only include category_id if categories exist and one was selected (solo can skip)
      if (categories.length > 0 && data.category_id) {
        teamData.category_id = parseInt(data.category_id, 10);
      }
      // If no categories exist, don't send category_id (backend will handle as null)
      
      await createTeam(hackathonId, teamData);
      toast.success(isSoloMode ? 'Solo participation created successfully' : 'Team created successfully. You are now the team leader', {
        duration: 5000,
      });
      
      // Show next steps message
      setTimeout(() => {
        toast.success(isSoloMode 
          ? 'You can now submit your project when submissions open' 
          : 'Invite team members and start working on your project', {
          duration: 4000,
        });
      }, 1500);
      
      navigate(`/hackathons/${hackathonId}`);
    } catch (error) {
      // Error handled in store
    }
  };

  if (!currentHackathon) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading hackathon details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/hackathons/${hackathonId}`}
            className="inline-flex items-center text-primary hover:text-primary/80 mb-6 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Hackathon
          </Link>
          <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 rounded-2xl p-6 border border-primary/20 dark:border-primary/30">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {watchedIsSolo ? 'Participate Solo' : 'Create Your Team'}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {watchedIsSolo 
                ? `Compete individually in "${currentHackathon.title}"`
                : `Form a team for "${currentHackathon.title}"`
              }
            </p>
          </div>
          
          {/* Solo vs Team Toggle */}
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSolo(false);
                setValue('is_solo', false);
              }}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                !watchedIsSolo
                  ? 'border-primary bg-primary/10 dark:bg-primary/20 text-primary'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-primary/50'
              }`}
            >
              <FiUsers className="w-6 h-6 mx-auto mb-2" />
              <div className="font-semibold">Create Team</div>
              <div className="text-xs mt-1">Form a team with others</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSolo(true);
                setValue('is_solo', true);
              }}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                watchedIsSolo
                  ? 'border-primary bg-primary/10 dark:bg-primary/20 text-primary'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-primary/50'
              }`}
            >
              <FiUser className="w-6 h-6 mx-auto mb-2" />
              <div className="font-semibold">Participate Solo</div>
              <div className="text-xs mt-1">Compete as an individual</div>
            </button>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-xl border-2 border-primary/10 dark:border-primary/20">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Team/Participant Name - Primary Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                {watchedIsSolo ? (
                  <>
                    <FiUser className="inline mr-2 text-primary" />
                    Participant Name (Optional)
                  </>
                ) : (
                  <>
                    <FiUsers className="inline mr-2 text-primary" />
                    Team Name *
                  </>
                )}
              </label>
              <Input
                placeholder={watchedIsSolo 
                  ? "Optional: Custom name for your solo participation (defaults to your name)"
                  : "Enter a unique team name (e.g., 'Code Warriors', 'Innovation Squad')"
                }
                error={errors.name?.message}
                {...register('name')}
                disabled={isLoading}
                className="text-lg"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {watchedIsSolo
                  ? "Leave blank to use your name, or enter a custom name for your solo participation"
                  : "Choose a memorable name that represents your team"
                }
              </p>
            </div>
            
            <input type="hidden" {...register('is_solo')} />

            {/* Category Selection - Only if categories exist and not solo */}
            {categories.length > 0 && !watchedIsSolo && (
              <div className="bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5 dark:from-primary/10 dark:via-purple-500/10 dark:to-primary/10 border-2 border-primary/20 dark:border-primary/30 rounded-xl p-5">
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-primary/20 dark:bg-primary/30 rounded-lg mr-3">
                    <FiAward className="text-primary dark:text-primary-400" size={18} />
                  </div>
                  Category Selection *
                </label>
                <select
                  className="w-full px-4 py-3.5 border-2 border-primary/30 dark:border-primary/40 rounded-xl shadow-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base font-medium transition-all hover:border-primary/50 dark:hover:border-primary/60"
                  {...register('category_id')}
                  disabled={isLoading}
                  required={categories.length > 0}
                >
                  <option value="">Choose a category to compete in...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                      {category.max_teams && ` (Max ${category.max_teams} teams)`}
                      {category.description && ` - ${category.description}`}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 flex items-center">
                    <FiInfo className="mr-1" size={14} />
                    {errors.category_id.message}
                  </p>
                )}
                <div className="mt-3 flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <FiInfo className="mt-0.5 flex-shrink-0" size={14} />
                  <p>
                    <strong className="text-gray-900 dark:text-white">Important:</strong> Your team will compete in this category. 
                    {categories.some(c => c.max_teams) && ' Some categories have team limits.'}
                  </p>
                </div>
              </div>
            )}

            {/* Info about categories if none exist */}
            {categories.length === 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start">
                  <FiInfo className="text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                      No Categories Required
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                      This hackathon doesn't have categories. You can create your team without selecting a category.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Description - Optional */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Team Description (Optional)
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                rows={4}
                placeholder="Tell others about your team's goals, skills, or what you're looking for in teammates..."
                {...register('description')}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Optional: Describe your team's focus or what you're looking for
              </p>
            </div>

            {/* Important Information Card */}
            <div className="bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5 dark:from-primary/10 dark:via-purple-500/10 dark:to-primary/10 border border-primary/20 dark:border-primary/30 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <FiInfo className="mr-2 text-primary" />
                Important Information
              </h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {watchedIsSolo ? (
                  <>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">✓</span>
                      <span>You will participate as an <strong>individual competitor</strong></span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">✓</span>
                      <span>You can submit your project individually</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">✓</span>
                      <span>You cannot add members to a solo participation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">✓</span>
                      <span>You can still create a team later if you change your mind</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">✓</span>
                      <span>You will automatically become the <strong>team leader</strong></span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">✓</span>
                      <span>Maximum team size: <strong>{currentHackathon.max_team_size} members</strong></span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">✓</span>
                      <span>You can invite others to join your team after creation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">✓</span>
                      <span>Teams can be locked by organizers when registration closes</span>
                    </li>
                  </>
                )}
                {currentHackathon.team_deadline && (
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>Registration deadline: <strong>{format(new Date(currentHackathon.team_deadline), 'MMM d, yyyy h:mm a')}</strong></span>
                  </li>
                )}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/hackathons/${hackathonId}`)}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading 
                  ? (watchedIsSolo ? 'Creating Solo Participation...' : 'Creating Team...')
                  : (watchedIsSolo ? 'Participate Solo' : 'Create Team & Become Leader')
                }
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default TeamForm;
