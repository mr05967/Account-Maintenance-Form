import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore-lite.js";

// --- GLOBAL VARIABLES (Mandatory Canvas Environment Variables) ---
// These are provided by the canvas environment and MUST be used for setup.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-kyc-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Firebase instances will be stored here
let db;
let auth;
let userId = null;
let isAuthReady = false;

// --- UTILITY MAPPING FOR FORM FIELDS ---
// Maps reason checkboxes to the relevant section IDs that should be shown/updated.
const SECTION_MAPPING = {
    // If PeriodicReview is checked, all sections might be relevant for review, but we keep core sections.
    'PeriodicReview': ['sec-customer', 'sec-address', 'sec-occupation', 'sec-kyc', 'sec-nok', 'sec-special'],
    'CustomerIdentity': ['sec-customer'],
    'IDExpiry': ['sec-customer'],
    'AddressChange': ['sec-address'],
    'Occupation': ['sec-occupation', 'sec-kyc'],
    'NextOfKin': ['sec-nok'],
    'FinancialProfile': ['sec-kyc', 'sec-special'],
    'Other': ['sec-staff'], // Ensure staff/comments are looked at if 'Other' is checked
};

// All input fields in the form used for data collection
const fields = [
    // Section 1 fields are handled separately for identification/reason
    'idCategory', 'cnicInput', 'cifInput',
    
    // Section 2: Customer Information
    'customerFullName', 'salutation', 'gender', 'previousName', 'motherMaidenName', 'parentSpouseName', 
    'maritalStatus', 'dateOfBirth', 'placeOfBirthCountry', 'idIssuanceDate', 'idExpiryDate', 
    'passportNumber', 'passportExpiryDate', 'qualification', 'primaryNationality', 'ntnNumber', 
    'fbrStatus',

    // Section 3: Contact & Address
    'primaryContactNumber', 'telcoCompany', 'homeResidenceNumber', 'telOfficeNumber', 'emailAddress', 
    'residentialAddress', 'residentialCity', 'residentialProvince', 'residentialCountry', 'residentialZip', 
    'permanentAddress', 'permanentCity', 'permanentProvince', 'permanentCountry', 'permanentZip',

    // Section 4: Occupation
    'occupationType', 'jobTitle', 'employmentStatus', 'employmentStartDate', 'employerBusinessName', 
    'industryCode', 'businessNature', 'occupationAddress', 'occupationCity', 'occupationCountry',

    // Section 5: KYC Profile & Financial Activity
    'sourceOfFundsDescription', 'purposeOfRelationship', 'geoAreaActivity', 'expectedCreditAmount', 
    'noOfDeposit', 'highestExpectedBalance', 'expectedDebitAmount', 'noOfWithdrawal', 'expectedIntlTxnValue', 
    'riskRatingScore', 'newRiskClassification', 

    // Section 6: Next of Kin
    'nomineeTagCif', 'nomineeFullName', 'nomineeRelationship', 'nomineeShare', 'nomineeIDCategory', 
    'nomineeCNIC', 'nomineeContact', 'nomineeAddress', 'nomineeCity', 'nomineeCountry',

    // Section 7: Regulatory & Special Conditions
    'pepRelation', 'otherNationality', 'fatcaAffected', 'usTin', 'fatcaExemptionCode', 
    'crsTaxResident', 'crsJurisdiction1', 'crsTin1', 'crsJurisdiction2', 'crsTin2',

    // Section 8: Biometric Verification Status
    'lastVerificationDate', 'verificationSource', 
    
    // Section 9: Staff Certification & Audit
    'docRef_id', 'docRef_income', 'docRef_utility', 'docRef_other1', 'docRef_other2', 
    'reviewingOfficerID', 'certificationDate', 'auditComments',
];

// --- FIREBASE INITIALIZATION AND AUTHENTICATION ---

/**
 * Initializes Firebase, authenticates the user, and sets up global state.
 */
async function initApp() {
    if (!firebaseConfig) {
        console.error("Firebase configuration is missing. Cannot initialize app.");
        return;
    }

    try {
        setLogLevel('Debug');
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        // Authenticate user using custom token or anonymously
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            await signInAnonymously(auth);
        }

        // Wait for auth state to settle
        onAuthStateChanged(auth, (user) => {
            if (user) {
                userId = user.uid;
                isAuthReady = true;
                console.log("Firebase initialized and user authenticated:", userId);
                
                // Once authenticated, load any existing draft data
                loadDraftData();
            } else {
                isAuthReady = true; // Still ready, but anonymous or signed out
                console.log("Firebase initialized. Anonymous sign-in failed or user signed out.");
            }
        });

    } catch (error) {
        console.error("Error during Firebase initialization or authentication:", error);
    }
}

// --- FORM INTERACTIVITY FUNCTIONS ---

/**
 * Toggles the visibility of a section body (Accordion).
 * @param {string} sectionId The ID of the section container (e.g., 'sec-customer').
 */
