import { z } from 'zod';

// Lead validation schemas
export const LeadSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().regex(/^[\d\s\-\(\)]+$/, 'Invalid phone number').optional().or(z.literal('')),
  address: z.string().max(200, 'Address is too long').optional(),
  type: z.enum(['bathroom', 'kitchen', 'basement', 'addition', 'deck', 'roofing', 'other']).optional(),
  status: z.enum(['lead', 'qualified', 'estimate', 'closed', 'lost']).optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
});

export const ProjectInfoSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Project name is required'),
  type: z.enum(['bathroom', 'kitchen', 'basement', 'addition', 'deck', 'roofing', 'other']),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['lead', 'qualified', 'estimate', 'closed', 'lost']),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

// API Key validation
export const ApiKeySchema = z.string()
  .min(20, 'API key is too short')
  .regex(/^sk-[a-zA-Z0-9]{32,}$/, 'Invalid API key format');

// Input sanitization helpers
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().slice(0, 100);
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d\s\-\(\)]/g, '').slice(0, 20);
}

// Validation helpers
export function validateLead(lead: unknown): { valid: boolean; errors?: z.ZodError } {
  try {
    LeadSchema.parse(lead);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error };
    }
    return { valid: false };
  }
}

export function validateApiKey(key: string): boolean {
  try {
    ApiKeySchema.parse(key);
    return true;
  } catch {
    return false;
  }
}

