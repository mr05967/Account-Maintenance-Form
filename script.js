// Auto-open identification panel on load
window.onload = function () {
    document.getElementById("panel-identification").style.display = "block";
};

// Toggle panels
function togglePanel(id) {
    let panel = document.getElementById(id);
    panel.style.display = (panel.style.display === "block") ? "none" : "block";
}

// Handle multi-select logic
function handleMultiSelect() {
    const selected = Array.from(document.querySelectorAll(".ms-opt:checked"))
        .map(x => x.value);

    document.getElementById("panel-customer").style.display =
        selected.some(v => ["Periodic", "Customer", "ID Related"].includes(v))
            ? "block"
            : "none";

    document.getElementById("panel-occupation").style.display =
        selected.includes("Occupation") ? "block" : "none";

    document.getElementById("panel-nok").style.display =
        selected.includes("Next of Kin") ? "block" : "none";
}

// CNIC formatting
function formatCNIC(input) {
    let val = input.value.replace(/\D/g, "");
    if (val.length > 5) val = val.slice(0, 5) + "-" + val.slice(5);
    if (val.length > 13) val = val.slice(0, 13) + "-" + val.slice(13);
    input.value = val.slice(0, 15); 
}

// CIF formatting
function formatCIF(input) {
    input.value = input.value.replace(/\D/g, "").slice(0, 6);
}

// MAIN AUTO POPULATE FUNCTION
function autoPopulate() {
    const cnic = document.getElementById("cnicInput").value;
    const cif = document.getElementById("cifInput").value;

    if (cnic.length < 15 && cif.length < 6) return;

    // Load dataset.json from same GitHub folder
    fetch("database.json")
        .then(response => response.json())
        .then(data => {
            let record = data.find(row =>
                row.cnic === cnic || row.cif === cif
            );

            if (record) {
                // Customer information
                document.getElementById("customerName").value = record.customerName;
                document.getElementById("fatherName").value = record.fatherName;
                document.getElementById("dob").value = record.dob;
                document.getElementById("mobile").value = record.mobile;
                document.getElementById("email").value = record.email;

                // Occupation
                document.getElementById("occupationType").value = record.occupationType;
                document.getElementById("employer").value = record.employer;

                // Next of kin
                document.getElementById("nokName").value = record.nokName;
                document.getElementById("nokContact").value = record.nokContact;
            }
        })
        .catch(err => console.log("Error loading JSON:", err));
}
