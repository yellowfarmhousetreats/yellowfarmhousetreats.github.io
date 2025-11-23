#!/bin/bash
echo "=== MISSING IMAGES ==="
while IFS= read -r line; do
  if [[ $line =~ \"image\":.*\"(.*)\" ]]; then
    img="${BASH_REMATCH[1]}"
    if [ ! -f "$img" ]; then
      echo "MISSING: $img"
    fi
  fi
done < products.json

echo ""
echo "=== UNUSED IMAGES ==="
for img in images/*.jpg; do
  filename=$(basename "$img")
  if ! grep -q "$filename" products.json; then
    echo "UNUSED: $img"
  fi
done
