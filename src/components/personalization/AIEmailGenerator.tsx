import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiZap, FiRefreshCw, FiCopy, FiCheck, FiEdit3, FiAlertCircle } from 'react-icons/fi';

interface AIEmailGeneratorProps {
  prospect: {
    name: string;
    company: string;
    title: string;
    industry?: string;
  };
  onGenerate: (content: { subject: string; body: string }) => void;
  onClose: () => void;
}

const AIEmailGenerator: React.FC<AIEmailGeneratorProps> = ({ prospect, onGenerate, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    subject: string;
    body: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const predefinedPrompts = [
    `Write a personalized email to ${prospect.name}, ${prospect.title} at ${prospect.company}. Focus on their recent achievements.`,
    `Create a compelling outreach email for ${prospect.name} mentioning ${prospect.company}'s innovation in their industry.`,
    `Generate a professional email that references ${prospect.name}'s role as ${prospect.title} at ${prospect.company}.`,
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt or select a predefined option');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Simulate AI API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock AI generation - in real app, this would call your AI service
      const mockGenerated = {
        subject: `Re: Innovation at ${prospect.company}`,
        body: `Hi ${prospect.name},

I hope this email finds you well. I've been following ${prospect.company}'s work and I'm particularly impressed by your team's recent achievements.

As ${prospect.title}, you're likely focused on scaling your impact while maintaining quality. I believe our solution could help streamline your workflows and free up more time for strategic initiatives.

Would you be open to a brief 15-minute call next week to explore how we might support your goals?

Best regards,
[Your Name]`
      };

      setGeneratedContent(mockGenerated);
    } catch (err) {
      setError('Failed to generate email. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock regeneration with slightly different content
      const mockRegenerated = {
        subject: `Following up on ${prospect.company}'s success`,
        body: `Hello ${prospect.name},

I wanted to reach out personally after seeing the great work happening at ${prospect.company}. Your leadership as ${prospect.title} is clearly driving impressive results.

I noticed your team has been focusing on innovation and growth - areas where we've helped similar companies achieve remarkable results.

Would you be interested in learning how our platform has helped leaders like you accelerate their initiatives?

Looking forward to connecting,
[Your Name]`
      };

      setGeneratedContent(mockRegenerated);
    } catch (err) {
      setError('Failed to regenerate email. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedContent) return;
    
    const textToCopy = `Subject: ${generatedContent.subject}\n\n${generatedContent.body}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard');
    }
  };

  const handleUseGenerated = () => {
    if (generatedContent) {
      onGenerate(generatedContent);
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FiZap className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">AI Email Generator</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ×
        </button>
      </div>

      {/* Prospect Context */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-purple-800">
          <strong>Target:</strong> {prospect.name}, {prospect.title} at {prospect.company}
        </p>
      </div>

      {/* Prompt Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What would you like the email to focus on?
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the email content you want to generate..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Predefined Prompts */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Quick suggestions:</p>
        <div className="space-y-2">
          {predefinedPrompts.map((predefinedPrompt, index) => (
            <button
              key={index}
              onClick={() => setPrompt(predefinedPrompt)}
              className="w-full text-left p-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {predefinedPrompt}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
            isGenerating || !prompt.trim()
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <FiZap className="w-4 h-4 mr-2" />
              Generate Email
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <FiAlertCircle className="w-4 h-4 text-red-600 mr-2" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Generated Content */}
      {generatedContent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t pt-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">Generated Email</h4>
            <div className="flex gap-2">
              <button
                onClick={handleRegenerate}
                disabled={isGenerating}
                className={`flex items-center px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  isGenerating
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiRefreshCw className="w-3 h-3 mr-1" />
                Regenerate
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                {copied ? (
                  <>
                    <FiCheck className="w-3 h-3 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <FiCopy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Subject:</p>
              <p className="text-sm text-gray-900">{generatedContent.subject}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Body:</p>
              <div className="text-sm text-gray-900 whitespace-pre-wrap bg-white rounded p-3 border border-gray-200">
                {generatedContent.body}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleUseGenerated}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              <FiCheck className="w-4 h-4 mr-2" />
              Use This Email
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AIEmailGenerator;
