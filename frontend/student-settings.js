
document.addEventListener("DOMContentLoaded", () => {
    checkStudentLogin();
    loadStudentProfile();
    initializeAppearance();
    initializeNotifications();
    initializePasswordForm();
    initializeMobileMenu();
});

// ======================================
// API CONFIGURATION
// ======================================

const STUDENT_API = "http://127.0.0.1:8080/api/students";

// ======================================
// STUDENT LOGIN CHECK
// ======================================

function checkStudentLogin() {
    const email = localStorage.getItem("studentEmail");

    if (!email) {
        window.location.href = "login.html";
    }
}

// ======================================
// STUDENT PROFILE
// ======================================

function loadStudentProfile() {
    const name = localStorage.getItem("studentName") || "Student";
    const email = localStorage.getItem("studentEmail") || "";

    const initials = name
        .split(" ")
        .filter(Boolean)
        .map(word => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

    document.getElementById("studentName").textContent = name;
    document.getElementById("studentAvatar").textContent = initials;

    document.getElementById("profileName").textContent = name;
    document.getElementById("profileAvatar").textContent = initials;
    document.getElementById("profileEmail").textContent = email;
}

// ======================================
// APPEARANCE SETTINGS
// ======================================

function initializeAppearance() {
    const themeMode = document.getElementById("themeMode");
    const layoutMode = document.getElementById("layoutMode");
    const colorButtons = document.querySelectorAll(".theme-color");
    const resetButton = document.getElementById("resetAppearance");
    const message = document.getElementById("appearanceMessage");

    const defaultSettings = {
        mode: "light",
        layout: "comfortable",
        color: "blue"
    };

    function getSettings() {
        try {
            const saved = JSON.parse(
                localStorage.getItem("campusfixAppearance")
            );

            return {
                mode: ["light", "dark"].includes(saved?.mode)
                    ? saved.mode : defaultSettings.mode,

                layout: ["compact", "comfortable"].includes(saved?.layout)
                    ? saved.layout : defaultSettings.layout,

                color: ["blue", "purple", "green", "orange"].includes(saved?.color)
                    ? saved.color : defaultSettings.color
            };
        } catch {
            return { ...defaultSettings };
        }
    }

    function saveSettings(settings) {
        localStorage.setItem(
            "campusfixAppearance",
            JSON.stringify(settings)
        );
    }

    function applySettings(settings) {
        document.body.classList.toggle(
            "dark-mode",
            settings.mode === "dark"
        );

        document.body.classList.toggle(
            "compact-layout",
            settings.layout === "compact"
        );

        document.body.dataset.color = settings.color;

        themeMode.value = settings.mode;
        layoutMode.value = settings.layout;

        colorButtons.forEach(button => {
            const active = button.dataset.color === settings.color;

            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
        });
    }

    function updateSettings() {
        const settings = {
            mode: themeMode.value,
            layout: layoutMode.value,
            color: getSettings().color
        };

        applySettings(settings);
        saveSettings(settings);

        message.textContent = "Preferences saved successfully.";
    }

    applySettings(getSettings());

    themeMode.addEventListener("change", updateSettings);
    layoutMode.addEventListener("change", updateSettings);

    colorButtons.forEach(button => {
        button.addEventListener("click", () => {
            const color = button.dataset.color;

            if (!["blue", "purple", "green", "orange"].includes(color)) {
                return;
            }

            const settings = getSettings();
            settings.color = color;

            applySettings(settings);
            saveSettings(settings);

            message.textContent =
                color.toUpperCase() + " theme applied successfully.";
        });
    });

    resetButton.addEventListener("click", () => {
        applySettings(defaultSettings);
        saveSettings(defaultSettings);

        message.textContent = "Appearance reset to default.";
    });
}

// ======================================
// NOTIFICATION PREFERENCES
// ======================================

function initializeNotifications() {
    const controls = [
        "statusNotifications",
        "resolutionNotifications",
        "generalNotifications"
    ];

    const message = document.getElementById("notificationMessage");

    let saved = {};

    try {
        saved = JSON.parse(
            localStorage.getItem("campusfixStudentNotifications")
        ) || {};
    } catch {
        saved = {};
    }

    controls.forEach(id => {
        const checkbox = document.getElementById(id);

        checkbox.checked = saved[id] !== undefined
            ? saved[id]
            : true;

        checkbox.addEventListener("change", () => {
            const preferences = {};

            controls.forEach(controlId => {
                preferences[controlId] =
                    document.getElementById(controlId).checked;
            });

            localStorage.setItem(
                "campusfixStudentNotifications",
                JSON.stringify(preferences)
            );

            message.textContent = "Notification preferences saved.";
        });
    });
}

// ======================================
// CHANGE PASSWORD FORM
// ======================================

function initializePasswordForm() {
    const form = document.getElementById("changePasswordForm");
    const message = document.getElementById("passwordMessage");
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const currentPassword =
            document.getElementById("currentPassword").value;

        const newPassword =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        function showMessage(text, success = false) {
            message.textContent = text;
            message.style.color = success ? "#16a34a" : "#dc2626";
            message.className = "settings-message";
        }

        if (!currentPassword || !newPassword || !confirmPassword) {
            showMessage("Please fill all password fields.");
            return;
        }

        if (newPassword.length < 8 || newPassword.length > 72) {
            showMessage("New password must be 8 to 72 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage("New password and confirm password do not match.");
            return;
        }

        if (currentPassword === newPassword) {
            showMessage(
                "New password must be different from current password."
            );
            return;
        }

        submitButton.disabled = true;
        submitButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';

        try {
            const response = await fetch(
                `${STUDENT_API}/change-password`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                        confirmPassword
                    })
                }
            );

            const result = await response.json().catch(async () => {
                return await response.text();
            });

            if (!response.ok) {
                const errorMessage = typeof result === "string"
                    ? result
                    : result.message || "Unable to change password.";

                showMessage(errorMessage);
                return;
            }

            showMessage(
                result.message || "Password changed successfully!",
                true
            );

            form.reset();

        } catch (error) {
            console.error("Change password error:", error);

            showMessage(
                "Server connection failed. Please try again."
            );

        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML =
                '<i class="fa-solid fa-floppy-disk"></i> Update Password';
        }
    });
}

// ======================================
// MOBILE SIDEBAR
// ======================================

function initializeMobileMenu() {
    const menuBtn = document.getElementById("menuBtn");
    const sidebar = document.getElementById("sidebar");

    if (!menuBtn || !sidebar) return;

    menuBtn.addEventListener("click", () => {
        const isOpen = sidebar.classList.toggle("open");
        menuBtn.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", event => {
        if (
            sidebar.classList.contains("open") &&
            !sidebar.contains(event.target) &&
            !menuBtn.contains(event.target)
        ) {
            sidebar.classList.remove("open");
            menuBtn.setAttribute("aria-expanded", "false");
        }
    });

    sidebar.querySelectorAll(".sidebar-link").forEach(link => {
        link.addEventListener("click", () => {
            sidebar.classList.remove("open");
            menuBtn.setAttribute("aria-expanded", "false");
        });
    });
}
