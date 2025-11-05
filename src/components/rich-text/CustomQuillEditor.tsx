import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

export interface CustomQuillEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  height?: number;
}

const CustomQuillEditor: React.FC<CustomQuillEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Start typing...',
  height = 200
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<Quill | null>(null);

  useEffect(() => {
    if (editorRef.current && !quillInstance.current) {
      quillInstance.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder,
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'clean']
          ]
        }
      });

      if (value) {
        quillInstance.current.root.innerHTML = value;
      }

      quillInstance.current.on('text-change', () => {
        const content = quillInstance.current?.root.innerHTML || '';
        onChange?.(content);
      });
    }
  }, []);

  useEffect(() => {
    if (quillInstance.current && value !== quillInstance.current.root.innerHTML) {
      quillInstance.current.root.innerHTML = value;
    }
  }, [value]);

  return (
    <div className="border border-gray-200 rounded-lg">
      <div ref={editorRef} style={{ height: `${height}px` }} />
    </div>
  );
};

export default CustomQuillEditor;