window.toggleSection = function(sectionId) {
    const body = document.getElementById(sectionId + '-body');
    if (body) {
        body.classList.toggle('open');
    }
}

/**
 * Reads the selected reasons for updation and shows/hides sections accordingly.
 */
function updateVisibleSections() {
    const checkboxes = document.querySelectorAll('input[name="updateReasonMulti"]:checked');
    const selectedReasons = Array.from(checkboxes).map(cb => cb.value);
    
    // Get all potential sections that need updating based on selections
    let sectionsToShow = new Set();
    
    // Section 1 and 9 (Identification and Audit) are always visible/relevant
    sectionsToShow.add('sec-identification');
    sectionsToShow.add('sec-staff');

    selectedReasons.forEach(reason => {
        if (SECTION_MAPPING[reason]) {
            SECTION_MAPPING[reason].forEach(sectionId => sectionsToShow.add(sectionId));
        }
    });

    // Iterate through all possible sections (2 to 8) and update visibility/status
    const allSections = ['sec-customer', 'sec-address', 'sec-occupation', 'sec-kyc', 'sec-nok', 'sec-special', 'sec-biometric'];

    allSections.forEach(sectionId => {
        const sectionEl = document.getElementById(sectionId);
        const headerTitle = sectionEl.querySelector('.section-header .title');

        if (sectionsToShow.has(sectionId)) {
            sectionEl.style.display = 'block';
            headerTitle.style.color = 'var(--brand-dark)';
        } else {
            // Hide sections that are not strictly necessary based on selected reasons
            sectionEl.style.display = 'none';
        }
    });
}

/**
 * Mocks fetching existing customer data and populates the form.
 */
window.autoPopulate = function() {
    console.log("Fetching mock customer data...");

    // Mock data structure
    const mockData = {
        // Section 1
        idCategory: 'CNIC',
        cnicInput: '42101-1234567-8',
        cifInput: '987654',
        
        // Section 2
        customerFullName: 'Ahmed Hassan Khan',
        salutation: 'Mr',
        gender: 'M',
        dateOfBirth: '1985-10-20',
        primaryNationality: 'Pakistan',
        ntnNumber: '12345678901',
        
        // Section 3
        primaryContactNumber: '0300-1112233',
        emailAddress: 'ahmed.khan@example.com',
        residentialAddress: 'House 12, Street 3, DHA Phase 6',
        residentialCity: 'Karachi',
        
        // Section 4
        occupationType: 'Salaried',
        jobTitle: 'Senior Manager',
        employerBusinessName: 'Tech Solutions Corp',
        
        // Section 5
        sourceOfFundsDescription: 'Salary and Bonuses',
        purposeOfRelationship: 'Savings and Retirement Investment',
        newRiskClassification: 'Medium',
        
        // Section 9
        reviewingOfficerID: 'MGR-789',
        certificationDate: new Date().toISOString().substring(0, 10),
    };

    // Populate all input fields with mock data
    for (const key in mockData) {
        const input = document.getElementById(key);
        if (input) {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = (input.value === mockData[key]);
            } else {
                input.value = mockData[key];
            }
        }
    }
    
    // Set mock biometric status
    document.getElementById('biometricStatusText').textContent = "SUCCESS (Verified)";
    document.getElementById('biometricStatusText').style.color = 'var(--brand-primary)';
    document.getElementById('lastVerificationDate').value = '2023-11-20';
    
    console.log("Form populated with mock data.");
}

/**
 * Clears all input fields in the form.
 */
document.getElementById('clearBtn').addEventListener('click', () => {
    // Confirmation dialog substitute
    if (window.confirm("Are you sure you want to clear the entire form?")) {
        const allInputs = document.querySelectorAll('input, select, textarea');
        allInputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else if (input.id !== 'primaryNationality' && input.id !== 'residentialCountry' && input.id !== 'permanentCountry' && input.id !== 'occupationCountry') {
                input.value = '';
            }
        });
        
        // Reset specific UI elements
        document.getElementById('biometricStatusText').textContent = "Not Verified";
        document.getElementById('biometricStatusText').style.color = 'var(--brand-dark)';
        
        // Re-run visibility check to default
        updateVisibleSections();
        console.log("Form cleared.");
    }
});


/**
 * Collects all form data into a structured object.
 * @returns {object} The collected form data.
 */
function collectData() {
    const data = {};

    // Collect simple text/select/date inputs
    fields.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            data[id] = input.value;
        }
    });

    // Collect Section 1: Multi-Select Reasons
    const reasonCheckboxes = document.querySelectorAll('input[name="updateReasonMulti"]:checked');
    data.updateReasons = Array.from(reasonCheckboxes).map(cb => cb.value);

    // Collect Section 5: Radio/Checkbox Groups
    data.sigCashTxn = document.querySelector('input[name="sigCashTxn"]:checked')?.value || null;
    data.counterParties = Array.from(document.querySelectorAll('input[name="counterParties"]:checked')).map(cb => cb.value);
    data.txnMode = Array.from(document.querySelectorAll('input[name="txnMode"]:checked')).map(cb => cb.value);

    // Collect Section 9: Certification Checkboxes
    data.customerReviewed = document.getElementById('customerReviewed').checked;
    data.complianceCheck = document.getElementById('complianceCheck').checked;
    data.biometricStatus = document.getElementById('biometricStatusText').textContent; // Capture the final status

    return data;
}

