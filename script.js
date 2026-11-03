


document.addEventListener("DOMContentLoaded", async function () {

    // ==========================================
    // 1. SUPABASE CONNECTION
    // ==========================================

    const supabaseClient = window.supabaseClient;

    if (!supabaseClient) {
        console.error("Supabase is not connected. Check your Supabase configuration.");
    }

    // ==========================================
    // 2. LOCAL STORAGE HELPERS
    // ==========================================

    function getStorage(key, fallback) {
        try {
            const data = localStorage.getItem(key);
            return data !== null ? JSON.parse(data) : fallback;
        } catch (error) {
            console.error("Storage error:", error);
            return fallback;
        }
    }

    function saveStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error("Could not save data:", error);
            alert("Unable to save your data. Please check browser storage.");
            return false;
        }
    }

    // ==========================================
    // 3. CURRENT USER
    // ==========================================

    let currentUser = null;

    function updateAccountDisplay() {

        document.querySelectorAll("[data-login-link]").forEach(function (link) {
            link.style.display = currentUser ? "none" : "";
        });

        document.querySelectorAll("[data-account-link], [data-user-name]").forEach(function (element) {

            element.style.display = currentUser ? "" : "none";

            if (currentUser) {
                element.textContent = element.hasAttribute("data-user-name")
                    ? currentUser.name
                    : "My Account";
            }
        });

        document.querySelectorAll("[data-user-email]").forEach(function (element) {
            element.textContent = currentUser ? currentUser.email : "";
        });

        document.querySelectorAll("[data-logout], #logoutBtn").forEach(function (button) {
            button.style.display = currentUser ? "" : "none";
        });
    }

    // Get current Supabase session
    if (supabaseClient) {

        const { data, error } = await supabaseClient.auth.getSession();

        if (error) {
            console.error("Session error:", error.message);
        }

        if (data?.session?.user) {
            const user = data.session.user;

            currentUser = {
                id: user.id,
                name: user.user_metadata?.full_name || user.email,
                email: user.email
            };
        }

        updateAccountDisplay();

        // Listen for login/logout changes
        supabaseClient.auth.onAuthStateChange(function (event, session) {

            if (session?.user) {
                currentUser = {
                    id: session.user.id,
                    name: session.user.user_metadata?.full_name || session.user.email,
                    email: session.user.email
                };
            } else {
                currentUser = null;
            }

            updateAccountDisplay();
        });

    } else {
        updateAccountDisplay();
    }

    // ==========================================
    // 4. LOGIN
    // ==========================================

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            if (!supabaseClient) {
                alert("Supabase is not configured. Please check your connection.");
                return;
            }

            const email = document.getElementById("loginEmail")?.value.trim();
            const password = document.getElementById("loginPassword")?.value;

            if (!email || !password) {
                alert("Please enter your email and password.");
                return;
            }

            const button = loginForm.querySelector('button[type="submit"]');

            button.disabled = true;
            button.innerHTML = "Signing in...";

            try {

                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) {
                    alert("Login failed: " + error.message);
                    return;
                }

                if (data.user) {
                    window.location.href = "./dashboard.html";
                }

            } catch (error) {

                console.error("Login error:", error);
                alert("Connection error. Please try again.");

            } finally {

                button.disabled = false;
                button.innerHTML = 'Sign In <i class="fa-solid fa-arrow-right"></i>';

            }
        });
    }

    // ==========================================
    // 5. SIGN UP
    // Supports combined login page and register.html
    // ==========================================

    const signupForm = document.getElementById("signupForm");
    const registerForm = document.getElementById("registerForm");

    async function handleSignup(event, form, fields) {

        event.preventDefault();

        if (!supabaseClient) {
            alert("Supabase is not configured. Please check your connection.");
            return;
        }

        const name = document.getElementById(fields.name)?.value.trim();
        const email = document.getElementById(fields.email)?.value.trim().toLowerCase();
        const password = document.getElementById(fields.password)?.value;
        const confirmPassword = document.getElementById(fields.confirmPassword)?.value;

        if (!name || !email || !password || !confirmPassword) {
            alert("Please fill in all fields.");
            return;
        }

        if (password.length < 6) {
            alert("Password must contain at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        const button = form.querySelector('button[type="submit"]');

        if (button) {
            button.disabled = true;
            button.innerHTML = "Creating account...";
        }

        try {

            const { data, error } = await supabaseClient.auth.signUp({

                email: email,
                password: password,

                options: {
                    data: {
                        full_name: name
                    }
                }

            });

            if (error) {
                alert("Registration failed: " + error.message);
                return;
            }

            if (data.session) {

                alert("Account created successfully!");

                window.location.href = "./dashboard.html";

            } else {

                alert("Account created! Please check your email to confirm your account, then login.");

                window.location.href = "./login.html";
            }

        } catch (error) {

            console.error("Signup error:", error);
            alert("Connection error. Please try again.");

        } finally {

            if (button) {
                button.disabled = false;
                button.innerHTML = "Create Account";
            }
        }
    }

    if (signupForm) {
        signupForm.addEventListener("submit", function (event) {

            handleSignup(event, signupForm, {
                name: "signupName",
                email: "signupEmail",
                password: "signupPassword",
                confirmPassword: "confirmPassword"
            });

        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", function (event) {

            handleSignup(event, registerForm, {
                name: "registerName",
                email: "registerEmail",
                password: "registerPassword",
                confirmPassword: "confirmPassword"
            });

        });
    }

    // ==========================================
    // 6. LOGOUT
    // ==========================================

    document.querySelectorAll("[data-logout], #logoutBtn").forEach(function (button) {

        button.addEventListener("click", async function (event) {

            event.preventDefault();

            if (!supabaseClient) {
                alert("Supabase connection is missing.");
                return;
            }

            const { error } = await supabaseClient.auth.signOut();

            if (error) {
                alert("Logout failed: " + error.message);
                return;
            }

            currentUser = null;
            updateAccountDisplay();

            window.location.href = "./login.html";
        });
    });

    // ==========================================
    // 7. ENROLL IN COURSES
    // ==========================================

    document.querySelectorAll(".enroll-btn, [data-enroll]").forEach(function (button) {

        button.addEventListener("click", function () {

            if (!currentUser) {
                alert("Please login before enrolling in a course.");
                window.location.href = "./login.html";
                return;
            }

            const course = button.dataset.course ||
                button.closest(".course-card")
                    ?.querySelector(".course-title")
                    ?.textContent.trim();

            if (!course) {
                alert("Course information not found.");
                return;
            }

            const enrollments = getStorage("eduLearnEnrollments", {});
            const userEnrollments = enrollments[currentUser.id] || [];

            if (userEnrollments.includes(course)) {
                alert("You are already enrolled in this course.");
                return;
            }

            userEnrollments.push(course);
            enrollments[currentUser.id] = userEnrollments;

            if (saveStorage("eduLearnEnrollments", enrollments)) {
                alert("Successfully enrolled in: " + course);
            }
        });
    });

    // ==========================================
    // 8. WISHLIST
    // ==========================================

    document.querySelectorAll(".wishlist-btn").forEach(function (button) {

        const courseCard = button.closest(".course-card");

        const courseName = courseCard
            ?.querySelector(".course-title")
            ?.textContent.trim();

        if (!courseName) return;

        function updateHeart() {

            if (!currentUser) return;

            const wishlists = getStorage("eduLearnWishlist", {});
            const userWishlist = wishlists[currentUser.id] || [];
            const isSaved = userWishlist.includes(courseName);

            button.classList.toggle("active", isSaved);

            const icon = button.querySelector("i");

            if (icon) {
                icon.classList.toggle("fa-solid", isSaved);
                icon.classList.toggle("fa-regular", !isSaved);
            }
        }

        updateHeart();

        button.addEventListener("click", function () {

            if (!currentUser) {
                alert("Please login to save courses to your wishlist.");
                window.location.href = "./login.html";
                return;
            }

            const wishlists = getStorage("eduLearnWishlist", {});
            let userWishlist = wishlists[currentUser.id] || [];

            if (userWishlist.includes(courseName)) {

                userWishlist = userWishlist.filter(function (item) {
                    return item !== courseName;
                });

                alert("Course removed from wishlist.");

            } else {

                userWishlist.push(courseName);
                alert("Course added to wishlist.");
            }

            wishlists[currentUser.id] = userWishlist;

            if (saveStorage("eduLearnWishlist", wishlists)) {
                updateHeart();
            }
        });
    });

    // ==========================================
    // 9. COURSE SEARCH
    // ==========================================

    const courseSearch = document.getElementById("courseSearch");
    const courseCards = document.querySelectorAll(".course-card");

    let activeCategory = "all";

    function filterCourses() {

        const searchText = courseSearch
            ? courseSearch.value.toLowerCase().trim()
            : "";

        courseCards.forEach(function (card) {

            const title = card.querySelector(".course-title")
                ?.textContent.toLowerCase() || "";

            const description = card.querySelector(".course-content p")
                ?.textContent.toLowerCase() || "";

            const category = card.dataset.category || "";

            const matchesSearch =
                title.includes(searchText) ||
                description.includes(searchText);

            const matchesCategory =
                activeCategory === "all" ||
                category === activeCategory;

            card.style.display =
                matchesSearch && matchesCategory ? "" : "none";
        });
    }

    if (courseSearch) {
        courseSearch.addEventListener("input", filterCourses);
    }

    // ==========================================
    // 10. CATEGORY FILTER BUTTONS
    // ==========================================

    document.querySelectorAll("[data-filter]").forEach(function (button) {

        button.addEventListener("click", function () {

            activeCategory = button.dataset.filter;

            document.querySelectorAll("[data-filter]").forEach(function (item) {
                item.classList.remove("active");
            });

            button.classList.add("active");

            filterCourses();
        });
    });

    // ==========================================
    // 11. CATEGORY CARDS
    // ==========================================

    document.querySelectorAll(".category-card[data-category]").forEach(function (card) {

        card.addEventListener("click", function () {

            activeCategory = card.dataset.category;

            document.querySelectorAll("[data-filter]").forEach(function (button) {

                button.classList.toggle(
                    "active",
                    button.dataset.filter === activeCategory
                );
            });

            if (courseSearch) {
                courseSearch.value = "";
            }

            filterCourses();
        });
    });

    // ==========================================
    // 12. CONTACT FORM
    // ==========================================

    const contactForm = document.getElementById("contactForm");

    if (contactForm) {

        contactForm.addEventListener("submit", function (event) {

            event.preventDefault();

            if (!contactForm.checkValidity()) {
                contactForm.reportValidity();
                return;
            }

            const name = document.getElementById("name")?.value.trim() || "User";

            alert("Thank you, " + name + "! Your form is ready.");

            contactForm.reset();
        });
    }

    // ==========================================
    // 13. MOBILE MENU
    // ==========================================

    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");

    if (menuToggle && navMenu) {

        menuToggle.addEventListener("click", function () {

            const isOpen = navMenu.classList.toggle("active");

            menuToggle.setAttribute("aria-expanded", String(isOpen));

            const icon = menuToggle.querySelector("i");

            if (icon) {
                icon.classList.toggle("fa-bars", !isOpen);
                icon.classList.toggle("fa-xmark", isOpen);
            }
        });

        navMenu.querySelectorAll("a").forEach(function (link) {

            link.addEventListener("click", function () {

                navMenu.classList.remove("active");

                menuToggle.setAttribute("aria-expanded", "false");

                const icon = menuToggle.querySelector("i");

                if (icon) {
                    icon.classList.add("fa-bars");
                    icon.classList.remove("fa-xmark");
                }
            });
        });
    }

    // ==========================================
    // 14. HEADER SCROLL EFFECT
    // ==========================================

    const header = document.getElementById("header");

    window.addEventListener("scroll", function () {

        if (header) {
            header.classList.toggle("scrolled", window.scrollY > 50);
        }
    });

    // ==========================================
    // 15. ACTIVE NAVIGATION
    // ==========================================

    const sections = document.querySelectorAll("main section[id]");
    const navLinks = document.querySelectorAll(".nav-links a");

    if ("IntersectionObserver" in window) {

        const sectionObserver = new IntersectionObserver(function (entries) {

            entries.forEach(function (entry) {

                if (entry.isIntersecting) {

                    navLinks.forEach(function (link) {

                        link.classList.toggle(
                            "active",
                            link.getAttribute("href") === "#" + entry.target.id
                        );
                    });
                }
            });

        }, {
            rootMargin: "-30% 0px -60% 0px"
        });

        sections.forEach(function (section) {
            sectionObserver.observe(section);
        });
    }

    // ==========================================
    // 16. SMOOTH SCROLL
    // ==========================================

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {

        link.addEventListener("click", function (event) {

            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") return;

            const target = document.querySelector(targetId);

            if (target) {

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });

    // ==========================================
    // 17. REVEAL ANIMATION
    // ==========================================

    const revealElements = document.querySelectorAll(
        ".course-card, .category-card, .instructor-card, .testimonial-card"
    );

    if ("IntersectionObserver" in window) {

        const revealObserver = new IntersectionObserver(function (entries, observer) {

            entries.forEach(function (entry) {

                if (entry.isIntersecting) {
                    entry.target.classList.add("show");
                    observer.unobserve(entry.target);
                }
            });

        }, {
            threshold: 0.1
        });

        revealElements.forEach(function (element) {
            revealObserver.observe(element);
        });

    } else {

        revealElements.forEach(function (element) {
            element.classList.add("show");
        });
    }

    // ==========================================
    // 18. CURRENT YEAR
    // ==========================================

    document.querySelectorAll("[data-year]").forEach(function (element) {
        element.textContent = new Date().getFullYear();
    });

    // ==========================================
    // 19. PASSWORD VISIBILITY
    // Works with login and signup password fields
    // ==========================================

    document.querySelectorAll(".password-toggle").forEach(function (button) {

        button.addEventListener("click", function () {

            const inputId = button.dataset.toggle ||
                (button.id === "togglePassword" ? "loginPassword" : null);

            const input = inputId
                ? document.getElementById(inputId)
                : button.parentElement.querySelector("input");

            if (!input) return;

            const isPassword = input.type === "password";

            input.type = isPassword ? "text" : "password";

            button.innerHTML = isPassword
                ? '<i class="fa-regular fa-eye-slash"></i>'
                : '<i class="fa-regular fa-eye"></i>';

            button.setAttribute(
                "aria-label",
                isPassword ? "Hide password" : "Show password"
            );
        });
    });

    console.log("EduLearn JavaScript loaded successfully!");

});
