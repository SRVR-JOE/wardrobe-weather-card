# Release checklist

1. Update the version and changelog.
2. Run `npm run check` and commit the regenerated `dist/` bundle.
3. Check `docs/demo.html` with synthetic weather at desktop and phone widths.
4. Push to GitHub and require the validation workflow to pass.
5. Create a GitHub release and attach `dist/wardrobe-weather-card.js`.
6. Verify installation through HACS as a custom Dashboard repository.

This is an independent community card. HACS catalog acceptance and official Home Assistant inclusion are controlled by their maintainers.

Publishing requirements: https://www.hacs.xyz/docs/publish/include/
