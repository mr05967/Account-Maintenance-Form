// Auto-open first panel on load
window.onload = function () {
    const firstPanel = document.getElementById("p1");
    if (firstPanel) firstPanel.classList.remove("hidden");
};

// Panel toggle function
function togglePanel(id) {
    const panel = document.getElementById(id);
    if (panel) panel.classList.toggle("hidden");
}

// Multiselect behavior
function handleMultiSelect() {
    const selectedValues = Array.from(document.querySelectorAll(".ms-opt:checked")).map(
        (x) => x.value
    );

    // Customer Information panel
    document.getElementById("panel-customer").style.display =
        selectedValues.some((v) => ["Periodic", "Customer", "ID Related"].includes(v))
            ? "block"
            : "none";

    // Occupation panel
    document.getElementById("panel-occupation").style.display = selectedValues.includes(
        "Occupation"
    )
        ? "block"
        : "none";

    // Next of Kin panel
    document.getElementById("panel-nok").style.display = selectedValues.includes(
        "Next of Kin"
    )
        ? "block"
        : "none";
}

// Reading customer info from DB file (JSON)
async function loadCustomerData(identifier) {
    try {
        const response = await fetch("database.json"); // File you'll upload
        const data = await response.json();

        // Match by CIF or CNIC
        const record = data.find(
            (item) => item.cif == identifier || item.cnic == identifier
        );

        if (!record) return;

        // AUTO-FILL fields
        if (record.customerName)
            document.getElementById("customerName").value = record.customerName;

        if (record.fatherName)
            document.getElementById("fatherName").value = record.fatherName;

        if (record.dob)
            document.getElementById("dob").value = record.dob;

        if (record.mobile)
            document.getElementById("mobile").value = record.mobile;

        if (record.occupation)
            document.getElementById("occupation").value = record.occupation;

        if (record.employer)
            document.getElementById("employer").value = record.employer;

        if (record.nokName)
            document.getElementById("nokName").value = record.nokName;

        if (record.nokContact)
            document.getElementById("nokContact").value = record.nokContact;
    } catch (error) {
        console.error("Error reading database:", error);
    }
}

// Add listeners to fields for search
document.addEventListener("DOMContentLoaded", () => {
    const cifField = document.getElementById("cifInput");
    const cnicField = document.getElementById("cnicInput");

    if (cifField) {
        cifField.addEventListener("change", () => loadCustomerData(cifField.value));
    }

    if (cnicField) {
        cnicField.addEventListener("change", () => loadCustomerData(cnicField.value));
    }
});
