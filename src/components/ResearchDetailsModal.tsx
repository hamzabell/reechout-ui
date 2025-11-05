import React from 'react';
import ModalWrapper from './ModalWrapper';
import { FaBuilding, FaLightbulb, FaUsers } from 'react-icons/fa';

interface ResearchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: {
    name: string;
    email: string;
    company: string;
    title?: string;
    researchData?: any;
  } | null;
}

const ResearchDetailsModal: React.FC<ResearchDetailsModalProps> = ({
  isOpen,
  onClose,
  prospect
}) => {
  if (!prospect || !prospect.researchData) return null;

  const { researchData } = prospect;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl"
    >
      <div className="bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Research: {prospect.name}</h2>
              <p className="text-sm text-gray-600">{prospect.title} at {prospect.company}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="space-y-4">
            {/* Company Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <FaBuilding className="w-4 h-4 mr-2 text-blue-600" />
                Company Information
              </h3>
              <div className="text-sm text-gray-700">
                <p className="mb-2">{researchData.companyInfo?.description || 'No description available'}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium">Size:</span> {researchData.companyInfo?.employees || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Revenue:</span> {researchData.companyInfo?.revenue || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Founded:</span> {researchData.companyInfo?.founded || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {researchData.companyInfo?.headquarters || "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <FaLightbulb className="w-4 h-4 mr-2 text-blue-600" />
                Key Insights
              </h3>
              <ul className="space-y-1 text-sm text-gray-700">
                {(researchData.insights?.recentActivities || []).slice(0, 3).map((insight: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-1">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            {/* Leadership Team */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <FaUsers className="w-4 h-4 mr-2 text-green-600" />
                Leadership Team
              </h3>
              <div className="space-y-2">
                {researchData.companyInfo?.keyPeople || [].slice(0, 2).map((leader: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{leader}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .overflow-y-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </ModalWrapper>
  );
};

export default ResearchDetailsModal;
