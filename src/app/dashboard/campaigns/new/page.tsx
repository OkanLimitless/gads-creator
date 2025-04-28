import { CampaignForm } from "@/components/campaigns/CampaignForm";

export default function NewCampaignPage() {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Create a New Google Ads Campaign
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Create a new search campaign with maximize clicks targeting.
        </p>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <CampaignForm />
      </div>
    </div>
  );
} 