"use client";

interface AdTextInputsProps {
  headlines: string[];
  descriptions: string[];
  onHeadlineChange: (index: number, value: string) => void;
  onDescriptionChange: (index: number, value: string) => void;
  onAddDescription: () => void;
  onRemoveDescription: (index: number) => void;
  headlineErrors?: string[];
  descriptionErrors?: string[];
}

export function AdTextInputs({
  headlines,
  descriptions,
  onHeadlineChange,
  onDescriptionChange,
  onAddDescription,
  onRemoveDescription,
  headlineErrors = [],
  descriptionErrors = [],
}: AdTextInputsProps) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Headlines</h3>
        <p className="mt-1 text-sm text-gray-500">
          Enter 10 headlines, each with a maximum of 30 characters. These will be shown in your search ads.
        </p>
        <div className="mt-4 space-y-4">
          {headlines.map((headline, index) => (
            <div key={`headline-${index}`} className="flex items-start">
              <div className="flex-grow">
                <div className="relative">
                  <input
                    type="text"
                    className={`block w-full pr-16 rounded-md shadow-sm ${
                      headlineErrors[index]
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    placeholder={`Headline ${index + 1}`}
                    value={headline}
                    onChange={(e) => onHeadlineChange(index, e.target.value)}
                    maxLength={30}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className={`text-sm ${headline.length > 30 ? "text-red-500" : "text-gray-400"}`}>
                      {headline.length}/30
                    </span>
                  </div>
                </div>
                {headlineErrors[index] && (
                  <p className="mt-1 text-sm text-red-600">{headlineErrors[index]}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Descriptions</h3>
        <p className="mt-1 text-sm text-gray-500">
          Enter at least one description with a maximum of 90 characters. This will appear below your headlines.
        </p>
        <div className="mt-4 space-y-4">
          {descriptions.map((description, index) => (
            <div key={`description-${index}`} className="flex items-start">
              <div className="flex-grow">
                <div className="relative">
                  <input
                    type="text"
                    className={`block w-full pr-16 rounded-md shadow-sm ${
                      descriptionErrors[index]
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    placeholder={`Description ${index + 1}`}
                    value={description}
                    onChange={(e) => onDescriptionChange(index, e.target.value)}
                    maxLength={90}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className={`text-sm ${description.length > 90 ? "text-red-500" : "text-gray-400"}`}>
                      {description.length}/90
                    </span>
                  </div>
                </div>
                {descriptionErrors[index] && (
                  <p className="mt-1 text-sm text-red-600">{descriptionErrors[index]}</p>
                )}
              </div>
              {descriptions.length > 1 && (
                <button
                  type="button"
                  className="ml-2 p-1 rounded-md text-gray-400 hover:text-red-500"
                  onClick={() => onRemoveDescription(index)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={onAddDescription}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add Description
          </button>
        </div>
      </div>
    </div>
  );
} 