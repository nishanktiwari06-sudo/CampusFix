
/* ============================================
   CAMPUSFIX STUDENT PROFILE - UPGRADED
   ============================================ */

   const API_BASE = "http://127.0.0.1:8080/api/students";


   document.addEventListener("DOMContentLoaded", () => {
   
       // ============================================
       // ELEMENTS
       // ============================================
   
       const profilePhoto = document.getElementById("profilePhoto");
       const photoInput = document.getElementById("photoInput");
   
       const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
       const removePhotoBtn = document.getElementById("removePhotoBtn");
   
       const profileForm = document.getElementById("profileForm");
   
       const fullNameInput = document.getElementById("fullName");
       const departmentInput = document.getElementById("department");
       const emailInput = document.getElementById("email");
       const rollNoInput = document.getElementById("rollNo");
   
       const profileName = document.getElementById("profileName");
       const profileDepartment = document.getElementById("profileDepartment");
   
       const studentName = document.getElementById("studentName");
       const studentAvatar = document.getElementById("studentAvatar");
   
       const profileMessage = document.getElementById("profileMessage");
       const saveProfileBtn = document.getElementById("saveProfileBtn");
   
       let currentStudent = null;
   
   
       // ============================================
       // HELPER FUNCTIONS
       // ============================================
   
       function getInitials(name) {
   
           if (!name || !name.trim()) {
               return "ST";
           }
   
           return name.trim()
               .split(/\s+/)
               .slice(0, 2)
               .map(word => word.charAt(0).toUpperCase())
               .join("");
       }
   
   
       function showMessage(message, isError = false) {
   
           if (!profileMessage) return;
   
           profileMessage.textContent = message;
   
           profileMessage.classList.toggle("error", isError);
       }
   
   
       function setPhotoFallback(name) {
   
           if (!profilePhoto) return;
   
           profilePhoto.replaceChildren();
   
           profilePhoto.textContent = getInitials(name);
       }
   
   
       // ============================================
       // DISPLAY PROFILE PHOTO
       // ============================================
   
       function displayPhoto(filename, name) {
   
           if (!filename) {
   
               setPhotoFallback(name);
   
               return;
           }
   
           const imageUrl =
               `${API_BASE}/profile/photo/${encodeURIComponent(filename)}`;
   
           const image = document.createElement("img");
   
           image.alt = "Student Profile Photo";
   
           image.onload = () => {
   
               profilePhoto.replaceChildren(image);
   
           };
   
           image.onerror = () => {
   
               setPhotoFallback(name);
   
           };
   
           image.src = imageUrl;
       }
   
   
       // ============================================
       // UPDATE STUDENT DISPLAY
       // ============================================
   
       function updateStudentDisplay(student) {
   
           currentStudent = student;
   
           if (fullNameInput) {
               fullNameInput.value = student.fullName || "";
           }
   
           if (departmentInput) {
               departmentInput.value = student.department || "";
           }
   
           if (emailInput) {
               emailInput.value = student.email || "";
           }
   
           if (rollNoInput) {
               rollNoInput.value = student.rollNo || "";
           }
   
           if (profileName) {
               profileName.textContent =
                   student.fullName || "Student";
           }
   
           if (profileDepartment) {
   
               profileDepartment.textContent =
                   student.department || "Department not specified";
           }
   
           if (studentName) {
   
               studentName.textContent =
                   student.fullName || "Student";
           }
   
           if (studentAvatar) {
   
               studentAvatar.textContent =
                   getInitials(student.fullName);
           }
   
           displayPhoto(
               student.profilePhotoPath,
               student.fullName
           );
   
           localStorage.setItem(
               "studentName",
               student.fullName || ""
           );
   
           if (student.email) {
   
               localStorage.setItem(
                   "studentEmail",
                   student.email
               );
           }
       }
   
   
       // ============================================
       // API REQUEST
       // ============================================
   
       async function apiRequest(url, options = {}) {
   
           const response = await fetch(url, {
   
               ...options,
   
               credentials: "include"
   
           });
   
           if (response.status === 401) {
   
               throw new Error(
                   "Session expired. Please login again."
               );
           }
   
           return response;
       }
   
   
       // ============================================
       // LOAD STUDENT PROFILE
       // ============================================
   
       async function loadProfile() {
   
           try {
   
               showMessage("Loading profile...");
   
               const response = await apiRequest(
                   `${API_BASE}/profile`
               );
   
               if (!response.ok) {
   
                   throw new Error(
                       await response.text()
                   );
               }
   
               const student = await response.json();
   
               updateStudentDisplay(student);
   
               showMessage("");
   
           } catch (error) {
   
               console.error(
                   "Profile loading error:",
                   error
               );
   
               showMessage(
                   error.message || "Unable to load profile.",
                   true
               );
           }
       }
   
   
       // ============================================
       // UPDATE PROFILE
       // ============================================
   
       if (profileForm) {
   
           profileForm.addEventListener("submit", async (event) => {
   
               event.preventDefault();
   
               const fullName = fullNameInput.value.trim();
   
               const department = departmentInput.value.trim();
   
               if (!fullName) {
   
                   showMessage(
                       "Full name is required.",
                       true
                   );
   
                   fullNameInput.focus();
   
                   return;
               }
   
               saveProfileBtn.disabled = true;
   
               saveProfileBtn.innerHTML =
                   '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
   
               try {
   
                   const response = await apiRequest(
                       `${API_BASE}/profile`,
                       {
                           method: "PUT",
   
                           headers: {
                               "Content-Type": "application/json"
                           },
   
                           body: JSON.stringify({
                               fullName,
                               department
                           })
                       }
                   );
   
                   if (!response.ok) {
   
                       throw new Error(
                           await response.text()
                       );
                   }
   
                   const updatedStudent = await response.json();
   
                   updateStudentDisplay(updatedStudent);
   
                   showMessage(
                       "Profile updated successfully!"
                   );
   
               } catch (error) {
   
                   console.error(
                       "Profile update error:",
                       error
                   );
   
                   showMessage(
                       error.message || "Unable to update profile.",
                       true
                   );
   
               } finally {
   
                   saveProfileBtn.disabled = false;
   
                   saveProfileBtn.innerHTML =
                       '<i class="fa-solid fa-floppy-disk"></i> Save Changes';
               }
   
           });
   
       }
   
   
       // ============================================
       // OPEN PHOTO SELECTOR
       // ============================================
   
       if (uploadPhotoBtn && photoInput) {
   
           uploadPhotoBtn.addEventListener("click", () => {
   
               photoInput.click();
   
           });
   
       }
   
   
       // ============================================
       // UPLOAD PROFILE PHOTO
       // ============================================
   
       if (photoInput && uploadPhotoBtn) {
   
           photoInput.addEventListener("change", async () => {
   
               const photo = photoInput.files[0];
   
               if (!photo) return;
   
               const allowedTypes = [
                   "image/jpeg",
                   "image/png"
               ];
   
               if (!allowedTypes.includes(photo.type)) {
   
                   showMessage(
                       "Only JPG and PNG photos are allowed.",
                       true
                   );
   
                   photoInput.value = "";
   
                   return;
               }
   
               if (photo.size > 5 * 1024 * 1024) {
   
                   showMessage(
                       "Photo size cannot exceed 5 MB.",
                       true
                   );
   
                   photoInput.value = "";
   
                   return;
               }
   
               const formData = new FormData();
   
               formData.append("photo", photo);
   
               uploadPhotoBtn.disabled = true;
   
               uploadPhotoBtn.innerHTML =
                   '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
   
               try {
   
                   const response = await apiRequest(
                       `${API_BASE}/profile/photo`,
                       {
                           method: "POST",
                           body: formData
                       }
                   );
   
                   if (!response.ok) {
   
                       throw new Error(
                           await response.text()
                       );
                   }
   
                   const updatedStudent = await response.json();
   
                   updateStudentDisplay(updatedStudent);
   
                   showMessage(
                       "Profile photo uploaded successfully!"
                   );
   
               } catch (error) {
   
                   console.error(
                       "Photo upload error:",
                       error
                   );
   
                   showMessage(
                       error.message || "Unable to upload photo.",
                       true
                   );
   
               } finally {
   
                   uploadPhotoBtn.disabled = false;
   
                   uploadPhotoBtn.innerHTML =
                       '<i class="fa-solid fa-upload"></i> Upload Photo';
   
                   photoInput.value = "";
               }
   
           });
   
       }
   
   
       // ============================================
       // REMOVE PROFILE PHOTO
       // ============================================
   
       if (removePhotoBtn) {
   
           removePhotoBtn.addEventListener("click", async () => {
   
               if (!currentStudent || !currentStudent.profilePhotoPath) {
   
                   showMessage(
                       "No profile photo to remove.",
                       true
                   );
   
                   return;
               }
   
               const confirmed = confirm(
                   "Are you sure you want to remove your profile photo?"
               );
   
               if (!confirmed) return;
   
               removePhotoBtn.disabled = true;
   
               removePhotoBtn.textContent = "Removing...";
   
               try {
   
                   const response = await apiRequest(
                       `${API_BASE}/profile/photo`,
                       {
                           method: "DELETE"
                       }
                   );
   
                   if (!response.ok) {
   
                       throw new Error(
                           await response.text()
                       );
                   }
   
                   const updatedStudent = await response.json();
   
                   updateStudentDisplay(updatedStudent);
   
                   showMessage(
                       "Profile photo removed successfully!"
                   );
   
               } catch (error) {
   
                   console.error(
                       "Photo delete error:",
                       error
                   );
   
                   showMessage(
                       error.message || "Unable to remove photo.",
                       true
                   );
   
               } finally {
   
                   removePhotoBtn.disabled = false;
   
                   removePhotoBtn.innerHTML =
                       '<i class="fa-solid fa-trash"></i> Remove Photo';
               }
   
           });
   
       }
   
   
       // ============================================
       // MOBILE SIDEBAR - FIXED
       // ============================================
   
       const menuBtn = document.getElementById("menuBtn");
   
       const sidebar = document.getElementById("sidebar");
   
   
       if (menuBtn && sidebar) {
   
           menuBtn.setAttribute(
               "aria-expanded",
               "false"
           );
   
           menuBtn.addEventListener("click", (event) => {
   
               event.preventDefault();
   
               event.stopPropagation();
   
               // Use the same class as dashboard.css
               sidebar.classList.toggle("open");
   
               const isOpen =
                   sidebar.classList.contains("open");
   
               menuBtn.setAttribute(
                   "aria-expanded",
                   String(isOpen)
               );
   
           });
   
   
           // Close sidebar when clicking outside
   
           document.addEventListener("click", (event) => {
   
               const clickedInsideSidebar =
                   sidebar.contains(event.target);
   
               const clickedMenuButton =
                   menuBtn.contains(event.target);
   
               if (
                   !clickedInsideSidebar &&
                   !clickedMenuButton &&
                   sidebar.classList.contains("open")
               ) {
   
                   sidebar.classList.remove("open");
   
                   menuBtn.setAttribute(
                       "aria-expanded",
                       "false"
                   );
   
               }
   
           });
   
   
           // Close sidebar after clicking navigation link
   
           sidebar.querySelectorAll(".sidebar-link").forEach(link => {
   
               link.addEventListener("click", () => {
   
                   sidebar.classList.remove("open");
   
                   menuBtn.setAttribute(
                       "aria-expanded",
                       "false"
                   );
   
               });
   
           });
   
   
           // Close sidebar with Escape key
   
           document.addEventListener("keydown", (event) => {
   
               if (event.key === "Escape") {
   
                   sidebar.classList.remove("open");
   
                   menuBtn.setAttribute(
                       "aria-expanded",
                       "false"
                   );
   
               }
   
           });
   
       }
   
   
       // ============================================
       // INITIAL LOAD
       // ============================================
   
       loadProfile();
   
   });
   