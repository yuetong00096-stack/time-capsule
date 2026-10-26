# Time Capsule

Seven objects and the memories I keep with them.

The objects get random sizes, positions, and angles when the page opens. Click one to read its story. Click Back or press Escape to return. The left and right arrow keys switch between stories.

## Run locally

Open this folder in VS Code and use Live Server, or run:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. p5.js loads from a CDN, so an internet connection is needed for the canvas.

## Files

- `index.html` contains the page structure.
- `style.css` controls the layout and appearance.
- `sketch.js` handles placement, the canvas, and interactions.
- `objects.js` contains the object titles and stories.
- `assets/` contains the seven object images with transparent backgrounds.

## GitHub Pages

Upload the files and the `assets` folder to the root of the repository. In Settings > Pages, choose Deploy from a branch, then select main and /(root), and save.

The photos and stories are from my personal collection. The PNGs are background-removed versions of the original photos.
