// Auto-open first panel
window.onload = function () {
    document.getElementById("p1").classList.remove("hidden");
};

/* ---------------------------
   PANEL TOGGLE
----------------------------- */
function togglePanel(id) {
    document.getElementById(id).classList.toggle("hidden");
}

/* ---------------------------
   MULTISELECT LOGIC
----------------------------- */
function handleMultiSelect() {
    const selected = Array.from(document.querySelectorAll(".ms-opt:checked"))
        .map(x => x.value);

    // Customer Section
    document.getElementById("panel-customer").style.display =
        selected.some(v => ["Periodic", "Customer", "ID Related"].includes(v))
            ? "block"
            : "none";

    // Occupation
    document.getElementById("panel-occupation").style.display =
        selected.includes("Occupation") ? "block" : "none";

    // Next of Kin
    document.getElementById("panel-nok").style.display =
        selected.includes("Next of Kin") ? "block" : "none";
}

/* ---------------------------
   LOAD DATA FROM DATABASE.JSON
----------------------------- */
async function fetchCustomerData(identifier) {
    try {
        const res = await fetch("database.json");
        const data = await res.json();

        let record =
            data.find(x => x.cif === identifier) ||
            data.find(x => x.cnic === identifier);

        return record || null;
    } catch (err) {
        console.error("Error reading DB file:", err);
        return null;
    }
}

/* ---------------------------
   POPULATE FORM WHEN USER ENTERS CIF/CNIC
----------------------------- */
async function handleSearch() {
    const cif = document.getElementById("cifInput").value.trim();
    const cnic = document.getElementById("cnicInput").value.trim();

    if (!cif && !cnic) return;

    let record = await fetchCustomerData(cif || cnic);

    if (!record) {
        alert("No record found!");
        return;
    }

    // Fill customer information
    document.querySelector("#panel-customer input[name='customerName']").value = record.name;
    document.querySelector("#panel-customer input[name='fatherName']").value = record.father;
    document.querySelector("#panel-customer input[name='dob']").value = record.dob;
    document.querySelector("#panel-customer input[name='mobile']").value = record.mobile;

    // Fill occupation data
    document.querySelector("#panel-occupation input[name='occupation']").value = record.occupation;
    document.querySelector("#panel-occupation input[name='employer']").value = record.employer;

    // Fill next of kin data
    document.querySelector("#panel-nok input[name='nokName']").value = record.nok_name;
    document.querySelector("#panel-nok input[name='nokContact']").value = record.nok_contact;
}
