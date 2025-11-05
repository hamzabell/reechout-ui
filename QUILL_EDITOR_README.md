# Quill.js WYSIWYG Editor Components

This project includes two powerful Quill.js-based rich text editor components designed to replace existing email body fields throughout the application.

## Components Overview

### 1. QuillEditor (General Purpose)
A full-featured rich text editor with comprehensive formatting options and preview functionality.

### 2. EmailBodyEditor (Email-Specific)
A specialized editor optimized for email composition with personalization variables and email-specific features.

## Installation

The components use the following dependencies (already installed):

```bash
npm install quill react-quill --legacy-peer-deps
```

## Quick Start

### Basic Usage

```tsx
import { QuillEditor, EmailBodyEditor } from '@/components/rich-text';

function MyComponent() {
  const [content, setContent] = useState('<p>Hello World</p>');

  return (
    <QuillEditor
      value={content}
      onChange={setContent}
      placeholder="Start typing..."
      height={300}
    />
  );
}
```

### Email Form Example

```tsx
import { EmailBodyEditor } from '@/components/rich-text';

function EmailForm() {
  const [emailBody, setEmailBody] = useState('');
  
  const variables = ['firstName', 'company', 'title'];

  return (
    <form>
      <EmailBodyEditor
        value={emailBody}
        onChange={setEmailBody}
        recipientName="John Doe"
        subject="Introduction"
        enableVariables={true}
        availableVariables={variables}
        name="emailBody"
        required={true}
      />
      <button type="submit">Send Email</button>
    </form>
  );
}
```

## Component Props

### QuillEditor Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `''` | Editor content (HTML string) |
| `onChange` | `function` | - | Content change handler |
| `onSubmit` | `function` | - | Submit handler |
| `onCancel` | `function` | - | Cancel handler |
| `placeholder` | `string` | `'Start composing...'` | Placeholder text |
| `height` | `number` | `300` | Editor height in pixels |
| `editMode` | `boolean` | `true` | Initial edit mode |
| `enablePreview` | `boolean` | `true` | Enable preview mode |
| `showSubmitButton` | `boolean` | `true` | Show submit button |
| `showCancelButton` | `boolean` | `true` | Show cancel button |
| `required` | `boolean` | `false` | Field validation |
| `minLength` | `number` | - | Minimum character count |
| `maxLength` | `number` | - | Maximum character count |
| `modules` | `object` | - | Custom Quill modules |
| `formats` | `string[]` | - | Custom Quill formats |
| `disabled` | `boolean` | `false` | Disable editor |
| `loading` | `boolean` | `false` | Loading state |
| `error` | `string` | - | Error message |

### EmailBodyEditor Props

Includes all QuillEditor props plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `recipientName` | `string` | - | Email recipient name |
| `subject` | `string` | - | Email subject line |
| `enableVariables` | `boolean` | `true` | Enable personalization |
| `availableVariables` | `string[]` | `[]` | Array of variable names |
| `onInsertVariable` | `function` | - | Variable insert handler |
| `name` | `string` | `'emailBody'` | Form input name |

## Features

### QuillEditor Features
- ✅ Full rich text formatting (bold, italic, underline, etc.)
- ✅ Headers, lists, quotes, and code blocks
- ✅ Color and background color options
- ✅ Links, images, and video embedding
- ✅ Edit/Preview mode toggle
- ✅ Built-in validation and error handling
- ✅ Customizable toolbar and formats
- ✅ Responsive design
- ✅ Accessibility support

### EmailBodyEditor Features
- ✅ All QuillEditor features
- ✅ Simplified toolbar optimized for email
- ✅ Personalization variable support
- ✅ Recipient and subject display
- ✅ Email preview with variable highlighting
- ✅ Form integration with hidden input
- ✅ Send/Discard actions
- ✅ Variable dropdown selector

## Personalization Variables

The EmailBodyEditor supports personalization variables using the `{{variableName}}` syntax. These are automatically highlighted in preview mode:

```html
<p>Hi {{firstName}},</p>
<p>I noticed you work at {{company}} as a {{title}}.</p>
```

### Available Variables
- `firstName`
- `lastName`
- `company`
- `title`
- `industry`
- `location`
- `referral`
- Custom variables can be added via `availableVariables` prop

