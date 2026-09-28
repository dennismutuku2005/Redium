import { z } from 'zod';
import { normalizeMac, isValidMac } from './mac-utils';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const brandSchema = z.object({
  name: z.string().trim().min(1, 'Brand name is required').max(50, 'Brand name is too long'),
});

export const routerSchema = z.object({
  mac: z.string().trim().refine((val) => {
    return isValidMac(val);
  }, {
    message: 'Invalid MAC address. Must contain 12 valid hexadecimal characters.',
  }),
  brandId: z.string().min(1, 'Brand is required'),
  model: z.string().trim().max(100, 'Model name too long').optional().nullable(),
  serial: z.string().trim().max(100, 'Serial number too long').optional().nullable(),
  locationName: z.string().trim().min(2, 'Location name is required (at least 2 characters)').max(200, 'Location is too long'),
  landmark: z.string().trim().max(200, 'Landmark description too long').optional().nullable(),
  status: z.enum(['Active', 'Inactive', 'Faulty']).default('Active'),
  notes: z.string().max(2000, 'Notes too long').optional().nullable(),
  photoUrls: z.array(z.string()).optional().default([]),
});

export const csvRowSchema = z.object({
  mac: z.string().trim(),
  brand: z.string().trim().min(1, 'Brand is required'),
  locationName: z.string().trim().min(2, 'Location name is required'),
  model: z.string().trim().optional(),
  serial: z.string().trim().optional(),
  landmark: z.string().trim().optional(),
  status: z.enum(['Active', 'Inactive', 'Faulty']).optional().default('Active'),
  notes: z.string().trim().optional(),
});
