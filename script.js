const fields = {
    // 1. IDENTIFICATION
    idCategory: 'idCategory',
    cnicInput: 'cnicInput',
    cifInput: 'cifInput',
    updateReason: 'updateReason',
    
    // 2. CUSTOMER INFO
    customerFullName: 'customerFullName',
    salutation: 'salutation',
    gender: 'gender',
    motherMaidenName: 'motherMaidenName',
    parentSpouseName: 'parentSpouseName',
    maritalStatus: 'maritalStatus',
    dateOfBirth: 'dateOfBirth',
    placeOfBirthCountry: 'placeOfBirthCountry',
    qualification: 'qualification',
    idIssuanceDate: 'idIssuanceDate',
    idExpiryDate: 'idExpiryDate',
    fbrStatus: 'fbrStatus',

    // 3. CONTACT & ADDRESS
    primaryContactNumber: 'primaryContactNumber',
    homeResidenceNumber: 'homeResidenceNumber',
    telOfficeNumber: 'telOfficeNumber',
    emailAddress: 'emailAddress',
    mobileCountry: 'mobileCountry',
    telcoCompany: 'telcoCompany',
    residentialAddress: 'residentialAddress',
    permanentAddress: 'permanentAddress',

    // 4. OCCUPATION
    occupationType: 'occupationType',
    jobTitle: 'jobTitle',
    employerBusinessName: 'employerBusinessName',
    occupationAddress: 'occupationAddress',

    // 5. KYC PROFILE
    sourceOfFundsDescription: 'sourceOfFundsDescription',
    geoAreaActivity: 'geoAreaActivity',
    expectedCreditAmount: 'expectedCreditAmount',
    noOfDeposit: 'noOfDeposit',
    highestExpectedBalance: 'highestExpectedBalance',
    expectedDebitAmount: 'expectedDebitAmount',
    noOfWithdrawal: 'noOfWithdrawal',
    riskRatingScore: 'riskRatingScore',
    newRiskClassification: 'newRiskClassification',
    
    // 6. NEXT OF KIN
    nomineeTagCif: 'nomineeTagCif',
    nomineeFullName: 'nomineeFullName',
    nomineeRelationship: 'nomineeRelationship',
    nomineeCNIC: 'nomineeCNIC',
    nomineeContact: 'nomineeContact',
    nomineeAddress: 'nomineeAddress',
    
    // 7. REGULATORY & SPECIAL CONDITIONS
    fatca: 'fatca', 
    crs: 'crs', 
    pep: 'pep', 
    pepRelation: 'pepRelation', 
    nonResident: 'nonResident', 
    zakatExempt: 'zakatExempt', 
    otherNationality: 'otherNationality', 

    // 8. BIOMETRIC (Output/Status field only)
    biometricReVerifiedStatus: 'biometricReVerifiedStatus',

    // 9. STAFF & AUDIT
    customerReviewed: 'customerReviewed', 
    docRef_id: 'docRef_id',
    docRef_student: 'docRef_student',
    docRef_income: 'docRef_income',
    docRef_utility: 'docRef_utility',
    docRef_other: 'docRef_other',
};

const sections = {
    customer: 'sec-customer',
    address: 'sec-address',
    occupation: 'sec-occupation',
    kyc: 'sec-kyc',
    nok: 'sec-nok',
    special: 'sec-special',
    biometric: 'sec-biometric',
    staff: 'sec-staff'
};

document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners for key inputs and buttons
    document.getElementById(fields.updateReason).addEventListener('change', updateVisibleSections);
    document.getElementById('submitBtn').addEventListener('click', handleSubmit);
    document.getElementById('clearBtn').addEventListener('click', clearForm);
    
    // CNIC/CIF formatting and mock data population
    document.getElementById(fields.cnicInput).addEventListener('input', function() { formatCNIC(this); autoPopulate(); });
    document.getElementById(fields.cifInput).addEventListener('input', function() { formatCIF(this); autoPopulate(); });

    // Initial section visibility setup
    updateVisibleSections();
});


/* --- Utility Functions --- */

/**
 * Formats the CNIC input field on the fly (XXXXX-XXXXXXX-X).
 * @param {HTMLInputElement} input - The CNIC input element.
 */
function formatCNIC(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value.length > 5 && value.length <= 12) {
        value = value.substring(0, 5) + '-' + value.substring(5);
    } else if (value.length > 12) {
        value = value.substring(0, 5) + '-' + value.substring(5, 12) + '-' + value.substring(12, 13);
    }
    input.value = value;
}

/**
 * Formats the CIF input field (numeric only, max 6 digits).
 * @param {HTMLInputElement} input - The CIF input element.
 */
function formatCIF(input) {
    input.value = input.value.replace(/[^0-9]/g, '').substring(0, 6);
}

/**
 * Toggles the open/close state of an accordion section.
 * @param {string} sectionId - The ID of the accordion section container.
 */
function toggleSection(sectionId) {
    const sectionBody = document.getElementById(sectionId + '-body');
    if (sectionBody) {
        sectionBody.classList.toggle('open');
    }
}


/* --- Section Visibility Logic --- */

/**
 * Hides/shows sections based on the selected update reason.
 */
