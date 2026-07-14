// ===== QR/BARCODE SCANNER & MY BOOKS — scan.js =====

// ══════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════
const scanState = {
  selectedUserPRN: null,
  userData: null,
  showModal: false,
  showMyBooks: false,
  scanner: null,
  isScanning: false,
  scanLocked: false   // prevents duplicate scan triggers
};

// ══════════════════════════════════════════════
//  DOM REFERENCES
// ══════════════════════════════════════════════
const scanOverlay = document.getElementById("scanOverlay");
const scanClose = document.getElementById("scanClose");
const scanIdBtn = document.getElementById("scanIdBtn");
const demoUserSelect = document.getElementById("demoUserSelect");
const scanLoading = document.getElementById("scanLoading");
const scanError = document.getElementById("scanError");
const scanSuccess = document.getElementById("scanSuccess");
const manualPrnInput = document.getElementById("manualPrnInput");
const manualPrnBtn = document.getElementById("manualPrnBtn");
const myBooksOverlay = document.getElementById("myBooksOverlay");
const myBooksClose = document.getElementById("myBooksClose");
const myBooksContent = document.getElementById("myBooksContent");

// ══════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ══════════════════════════════════════════════

/** Look up user data by PRN */
function getUserData(prn) {
  return users[prn] || null;
}

/** Validate PRN: must be exactly 12 numeric digits */
function isValidPRN(text) {
  return /^\d{12}$/.test(text);
}

/** Determine book return status */
function getBookStatus(returnDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ret = new Date(returnDate);
  ret.setHours(0, 0, 0, 0);
  if (today > ret) {
    const diffDays = Math.ceil((today - ret) / (1000 * 60 * 60 * 24));
    return { status: "overdue", label: "Overdue", detail: diffDays + " day" + (diffDays > 1 ? "s" : "") + " overdue" };
  } else {
    const diffDays = Math.ceil((ret - today) / (1000 * 60 * 60 * 24));
    return { status: "active", label: "Active", detail: diffDays + " day" + (diffDays > 1 ? "s" : "") + " left" };
  }
}

/** Format date */
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ══════════════════════════════════════════════
//  RESET UI STATES
// ══════════════════════════════════════════════
function resetScanUI() {
  scanLoading.classList.remove("show");
  scanError.classList.remove("show");
  scanError.textContent = "";
  scanSuccess.classList.remove("show");
  scanSuccess.textContent = "";
  manualPrnInput.value = "";
  demoUserSelect.value = "";
  scanState.scanLocked = false;
}

// ══════════════════════════════════════════════
//  QR / BARCODE SCANNER (html5-qrcode)
//  Fully automatic — no capture/submit button
// ══════════════════════════════════════════════
function startScanner() {
  if (scanState.isScanning) return;

  scanState.scanner = new Html5Qrcode("qrReader");
  scanState.isScanning = true;

  scanState.scanner.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    },
    function onScanSuccess(decodedText) {
      var text = decodedText.trim();

      // STRICT VALIDATION: only accept 12-digit numeric PRN
      if (!isValidPRN(text)) {
        // Not a valid PRN — silently ignore, keep scanning
        return;
      }

      // Prevent duplicate triggers
      if (scanState.scanLocked) return;
      scanState.scanLocked = true;

      // Valid PRN detected — process automatically
      handleScan(text);
    },
    function onScanFailure() {
      // Scan attempt failed — silent, keep trying
    }
  ).catch(function(err) {
    console.log("Camera error:", err);
    scanError.textContent = "Camera not available. Please use manual PRN entry below.";
    scanError.classList.add("show");
  });
}

function stopScanner() {
  if (scanState.scanner && scanState.isScanning) {
    scanState.scanner.stop().then(function() {
      scanState.scanner.clear();
      scanState.isScanning = false;
    }).catch(function() {
      scanState.isScanning = false;
    });
  }
}

// ══════════════════════════════════════════════
//  HANDLE SCAN RESULT (fully automated)
// ══════════════════════════════════════════════
function handleScan(prn) {
  // Stop scanning immediately
  stopScanner();

  // Show loading
  scanLoading.classList.add("show");
  scanError.classList.remove("show");
  scanSuccess.classList.remove("show");

  setTimeout(function() {
    scanLoading.classList.remove("show");

    var userData = getUserData(prn);
    if (!userData) {
      scanError.textContent = "PRN \"" + prn + "\" not found in system. Try manual entry or demo selector.";
      scanError.classList.add("show");
      scanState.scanLocked = false;
      // Restart scanner for retry
      setTimeout(function() { startScanner(); }, 1500);
      return;
    }

    // Success — show brief confirmation
    scanSuccess.innerHTML = '<i class="fa-solid fa-circle-check"></i> ID Detected: ' + prn + ' (' + userData.name + ')';
    scanSuccess.classList.add("show");

    scanState.selectedUserPRN = prn;
    scanState.userData = userData;

    // Auto-close scanner and open My Books (NO button click needed)
    setTimeout(function() {
      closeScanModal();
      showMyBooks(prn, userData);
    }, 1200);
  }, 600);
}

// ══════════════════════════════════════════════
//  SCAN MODAL OPEN / CLOSE
// ══════════════════════════════════════════════
function openScanModal() {
  // Populate demo dropdown
  demoUserSelect.innerHTML = '<option value="">-- Choose a student --</option>';
  allPRNs.forEach(function(prn) {
    var u = users[prn];
    var opt = document.createElement("option");
    opt.value = prn;
    opt.textContent = u.name + " (" + prn + ")";
    demoUserSelect.appendChild(opt);
  });

  resetScanUI();
  scanOverlay.classList.add("show");
  scanState.showModal = true;

  // Start QR/barcode scanner automatically
  setTimeout(function() { startScanner(); }, 300);
}

