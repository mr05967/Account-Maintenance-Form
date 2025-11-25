// ---------- Auto-open identification panel on load ----------
window.addEventListener('DOMContentLoaded', function() {
    // identification panel is already open via CSS
    console.log("Form ready.");
});

// ---------- Toggle sections ----------
function toggleSection(id) {
    const body = document.querySelector(`#${id} .section-body`);
    body.classList.toggle('open');
}

// ---------- Multi-select handling ----------
function updateVisibleSections() {
    const selected = Array.from(document.querySelectorAll(".ms-opt:checked")).map(cb => cb.value);

    document.getElementById("sec-customer").style.display =
        selected.some(v => ["Periodic", "Customer", "IDExpiry"].includes(v)) ? "block" : "none";

    document.getElementById("sec-occupation").style.display =
        selected.includes("Occupation") ? "block" : "none";

    document.getElementById("sec-nok").style.display =
        selected.includes("NextOfKin") ? "block" : "none";
}

// attach handler to multi-select checkboxes
document.querySelectorAll('.ms-opt').forEach(cb => {
    cb.addEventListener('change', updateVisibleSections);
});

// ---------- CNIC & CIF formatting ----------
function onlyDigits(str) { return (str || '').replace(/\D/g, ''); }

document.getElementById("cnicInput").addEventListener('input', function() {
    let digits = onlyDigits(this.value).slice(0,13);
    let out = '';
    if(digits.length <= 5) out = digits;
    else if(digits.length <= 12) out = digits.slice(0,5) + '-' + digits.slice(5);
    else out = digits.slice(0,5) + '-' + digits.slice(5,12) + '-' + digits.slice(12);
    this.value = out;
});

document.getElementById("cifInput").addEventListener('input', function() {
    this.value = onlyDigits(this.value).slice(0,6);
});

// ---------- Auto-populate form from dataset ----------
function autoPopulate() {
    const cnicInput = document.getElementById("cnicInput").value;
    const cifInput = document.getElementById("cifInput").value;

    if(cnicInput.length < 15 && cifInput.length < 6) return;

    fetch("database.json")
    .then(res => res.json())
    .then(data => {
        const record = data.find(r => r.cnic === cnic || r.cif === cif);
        if(record) {
            // Customer info
            document.getElementById("customerFullName").value = record.customerName || '';
            document.getElementById("parentSpouseName").value = record.fatherName || '';
            document.getElementById("dateOfBirth").value = record.dob || '';
            document.getElementById("primaryContactNumber").value = record.mobile || '';
            document.getElementById("emailAddress").value = record.email || '';
            document.getElementById("residentialAddress").value = record.address || '';
            document.getElementById("permanentAddress").value = record.address || '';

            // Regulatory declarations
            document.getElementById("fatca").checked = !!record.fatca;
            document.getElementById("crs").checked = !!record.crs;
            document.getElementById("pep").checked = !!record.pep;

            // Occupation
            document.getElementById("occupationType").value = record.occupationType || '';
            document.getElementById("employerBusinessName").value = record.employer || '';
            document.getElementById("sourceOfFundsDescription").value = record.income || '';

            // Next of Kin
            document.getElementById("nomineeFullName").value = record.nokName || '';
            document.getElementById("nomineeRelationship").value = record.nokRelation || '';
            document.getElementById("nomineeContact").value = record.nokContact || '';
            document.getElementById("nomineeAddress").value = record.address || '';

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

// ---------- Clear & Submit ----------
document.getElementById("clearBtn").addEventListener('click', function() {
    if(!confirm("Clear the form?")) return;

    document.querySelectorAll('input, textarea, select').forEach(el => {
        if(el.type === 'checkbox') el.checked = false;
        else el.value = '';
    });

    document.getElementById("sec-customer").style.display = 'none';
    document.getElementById("sec-occupation").style.display = 'none';
    document.getElementById("sec-nok").style.display = 'none';
    document.getElementById("biometricStatusText").innerText = 'Not Verified';
});

document.getElementById("submitBtn").addEventListener('click', function() {
    const reasonsSelected = Array.from(document.querySelectorAll(".ms-opt:checked")).length > 0;
    if(!reasonsSelected && !confirm("No reason selected. Continue submission?")) return;

    const payload = {
        cif: document.getElementById("cif").value,
        cnic: document.getElementById("cnic").value,
        name: document.getElementById("customerFullName").value,
        primaryContact: document.getElementById("primaryContactNumber").value
    };
    console.log("Submitting payload (demo):", payload);
    alert("Form submitted (demo). Check console for payload.");
});
