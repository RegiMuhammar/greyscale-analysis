# Grey Scale Analyser - Implementation Plan

## 1. Project Goal

Build an MVP web application for textile research observation. The app lets users upload two fabric sample photos, convert both to greyscale, compare original and greyscale results, reference ISO 105-A03 visual grades, record observer input, and download outputs for research documentation.

The MVP is a browser-only tool. It does not perform official ISO calibration, automatic ISO grading, Delta E analysis, database storage, authentication, or backend image processing.

## 2. Source Documents

- `PRD_GreyScaleAnalyser.docx`
- `PRD_GreyScaleAnalyser_v1.0.2_ExtendStyle.docx`
- Design reference: https://www.extend.ai/
- Standard reference in PRD: ISO 105-A03 grey scale visual reference for assessing staining

## 3. MVP Scope

### In Scope

- Dual image upload:
  - before washing
  - after washing
- Client-side greyscale conversion using HTML5 Canvas.
- 4-panel preview:
  - original before
  - greyscale before
  - original after
  - greyscale after
- ISO 105-A03 visual reference chart with 9 values:
  - `5`
  - `4-5`
  - `4`
  - `3-4`
  - `3`
  - `2-3`
  - `2`
  - `1-2`
  - `1`
- Observer form:
  - observer name
  - selected grade
  - notes
- Download:
  - greyscale before PNG
  - greyscale after PNG
  - composite PNG
- Reset/upload again.
- Responsive layout for mobile, tablet, and desktop.

### Out of Scope

- Official ISO calibration.
- Automatic ISO 105-A03 grading.
- Delta E calculation.
- Spectrophotometer integration.
- Backend API.
- Database.
- User accounts.
- Batch processing.
- PDF export.
- Multi-project history.

## 4. Technical Stack

- Frontend: React + Vite
- Styling: Tailwind CSS
- UI components: shadcn/ui
- Icons: lucide-react
- Image processing: HTML5 Canvas API
- State management: React local state/hooks
- Backend: none for MVP
- Deployment: Vercel, Netlify, GitHub Pages, or static hosting

## 5. Architecture

```txt
src/
  components/
    AppHeader.jsx
    UploadZone.jsx
    PreviewPanel.jsx
    GreyscaleChart.jsx
    ObserverForm.jsx
    DownloadButtons.jsx
    QualityNotice.jsx
  components/ui/
    # shadcn/ui components
  constants/
    greyScaleChart.js
  hooks/
    useImageUpload.js
    useGreyscale.js
  utils/
    greyscale.js
    download.js
    image.js
  App.jsx
  main.jsx
  index.css
```

## 6. Image Processing Plan

### Upload Handling

- Accept only:
  - `.jpg`
  - `.jpeg`
  - `.png`
  - `.webp`
- Max file size: `10MB` per image.
- Use `URL.createObjectURL(file)` for preview.
- Revoke object URLs during cleanup to avoid memory leaks.
- Keep original image data available for preview and composite export.

### Greyscale Conversion

Use the luminosity method:

```js
gray = 0.299 * R + 0.587 * G + 0.114 * B;
```

Then set:

```js
R = gray;
G = gray;
B = gray;
```

Reasoning:

- Preserves perceived lightness/value better than simple RGB averaging.
- Supports the user's context that each color can map to a different greyscale value because hue, intensity, and RGB composition affect perceived brightness.
- Runs fully in browser using Canvas.

Important wording in UI:

- The app converts photos into digital greyscale for observer comparison.
- ISO 105-A03 is used as a visual reference chart.
- The app does not claim official ISO calibration or automatic ISO grading.

## 7. ISO 105-A03 Chart Plan

Create `constants/greyScaleChart.js`:

```js
export const GREY_SCALE_GRADES = [
  { grade: "5", label: "Tidak ada staining/perubahan visual", severity: "best" },
  { grade: "4-5", label: "Perubahan sangat sangat kecil", severity: "very-low" },
  { grade: "4", label: "Perubahan kecil", severity: "low" },
  { grade: "3-4", label: "Perubahan cukup kecil", severity: "mild" },
  { grade: "3", label: "Perubahan sedang", severity: "medium" },
  { grade: "2-3", label: "Perubahan cukup besar", severity: "high" },
  { grade: "2", label: "Perubahan besar", severity: "very-high" },
  { grade: "1-2", label: "Perubahan sangat besar", severity: "severe" },
  { grade: "1", label: "Perubahan ekstrem", severity: "worst" },
];
```