function closeScanModal() {
  stopScanner();
  scanOverlay.classList.remove("show");
  scanState.showModal = false;
  scanState.scanLocked = false;
}

// ══════════════════════════════════════════════
//  MY BOOKS DASHBOARD
// ══════════════════════════════════════════════
function showMyBooks(prn, userData) {
  var booksWithStatus = userData.issuedBooks.map(function(b) {
    var s = getBookStatus(b.returnDate);
    return { title: b.title, returnDate: b.returnDate, rack: b.rack, status: s.status, label: s.label, detail: s.detail };
  });

  var totalBooks = booksWithStatus.length;
  var overdueCount = booksWithStatus.filter(function(b) { return b.status === "overdue"; }).length;
  var activeCount = totalBooks - overdueCount;
  var initials = userData.name.split(" ").map(function(n) { return n[0]; }).join("").toUpperCase();

  var html = '';

  // User profile card
  html += '<div class="user-profile">';
  html += '  <div class="user-avatar">' + initials + '</div>';
  html += '  <div class="user-info">';
  html += '    <h3>' + userData.name + '</h3>';
  html += '    <p>' + userData.department + ' &middot; ' + userData.semester + ' Semester</p>';
  html += '    <span class="prn-badge">' + prn + '</span>';
  html += '  </div>';
  html += '</div>';

  // Summary cards
  html += '<div class="books-summary">';
  html += '  <div class="summary-card"><div class="num">' + totalBooks + '</div><div class="label">Total Issued</div></div>';
  html += '  <div class="summary-card active"><div class="num">' + activeCount + '</div><div class="label">Active</div></div>';
  html += '  <div class="summary-card overdue"><div class="num">' + overdueCount + '</div><div class="label">Overdue</div></div>';
  html += '</div>';

  // Issued books list
  html += '<div class="issued-books-title"><i class="fa-solid fa-book-bookmark" style="color:var(--accent)"></i> Issued Books</div>';

  booksWithStatus.forEach(function(b) {
    var iconClass = b.status === "overdue" ? "fa-clock" : "fa-check";
    html += '<div class="issued-book-card">';
    html += '  <div class="issued-book-icon ' + b.status + '"><i class="fa-solid ' + iconClass + '"></i></div>';
    html += '  <div class="issued-book-info">';
    html += '    <div class="title">' + b.title + '</div>';
    html += '    <div class="meta-row">';
    html += '      <span><i class="fa-regular fa-calendar"></i> Return: ' + formatDate(b.returnDate) + '</span>';
    html += '      <span>' + b.detail + '</span>';
    if (b.rack) html += '      <span><i class="fa-solid fa-location-dot"></i> Rack ' + b.rack + '</span>';
    html += '    </div>';
    html += '  </div>';
    html += '  <span class="issued-status ' + b.status + '">' + b.label + '</span>';
    if (b.rack) html += '  <button class="locate-btn" data-rack="' + b.rack + '"><i class="fa-solid fa-map-pin"></i> Locate</button>';
    html += '</div>';
  });

  myBooksContent.innerHTML = html;

  // Attach locate buttons
  myBooksContent.querySelectorAll(".locate-btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var rack = btn.dataset.rack;
      myBooksOverlay.classList.remove("show");
      if (typeof highlightRack === "function") highlightRack(rack);
      var mapEl = document.getElementById("libMap");
      if (mapEl) mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  myBooksOverlay.classList.add("show");
  scanState.showMyBooks = true;
}

// ══════════════════════════════════════════════
//  EVENT LISTENERS
// ══════════════════════════════════════════════

// Open scan modal
scanIdBtn.addEventListener("click", openScanModal);

// Close scan modal
scanClose.addEventListener("click", closeScanModal);
scanOverlay.addEventListener("click", function(e) {
  if (e.target === scanOverlay) closeScanModal();
});

// Manual PRN submit (fallback for demo)
manualPrnBtn.addEventListener("click", function() {
  var prn = manualPrnInput.value.trim();
  if (!prn) return;
  // For manual entry, accept any key that exists in users dataset
  var userData = getUserData(prn);
  if (userData) {
    handleScan(prn);
  } else {
    scanError.textContent = "PRN \"" + prn + "\" not found. Check the number and try again.";
    scanError.classList.add("show");
  }
});
manualPrnInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    var prn = manualPrnInput.value.trim();
    if (!prn) return;
    var userData = getUserData(prn);
    if (userData) {
      handleScan(prn);
    } else {
      scanError.textContent = "PRN \"" + prn + "\" not found. Check the number and try again.";
      scanError.classList.add("show");
    }
  }
});

// Demo user dropdown
demoUserSelect.addEventListener("change", function() {
  var prn = demoUserSelect.value;
  if (prn) handleScan(prn);
});

// Close My Books panel
myBooksClose.addEventListener("click", function() {
  myBooksOverlay.classList.remove("show");
  scanState.showMyBooks = false;
});
myBooksOverlay.addEventListener("click", function(e) {
  if (e.target === myBooksOverlay) {
    myBooksOverlay.classList.remove("show");
    scanState.showMyBooks = false;
  }
});
