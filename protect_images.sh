#!/bin/bash

# Directory containing product images
IMG_DIR="public/product-images/new"
OUTPUT_DIR="public/product-images/protected"

mkdir -p "$OUTPUT_DIR"

echo "Processing images for watermark and reverse-search protection..."

for img in "$IMG_DIR"/*.png; do
    filename=$(basename "$img")
    echo "Processing $filename..."
    
    # 1. Add subtle noise (+noise Gaussian)
    # 2. Slight rotation (0.3 degrees) to break geometric matching
    # 3. Apply watermark text "BLANK" semi-transparently
    # 4. Downscale and save as compressed WebP for fast storefront delivery
    
    tmp_file="$OUTPUT_DIR/${filename%.png}.tmp.png"
    output_file="$OUTPUT_DIR/${filename%.png}.webp"

    convert "$img" \
        -resize '900x900>' \
        -strip \
        -background transparent \
        -fill "rgba(255,255,255,0.2)" \
        -font Courier -pointsize 40 \
        -gravity Center \
        -annotate +0+0 "BLANK" \
        -fill "rgba(0,0,0,0.1)" \
        -annotate +2+2 "BLANK" \
        -rotate 0.3 \
        +noise Gaussian \
        "$tmp_file"

    cwebp -quiet -metadata none -q 74 -m 6 "$tmp_file" -o "$output_file"
    rm -f "$tmp_file"
done

echo "Done. Protected WebP images are in $OUTPUT_DIR"
