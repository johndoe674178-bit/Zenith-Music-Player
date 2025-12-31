import { useState, useEffect } from 'react';

interface ExtractedColors {
    primary: string;
    secondary: string;
    isDark: boolean;
}

/**
 * Extracts dominant colors from an image URL
 * Returns primary and secondary colors as hex strings
 */
export const useColorExtractor = (imageUrl: string | undefined): ExtractedColors => {
    const [colors, setColors] = useState<ExtractedColors>({
        primary: '#1DB954',
        secondary: '#121212',
        isDark: true
    });

    useEffect(() => {
        if (!imageUrl) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // Small sample for performance
                canvas.width = 50;
                canvas.height = 50;
                ctx.drawImage(img, 0, 0, 50, 50);

                const imageData = ctx.getImageData(0, 0, 50, 50);
                const pixels = imageData.data;

                // Color buckets for averaging
                const colorBuckets: { [key: string]: { r: number; g: number; b: number; count: number } } = {};

                for (let i = 0; i < pixels.length; i += 16) { // Sample every 4th pixel
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];

                    // Skip very dark or very light pixels
                    const brightness = (r + g + b) / 3;
                    if (brightness < 30 || brightness > 225) continue;

                    // Bucket colors by rounding
                    const bucketR = Math.round(r / 32) * 32;
                    const bucketG = Math.round(g / 32) * 32;
                    const bucketB = Math.round(b / 32) * 32;
                    const key = `${bucketR}-${bucketG}-${bucketB}`;

                    if (!colorBuckets[key]) {
                        colorBuckets[key] = { r: 0, g: 0, b: 0, count: 0 };
                    }
                    colorBuckets[key].r += r;
                    colorBuckets[key].g += g;
                    colorBuckets[key].b += b;
                    colorBuckets[key].count++;
                }

                // Sort by count and get top 2
                const sorted = Object.values(colorBuckets)
                    .filter(b => b.count > 2)
                    .sort((a, b) => b.count - a.count);

                if (sorted.length >= 1) {
                    const primary = sorted[0];
                    const pR = Math.round(primary.r / primary.count);
                    const pG = Math.round(primary.g / primary.count);
                    const pB = Math.round(primary.b / primary.count);

                    const secondary = sorted[1] || sorted[0];
                    const sR = Math.round(secondary.r / secondary.count);
                    const sG = Math.round(secondary.g / secondary.count);
                    const sB = Math.round(secondary.b / secondary.count);

                    const primaryHex = `#${pR.toString(16).padStart(2, '0')}${pG.toString(16).padStart(2, '0')}${pB.toString(16).padStart(2, '0')}`;
                    const secondaryHex = `#${sR.toString(16).padStart(2, '0')}${sG.toString(16).padStart(2, '0')}${sB.toString(16).padStart(2, '0')}`;

                    const avgBrightness = (pR + pG + pB) / 3;

                    setColors({
                        primary: primaryHex,
                        secondary: secondaryHex,
                        isDark: avgBrightness < 128
                    });
                }
            } catch (e) {
                // CORS or other errors - use defaults
                console.warn('Color extraction failed:', e);
            }
        };

        img.src = imageUrl;
    }, [imageUrl]);

    return colors;
};
