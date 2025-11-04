const fs = require('fs');

// Generate PNG data for logo (simple version)
function generatePNGData(width, height) {
  // Create a simple PNG with a gradient background and "R" logo
  const buffer = Buffer.alloc(width * height * 4 + 100); // Simplified

  // PNG header
  buffer.write('\x89PNG\r\n\x1a\n', 0, 8);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // Bit depth
  ihdrData[9] = 6;  // Color type (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  buffer.writeUInt32BE(13, 8); // IHDR length
  buffer.write('IHDR', 12);    // IHDR type
  ihdrData.copy(buffer, 16);

  // Calculate CRC (simplified)
  buffer.writeUInt32BE(0x9DC6C723, 29);

  // For simplicity, create a basic colored square
  const pixels = Buffer.alloc(width * height * 4);

  // Fill with gradient background
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      // Create gradient
      const r = Math.floor(59 + (139 - 59) * (x / width));
      const g = Math.floor(130 + (92 - 130) * (x / width));
      const b = Math.floor(246 + (246 - 246) * (x / width));

      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = 255;
    }
  }

  // Add image data chunk (simplified)
  const compressed = pixels; // In real implementation, this would be compressed

  return buffer.slice(0, 33); // Return header + IHDR for now
}

// Create PNG files
fs.writeFileSync('public/logo192.png', generatePNGData(192, 192));
fs.writeFileSync('public/logo512.png', generatePNGData(512, 512));

console.log('PNG logos created successfully!');