# Global Outreach Bookmark Studio

A static, deployable bookmark-personalization app for Global Outreach fundraising materials.

## What it does

- Starts from the provided Global Outreach artwork and includes both the village and city backgrounds.
- Lets students personalize their name, trip location, dates, optional portrait, and background.
- Produces a two-page PDF: submission instructions followed by a one-up, press-ready bookmark.
- Gives page 2 a 2.75 × 8.25 in media size, a centered 2.5 × 8 in trim box, and 0.125 in bleed on every side.
- Creates the PDF entirely in the browser. The app does not send email or transfer the student's portrait to another service.

## Open locally

Double-click `index.html` in Finder. This version deliberately uses no runtime or local server, so students and staff can test it directly from the project folder.

## Deploy

This is a static site and can be deployed to Netlify, Vercel, GitHub Pages, or any static host. Publish the project folder, retaining the `src` directory and its `assets` subfolder. No server runtime is required.

## Production notes

- The downloaded PDF retains the vector artwork, includes embedded trim and bleed boxes, and is ready to submit through the organization's preferred print-order workflow.
- The date field can be removed in a future template if it is not part of the program's workflow.
- Add future approved variants in `templateOptions` in `src/app.js`; the controls are already built to accommodate them.
- If hands-off submission is added later, use an authenticated upload endpoint controlled by Cedarville. Do not expose a generic mail or storage credential in this client app.
