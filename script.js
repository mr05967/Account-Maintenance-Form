// ----------------------
// AUTO OPEN FIRST PANEL
// ----------------------
window.onload = function () {
    document.getElementById("panel-identification").style.display = "block";
};

// ----------------------
// PANEL TOGGLER
// ----------------------
function togglePanel(id) {
    let el = document.getElementById(id);
    el.style.display = (el.style.display === "block") ? "none" : "block";
}

// ----------------------
// MULTISELECT PANEL VISIBILITY
// ----------------------
function handleMultiSelect() {
    const selected = Array.from(document.querySelectorAll('.ms-opt:checked')).map(x => x.value);

    document.getElementById('panel-customer').style.display =
        selected.some(v => ['Periodic', 'Customer', 'ID Related'].includes(v)) ? 'block' : 'none';

    document.getElementById('panel-occupation').style.display =
        selected.includes('Occupation') ? 'block' : 'none';

    document.getElementById('panel-nok').style.display =
        selected.includes('Next of Kin') ? 'block' : 'none';
}

// ----------------------
// FORMAT CNIC XXXXX-XXXXXXX-X
// ----------------------
function formatCNIC(input) {
    let val = input.value.replace(/\D/g, '').slice(0, 13);

    if (val.length > 5) val = val.slice(0, 5) + '-' + val.slice(5);
    if (val.length > 13) val = val.slice(0, 13) + '-' + val.slice(13);

    input.value = val;

    // auto-populate when CNIC complete
    if (val.length === 15) {
        populateData();
    }
}

// ----------------------
// FORMAT CIF ######
// ----------------------
function formatCIF(input) {
    let val = input.value.replace(/\D/g, '').slice(0, 6);
    input.value = val;

    // auto-populate when CIF complete
    if (val.length === 6) {
        populateData();
    }
}

// ----------------------
// AUTO POPULATE FUNCTION
// ----------------------
function populateData() {
    const cif = document.getElementById("cifInput").value;
    const cnic = document.getElementById("cnicInput").value;

    fetch("database.json")
        .then(res => res.json())
        .then(data => {
            let record = data.find(r => r.cif === cif || r.cnic === cnic);
            if (!record) return;

            // CUSTOMER INFO
            document.getElementById("customerName").value = record.customerName;
            document.getElementById("fatherName").value = record.fatherName;
            document.getElementById("dob").value = record.dob;
            document.getElementById("mobile").value = record.mobile;
            document.getElementById("email").value = record.email;
            document.getElementById("address").value = record.address;

            // FATCA / CRS / PEP
            document.getElementById("fatca").checked = record.fatca;
            document.getElementById("crs").checked = record.crs;
            document.getElementById("pep").checked = record.pep;

            // OCCUPATION
            document.getElementById("occupationType").value = record.occupationType;
            document.getElementById("employer").value = record.employer;
            document.getElementById("income").value = record.income;

            // NEXT OF KIN
            document.getElementById("nokName").value = record.nokName;
            document.getElementById("nokRelation").value = record.nokRelation;
            document.getElementById("nokContact").value = record.nokContact;

            // SPECIAL CONDITIONS
            document.getElementById("special").value = record.special;
        });
}
