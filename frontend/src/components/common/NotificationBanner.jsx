import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiX, FiClock, FiInfo, FiAward } from 'react-icons/fi';
import { format } from 'date-fns';

const NotificationBanner = ({ 
  type = 'info', // 'success', 'warning', 'error', 'info'
  title,
  message,
  deadline,
  onClose,
  autoClose = false,
  autoCloseDelay = 5000,
  persistent = false
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && !persistent && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, persistent, isVisible, onClose]);

  if (!isVisible) return null;

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-700',
          icon: 'text-green-600 dark:text-green-400',
          title: 'text-green-900 dark:text-green-200',
          message: 'text-green-800 dark:text-green-300',
          iconComponent: FiCheckCircle
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          border: 'border-amber-200 dark:border-amber-700',
          icon: 'text-amber-600 dark:text-amber-400',
          title: 'text-amber-900 dark:text-amber-200',
          message: 'text-amber-800 dark:text-amber-300',
          iconComponent: FiAlertCircle
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-700',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-900 dark:text-red-200',
          message: 'text-red-800 dark:text-red-300',
          iconComponent: FiAlertCircle
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-700',
          icon: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-900 dark:text-blue-200',
          message: 'text-blue-800 dark:text-blue-300',
          iconComponent: FiInfo
        };
    }
  };

  const styles = getStyles();
  const Icon = styles.iconComponent;

  return (
    <div className={`${styles.bg} border-l-4 ${styles.border} p-4 mb-6 rounded-r-lg shadow-md`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${styles.icon}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-semibold ${styles.title} mb-1`}>
              {title}
            </h3>
          )}
          <p className={`text-sm ${styles.message}`}>
            {message}
          </p>
          {deadline && (
            <div className="mt-2 flex items-center text-xs">
              <FiClock className={`mr-1 ${styles.icon}`} size={14} />
              <span className={styles.message}>
                Deadline: {format(new Date(deadline), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          )}
        </div>
        {!persistent && onClose && (
          <button
            onClick={() => {
              setIsVisible(false);
              onClose();
            }}
            className={`ml-4 flex-shrink-0 ${styles.icon} hover:opacity-75 transition-opacity`}
          >
            <FiX className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationBanner;