The visual chart should show paired grey patches for every grade. The patch values are illustrative visual references for the observer, not official calibrated ISO chip values.

## 8. Visual Design Direction

Follow the PRD direction inspired by Extend.ai:

- Clean SaaS/workspace interface.
- First screen should be the usable tool, not a marketing landing page.
- Off-white page background.
- White panels.
- Thin borders.
- Small radius, maximum `8px`.
- Strong dark headings.
- Blue primary CTA.
- Neutral figure/caption styling for sample previews.
- Minimal decorative color so sample observation is not visually biased.

Color tokens:

```txt
Primary:        #2563EB
Primary Dark:   #0B1020
Background:     #F7F8FA
Surface:        #FFFFFF
Surface Muted:  #F1F4F8
Border:         #D9DEE7
Text Primary:   #111827
Text Secondary: #667085
Success:        #16A34A
Warning:        #D97706
Danger:         #DC2626
```

Use assets from `logo/` if they fit the final header:

- `logo/logo.png`
- `logo/logo-text.png`

## 9. Responsive Layout Requirements

Responsive behavior is mandatory and must be verified before delivery.

### Mobile `< 640px`

- Header stacks cleanly.
- Upload zones stack into one column.
- Preview panels render in one column.
- Chart can scroll horizontally if needed.
- Download buttons become full width.
- Observer form fields stack vertically.
- No text overflow in buttons, labels, upload cards, or chart cells.
- Minimum tested viewport: `375px` wide.

### Tablet `640px - 1024px`

- Upload zones use two columns.
- Preview uses 2x2 grid.
- Chart sits below preview.
- Observer form can remain full width or 2-column where appropriate.
- Captions remain readable.

### Desktop `> 1024px`

- Workspace layout with constrained max width.
- Upload zones use two columns.
- Preview can use 4-panel horizontal grid or 2x2 grid depending on image readability.
- Chart appears below preview or as a right-side reference panel.
- Primary actions remain visible without visual clutter.

### Viewports To Test

- `375 x 812`
- `768 x 1024`
- `1440 x 900`

## 10. Implementation Milestones

### M1 - Project Setup

- [ ] Create Vite React project.
- [ ] Install Tailwind CSS.
- [ ] Configure shadcn/ui.
- [ ] Install `lucide-react`, `clsx`, `tailwind-merge`.
- [ ] Set up base folder structure.
- [ ] Add global design tokens in CSS/Tailwind.

Acceptance criteria:

- App runs locally with `npm run dev`.
- Base styling matches PRD direction.
- No unused starter UI remains.

### M2 - Upload Flow

- [ ] Build `UploadZone`.
- [ ] Support click-to-upload.
- [ ] Support drag-and-drop.
- [ ] Validate file type.
- [ ] Validate max file size.
- [ ] Show upload success state.
- [ ] Show filename, size, and thumbnail.
- [ ] Add reset/change image action.

Acceptance criteria:

- Valid files render previews.
- Invalid type shows an error.
- Files over `10MB` show an error.
- User can replace each uploaded image independently.

### M3 - Greyscale Core

- [ ] Build `utils/greyscale.js`.
- [ ] Convert image to canvas.
- [ ] Apply luminosity formula.
- [ ] Return PNG data URL/blob.
- [ ] Build `useGreyscale`.
- [ ] Show processing state while converting.
- [ ] Handle conversion errors gracefully.

Acceptance criteria:

- Both uploaded images convert to greyscale.
- Output preserves original image aspect ratio.
- Processing happens locally in browser.
- No image is uploaded to any server.

### M4 - Preview Workspace

- [ ] Build `PreviewPanel`.
- [ ] Show original before.
- [ ] Show greyscale before.
- [ ] Show original after.
- [ ] Show greyscale after.
- [ ] Add figure-style captions.
- [ ] Add empty state before both images are ready.

Acceptance criteria:

- 4-panel comparison is clear.
- Image aspect ratio is preserved.
- Captions are readable on mobile and desktop.

