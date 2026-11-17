
document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // API CONFIGURATION
    // =========================

    const API_URL = "http://127.0.0.1:8080/api/complaints";

    const form = document.getElementById("complaintForm");

    if (!form) return;

    const titleInput = document.getElementById("issueTitle");
    const categoryInput = document.getElementById("category");
    const locationInput = document.getElementById("location");
    const descriptionInput = document.getElementById("description");

    const imageInput = document.getElementById("issueImage");
    const imagePreview = document.getElementById("imagePreview");
    const uploadArea = document.getElementById("uploadArea");
    const browseBtn = document.getElementById("browseBtn");

    const charCount = document.getElementById("charCount");
    const messageBox = document.getElementById("complaintMessage");
    const submitButton = form.querySelector('[type="submit"]');

    let selectedImage = null;
    let isSubmitting = false;
    let previewUrl = null;


    // =========================
    // STUDENT LOGIN CHECK
    // =========================

    const studentEmail = localStorage.getItem("studentEmail");

    if (!studentEmail || !studentEmail.trim()) {

        alert("Please login first.");

        window.location.replace("login.html");

        return;
    }

    loadLoggedInStudentDetails();


    // =========================
    // SIDEBAR
    // =========================

    const menuBtn = document.getElementById("menuBtn");
    const sidebar = document.getElementById("sidebar");

    if (menuBtn && sidebar) {

        menuBtn.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });

    }


    // =========================
    // INPUT PATTERNS
    // =========================

    const titlePattern = /^[A-Za-z0-9 ,.'()&-]+$/;

    const locationPattern = /^[A-Za-z0-9 ,/#.-]+$/;


    function hasMeaningfulText(value) {

        return /[A-Za-z0-9]/.test(value);

    }


    // =========================
    // MESSAGE FUNCTION
    // =========================

    function showMessage(message, type) {

        if (!messageBox) return;

        messageBox.textContent = message;

        messageBox.className =
            "complaint-message " + type;

    }


    // =========================
    // FORM VALIDATION
    // =========================

    function validateForm() {

        const title = titleInput.value.trim();

        const location = locationInput.value.trim();

        const description = descriptionInput.value.trim();


        if (!title || !categoryInput.value ||
            !location || !description) {

            showMessage(
                "Please fill all required fields.",
                "error"
            );

            return false;
        }


        if (title.length < 5 || title.length > 80) {

            showMessage(
                "Title must be between 5 and 80 characters.",
                "error"
            );

            titleInput.focus();

            return false;
        }


        if (!titlePattern.test(title) ||
            !hasMeaningfulText(title)) {

            showMessage(
                "Title contains invalid characters.",
                "error"
            );

            titleInput.focus();

            return false;
        }


        if (location.length < 3 || location.length > 100) {

            showMessage(
                "Location must be between 3 and 100 characters.",
                "error"
            );

            locationInput.focus();

            return false;
        }


        if (!locationPattern.test(location) ||
            !hasMeaningfulText(location)) {

            showMessage(
                "Location contains invalid characters.",
                "error"
            );

            locationInput.focus();

            return false;
        }


        if (description.length < 15 ||
            description.length > 500) {

            showMessage(
                "Description must be between 15 and 500 characters.",
                "error"
            );

            descriptionInput.focus();

            return false;
        }


        if (!hasMeaningfulText(description)) {

            showMessage(
                "Description must contain meaningful text.",
                "error"
            );

            descriptionInput.focus();

            return false;
        }


        if (/[<>]/.test(description) ||
            /[\u0000-\u001F]/.test(description)) {

            showMessage(
                "Description contains unsupported characters.",
                "error"
            );

            descriptionInput.focus();

            return false;
        }


        const validCategories = [
            "Maintenance",
            "Electrical",
            "Cleanliness",
            "Water Supply",
            "Internet",
            "Furniture",
            "Security",
            "Other"
        ];


        if (!validCategories.includes(categoryInput.value)) {

            showMessage(
                "Please select a valid category.",
                "error"
            );

            categoryInput.focus();

            return false;
        }


        const priority = document.querySelector(
            'input[name="priority"]:checked'
        );


        if (!priority ||
            !["Low", "Medium", "High"].includes(priority.value)) {

            showMessage(
                "Please select a valid priority.",
                "error"
            );

            return false;
        }


        return true;

    }


    // =========================
    // CHARACTER COUNTER
    // =========================

    if (descriptionInput && charCount) {

        descriptionInput.addEventListener("input", () => {

            charCount.textContent =
                descriptionInput.value.length;

        });

    }


    // =========================
    // IMAGE VALIDATION
    // =========================

    function validateImage(file) {

        if (!file) return false;

        const allowedTypes = [
            "image/jpeg",
            "image/png"
        ];

        const maxSize = 5 * 1024 * 1024;


        if (!allowedTypes.includes(file.type)) {

            showMessage(
                "Only JPG, JPEG and PNG images are allowed.",
                "error"
            );

            return false;
        }


        if (file.size > maxSize) {

            showMessage(
                "Image size must be 5 MB or smaller.",
                "error"
            );

            return false;
        }


        if (file.size === 0) {

            showMessage(
                "Selected image is empty.",
                "error"
            );

            return false;
        }


        return true;

    }


    // =========================
    // DISPLAY IMAGE PREVIEW
    // =========================

    function displayImage(file) {

        if (!validateImage(file)) {

            imageInput.value = "";

            selectedImage = null;

            return;
        }


        selectedImage = file;


        if (previewUrl) {

            URL.revokeObjectURL(previewUrl);

        }


        previewUrl = URL.createObjectURL(file);


        imagePreview.replaceChildren();

        imagePreview.style.display = "block";


        const wrapper = document.createElement("div");

        wrapper.className = "preview-item";


        const img = document.createElement("img");

        img.src = previewUrl;

        img.alt = "Complaint image preview";


        const info = document.createElement("div");

        info.className = "preview-info";


        const name = document.createElement("strong");

        name.textContent = file.name;


        const size = document.createElement("small");

        size.textContent =
            (file.size / 1024).toFixed(1) + " KB";


        const remove = document.createElement("button");

        remove.type = "button";

        remove.className = "remove-image";

        remove.textContent = "Remove";


        remove.addEventListener("click", removeImage);


        info.append(name, size);

        wrapper.append(img, info, remove);

        imagePreview.appendChild(wrapper);

    }


    // =========================
    // REMOVE IMAGE
    // =========================

    function removeImage() {

        selectedImage = null;

        imageInput.value = "";

        imagePreview.replaceChildren();

        imagePreview.style.display = "none";


        if (previewUrl) {

            URL.revokeObjectURL(previewUrl);

            previewUrl = null;

        }

    }


    // =========================
    // BROWSE BUTTON
    // =========================

    if (browseBtn && imageInput) {

        browseBtn.addEventListener("click", (event) => {

            event.preventDefault();

            event.stopPropagation();

            imageInput.click();

        });

    }


    // =========================
    // DRAG AND DROP
    // =========================

    if (uploadArea && imageInput) {

        uploadArea.addEventListener("click", (event) => {

            if (event.target.closest("#browseBtn")) return;

            imageInput.click();

        });


        uploadArea.addEventListener("dragover", (event) => {

            event.preventDefault();

            uploadArea.classList.add("dragover");

        });


        uploadArea.addEventListener("dragleave", () => {

            uploadArea.classList.remove("dragover");

        });


        uploadArea.addEventListener("drop", (event) => {

            event.preventDefault();

            uploadArea.classList.remove("dragover");


            const file = event.dataTransfer.files[0];

            if (!file) return;


            displayImage(file);

        });


        imageInput.addEventListener("change", () => {

            const file = imageInput.files[0];

            if (file) displayImage(file);

        });

    }


    // =========================
    // SUBMIT COMPLAINT
    // =========================

    form.addEventListener("submit", async (event) => {

        event.preventDefault();


        if (isSubmitting) return;


        if (!validateForm()) return;


        const priority = document.querySelector(
            'input[name="priority"]:checked'
        );


        // FormData sends text and image together.
        const formData = new FormData();


        formData.append(
            "title",
            titleInput.value.trim()
        );


        formData.append(
            "category",
            categoryInput.value
        );


        formData.append(
            "location",
            locationInput.value.trim()
        );


        formData.append(
            "description",
            descriptionInput.value.trim()
        );


        formData.append(
            "priority",
            priority.value
        );


        formData.append(
            "studentEmail",
            studentEmail.trim()
        );


        // Add photo only if selected.
        if (selectedImage) {

            formData.append(
                "image",
                selectedImage
            );

        }


        isSubmitting = true;

        submitButton.disabled = true;

        submitButton.textContent = "Uploading complaint...";


        try {

            const response = await fetch(API_URL, {

                method: "POST",

                // Do not manually set Content-Type for FormData.
                // Browser automatically adds multipart boundary.

                credentials: "include",

                body: formData

            });


            const responseText = await response.text();

            let result = {};

            try {

                result = responseText
                    ? JSON.parse(responseText)
                    : {};

            } catch {

                result = {
                    message: responseText
                };

            }


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    responseText ||
                    "Complaint submission failed."
                );

            }


            console.log(
                "Complaint saved successfully:",
                result
            );


            showMessage(
                "Complaint and photo submitted successfully!",
                "success"
            );


            form.reset();

            removeImage();


            if (charCount) {

                charCount.textContent = "0";

            }


            setTimeout(() => {

                window.location.href =
                    "my-complaints.html";

            }, 1200);


        } catch (error) {

            console.error(
                "Complaint submission error:",
                error
            );


            showMessage(
                error.message ||
                "Complaint submit nahi hui. Please try again.",
                "error"
            );


        } finally {

            isSubmitting = false;

            submitButton.disabled = false;

            submitButton.innerHTML =
                '<i class="fa-solid fa-paper-plane"></i> Submit Complaint';

        }

    });

});


// =========================
// LOAD STUDENT DETAILS
// =========================

function loadLoggedInStudentDetails() {

    const studentName =
        localStorage.getItem("studentName");


    if (!studentName) return;


    const nameElement =
        document.getElementById("loggedInStudentName");


    const avatarElement =
        document.getElementById("loggedInStudentAvatar");


    if (nameElement) {

        nameElement.textContent = studentName;

    }


    if (avatarElement) {

        avatarElement.textContent = studentName
            .trim()
            .split(/\s+/)
            .map(word => word.charAt(0))
            .join("")
            .substring(0, 2)
            .toUpperCase();

    }

}
