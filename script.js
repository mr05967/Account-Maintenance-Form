window.onload = function () {
  document.getElementById("p1").classList.remove("hidden");
};

function togglePanel(id) {
  document.getElementById(id).classList.toggle("hidden");
}

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

async function loadCustomerData() {
  const cif = document.getElementById("cifInput").value.trim();
  const cnic = document.getElementById("cnicInput").value.trim();

  if (!cif && !cnic) return;

  const response = await fetch("sample-database.json");
  const db = await response.json();

  const record = db.find(
    x => x.cif === cif || x.cnic === cnic
  );

  if (record) {
    document.getElementById("custName").value = record.name;
    document.getElementById("fatherName").value = record.father;
    document.getElementById("dob").value = record.dob;
    document.getElementById("mobile").value = record.mobile;
    document.getElementById("occType").value = record.occupation;
    document.getElementById("employer").value = record.employer;
    document.getElementById("nokName").value = record.nokName;
    document.getElementById("nokContact").value = record.nokContact;
  }
}
