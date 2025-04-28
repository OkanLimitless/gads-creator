"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { CampaignFormData, campaignSchema } from "@/lib/validations/campaignSchema";
import { AccountSelector } from "@/components/accounts/AccountSelector";
import { AdTextInputs } from "@/components/campaigns/AdTextInputs";

const DEFAULT_HEADLINES = Array(10).fill("");
const DEFAULT_DESCRIPTIONS = [""];

export function CampaignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams.get("customerId") || "";
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      customerId: initialCustomerId,
      name: "",
      budget: 5,
      maxCpc: 1,
      headlines: DEFAULT_HEADLINES,
      descriptions: DEFAULT_DESCRIPTIONS,
    },
  });
  
  // Watch form values for controlled components
  const watchCustomerId = watch("customerId");
  const watchHeadlines = watch("headlines");
  const watchDescriptions = watch("descriptions");
  
  const onHeadlineChange = (index: number, value: string) => {
    const headlines = [...watchHeadlines];
    headlines[index] = value;
    setValue("headlines", headlines, { shouldValidate: true });
  };
  
  const onDescriptionChange = (index: number, value: string) => {
    const descriptions = [...watchDescriptions];
    descriptions[index] = value;
    setValue("descriptions", descriptions, { shouldValidate: true });
  };
  
  const onAddDescription = () => {
    setValue("descriptions", [...watchDescriptions, ""], { shouldValidate: true });
  };
  
  const onRemoveDescription = (index: number) => {
    const descriptions = watchDescriptions.filter((_, i) => i !== index);
    setValue("descriptions", descriptions, { shouldValidate: true });
  };
  
  const onSubmit: SubmitHandler<CampaignFormData> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await axios.post("/api/google-ads/campaigns", data);
      router.push(`/dashboard/campaigns/success?id=${response.data.campaignId}`);
    } catch (err: any) {
      console.error("Error creating campaign:", err);
      setError(err.response?.data?.error || "Failed to create campaign");
      setIsSubmitting(false);
    }
  };
  
  // Helper function to safely map error messages
  const mapErrorMessages = (errors: any[] | undefined): string[] => {
    if (!errors) return [];
    return errors.map((err) => err?.message || '');
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error creating campaign</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-8 divide-y divide-gray-200">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Campaign Information</h3>
            <p className="mt-1 text-sm text-gray-500">
              Basic information about your campaign.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <AccountSelector
                value={watchCustomerId}
                onChange={(value) => setValue("customerId", value, { shouldValidate: true })}
                error={errors.customerId?.message}
              />
            </div>
            
            <div className="sm:col-span-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Campaign Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="name"
                  {...register("name")}
                  className={`shadow-sm block w-full sm:text-sm rounded-md ${
                    errors.name
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                />
              </div>
              {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>}
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                Daily Budget ($)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="budget"
                  {...register("budget")}
                  min="1"
                  step="0.01"
                  className={`pl-7 block w-full pr-12 sm:text-sm rounded-md ${
                    errors.budget
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                />
              </div>
              {errors.budget && <p className="mt-2 text-sm text-red-600">{errors.budget.message}</p>}
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="maxCpc" className="block text-sm font-medium text-gray-700">
                Max CPC ($)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="maxCpc"
                  {...register("maxCpc")}
                  min="0.01"
                  step="0.01"
                  className={`pl-7 block w-full pr-12 sm:text-sm rounded-md ${
                    errors.maxCpc
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                />
              </div>
              {errors.maxCpc && <p className="mt-2 text-sm text-red-600">{errors.maxCpc.message}</p>}
            </div>
          </div>
        </div>
        
        <div className="pt-8">
          <AdTextInputs
            headlines={watchHeadlines}
            descriptions={watchDescriptions}
            onHeadlineChange={onHeadlineChange}
            onDescriptionChange={onDescriptionChange}
            onAddDescription={onAddDescription}
            onRemoveDescription={onRemoveDescription}
            headlineErrors={mapErrorMessages(errors.headlines as any[])}
            descriptionErrors={mapErrorMessages(errors.descriptions as any[])}
          />
        </div>
      </div>
      
      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="button"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => reset()}
            disabled={isSubmitting}
          >
            Reset
          </button>
          <button
            type="submit"
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Campaign"}
          </button>
        </div>
      </div>
    </form>
  );
} 