import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiChevronRight } from 'react-icons/fi';
import Button from '../ui/Button';

const CategoriesTab = ({ hackathon, isOrganizer, hackathonId, onAddCategory, onViewTeams }) => {
  const navigate = useNavigate();

  const handleViewTeams = (categoryId) => {
    if (onViewTeams) {
      onViewTeams(categoryId);
    } else {
      // Fallback: navigate with query parameter
      navigate(`/hackathons/${hackathonId}?category=${categoryId}&tab=teams`);
    }
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Categories</h3>
        {isOrganizer && (
          <Button onClick={onAddCategory} className="flex items-center">
            <FiPlus className="mr-2" />
            Add Category
          </Button>
        )}
      </div>

      {!hackathon.categories || hackathon.categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No categories yet</p>
          {isOrganizer && (
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              Add categories to organize teams
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hackathon.categories.map((category) => (
            <div
              key={category.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <h4 className="font-medium text-gray-900 dark:text-white">{category.name}</h4>
              {category.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  {category.description}
                </p>
              )}
              {category.max_teams && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Max teams: {category.max_teams}
                </p>
              )}
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => handleViewTeams(category.id)}
                  className="text-primary dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm flex items-center transition-colors"
                >
                  View Teams
                  <FiChevronRight className="ml-1" />
                </button>
                {isOrganizer && (
                  <div className="flex space-x-2">
                    <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                      <FiEdit size={16} />
                    </button>
                    <button className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400">
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesTab;





