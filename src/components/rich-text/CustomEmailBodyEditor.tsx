import React, { useState } from 'react';
import { FiMail, FiUser, FiAlertCircle } from 'react-icons/fi';
import CustomQuillEditor, { CustomQuillEditorProps } from './CustomQuillEditor';

export interface CustomEmailBodyEditorProps extends CustomQuillEditorProps {
  recipientName?: string;
  subject?: string;
  enableVariables?: boolean;
  availableVariables?: string[];
  onInsertVariable?: (variable: string) => void;
  name?: string;
  required?: boolean;
}

const CustomEmailBodyEditor: React.FC<CustomEmailBodyEditorProps> = ({
  recipientName,
  subject,
  enableVariables = true,
  availableVariables = [],
  onInsertVariable,
  name = 'emailBody',
  required = false,
  value,
  onChange,
  placeholder,
  height,
  ...rest
}) => {
  const [selectedVariable, setSelectedVariable] = useState('');

  const handleInsertVariable = (variable: string) => {
    const variableTag = variable === "custom" ? "{{}}" : `{{${variable}}}`;
    if (onChange && value !== undefined) {
      const newValue = value + variableTag;
      onChange(newValue);
    }
    setSelectedVariable('');
    onInsertVariable?.(variable);
  };

  const customToolbar = enableVariables ? (
    <div className="flex items-center gap-2 mb-2">
      <select
        value={selectedVariable}
        onChange={(e) => {
          const variable = e.target.value;
          if (variable) {
            handleInsertVariable(variable);
          }
        }}
        className="text-xs px-2 py-1 border border-gray-300 rounded"
        title="Insert personalization variable"
      >
        <option value="">Insert Variable...</option>
        {[...availableVariables, "custom"].map(variable => (
          <option key={variable} value={variable}>
            {variable === "custom" ? "Custom Field..." : variable}
          </option>
        ))}
      </select>
    </div>
  ) : null;

  return (
    <div className="space-y-2">
      {(recipientName || subject) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          {recipientName && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <FiUser className="w-4 h-4" />
              <span>To: {recipientName}</span>
            </div>
          )}
          {subject && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiMail className="w-4 h-4" />
              <span>Subject: {subject}</span>
            </div>
          )}
        </div>
      )}

      {customToolbar}

      <CustomQuillEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder || "Compose your email message here..."}
        height={height || 250}
        {...rest}
      />

      {enableVariables && availableVariables.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FiAlertCircle className="w-3 h-3" />
          <span>
            Personalize your email using variables like {"{{"}firstName{"}}"} or {"{{"}company{"}}"}
          </span>
        </div>
      )}

      <input 
        type="hidden" 
        name={name} 
        value={value || ''} 
        required={required}
      />
    </div>
  );
};

export default CustomEmailBodyEditor;
