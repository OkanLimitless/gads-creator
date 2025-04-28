import { z } from "zod";

export const campaignSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  name: z.string().min(1, "Campaign name is required").max(100, "Campaign name must be less than 100 characters"),
  budget: z.coerce
    .number()
    .min(1, "Budget must be at least 1")
    .max(10000, "Budget must be less than 10,000"),
  maxCpc: z.coerce
    .number()
    .min(0.01, "Max CPC must be at least 0.01")
    .max(1000, "Max CPC must be less than 1,000"),
  headlines: z
    .array(
      z.string().max(30, "Headlines must be 30 characters or less").min(1, "Headlines cannot be empty")
    )
    .length(10, "Exactly 10 headlines are required"),
  descriptions: z
    .array(
      z.string().max(90, "Descriptions must be 90 characters or less").min(1, "Descriptions cannot be empty")
    )
    .min(1, "At least one description is required"),
});

export type CampaignFormData = z.infer<typeof campaignSchema>; 