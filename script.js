// ---------- Auto-open identification panel on load ----------
window.addEventListener('DOMContentLoaded', function() {
    console.log("Form ready.");

    // attach button handlers for Identification buttons
    attachIdentButtons();
    
    // Ensure the first section is open
    document.getElementById('sec-ident-body').classList.add('open');
});

// ---------- Toggle sections ----------
function toggleSection(id) {
    const body = document.querySelector(`#${id} .section-body`);
    body.classList.toggle('open');
}

// ---------- Multi-select handling ----------
function updateVisibleSections() {
    const selected = Array.from(document.querySelectorAll(".ms-opt:checked")).map(cb => cb.value);

    // Show Customer section if any relevant reason is selected
    document.getElementById("sec-customer").style.display =
        selected.some(v => ["Periodic", "Customer", "IDExpiry"].includes(v)) ? "block" : "none";

    // Show Occupation section if relevant reason is selected
    document.getElementById("sec-occupation").style.display =
        selected.includes("Occupation") ? "block" : "none";

    // Show Next of Kin section if relevant reason is selected
    document.getElementById("sec-nok").style.display =
        selected.includes("NextOfKin") ? "block" : "none";
}

// attach handler to multi-select checkboxes
document.querySelectorAll('.ms-opt').forEach(cb => {
    cb.addEventListener('change', updateVisibleSections);
});

// ---------- CNIC & CIF formatting ----------
function onlyDigits(str) { return (str || '').replace(/\D/g, ''); }

function formatCNIC(input) {
    let digits = onlyDigits(input.value).slice(0,13);
    let out = '';
    if(digits.length <= 5) out = digits;
    else if(digits.length <= 12) out = digits.slice(0,5) + '-' + digits.slice(5);
    else out = digits.slice(0,5) + '-' + digits.slice(5,12) + '-' + digits.slice(12);
    input.value = out;
}

function formatCIF(input) {
    input.value = onlyDigits(input.value).slice(0,6);
}

// The oninput listeners are now in the HTML, so we only need the functions here.

// ---------- Auto-populate form from dataset ----------
function autoPopulate() {
    const cnicInput = document.getElementById("cnicInput").value;
    const cifInput = document.getElementById("cifInput").value;

    if(cnicInput.length < 15 && cifInput.length < 6) return;

    fetch("database.json")
    .then(res => res.json())
    .then(data => {
        const record = data.find(r => r.cnic === cnicInput || r.cif === cifInput);
        if(record) {
            // === Identification and Review (sec-ident) ===
            // Assuming the DB has keys that match the existing ones
            // New fields (can't populate without specific DB keys, using existing data):
            // document.getElementById("idIssuanceDate").value = record.idIssuanceDate || ''; 
            // document.getElementById("idExpiryDate").value = record.idExpiryDate || ''; 
            // document.getElementById("fbrStatus").value = record.fbrStatus || ''; 
            // document.getElementById("customerRelationshipDate").value = record.relationshipDate || ''; 

            // === Customer Identity, Address & Contact Details (sec-customer) ===
            document.getElementById("customerFullName").value = record.customerName || '';
            document.getElementById("parentSpouseName").value = record.fatherName || '';
            document.getElementById("dateOfBirth").value = record.dob || '';
            document.getElementById("primaryContactNumber").value = record.mobile || '';
            document.getElementById("emailAddress").value = record.email || '';
            document.getElementById("residentialAddress").value = record.address || '';
            document.getElementById("permanentAddress").value = record.address || '';
            
            // Assuming gender can be populated
            // document.getElementById("gender").value = record.gender || ''; 

            // Regulatory declarations (Existing)
            document.getElementById("fatca").checked = !!record.fatca;
            document.getElementById("crs").checked = !!record.crs;
            document.getElementById("pep").checked = !!record.pep;
            // The rest of the new regulatory/status fields will remain unchecked/unpopulated.

            // === Occupation (sec-occupation) ===
            document.getElementById("occupationType").value = record.occupationType || '';
            document.getElementById("employerBusinessName").value = record.employer || '';
            document.getElementById("sourceOfFundsDescription").value = record.income || '';

            // === Next of Kin (sec-nok) ===
            document.getElementById("nomineeFullName").value = record.nokName || '';
            document.getElementById("nomineeRelationship").value = record.nokRelation || '';
            document.getElementById("nomineeContact").value = record.nokContact || '';
            document.getElementById("nomineeAddress").value = record.address || ''; // Placeholder

            // Special conditions
            document.getElementById("special_photo").checked = record.special?.includes("Photo") || false;
            document.getElementById("special_vis").checked = record.special?.includes("Visually") || false;
            document.getElementById("special_deaf").checked = record.special?.includes("Deaf") || false;
            document.getElementById("special_locker").checked = record.special?.includes("Locker") || false;

            // Biometric status
            if(record.biometricReVerifiedStatus){
                document.getElementById("biometricReVerifiedStatus").value = record.biometricReVerifiedStatus;
                document.getElementById("biometricStatusText").innerText = record.biometricReVerifiedStatus;
            } else {
                document.getElementById("biometricReVerifiedStatus").value = '';
                document.getElementById("biometricStatusText").innerText = 'Not Verified';
            }

            // Handle reasons if present
            if(record.reasons && Array.isArray(record.reasons)) {
                document.querySelectorAll('.ms-opt').forEach(cb => {
                    cb.checked = record.reasons.includes(cb.value);
                });
                updateVisibleSections();
            }

            alert("Record matched and populated!");
        }
    })
    .catch(err => console.error("Error loading JSON:", err));
}

