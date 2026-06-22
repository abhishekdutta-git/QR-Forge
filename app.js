/* ============================================
   QR Forge — Application Logic
   ============================================ */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────
  let currentType = 'url';
  let qrInstance = null;
  let currentData = '';

  // ── DOM References ─────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const DOM = {
    tabs: $$('.tab'),
    tabContents: $$('.tab-content'),
    generateBtn: $('#generate-btn'),
    qrPreview: $('#qr-preview'),
    qrPlaceholder: $('#qr-placeholder'),
    qrActions: $('#qr-actions'),
    downloadPNG: $('#download-png'),
    downloadSVG: $('#download-svg'),
    copyBtn: $('#copy-btn'),
    fgColor: $('#fg-color'),
    bgColor: $('#bg-color'),
    fgColorValue: $('#fg-color-value'),
    bgColorValue: $('#bg-color-value'),
    dotStyle: $('#dot-style'),
    cornerStyle: $('#corner-style'),
    qrSize: $('#qr-size'),
    sizeValue: $('#size-value'),
    ecLevel: $('#ec-level'),
    dataInfo: $('#data-info'),
    dataInfoText: $('#data-info-text'),
    toastContainer: $('#toast-container'),
  };

  // ── Check Library ──────────────────────────────
  function checkLibrary() {
    if (typeof QRCodeStyling === 'undefined') {
      showToast('QR library failed to load. Please refresh.', 'error');
      DOM.generateBtn.disabled = true;
      return false;
    }
    return true;
  }

  // ── Tab Switching ──────────────────────────────
  function switchTab(type) {
    currentType = type;

    // Update tab buttons
    DOM.tabs.forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.type === type);
    });

    // Update tab contents
    DOM.tabContents.forEach((content) => {
      const contentType = content.id.replace('content-', '');
      content.classList.toggle('active', contentType === type);
    });

    // Focus the first input in the active tab
    const activeContent = $(`#content-${type}`);
    if (activeContent) {
      const firstInput = activeContent.querySelector('input, textarea');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }

  // ── Data Formatters ────────────────────────────

  function escapeWiFi(str) {
    // Escape special WiFi QR characters: \, ;, ,, ", :
    return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/"/g, '\\"').replace(/:/g, '\\:');
  }

  function getQRData() {
    switch (currentType) {
      case 'url':
        return getURLData();
      case 'text':
        return getTextData();
      case 'wifi':
        return getWiFiData();
      case 'vcard':
        return getVCardData();
      case 'email':
        return getEmailData();
      case 'phone':
        return getPhoneData();
      case 'sms':
        return getSMSData();
      default:
        return '';
    }
  }

  function getURLData() {
    let url = ($('#input-url').value || '').trim();
    if (!url) return '';
    // Auto-add https:// if no protocol
    if (url && !/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    return url;
  }

  function getTextData() {
    return ($('#input-text').value || '').trim();
  }

  function getWiFiData() {
    const ssid = ($('#wifi-ssid').value || '').trim();
    if (!ssid) return '';
    const password = ($('#wifi-password').value || '').trim();
    const encryption = $('#wifi-encryption').value;
    const hidden = $('#wifi-hidden').checked;

    let data = `WIFI:T:${encryption};S:${escapeWiFi(ssid)};`;
    if (encryption !== 'nopass' && password) {
      data += `P:${escapeWiFi(password)};`;
    }
    if (hidden) {
      data += 'H:true;';
    }
    data += ';';
    return data;
  }

  function getVCardData() {
    const fname = ($('#vcard-fname').value || '').trim();
    const lname = ($('#vcard-lname').value || '').trim();
    if (!fname && !lname) return '';

    const phone = ($('#vcard-phone').value || '').trim();
    const email = ($('#vcard-email').value || '').trim();
    const org = ($('#vcard-org').value || '').trim();
    const url = ($('#vcard-url').value || '').trim();

    let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
    vcard += `N:${lname};${fname};;;\n`;
    vcard += `FN:${fname}${lname ? ' ' + lname : ''}\n`;
    if (phone) vcard += `TEL:${phone}\n`;
    if (email) vcard += `EMAIL:${email}\n`;
    if (org) vcard += `ORG:${org}\n`;
    if (url) vcard += `URL:${url}\n`;
    vcard += 'END:VCARD';
    return vcard;
  }

  function getEmailData() {
    const address = ($('#email-address').value || '').trim();
    if (!address) return '';
    const subject = ($('#email-subject').value || '').trim();
    const body = ($('#email-body').value || '').trim();

    let mailto = `mailto:${address}`;
    const params = [];
    if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
    if (body) params.push(`body=${encodeURIComponent(body)}`);
    if (params.length) mailto += '?' + params.join('&');
    return mailto;
  }

  function getPhoneData() {
    const phone = ($('#phone-number').value || '').trim();
    if (!phone) return '';
    return `tel:${phone}`;
  }

  function getSMSData() {
    const number = ($('#sms-number').value || '').trim();
    if (!number) return '';
    const message = ($('#sms-message').value || '').trim();

    let sms = `sms:${number}`;
    if (message) sms += `?body=${encodeURIComponent(message)}`;
    return sms;
  }

  // ── QR Code Generation ────────────────────────

  function generateQR() {
    if (!checkLibrary()) return;

    const data = getQRData();
    if (!data) {
      showToast('Please enter some data first!', 'error');
      return;
    }

    currentData = data;
    const size = parseInt(DOM.qrSize.value, 10);
    const fgColor = DOM.fgColor.value;
    const bgColor = DOM.bgColor.value;
    const dotType = DOM.dotStyle.value;
    const cornerType = DOM.cornerStyle.value;
    const ecLevel = DOM.ecLevel.value;

    // Add loading state
    DOM.generateBtn.classList.add('loading');

    // Clear previous QR code
    const existingCanvas = DOM.qrPreview.querySelector('canvas, svg, img');
    if (existingCanvas) existingCanvas.remove();

    // Hide placeholder
    if (DOM.qrPlaceholder) DOM.qrPlaceholder.style.display = 'none';

    // Create new QR code
    try {
      qrInstance = new QRCodeStyling({
        width: size,
        height: size,
        data: data,
        type: 'canvas',
        dotsOptions: {
          color: fgColor,
          type: dotType,
        },
        cornersSquareOptions: {
          type: cornerType,
          color: fgColor,
        },
        cornersDotOptions: {
          type: cornerType === 'extra-rounded' ? 'dot' : cornerType,
          color: fgColor,
        },
        backgroundOptions: {
          color: bgColor,
        },
        qrOptions: {
          errorCorrectionLevel: ecLevel,
        },
      });

      qrInstance.append(DOM.qrPreview);

      // Show actions and data info
      DOM.qrPreview.classList.add('has-qr');
      DOM.qrActions.style.display = 'flex';

      // Show encoded data info
      DOM.dataInfoText.textContent = data.length > 150 ? data.substring(0, 150) + '…' : data;
      DOM.dataInfo.classList.add('visible');

      showToast('QR code generated successfully!', 'success');
    } catch (err) {
      console.error('QR Generation Error:', err);
      showToast('Failed to generate QR code. Try different input.', 'error');
    }

    // Remove loading state
    setTimeout(() => {
      DOM.generateBtn.classList.remove('loading');
    }, 300);
  }

  // ── Download Functions ─────────────────────────

  function downloadPNG() {
    if (!qrInstance) return;
    try {
      qrInstance.download({
        name: 'qr-forge-code',
        extension: 'png',
      });
      showToast('PNG downloaded!', 'success');
    } catch (err) {
      console.error('Download PNG Error:', err);
      showToast('Download failed. Try again.', 'error');
    }
  }

  function downloadSVG() {
    if (!currentData) return;

    // Recreate as SVG for download
    try {
      const size = parseInt(DOM.qrSize.value, 10);
      const svgQR = new QRCodeStyling({
        width: size,
        height: size,
        data: currentData,
        type: 'svg',
        dotsOptions: {
          color: DOM.fgColor.value,
          type: DOM.dotStyle.value,
        },
        cornersSquareOptions: {
          type: DOM.cornerStyle.value,
          color: DOM.fgColor.value,
        },
        cornersDotOptions: {
          type: DOM.cornerStyle.value === 'extra-rounded' ? 'dot' : DOM.cornerStyle.value,
          color: DOM.fgColor.value,
        },
        backgroundOptions: {
          color: DOM.bgColor.value,
        },
        qrOptions: {
          errorCorrectionLevel: DOM.ecLevel.value,
        },
      });

      svgQR.download({
        name: 'qr-forge-code',
        extension: 'svg',
      });
      showToast('SVG downloaded!', 'success');
    } catch (err) {
      console.error('Download SVG Error:', err);
      showToast('SVG download failed. Try again.', 'error');
    }
  }

  async function copyToClipboard() {
    if (!qrInstance) return;

    try {
      const blob = await qrInstance.getRawData('png');
      if (!blob) {
        showToast('Could not copy. Try downloading instead.', 'error');
        return;
      }
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      showToast('Copied to clipboard!', 'success');

      // Visual feedback on button
      DOM.copyBtn.classList.add('success');
      setTimeout(() => DOM.copyBtn.classList.remove('success'), 1500);
    } catch (err) {
      // Fallback: try to copy the data URL
      console.warn('Clipboard API failed, trying fallback:', err);
      try {
        const canvas = DOM.qrPreview.querySelector('canvas');
        if (canvas) {
          canvas.toBlob(async (blob) => {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob }),
              ]);
              showToast('Copied to clipboard!', 'success');
            } catch (e) {
              showToast('Copy not supported in this browser. Use download instead.', 'error');
            }
          });
        }
      } catch (e) {
        showToast('Copy not supported. Use download instead.', 'error');
      }
    }
  }

  // ── Toast Notifications ────────────────────────

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✓' : '✕'}</span>
      <span>${message}</span>
    `;
    DOM.toastContainer.appendChild(toast);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ── Color Picker Sync ─────────────────────────

  function syncColorValues() {
    DOM.fgColorValue.textContent = DOM.fgColor.value.toUpperCase();
    DOM.bgColorValue.textContent = DOM.bgColor.value.toUpperCase();
  }

  // ── Size Slider Sync ──────────────────────────

  function syncSizeValue() {
    DOM.sizeValue.textContent = DOM.qrSize.value;
  }

  // ── Event Listeners ────────────────────────────

  function setupEventListeners() {
    // Tab clicks
    DOM.tabs.forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.type));
    });

    // Generate button
    DOM.generateBtn.addEventListener('click', generateQR);

    // Download buttons
    DOM.downloadPNG.addEventListener('click', downloadPNG);
    DOM.downloadSVG.addEventListener('click', downloadSVG);
    DOM.copyBtn.addEventListener('click', copyToClipboard);

    // Color pickers
    DOM.fgColor.addEventListener('input', syncColorValues);
    DOM.bgColor.addEventListener('input', syncColorValues);

    // Size slider
    DOM.qrSize.addEventListener('input', syncSizeValue);

    // Enter key to generate
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        generateQR();
      }
    });

    // Auto-generate on Enter in textareas with Ctrl/Cmd
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target.tagName === 'TEXTAREA') {
        e.preventDefault();
        generateQR();
      }
    });
  }

  // ── Initialize ─────────────────────────────────

  function init() {
    setupEventListeners();
    syncColorValues();
    syncSizeValue();

    // Focus URL input on load
    const urlInput = $('#input-url');
    if (urlInput) {
      setTimeout(() => urlInput.focus(), 300);
    }

    // Check if library loaded
    if (typeof QRCodeStyling === 'undefined') {
      console.error('QRCodeStyling library not loaded!');
      showToast('QR library is loading... please wait.', 'error');

      // Retry check after a moment
      setTimeout(() => {
        if (typeof QRCodeStyling === 'undefined') {
          showToast('Failed to load QR library. Please refresh the page.', 'error');
          DOM.generateBtn.disabled = true;
        }
      }, 5000);
    }
  }

  // ── Start ──────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
