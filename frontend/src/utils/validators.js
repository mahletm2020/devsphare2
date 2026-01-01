  import * as yup from 'yup';

  export const loginSchema = yup.object({
    email: yup
      .string()
      .email('Please enter a valid email')
      .required('Email is required'),
    password: yup
      .string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
  });

  export const registerSchema = yup.object({
    name: yup
      .string()
      .required('Name is required')
      .max(255, 'Name is too long'),
    email: yup
      .string()
      .email('Please enter a valid email')
      .required('Email is required'),
    password: yup
      .string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
    password_confirmation: yup
      .string()
      .oneOf([yup.ref('password'), null], 'Passwords must match')
      .required('Password confirmation is required'),
    role: yup
      .string()
      .oneOf(['participant', 'organizer', 'sponsor'], 'Invalid role selected')
      .required('Role is required'),
  });