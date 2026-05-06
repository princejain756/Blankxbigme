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
    # 4. Save to protected directory
    
    convert "$img" \
        -background transparent \
        -fill "rgba(255,255,255,0.2)" \
        -font Courier -pointsize 40 \
        -gravity Center \
        -annotate +0+0 "BLANK" \
        -fill "rgba(0,0,0,0.1)" \
        -annotate +2+2 "BLANK" \
        -rotate 0.3 \
        +noise Gaussian \
        "$OUTPUT_DIR/$filename"
done

echo "Done. Protected images are in $OUTPUT_DIR"
