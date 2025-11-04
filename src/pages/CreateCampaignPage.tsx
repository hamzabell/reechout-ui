import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';

const CreateCampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleCreateSequence = async () => {
    setIsLoading(true);
    try {
      // Generate a unique ID for the new sequence
      const newSequenceId = `seq_${Date.now()}`;

      // In a real app, you would save this to your backend
      // For now, we'll just simulate the creation and redirect

      showToast('New sequence created successfully!', 'success');
      navigate(`/dashboard/campaigns/${newSequenceId}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create sequence', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/campaigns');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
              <i className="fas fa-plus text-2xl text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Sequence</h1>
            <p className="text-gray-600 mb-8">
              Start building your automated email sequence by creating a blank canvas.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleCreateSequence}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  Creating Sequence...
                </>
              ) : (
                <>
                  <i className="fas fa-plus" />
                  Create Blank Sequence
                </>
              )}
            </button>

            <button
              onClick={handleCancel}
              className="w-full px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <i className="fas fa-info-circle text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What happens next?</p>
                <p className="text-blue-700">
                  You'll be taken to your new sequence where you can add steps,
                  personalize emails, and add prospects from the prospects tab.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignPage;