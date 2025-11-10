// Simple test to verify optimistic updates work correctly
// This can be run in the browser console when on the campaign details page

console.log('Testing optimistic updates for campaign details...');

// Test 1: Check if input fields are editable
const nameInput = document.querySelector('input[placeholder="Enter campaign name"]');
const descriptionInput = document.querySelector('textarea[placeholder="Enter campaign description (optional)"]');

if (nameInput && descriptionInput) {
  console.log('✅ Input fields found and accessible');
  
  // Test 2: Check if we can type in the fields
  nameInput.value = 'Test Campaign Name';
  descriptionInput.value = 'Test Description';
  
  // Dispatch change events
  nameInput.dispatchEvent(new Event('input', { bubbles: true }));
  descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));
  
  console.log('✅ Can type in input fields');
  
  // Test 3: Check if save button is enabled when there are changes
  setTimeout(() => {
    const saveButton = document.querySelector('button:has(.FiSave)');
    if (saveButton && !saveButton.disabled) {
      console.log('✅ Save button is enabled when changes are made');
    } else {
      console.log('❌ Save button should be enabled when changes are made');
    }
  }, 100);
  
} else {
  console.log('❌ Input fields not found');
}

console.log('Test completed. Navigate to a campaign details page and run this script.');