// ---------- Trigger auto-populate after user stops typing ----------
let timer;
[document.getElementById("cifInput"), document.getElementById("cnicInput")].forEach(inp => {
    inp.addEventListener('input', function() {
        clearTimeout(timer);
        timer = setTimeout(autoPopulate, 700);
    });
});


// ---------- Identification Buttons Logic (Existing) ----------
function attachIdentButtons() {
    const bioBtn = document.getElementById("identBioBtn");
    const verBtn = document.getElementById("identVerisysBtn");

    if (!bioBtn || !verBtn) return;

    bioBtn.addEventListener('click', () => {
        document.getElementById("identBiometricFields").style.display = "block";
        document.getElementById("identVerisysFields").style.display = "none";
    });

    verBtn.addEventListener('click', () => {
        document.getElementById("identBiometricFields").style.display = "none";
        document.getElementById("identVerisysFields").style.display = "block";
    });
}


// ---------- Clear & Submit ----------
document.getElementById("clearBtn").addEventListener('click', function() {
    if(!confirm("Clear the form?")) return;

    document.querySelectorAll('input, textarea, select').forEach(el => {
        if(el.type === 'checkbox' || el.type === 'radio') el.checked = false;
        else el.value = '';
    });

    // Reset conditional sections
    document.getElementById("sec-customer").style.display = 'none';
    document.getElementById("sec-occupation").style.display = 'none';
    document.getElementById("sec-nok").style.display = 'none';
    document.getElementById("biometricStatusText").innerText = 'Not Verified';
    
    // Also hide identification dynamic fields
    const b = document.getElementById("identBiometricFields");
    const v = document.getElementById("identVerisysFields");
    if(b) b.style.display = "none";
    if(v) v.style.display = "none";
});

document.getElementById("submitBtn").addEventListener('click', function() {
    const reasonsSelected = Array.from(document.querySelectorAll(".ms-opt:checked")).length > 0;
    if(!reasonsSelected && !confirm("No reason selected. Continue submission?")) return;

    // BUG FIX: Correctly referencing "cifInput" and "cnicInput"
    const payload = {
        cif: document.getElementById("cifInput").value,
        cnic: document.getElementById("cnicInput").value,
        name: document.getElementById("customerFullName").value,
        primaryContact: document.getElementById("primaryContactNumber").value
    };
    console.log("Submitting payload (demo):", payload);
    alert("Form submitted (demo). Check console for payload.");
});
