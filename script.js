// Smooth scroll to top when form is submitted
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Show success message after form submission
function showSuccessMessage() {
  const msg = document.createElement("div");
  msg.innerText = "Your Account Maintenance Request has been submitted successfully.";
  msg.style.position = "fixed";
  msg.style.top = "20px";
  msg.style.left = "50%";
  msg.style.transform = "translateX(-50%)";
  msg.style.padding = "15px 25px";
  msg.style.background = "#0d5e24";
  msg.style.color = "white";
  msg.style.borderRadius = "6px";
  msg.style.fontSize = "16px";
  msg.style.boxShadow = "0 3px 10px rgba(0,0,0,0.3)";
  msg.style.zIndex = "9999";

  document.body.appendChild(msg);

  setTimeout(() => {
    msg.remove();
  }, 3000);
}

// Validate required fields
function validateForm() {
  let valid = true;
  const requiredFields = document.querySelectorAll("input, textarea, select");

  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      field.style.border = "2px solid red";
      valid = false;
    } else {
      field.style.border = "1px solid #a5c9a5";
    }
  });

  return valid;
}

// Attach to submit button
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector("button");

  btn.addEventListener("click", (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Please fill all fields before submitting.");
      return;
    }

    showSuccessMessage();
    scrollToTop();
  });
});
