const fs = require('fs');

// Simple ICO file creator
// This creates a minimal 16x16 favicon.ico with a circular gradient "R" logo

function createFaviconICO() {
  // Create a simple 16x16 canvas representation in memory
  const size = 16;
  const pixels = new Uint8Array(size * size * 4); // RGBA

  // Fill with white background
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 255;     // R
    pixels[i + 1] = 255; // G
    pixels[i + 2] = 255; // B
    pixels[i + 3] = 255; // A
  }

  // Create circular gradient background
  const centerX = 8, centerY = 8, radius = 7;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= radius) {
        // Gradient from indigo to purple
        const t = distance / radius;
        const r = Math.floor(99 * (1 - t) + 139 * t);    // 99 to 139
        const g = Math.floor(102 * (1 - t) + 92 * t);    // 102 to 92
        const b = Math.floor(241 * (1 - t) + 246 * t);   // 241 to 246

        const i = (y * size + x) * 4;
        pixels[i] = r;
        pixels[i + 1] = g;
        pixels[i + 2] = b;
        pixels[i + 3] = 255;
      }

      // Draw "R" letter (simplified pixel art)
      const rShape = [
        [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
        [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
        [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
        [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
        [1,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0],
        [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
        [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
        [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
        [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
        [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
        [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
        [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
        [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0]
      ];

      if (distance <= radius - 2 && rShape[y][x] === 1) {
        // Draw the "R" letter in dark color
        const i = (y * size + x) * 4;
        pixels[i] = 99;      // R (indigo)
        pixels[i + 1] = 102; // G
        pixels[i + 2] = 241; // B
        pixels[i + 3] = 255; // A
      }
    }
  }

  // Create ICO header
  const buffer = Buffer.alloc(22 + 40 + 1024); // Header + Info Header + Pixels

  // ICO Header (6 bytes)
  buffer.writeUInt16LE(0, 0);      // Reserved
  buffer.writeUInt16LE(1, 2);      // Type (1 = ICO)
  buffer.writeUInt16LE(1, 4);      // Number of images

  // Image Directory Entry (16 bytes)
  buffer.writeUInt8(16, 6);        // Width
  buffer.writeUInt8(16, 7);        // Height
  buffer.writeUInt8(0, 8);         // Color palette (0 = no palette)
  buffer.writeUInt8(0, 9);         // Reserved
  buffer.writeUInt16LE(1, 10);     // Color planes
  buffer.writeUInt16LE(32, 12);    // Bits per pixel
  buffer.writeUInt32LE(1024, 14);  // Image size
  buffer.writeUInt32LE(22, 18);    // Image offset

  // BMP Info Header (40 bytes)
  buffer.writeUInt32LE(40, 22);    // Header size
  buffer.writeInt32LE(16, 26);     // Width
  buffer.writeInt32LE(32, 30);     // Height (doubled for XOR+AND masks)
  buffer.writeUInt16LE(1, 34);     // Planes
  buffer.writeUInt16LE(32, 36);    // Bits per pixel
  buffer.writeUInt32LE(0, 38);     // Compression
  buffer.writeUInt32LE(1024, 42);  // Image size
  buffer.writeInt32LE(0, 46);      // X pixels per meter
  buffer.writeInt32LE(0, 50);      // Y pixels per meter
  buffer.writeUInt32LE(0, 54);     // Colors used
  buffer.writeUInt32LE(0, 58);     // Important colors

  // Pixel data (1024 bytes) - BGRA format, bottom to top
  for (let y = size - 1; y >= 0; y--) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const pixelIndex = 62 + ((size - 1 - y) * size + x) * 4;
      buffer[pixelIndex] = pixels[i + 2];     // B
      buffer[pixelIndex + 1] = pixels[i + 1]; // G
      buffer[pixelIndex + 2] = pixels[i];     // R
      buffer[pixelIndex + 3] = pixels[i + 3]; // A
    }
  }

  fs.writeFileSync('public/favicon.ico', buffer);
  console.log('Favicon.ico created successfully!');
}

createFaviconICO();