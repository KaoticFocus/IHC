# Icon Generation Instructions

To create the extension icons:

1. Use an icon generator tool like https://favicon.io/favicon-generator/
2. Create icons with these sizes:
   - 16x16 pixels (icon16.png)
   - 48x48 pixels (icon48.png)
   - 128x128 pixels (icon128.png)

3. Or use ImageMagick/GraphicsMagick to convert from a source image:
   ```bash
   convert source.png -resize 16x16 icons/icon16.png
   convert source.png -resize 48x48 icons/icon48.png
   convert source.png -resize 128x128 icons/icon128.png
   ```

4. Place the PNG files in the `extension/icons/` directory

For now, you can use any placeholder images or create simple colored squares as temporary icons.

