const ffmpeg = require('ffmpeg-static');
const { execSync } = require('child_process');

console.log('Using ffmpeg from:', ffmpeg);
try {
  // Convert webm to an animated webp (loop=0 for infinite loop, vf=scale to keep size down, fps to keep framerate reasonable)
  execSync(`"${ffmpeg}" -i ../assets/demo.webm -vcodec libwebp -filter:v fps=fps=10 -lossless 0 -compression_level 4 -q:v 50 -loop 0 -preset default -an -vsync 0 -y ../assets/demo.webp`, { stdio: 'inherit' });
  console.log('Conversion successful!');
} catch (error) {
  console.error('Conversion failed:', error);
}