### M5 - ISO 105-A03 Chart

- [ ] Build `constants/greyScaleChart.js`.
- [ ] Build `GreyscaleChart`.
- [ ] Render 9 grade values.
- [ ] Render paired grey patches.
- [ ] Add concise Indonesian descriptions.
- [ ] Add notice that chart is a visual reference, not official calibration.

Acceptance criteria:

- All 9 values are visible.
- Chart is readable on mobile, tablet, and desktop.
- Chart does not dominate or visually bias the sample preview.

### M6 - Observer Form

- [ ] Build `ObserverForm`.
- [ ] Add observer name input.
- [ ] Add grade selector.
- [ ] Add notes textarea.
- [ ] Store data in local state.
- [ ] Show selected grade summary near downloads.

Acceptance criteria:

- Observer can select one grade.
- Notes can be entered and edited.
- Form remains usable on mobile.

### M7 - Downloads

- [ ] Build `utils/download.js`.
- [ ] Download greyscale before PNG.
- [ ] Download greyscale after PNG.
- [ ] Generate composite PNG with 4 panels.
- [ ] Include labels in composite output.
- [ ] Include observer grade/notes in composite if available.
- [ ] Disable download buttons until outputs are ready.

Acceptance criteria:

- Individual PNG downloads work.
- Composite PNG downloads work.
- Composite is readable and suitable for report attachment.
- File names are predictable:
  - `greyscale_sebelum.png`
  - `greyscale_sesudah.png`
  - `komposit_greyscale.png`

### M8 - Responsive Polish

- [ ] Test `375 x 812`.
- [ ] Test `768 x 1024`.
- [ ] Test `1440 x 900`.
- [ ] Fix overflow.
- [ ] Fix cramped labels.
- [ ] Ensure stable panel dimensions.
- [ ] Ensure buttons and controls are reachable by keyboard.
- [ ] Check color contrast.

Acceptance criteria:

- No overlapping UI.
- No clipped text.
- No horizontal page scroll except intentional chart scroll on mobile.
- App remains usable with keyboard navigation.

### M9 - Build & Verification

- [ ] Run lint if configured.
- [ ] Run build.
- [ ] Test upload and conversion manually.
- [ ] Test invalid upload scenarios.
- [ ] Test all download actions.
- [ ] Test reset flow.
- [ ] Verify browser console has no errors.

Acceptance criteria:

- `npm run build` succeeds.
- Manual MVP flow works end to end.
- No major console errors.

## 11. Manual Test Checklist

- [ ] Upload valid before image.
- [ ] Upload valid after image.
- [ ] Upload invalid file type.
- [ ] Upload file above `10MB`.
- [ ] Replace before image.
- [ ] Replace after image.
- [ ] Confirm greyscale output appears.
- [ ] Compare 4-panel preview.
- [ ] Select ISO 105-A03 grade.
- [ ] Enter observer name.
- [ ] Enter observer notes.
- [ ] Download before greyscale.
- [ ] Download after greyscale.
- [ ] Download composite image.
- [ ] Reset all data.
- [ ] Verify mobile layout.
- [ ] Verify tablet layout.
- [ ] Verify desktop layout.

## 12. Copy Guidelines

Use clear Indonesian UI labels:

- `Sebelum pencucian`
- `Sesudah pencucian`
- `Upload foto`
- `Mengkonversi...`
- `Download greyscale sebelum`
- `Download greyscale sesudah`
- `Download komposit`
- `Grade observer`
- `Catatan observer`
- `Referensi ISO 105-A03`

Avoid claims like:

- `Otomatis sesuai ISO`
- `Hasil resmi ISO`
- `Grade ISO otomatis`

Prefer:

- `Referensi visual ISO 105-A03`
- `Alat bantu observasi`
- `Penilaian akhir dilakukan oleh observer`

## 13. Delivery Definition

The MVP is considered complete when:

- User can upload before/after sample images.
- App converts both images to greyscale locally.
- App displays original and greyscale results clearly.
- ISO 105-A03 9-step visual reference is available.
- Observer can select grade and add notes.
- User can download individual and composite PNG files.
- Layout works on mobile, tablet, and desktop.
- Build succeeds without blocking errors.
