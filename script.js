window.onload = function() {
    // Auto open Identification panel
    document.getElementById("panel-identification").style.display = "block";
};

// Toggle panel content
function togglePanel(id){
    let el = document.getElementById(id);
    el.style.display = (el.style.display === "block") ? "none" : "block";
}

// Handle multi-select for Reason for Updation/Review
function handleMultiSelect(){
    const selected = Array.from(document.querySelectorAll('.ms-opt:checked')).map(x=>x.value);

    document.getElementById('panel-customer').style.display =
        selected.some(v=>['Periodic','Customer','ID Related'].includes(v)) ? 'block':'none';
    document.getElementById('panel-occupation').style.display =
        selected.includes('Occupation') ? 'block':'none';
    document.getElementById('panel-nok').style.display =
        selected.includes('Next of Kin') ? 'block':'none';
}

// CNIC Format: #####-#######-#
function formatCNIC(input){
    let val = input.value.replace(/\D/g,'');
    if(val.length>5 && val.length<=12)
        val = val.slice(0,5)+'-'+val.slice(5);
    if(val.length>13)
        val = val.slice(0,13)+'-'+val.slice(13);
    input.value = val;
}

// CIF Format: ######
function formatCIF(input){
    let val = input.value.replace(/\D/g,'').slice(0,6);
    input.value = val;
}

// Auto-populate fields from dataset
function populateData(){
    const cif = document.getElementById('cifInput').value;
    const cnic = document.getElementById('cnicInput').value;

    // Fetch sample data from dataset
    fetch('database.json')
    .then(response => response.json())
    .then(data => {
        let record = data.find(d => d.cif === cif || d.cnic === cnic);
        if(record){
            // Customer info
            document.getElementById('customerName').value = record.customerName;
            document.getElementById('fatherName').value = record.fatherName;
            document.getElementById('dob').value = record.dob;
            document.getElementById('mobile').value = record.mobile;
            document.getElementById('email').value = record.email;

            // Occupation
            document.getElementById('occupationType').value = record.occupationType;
            document.getElementById('employer').value = record.employer;

            // Next of Kin
            document.getElementById('nokName').value = record.nokName;
            document.getElementById('nokContact').value = record.nokContact;
        }
    });
}