function updateVisibleSections() {
    const reason = document.getElementById(fields.updateReason).value;
    
    // Defines which sections should be visible for each reason
    const visibilityMap = {
        'PeriodicReview': [sections.customer, sections.address, sections.occupation, sections.kyc, sections.nok, sections.special, sections.biometric, sections.staff],
        'CustomerIdentity': [sections.customer, sections.address, sections.special, sections.biometric, sections.staff],
        'IDExpiry': [sections.customer, sections.address, sections.special, sections.biometric, sections.staff],
        'Occupation': [sections.occupation, sections.kyc, sections.special, sections.biometric, sections.staff],
        'NextOfKin': [sections.nok, sections.special, sections.biometric, sections.staff],
        'Other': [sections.customer, sections.address, sections.occupation, sections.kyc, sections.nok, sections.special, sections.biometric, sections.staff]
    };

    // Get the list of sections to show, defaulting to compliance/audit sections
    const sectionsToShow = visibilityMap[reason] || [sections.special, sections.biometric, sections.staff]; 
    
    // Iterate through all possible sections and set display style
    Object.values(sections).forEach(sectionId => {
        const sectionElement = document.getElementById(sectionId);
        if (sectionElement) {
            sectionElement.style.display = sectionsToShow.includes(sectionId) ? 'block' : 'none';
        }
    });
}


/* --- Data Handling (Placeholder for JSON/API interaction) --- */

/**
 * Simulate fetching and populating data based on CIF/CNIC.
 */
function autoPopulate() {
    const cif = document.getElementById(fields.cifInput).value;
    const cnic = document.getElementById(fields.cnicInput).value;

    // Only attempt to populate if a complete CIF or CNIC is entered
    if (cif.length !== 6 && cnic.length !== 15) return;
    
    // --- MOCK DATA SIMULATION ---
    const mockData = {
        '123456': { // Sample CIF for demo
            'idCategory': 'CNIC',
            'customerFullName': 'AHMED BIN QASIM',
            'salutation': 'Mr',
            'gender': 'M',
            'motherMaidenName': 'FATIMA ZAHRA',
            'parentSpouseName': 'MUHAMMAD QASIM',
            'maritalStatus': 'Married',
            'dateOfBirth': '1985-04-12',
            'idIssuanceDate': '2019-01-01',
            'idExpiryDate': '2029-01-01',
            'fbrStatus': 'ACTIVE TAX PAYER',
            'primaryContactNumber': '0300-1234567',
            'residentialAddress': 'House 1A, Street 5, Phase 7, Karachi.',
            'occupationType': 'Salaried',
            'sourceOfFundsDescription': 'Salary Income',
            'expectedCreditAmount': '500000',
            'newRiskClassification': 'Medium',
            'nomineeFullName': 'AYESHA AHMED',
            'biometricReVerifiedStatus': 'SUCCESS',
            'biometricStatusText': 'Verified'
        }
    };
    
    const data = mockData['123456']; // Simulate found data

    // Populate fields if data exists
    if (data) {
        Object.keys(fields).forEach(key => {
            const element = document.getElementById(fields[key]);
            if (element && data[key] !== undefined) {
                if (element.type === 'checkbox') {
                    element.checked = data[key] === true;
                } else if (element.tagName === 'SELECT' || element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.value = data[key];
                }
            }
        });
        document.getElementById('biometricStatusText').textContent = data.biometricStatusText || 'Verified';
        console.log('Mock Data Populated for CIF/CNIC');
    } else {
        // Clear status fields if nothing found
        document.getElementById('biometricStatusText').textContent = 'Not Verified';
        document.getElementById(fields.biometricReVerifiedStatus).value = '';
    }
}

/**
 * Gathers all data from the form and prepares it for submission (including checkbox groups).
 * @returns {object} The collected form data.
 */
function collectData() {
    const formData = {};

    // Collect all standard fields
    Object.keys(fields).forEach(key => {
        const element = document.getElementById(fields[key]);
        if (element) {
            if (element.type === 'checkbox') {
                formData[key] = element.checked;
            } else if (element.tagName === 'SELECT' || element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                formData[key] = element.value;
            }
        }
    });

    // Handle Checkbox Groups (Section 7 and 5)
    formData.specialConditions = Array.from(document.querySelectorAll('input[name="specialCondition"]:checked')).map(el => el.value);
    formData.counterParties = Array.from(document.querySelectorAll('input[name="counterParties"]:checked')).map(el => el.value);
    formData.txnMode = Array.from(document.querySelectorAll('input[name="txnMode"]:checked')).map(el => el.value);
    
    // Handle Radio Buttons (Sig Cash Txn - Section 5)
    const sigCashTxnElement = document.querySelector('input[name="sigCashTxn"]:checked');
    formData.significantCashTransaction = sigCashTxnElement ? sigCashTxnElement.value : null;

    return formData;
}

/**
 * Handles the form submission event.
 */
function handleSubmit() {
    const data = collectData();
    
    // Basic validation check (mandatory fields in Section 1 and 9)
    if (!data.cifInput || !data.cnicInput || !data.updateReason) {
        alert("Please enter CIF, CNIC, and select a Reason for Updation in Section 1.");
        return;
    }

    if (!data.customerReviewed) {
        alert("Staff Certification: Please confirm the customer has reviewed and confirmed all changes in Section 9.");
        return;
    }

    // --- SUBMISSION LOGIC ---
    console.log('--- Submitting Form Data to Camunda/Backend ---');
    console.log(JSON.stringify(data, null, 2));
    alert('Form data successfully logged to console for submission. (In a real system, this JSON would be sent to the API.)');
    
    // Example: fetch('/api/submit', { method: 'POST', body: JSON.stringify(data) })
}

/**
 * Clears all form fields.
 */
function clearForm() {
    if (confirm("Are you sure you want to clear all form data?")) {
        // Clear all mapped fields
        Object.keys(fields).forEach(key => {
            const element = document.getElementById(fields[key]);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = false;
                } else if (element.tagName === 'SELECT' || element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.value = '';
                }
            }
        });
        
        // Clear all radio/checkbox groups
        document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(el => {
            el.checked = false;
        });

        // Clear status display and reset sections
        document.getElementById('biometricStatusText').textContent = 'Not Verified';
        updateVisibleSections(); 
        
        console.log('Form cleared.');
    }
}
