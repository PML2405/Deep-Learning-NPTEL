# Deep Learning (NPTEL) – Course Notes

Slides, transcripts and assignment solutions for the NPTEL Deep Learning course, browsable as a website via GitHub Pages.

**Site:** https://pml2405.github.io/Deep-Learning-NPTEL/

## Layout

```
index.html            the web page
assets/               style.css, app.js
manifest.js           generated file index (what the page reads)
tools/build_manifest.py   regenerates manifest.js
slides/               Week NN - Lecture NN - <Title>.pdf
transcripts/          Week NN - Transcript[ (Part X)].pdf
assignments/          Week NN - Assignment Solution.pdf
```

## Adding new material

1. Drop the PDFs into the right folder, following the naming pattern above.
2. For a new week, add its short title to `WEEK_TITLES` in `tools/build_manifest.py`.
3. Run `python3 tools/build_manifest.py`.
4. Commit and push — Pages redeploys automatically.

## Preview locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
