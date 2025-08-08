import { z } from "zod";

export const phoneSchema = z
  .string()
  .min(8)
  .max(20)
  .regex(/^[+\d][\d\s()-]{7,}$/);

export const createCustomerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: phoneSchema,
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional().default(true),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().or(z.literal("")),
  durationMin: z.number().int().min(5).max(8 * 60),
  priceCents: z.number().int().min(0),
  isActive: z.boolean().optional().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();

export const createAppointmentSchema = z.object({
  customerId: z.string().min(1),
  serviceId: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  notes: z.string().optional().or(z.literal("")),
  status: z.enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
});

export const updateAppointmentSchema = createAppointmentSchema.partial();

export const settingsSchema = z.object({
  businessName: z.string().min(1),
  timezone: z.string().min(1),
  openHour: z.number().int().min(0).max(23),
  closeHour: z.number().int().min(0).max(23),
  slotMinutes: z.number().int().min(5).max(240),
  whatsappFrom: z.string().optional().or(z.literal("")),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;