// --- FIREBASE CRUD OPERATIONS ---

/**
 * Loads the last saved draft data from Firestore for the current user.
 */
async function loadDraftData() {
    if (!isAuthReady || !userId) return;

    try {
        const submissionRef = doc(db, `artifacts/${appId}/users/${userId}/kyc_submissions`, 'draft');
        const docSnap = await getDoc(submissionRef);

        if (docSnap.exists()) {
            const savedData = docSnap.data();
            console.log("Draft data loaded from Firestore.");
            
            // Populate form fields from savedData
            for (const key in savedData) {
                const value = savedData[key];
                
                // Handle simple fields
                const input = document.getElementById(key);
                if (input) {
                    input.value = value;
                }
                
                // Handle Checkbox Arrays (Reasons, Counter Parties, Txn Modes, Special Conditions)
                if (Array.isArray(value)) {
                    document.querySelectorAll(`input[name="${key}"]:checkbox`).forEach(cb => {
                        cb.checked = value.includes(cb.value);
                    });
                }
                
                // Handle Radio Buttons
                if (key === 'sigCashTxn') {
                    document.querySelectorAll(`input[name="sigCashTxn"]`).forEach(radio => {
                        radio.checked = (radio.value === value);
                    });
                }
                
                // Handle Certification Checkboxes
                if (typeof value === 'boolean') {
                    const checkbox = document.getElementById(key);
                    if (checkbox && checkbox.type === 'checkbox') {
                        checkbox.checked = value;
                    }
                }
            }

            // After loading, update the UI logic
            updateVisibleSections();
            
        } else {
            console.log("No existing draft found. Starting fresh form.");
        }
    } catch (e) {
        console.error("Error loading draft data:", e);
    }
}

/**
 * Handles the final form submission and saves data to Firestore.
 */
async function handleSubmit() {
    if (!isAuthReady || !userId) {
        alert("Authentication not ready. Please wait a moment and try again.");
        return;
    }

    const submissionData = collectData();
    
    // Simple Validation Check
    if (!submissionData.customerReviewed || !submissionData.complianceCheck) {
        alert("Mandatory: Please confirm the final certification checks in Section 9 before submitting.");
        return;
    }
    if (!submissionData.updateReasons || submissionData.updateReasons.length === 0) {
         alert("Mandatory: Please select at least one Reason for Updation in Section 1.");
        return;
    }

    try {
        // Use a timestamp or a unique ID for the final submission document
        const submissionId = `submission-${Date.now()}`;
        const submissionRef = doc(db, `artifacts/${appId}/users/${userId}/kyc_submissions`, submissionId);

        // Save the data
        await setDoc(submissionRef, {
            ...submissionData,
            submissionDate: new Date().toISOString(),
            userId: userId,
        });

        console.log(`KYC Submission successful! Document ID: ${submissionId}`);
        
        // Optional: Clear the draft document after successful final submission (for next time)
        const draftRef = doc(db, `artifacts/${appId}/users/${userId}/kyc_submissions`, 'draft');
        await setDoc(draftRef, {}); // Clear the draft

        alert("KYC Update Submitted Successfully! Thank you.");
        
        // Reload or clear the form after submission
        document.getElementById('clearBtn').click(); 
        
    } catch (e) {
        console.error("Error submitting KYC data:", e);
        alert("An error occurred during submission. Please check the console.");
    }
}


// --- MAIN EXECUTION ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Firebase and authenticate
    initApp();
    
    // 2. Attach main submission handler
    document.getElementById('submitBtn').addEventListener('click', handleSubmit);
    
    // 3. Attach listeners for accordion toggles (functions already exposed via window)

    // 4. Attach listeners to the reason checkboxes to trigger visibility logic
    document.getElementById('updateReasonCheckboxes').addEventListener('change', updateVisibleSections);
    
    // 5. Initial visibility check (to hide optional sections until reasons are selected)
    updateVisibleSections(); 
    
    // 6. Address Sync Listener
    document.getElementById('sameAsResidential').addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        if (isChecked) {
            document.getElementById('permanentAddress').value = document.getElementById('residentialAddress').value;
            document.getElementById('permanentCity').value = document.getElementById('residentialCity').value;
            document.getElementById('permanentProvince').value = document.getElementById('residentialProvince').value;
            document.getElementById('permanentCountry').value = document.getElementById('residentialCountry').value;
            document.getElementById('permanentZip').value = document.getElementById('residentialZip').value;
        } else {
            document.getElementById('permanentAddress').value = '';
        }
    });
});
