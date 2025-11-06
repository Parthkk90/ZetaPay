# ZetaPay Browser Extension - Publishing Guide

## Overview
This guide walks through the process of building and publishing the ZetaPay browser extension to Chrome Web Store and Firefox Add-ons.

## Prerequisites
- Node.js 18+ and Yarn installed
- Chrome/Firefox browser for testing
- Developer accounts:
  - [Chrome Web Store Developer](https://chrome.google.com/webstore/devconsole) ($5 one-time fee)
  - [Firefox Add-ons Developer](https://addons.mozilla.org/developers/) (free)

## Building the Extension

### 1. Install Dependencies
```bash
cd web
yarn install
```

### 2. Build for Production
```bash
# Run the build script
node scripts/build-extension.js
```

This will:
- Build Next.js app as static export
- Copy all extension files (manifest, scripts, icons)
- Create `extension-build/` directory
- Generate `zetapay-extension-v{version}.zip`

### 3. Prepare Icons
The build includes placeholder SVG icons. For production:

**Option A: Use online converter**
1. Go to https://cloudconvert.com/svg-to-png
2. Convert each icon (16x16, 48x48, 128x128)
3. Replace SVG files in `extension-build/images/`

**Option B: Use ImageMagick (if installed)**
```bash
cd web/public/images
magick icon16.svg icon16.png
magick icon48.svg icon48.png
magick icon128.svg icon128.png
```

**Option C: Design professional icons**
- Hire a designer on Fiverr/Upwork
- Use Figma/Adobe Illustrator
- Follow [Chrome icon guidelines](https://developer.chrome.com/docs/webstore/images/)

## Testing Locally

### Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension-build/` folder
5. Test on checkout pages (search "checkout" in any site URL)

### Firefox
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `manifest.json` from `extension-build/`
4. Test functionality

### Testing Checklist
- [ ] Extension loads without errors
- [ ] Wallet connection works (MetaMask)
- [ ] Network switching to ZetaChain Athens works
- [ ] Payment button appears on checkout pages
- [ ] Transaction signing and confirmation works
- [ ] Icons display properly
- [ ] No console errors

## Publishing to Chrome Web Store

### 1. Create Developer Account
- Go to [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole)
- Pay $5 one-time registration fee
- Complete profile

### 2. Prepare Store Listing Assets
Create these in `web/store-assets/chrome/`:

**Screenshots** (1280x800 or 640x400 PNG/JPG)
- Extension popup showing payment UI
- Button injection on checkout page
- Transaction confirmation
- Wallet connection

**Promotional Images** (optional but recommended)
- Small tile: 440x280
- Large tile: 920x680
- Marquee: 1400x560

**Store Listing Text**
- See `STORE_LISTING.md` (create this file)

### 3. Upload Extension
1. Click "New Item" in developer console
2. Upload `zetapay-extension-v{version}.zip`
3. Fill in store listing:
   - **Name**: ZetaPay - Crypto Payments via ZetaChain
   - **Summary**: Pay with cryptocurrency on Amazon, Flipkart, and more using ZetaChain's Universal Apps
   - **Description**: (See detailed description below)
   - **Category**: Shopping
   - **Language**: English (add more as needed)
4. Upload screenshots and promotional images
5. Add privacy policy link
6. Set pricing: Free
7. Select countries/regions

### 4. Privacy & Compliance
- Upload `PRIVACY_POLICY.md` to your website or GitHub Pages
- Add privacy policy URL to manifest and store listing
- Complete Chrome Web Store privacy practices disclosure
- Declare permissions usage

### 5. Submit for Review
- Review all information
- Click "Submit for review"
- Wait 1-3 days for approval
- Address any review feedback

## Publishing to Firefox Add-ons

### 1. Create Developer Account
- Go to [Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/)
- Sign up (free)
- Complete profile

### 2. Prepare Listing
Firefox requires similar assets:
- Extension screenshots
- Icon (128x128 PNG)
- Detailed description
- Privacy policy link

### 3. Upload Extension
1. Click "Submit a New Add-on"
2. Upload `.zip` file
3. Select "On this site" (listed on AMO)
4. Fill in metadata:
   - Name, summary, description
   - Categories: Shopping, Web Development
   - Support email/website
   - Privacy policy URL
5. Upload screenshots

### 4. Source Code (Required for Firefox)
Firefox requires source code submission for review. Create a separate zip:
```bash
cd web
zip -r zetapay-source-v{version}.zip . -x "node_modules/*" "out/*" "extension-build/*"
```
Upload this in the "Source code" section with build instructions.

### 5. Submit for Review
- Complete all required fields
- Submit for review
- Firefox review typically takes 1-2 weeks
- May request additional information

## Post-Publishing

### Version Updates
1. Update `version` in `web/package.json`
2. Update `CHANGELOG.md` with changes
3. Rebuild: `node scripts/build-extension.js`
4. Upload new version to stores
5. Stores will auto-update users (Chrome: ~hours, Firefox: ~days)

### Monitoring
- Monitor reviews and ratings
- Respond to user feedback
- Track installation metrics
- Watch for reported bugs

### Maintenance
- Keep dependencies updated
- Address security vulnerabilities promptly
- Test on new browser versions
- Update for Chrome/Firefox API changes

## Store Listing - Detailed Description Template

```
🚀 Pay with Crypto on Your Favorite Shopping Sites

ZetaPay enables seamless cryptocurrency payments on Amazon, Flipkart, and thousands of other e-commerce platforms using ZetaChain's Universal Apps technology.

✨ KEY FEATURES:
• Pay with Bitcoin, Ethereum, USDC, and other popular cryptocurrencies
• Automatic conversion to merchant's preferred currency
• Secure wallet integration (MetaMask, WalletConnect)
• Real-time transaction tracking
• No additional fees beyond blockchain gas

🔐 SECURITY & PRIVACY:
• Your private keys never leave your wallet
• All transactions require explicit approval
• No personal data collection
• Open source and audited

🌐 SUPPORTED NETWORKS:
• ZetaChain (primary)
• Ethereum
• Bitcoin
• BSC
• And more...

💡 HOW IT WORKS:
1. Shop normally on any supported site
2. At checkout, click "Pay with Crypto via ZetaChain"
3. Connect your wallet (one-time setup)
4. Approve the transaction
5. Merchant receives payment instantly

🛠 REQUIREMENTS:
• MetaMask or compatible Web3 wallet
• Cryptocurrency in your wallet
• Supported e-commerce platform

📋 PERMISSIONS:
• Storage: Save your preferences locally
• Active Tab: Detect checkout pages
• Scripting: Inject payment button

🔗 LINKS:
• Privacy Policy: [URL]
• Support: [URL]
• Documentation: [URL]
• GitHub: https://github.com/Parthkk90/ZetaPay

Made with ❤️ by the ZetaPay team
```

## Troubleshooting

### Common Issues

**Build fails**
- Ensure Node.js 18+ is installed
- Run `yarn install` first
- Check for TypeScript errors

**Extension won't load**
- Verify manifest.json syntax
- Check console for errors
- Ensure all file paths are correct

**Icons not showing**
- Convert SVG to PNG
- Ensure correct dimensions (16, 48, 128)
- Verify paths in manifest.json

**Store rejection**
- Review Chrome/Firefox policies
- Address reported violations
- Improve privacy policy
- Add required permissions justification

## Resources
- [Chrome Extension Publishing](https://developer.chrome.com/docs/webstore/publish/)
- [Firefox Add-on Distribution](https://extensionworkshop.com/documentation/publish/)
- [Web Store Best Practices](https://developer.chrome.com/docs/webstore/best_practices/)
- [ZetaChain Documentation](https://docs.zetachain.com/)

## Support
For publishing questions, contact the team or open an issue on GitHub.