## Integration Guide

### Replacing Existing Email Body Fields

1. **Import the component:**
```tsx
import { EmailBodyEditor } from '@/components/rich-text';
```

2. **Replace textarea/input with EmailBodyEditor:**
```tsx
// Before:
<textarea
  name="emailBody"
  value={emailBody}
  onChange={(e) => setEmailBody(e.target.value)}
  placeholder="Enter email body..."
/>

// After:
<EmailBodyEditor
  value={emailBody}
  onChange={setContent}
  name="emailBody"
  required={true}
/>
```

3. **Handle form submission:**
```tsx
const handleSubmit = (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const emailBody = formData.get('emailBody'); // Gets the HTML content
  // Submit to API...
};
```

### Form Integration

The EmailBodyEditor includes a hidden input field for seamless form integration:

```tsx
<form onSubmit={handleSubmit}>
  <EmailBodyEditor
    name="emailBody"
    value={emailBody}
    onChange={setEmailBody}
    required={true}
  />
  <button type="submit">Send</button>
</form>
```

## Styling

The components use Tailwind CSS classes and can be customized through props:

```tsx
<EmailBodyEditor
  containerClassName="custom-container-class"
  className="custom-editor-class"
  height={400}
/>
```

## Validation

Built-in validation support:

```tsx
<EmailBodyEditor
  required={true}
  minLength={10}
  maxLength={5000}
  error={errorMessage}
/>
```

## Advanced Configuration

### Custom Toolbar

```tsx
const customModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'clean']
  ]
};

<QuillEditor
  modules={customModules}
  formats={['bold', 'italic', 'underline', 'list', 'link']}
/>
```

### Event Handling

```tsx
const handleChange = (content, delta, source, editor) => {
  console.log('Content changed:', content);
  console.log('Text length:', editor.getLength());
  console.log('Plain text:', editor.getText());
};

<QuillEditor
  onChange={handleChange}
  onSubmit={async (content) => {
    await saveContent(content);
  }}
/>
```

## Files Structure

```
src/components/rich-text/
├── QuillEditor.tsx           # Main Quill editor component
├── EmailBodyEditor.tsx       # Email-specific editor
├── QuillEditorDemo.tsx       # Demo and examples
├── EmailFormExample.tsx      # Form integration example
└── index.ts                  # Export file
```

## Demo Pages

- `/quill-editor-test` - Full demo with both components
- `EmailFormExample` - Complete email form integration

## Browser Support

The Quill.js editor supports all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Migration from Existing Editors

### From ImprovedRichTextEditor

1. Replace imports:
```tsx
// Old
import { ImprovedRichTextEditor } from './rich-text/ImprovedRichTextEditor';

// New
import { EmailBodyEditor } from './rich-text';
```

2. Update props:
```tsx
// Old
<ImprovedRichTextEditor
  value={content}
  onChange={setContent}
  enablePersonalization={true}
  availableVariables={variables}
/>

// New
<EmailBodyEditor
  value={content}
  onChange={setContent}
  enableVariables={true}
  availableVariables={variables}
/>
```

3. Update event handlers:
```tsx
// Old: onChange receives plain string
const handleChange = (content: string) => setContent(content);

// New: onChange receives Quill parameters
const handleChange = (content: string, delta: any, source: string, editor: any) => {
  setContent(content);
};
```

## Troubleshooting

### Common Issues

1. **CSS Import Issues**
   - Make sure to import the Quill CSS: `import 'react-quill/dist/quill.snow.css';`

2. **Form Submission**
   - Use the `name` prop for form integration
   - The hidden input automatically syncs with editor content

3. **Variable Display**
   - Variables use `{{variableName}}` syntax
   - They're automatically highlighted in preview mode

4. **Height Issues**
   - Set explicit height via `height` prop
   - The bottom action bar automatically adjusts

### Performance Tips

- Use `value` prop for controlled components
- Avoid excessive onChange calls
- Consider debouncing for auto-save functionality
- Use `enablePreview={false}` for simple use cases

## Contributing

When modifying the components:

1. Maintain TypeScript types
2. Follow existing code patterns
3. Update documentation
4. Test with different content types
5. Ensure accessibility standards

## License

These components are part of the reechout-react project.
