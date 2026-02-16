document.addEventListener('DOMContentLoaded', () => {

    // 1. Scroll Reveal
    const revealEls = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), i * 80);
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    revealEls.forEach(el => revealObserver.observe(el));

    // 2. Navbar scroll & Mobile Menu
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 30);
    });

    const mobileBtn = document.getElementById('nav-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileOverlay = document.getElementById('mobile-nav-overlay');
    const mobileClose = document.getElementById('mobile-nav-close');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link, .mobile-nav-btn');

    function toggleMobileNav() {
        mobileNav.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
        document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    }

    if (mobileBtn) mobileBtn.addEventListener('click', toggleMobileNav);
    if (mobileClose) mobileClose.addEventListener('click', toggleMobileNav);
    if (mobileOverlay) mobileOverlay.addEventListener('click', toggleMobileNav);

    mobileLinks.forEach(link => {
        link.addEventListener('click', toggleMobileNav);
    });

    // 3. Animated Counters
    const counters = document.querySelectorAll('.counter');
    let countersAnimated = false;
    function animateCounter(el) {
        const target = parseInt(el.getAttribute('data-target'));
        if (!target) return;
        const duration = 2200;
        const start = performance.now();
        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target).toLocaleString('en-IN') + '+';
            if (progress < 1) requestAnimationFrame(tick);
            else el.textContent = target.toLocaleString('en-IN') + '+';
        }
        requestAnimationFrame(tick);
    }
    const counterSection = document.getElementById('impact');
    if (counterSection) {
        new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !countersAnimated) {
                    countersAnimated = true;
                    counters.forEach(c => animateCounter(c));
                }
            });
        }, { threshold: 0.3 }).observe(counterSection);
    }

    // 4. Donation Card
    const amountCards = document.querySelectorAll('.amount-card');
    const customAmtInput = document.getElementById('custom-amt'); // Corrected ID usage if needed

    // Donation Logic Variables
    const donateBtn = document.getElementById('btn-donate');
    const modal = document.getElementById('donation-modal');
    const closeModal = document.querySelector('.close-modal');
    const modalAmountInput = document.getElementById('donor-amount');
    const donationFormModal = document.getElementById('donation-form-modal');
    const modalSubmitBtn = document.querySelector('.modal-submit-btn');

    let selectedAmount = 0;
    let isMonthly = false;

    // Smart Toggle for 80G & Maha Prasadam
    const certificateCheckbox = document.getElementById('certificate-checkbox');
    const prasadamCheckbox = document.getElementById('prasadam-checkbox');

    // Hide Maha Prasadam initially
    if (prasadamCheckbox) {
        prasadamCheckbox.parentElement.style.display = 'none';
    }


    const toggleOnetime = document.getElementById('toggle-onetime');
    const toggleMonthly = document.getElementById('toggle-monthly');
    if (toggleOnetime && toggleMonthly) {
        toggleOnetime.addEventListener('click', () => { isMonthly = false; toggleOnetime.classList.add('active'); toggleMonthly.classList.remove('active'); });
        toggleMonthly.addEventListener('click', () => { isMonthly = true; toggleMonthly.classList.add('active'); toggleOnetime.classList.remove('active'); });
    }

    amountCards.forEach(card => {
        card.addEventListener('click', () => {
            amountCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            selectedAmount = parseInt(card.getAttribute('data-amount'));

            // 🔥 SHOW / HIDE MAHA PRASADAM OPTION
            if (prasadamCheckbox) {
                if (selectedAmount >= 1000) {
                    prasadamCheckbox.parentElement.style.display = 'flex';
                } else {
                    prasadamCheckbox.checked = false;
                    prasadamCheckbox.parentElement.style.display = 'none';
                }
            }

            if (customAmtInput) customAmtInput.value = '';
            if (donateBtn) donateBtn.classList.add('active');
        });
    });


    const customImpact = document.getElementById('custom-impact');

    if (customAmtInput) {
        customAmtInput.addEventListener('input', () => {
            const val = parseInt(customAmtInput.value);

            if (val > 0) {
                amountCards.forEach(c => c.classList.remove('selected'));
                selectedAmount = val;
                // Show/Hide Maha Prasadam for custom amount
                if (prasadamCheckbox) {
                    if (val >= 1000) {
                        prasadamCheckbox.parentElement.style.display = 'flex';
                    } else {
                        prasadamCheckbox.checked = false;
                        prasadamCheckbox.parentElement.style.display = 'none';
                    }
                }


                // Calculate meals
                const meals = Math.floor(val / 25);

                if (meals > 0) {
                    customImpact.style.display = 'block';
                    customImpact.innerHTML = `This will serve <strong>${meals}</strong> hot meals`;
                } else {
                    customImpact.style.display = 'none';
                }

                donateBtn.classList.add('active');
            } else {
                customImpact.style.display = 'none';
                donateBtn.classList.remove('active');
                selectedAmount = 0;
            }
        });
    }


    const extraDetails = document.getElementById('extra-details');
    const panField = document.getElementById('pan-field');
    const addressField = document.getElementById('address-field');
    const pincodeField = document.getElementById('pincode-field');

    const panInput = document.getElementById('pan-number');
    if (panInput) {
        panInput.addEventListener('input', function () {
            this.value = this.value.toUpperCase();
        });
    }

    function updateExtraFields() {

        const is80G = certificateCheckbox && certificateCheckbox.checked;
        const isPrasadam = prasadamCheckbox && prasadamCheckbox.checked;

        if (is80G || isPrasadam) {
            extraDetails.style.display = 'block';
        } else {
            extraDetails.style.display = 'none';
        }

        // Show PAN only for 80G
        panField.style.display = is80G ? 'block' : 'none';

        // Show Address only for Prasadam
        addressField.style.display = isPrasadam ? 'block' : 'none';

        // Show Pincode if either is selected
        pincodeField.style.display = (is80G || isPrasadam) ? 'block' : 'none';
    }

    if (certificateCheckbox) {
        certificateCheckbox.addEventListener('change', updateExtraFields);
    }

    if (prasadamCheckbox) {
        prasadamCheckbox.addEventListener('change', updateExtraFields);
    }




    // Donation Logic (Modal Trigger)
    if (donateBtn && modal) {
        donateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!selectedAmount || selectedAmount <= 0) {
                alert('Please choose an amount to begin your seva ❤️.');
                return;
            }

            // Open Modal
            // Open Modal
            if (modalAmountInput) {
                modalAmountInput.value = selectedAmount.toLocaleString('en-IN');
            }

            // 🔥 Calculate Meals
            const modalMealImpact = document.getElementById('modal-meal-impact');

            if (modalMealImpact && selectedAmount > 0) {
                const meals = Math.floor(selectedAmount / 25);

                if (meals > 0) {
                    modalMealImpact.style.display = 'block';
                    modalMealImpact.innerHTML = `❤️ Your donation will feed <strong>${meals}</strong> caregivers today`;
                } else {
                    modalMealImpact.style.display = 'none';
                }
            }

            modal.style.display = 'block';
            requestAnimationFrame(() => {
                modal.classList.add('show');
            });

        });

        // Close Modal Logic
        const closeModalFunc = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        };

        if (closeModal) {
            closeModal.addEventListener('click', closeModalFunc);
        }

        window.addEventListener('click', (e) => {
            if (e.target == modal) {
                closeModalFunc();
            }
        });

        // Handle Form Submission
        if (donationFormModal) {
            donationFormModal.addEventListener('submit', (e) => {
                e.preventDefault();
                // ===== VALIDATION START =====

                const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
                const pinRegex = /^[0-9]{6}$/;

                const is80G = certificateCheckbox && certificateCheckbox.checked;
                const isPrasadam = prasadamCheckbox && prasadamCheckbox.checked;

                const panValue = document.getElementById('pan-number')?.value.trim();
                const pincodeValue = document.getElementById('common-pincode')?.value.trim();
                const addressValue = document.getElementById('donor-address')?.value.trim();

                // PAN validation
                if (is80G) {
                    if (!panValue || !panRegex.test(panValue)) {
                        alert("Please enter a valid PAN number (ABCDE1234F)");
                        return;
                    }
                }

                // Address validation
                if (isPrasadam) {
                    if (!addressValue || addressValue.length < 5) {
                        alert("Please enter a valid delivery address.");
                        return;
                    }
                }

                // Pincode validation
                if (is80G || isPrasadam) {
                    if (!pincodeValue || !pinRegex.test(pincodeValue)) {
                        alert("Please enter a valid 6-digit pincode.");
                        return;
                    }
                }

                // ===== VALIDATION END =====

                // Simulate Processing
                const originalBtnText = modalSubmitBtn.innerHTML;
                modalSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                modalSubmitBtn.disabled = true;
                modalSubmitBtn.style.opacity = '0.8';

                setTimeout(() => {
                    modalSubmitBtn.innerHTML = originalBtnText;
                    modalSubmitBtn.disabled = false;
                    modalSubmitBtn.style.opacity = '1';

                    // Close Donation Modal
                    closeModalFunc();

                    // Extract values
                    const occasionVal = document.getElementById('donor-occasion').value;
                    const dateVal = document.getElementById('donor-date').value;
                    const amountVal = selectedAmount.toLocaleString('en-IN');

                    // Construct Redirect URL
                    let redirectUrl = `thankyou.html?amount=${amountVal}`;
                    if (occasionVal && occasionVal !== 'general') {
                        redirectUrl += `&occasion=${encodeURIComponent(occasionVal)}`;
                    }
                    if (dateVal) {
                        redirectUrl += `&date=${encodeURIComponent(dateVal)}`;
                    }

                    // Reset Form
                    donationFormModal.reset();

                    // Redirect
                    window.location.href = redirectUrl;
                }, 1500);
            });
        }
    }

    // 5. Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
            }
        });
    });

    // 6. FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                const isOpen = item.classList.contains('open');
                // Close all others
                faqItems.forEach(other => other.classList.remove('open'));
                // Toggle clicked
                if (!isOpen) {
                    item.classList.add('open');
                }
            });
        }
    });

    // 7. Seva Progress Bar — animate on load and slowly increment
    const sevaFill = document.getElementById('seva-fill');
    const sevaServed = document.getElementById('seva-served');
    let currentMeals = 742;
    const goalMeals = 1000;

    if (sevaFill && sevaServed) {
        // Slowly increment every 15-30 seconds to simulate live progress
        setInterval(() => {
            if (currentMeals < goalMeals - 5) {
                currentMeals += Math.floor(Math.random() * 3) + 1;
                sevaServed.textContent = currentMeals.toLocaleString('en-IN');
                sevaFill.style.width = Math.min((currentMeals / goalMeals) * 100, 100) + '%';
            }
        }, 18000); // Every 18 seconds
    }
});
