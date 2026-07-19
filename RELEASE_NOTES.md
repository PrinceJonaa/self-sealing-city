# Desktop Workspace + Mobile PWA Release

This update replaces the centered desktop decision overlay with a full-height side workspace that leaves the 3D scene unobstructed. The workspace can dock left or right, resize at its edge, float and move freely, or collapse to its title bar. Its selected layout persists on the device, and the 3D camera now adapts to the remaining scene area.

The existing portrait bottom sheet and landscape split-screen mobile layouts are preserved.

## Original mobile release

This release adds a full touch-first design system, portrait and landscape phone layouts, adaptive Three.js quality, PWA installation/offline support, autosave/resume, undo, haptics, wake lock, decision confirmation, background pausing, and a WebGL story-mode fallback.

## Quick paths

- Deploy `dist/` to any HTTPS static host for the installable PWA.
- Open `standalone-mobile.html` for the one-file demo.
- Run `npm install && npm run dev` to edit locally.
- Run `npm run build:standalone` to rebuild both the PWA and one-file edition.
