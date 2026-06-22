# QR Forge — Free QR Code Generator

**Generate beautiful, customizable QR codes instantly — free forever.**

🔗 **Live Demo**: [Your Vercel URL Here]

---

## ✨ Features

- **7 QR Code Types** — URL, Plain Text, WiFi, vCard (Contact), Email, Phone, SMS
- **Custom Styling** — Foreground & background colors, dot styles (rounded, dots, classy, etc.), corner styles
- **Adjustable Size** — From 200px to 600px with a smooth slider
- **Error Correction** — Choose from Low (7%) to High (30%) recovery levels
- **Download** — Export as PNG or SVG
- **Copy to Clipboard** — One-click image copy
- **100% Client-Side** — No data leaves your browser. Zero tracking, zero server calls.
- **Responsive Design** — Works beautifully on desktop, tablet, and mobile
- **Dark Mode** — Premium glassmorphism UI with animated gradient background

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 (Semantic) |
| Styling | Vanilla CSS (Custom Properties, Glassmorphism, Animations) |
| Logic | Vanilla JavaScript (ES6+) |
| QR Engine | [qr-code-styling](https://github.com/nicholasgasior/qr-code-styling) (CDN) |
| Fonts | [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts) |
| Hosting | Vercel (Free Hobby Plan) |

## 📁 Project Structure

```
├── index.html      # Main HTML — semantic structure, SEO meta tags
├── style.css       # Premium dark theme — glassmorphism, animations, responsive
├── app.js          # Application logic — QR generation, downloads, clipboard
├── vercel.json     # Vercel deployment configuration
└── README.md       # This file
```

## 📝 Why I Built This

I frequently needed to generate QR codes for sharing WiFi passwords, contact info, and URLs. Most online tools are bloated with ads, track your data, or require sign-ups. **QR Forge** is fast, private, and free — everything runs in your browser.

---

**Built for [Digital Heroes](https://digitalheroesco.com)**

## 📄 License

MIT License — free to use, modify, and share.
