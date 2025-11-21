document.addEventListener('DOMContentLoaded', () => {

    // --- DOM ELEMENT SELECTION ---
    const form = document.getElementById('funnelForm');
    const steps = Array.from(form.querySelectorAll(':scope > section'));
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');
    const progressFill = document.getElementById('progressFill');
    const stepDots = document.querySelectorAll('.step-dot');
    const heroHeader = document.querySelector('.hero-header');
    const formContainer = document.querySelector('.form-container');
    const navigationContainer = document.querySelector('.navigation');
    const successModal = document.getElementById('successModal');
    const clearBtn = document.getElementById('clearBtn');
    const saveProgressBtn = document.getElementById('saveProgressBtn');


    // URL base de tu backend
    const API_BASE_URL = "https://requalv.vercel.app/"; // cambia a tu dominio en producción


    // --- STATE MANAGEMENT ---
    let currentStep = 0;
    const TOTAL_STEPS = steps.length;

    // Paso del resumen (último paso)
    let summaryStep = TOTAL_STEPS - 1;

    // --- VARIABLES PARA EDICIÓN DESDE RESUMEN ---
    let isEditingFromSummary = false;

    // --- ALERTAS EN PANTALLA (5500 ms) --
    function showAlert(message, type = 'info') {
        const container = document.getElementById('appAlerts');
        if (!container) {
            console.warn('No se encontró #appAlerts. Mensaje:', message);
            return;
        }

        const alertEl = document.createElement('div');
        alertEl.classList.add('app-alert', `app-alert--${type}`);

        const iconSpan = document.createElement('span');
        iconSpan.classList.add('app-alert-icon');
        iconSpan.textContent =
            type === 'success' ? '✅' :
                type === 'error' ? '⚠️' :
                    'ℹ️';

        const msgSpan = document.createElement('div');
        msgSpan.classList.add('app-alert-message');
        msgSpan.innerHTML = message.replace(/\n/g, '<br>');

        const closeBtn = document.createElement('button');
        closeBtn.classList.add('app-alert-close');
        closeBtn.type = 'button';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => removeAlert(alertEl));

        alertEl.appendChild(iconSpan);
        alertEl.appendChild(msgSpan);
        alertEl.appendChild(closeBtn);

        container.appendChild(alertEl);

        const timeoutId = setTimeout(() => removeAlert(alertEl), 5500);
        alertEl.dataset.timeoutId = timeoutId;
    }

    function removeAlert(alertEl) {
        if (!alertEl || !alertEl.parentNode) return;

        const timeoutId = alertEl.dataset.timeoutId;
        if (timeoutId) clearTimeout(timeoutId);

        alertEl.style.animation = 'alert-fade-out 180ms ease-out forwards';

        setTimeout(() => {
            if (alertEl.parentNode) {
                alertEl.parentNode.removeChild(alertEl);
            }
        }, 180);
    }

    // --- INICIAR FORMULARIO ---
    function handleStartBuilding() {
        if (heroHeader) heroHeader.style.display = 'none';
        if (formContainer) formContainer.style.display = 'block';
        if (navigationContainer) navigationContainer.style.display = 'block';
        showStep(0);
    }

    // --- EDICIÓN DESDE RESUMEN ---
    function editStepFromSummary(stepIndex) {
        isEditingFromSummary = true;
        showStep(stepIndex);

        if (nextBtn) {
            nextBtn.innerHTML = `
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
                Volver al Resumen
            `;
        }
    }
    window.editStepFromSummary = editStepFromSummary;

    // --- EVENT HANDLERS REGISTRY ---
    const eventHandlers = {
        startBuilding: handleStartBuilding,

        showInfo: () => {
            const message = `
                <strong>FunnelCraft Pro – Guía rápida de uso</strong><br><br>
                1. <strong>Completa los datos básicos:</strong><br>
                Ingresa tu nombre, email y WhatsApp, así como el tipo de negocio y tu oferta principal.<br><br>
                2. <strong>Define el objetivo del funnel:</strong><br>
                Decide si quieres capturar leads, vender, agendar llamadas o enviar tráfico a otra plataforma.<br><br>
                3. <strong>Activa solo los módulos necesarios:</strong><br>
                Elige testimonios, FAQs, redes sociales, contadores, bonus, etc., según la estrategia de tu oferta.<br><br>
                4. <strong>Guarda tu progreso:</strong><br>
                Usa el botón "Guardar progreso" antes de salir de la página para no perder la información.<br><br>
                5. <strong>Revisa el resumen final:</strong><br>
                En el paso de resumen verás una vista consolidada de todo. Desde ahí puedes volver a cada sección y editar.
            `;
            showAlert(message, 'info');
        },

        toggleModuleOptions: function (moduleId, isChecked) {
            const optionsContainer = document.getElementById(`${moduleId}Options`);
            if (optionsContainer) {
                if (isChecked) {
                    optionsContainer.classList.add('visible');
                    optionsContainer.style.display = 'block';
                } else {
                    optionsContainer.classList.remove('visible');
                    optionsContainer.style.display = 'none';
                }
            }
        },

        addTestimonial: () => {
            const container = document.getElementById('testimonialsContainer');
            createDynamicItem(container, dynamicItemTemplates.testimonial);
        },

        addSocialMedia: () => {
            const container = document.getElementById('socialMediaContainer');
            createDynamicItem(container, dynamicItemTemplates.socialMedia);
        },

        addFaq: () => {
            const container = document.getElementById('faqContainer');
            createDynamicItem(container, dynamicItemTemplates.faq);
        },

        addPricingPlan: () => {
            const container = document.getElementById('pricingPlansContainer');
            createDynamicItem(container, dynamicItemTemplates.pricingPlan);
        },

        addSocialProof: () => {
            const container = document.getElementById('socialProofContainer');
            createDynamicItem(container, dynamicItemTemplates.socialProof);
        },

        addBonus: () => {
            const container = document.getElementById('bonusContainer');
            createDynamicItem(container, dynamicItemTemplates.bonus);
        },

        removeDynamicItem: function (button) {
            const item = button.closest('.dynamic-item');
            if (item) {
                item.style.animation = 'fadeOut 0.5s ease forwards';
                setTimeout(() => {
                    if (item.parentNode) {
                        item.parentNode.removeChild(item);
                    }
                }, 500);
            }
        },

        closeModal: function () {
            if (successModal) {
                const modalCard = successModal.querySelector('.glass-card');
                if (modalCard) {
                    modalCard.style.transform = 'scale(0.9)';
                }
                setTimeout(() => {
                    successModal.classList.add('hidden');
                    successModal.classList.remove('flex');
                }, 400);
            }
        }
    };

    // Exposición global para onclick del HTML
    window.startBuilding = eventHandlers.startBuilding;
    window.showInfo = eventHandlers.showInfo;
    window.toggleModuleOptions = eventHandlers.toggleModuleOptions;
    window.addTestimonial = eventHandlers.addTestimonial;
    window.addSocialMedia = eventHandlers.addSocialMedia;
    window.addFaq = eventHandlers.addFaq;
    window.addPricingPlan = eventHandlers.addPricingPlan;
    window.addSocialProof = eventHandlers.addSocialProof;
    window.addBonus = eventHandlers.addBonus;
    window.removeDynamicItem = eventHandlers.removeDynamicItem;
    window.closeModal = eventHandlers.closeModal;

    // Funciones específicas para eliminar items (compatibilidad con HTML)
    window.removeTestimonial = eventHandlers.removeDynamicItem;
    window.removeSocialMedia = eventHandlers.removeDynamicItem;
    window.removeFaq = eventHandlers.removeDynamicItem;
    window.removePricingPlan = eventHandlers.removeDynamicItem;
    window.removeSocialProof = eventHandlers.removeDynamicItem;
    window.removeBonus = eventHandlers.removeDynamicItem;

    // --- INITIALIZATION ---
    function initializeForm() {
        showStep(0);
        updateProgress();
        setupEventListeners();
        loadProgress();
    }

    // --- NAVIGATION LOGIC ---
    function showStep(stepIndex) {
        steps.forEach((step, index) => {
            if (index === stepIndex) {
                step.classList.remove('hidden');
                step.classList.remove('fade-up');
                void step.offsetWidth;
                step.classList.add('fade-up');
            } else {
                step.classList.add('hidden');
            }
        });

        currentStep = stepIndex;
        updateNavigationButtons();
        updateProgress();

        // Si estamos en el paso de resumen, generar el resumen
        if (currentStep === summaryStep) {
            generateSummary();
        }

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    window.showStep = showStep;

    function nextStep() {
        if (validateCurrentStep()) {
            if (isEditingFromSummary) {
                generateSummary();
                showStep(summaryStep);
                isEditingFromSummary = false;
                resetNavigationButtonText();
                return;
            }

            const nextIndex = currentStep + 1;
            if (nextIndex === summaryStep) {
                generateSummary();
            }

            if (currentStep < TOTAL_STEPS - 1) {
                showStep(nextIndex);
            }
        }
    }

    function prevStep() {
        if (currentStep > 0) {
            if (isEditingFromSummary) {
                generateSummary();
                showStep(summaryStep);
                isEditingFromSummary = false;
                resetNavigationButtonText();
                return;
            }
            showStep(currentStep - 1);
        }
    }

    function resetNavigationButtonText() {
        if (nextBtn) {
            nextBtn.innerHTML = `
                Siguiente
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            `;
        }
        if (prevBtn) {
            prevBtn.innerHTML = `
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Anterior
            `;
        }
    }

    function updateNavigationButtons() {
        if (isEditingFromSummary) {
            prevBtn.style.display = 'inline-flex';
            nextBtn.classList.remove('hidden');
            submitBtn.classList.add('hidden');

            if (prevBtn) {
                prevBtn.innerHTML = `
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                    Volver al Resumen
                `;
            }
            return;
        }

        prevBtn.style.display = currentStep > 0 ? 'inline-flex' : 'none';

        if (currentStep === TOTAL_STEPS - 1) {
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.remove('hidden');
            submitBtn.classList.add('hidden');
            resetNavigationButtonText();
        }
    }

    function updateProgress() {
        const progressPercentage = (currentStep / (TOTAL_STEPS - 1)) * 100;
        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }

        stepDots.forEach((dot, index) => {
            dot.classList.remove('active', 'completed');
            if (index < currentStep) {
                dot.classList.add('completed');
            } else if (index === currentStep) {
                dot.classList.add('active');
            }
        });
    }

    // --- VALIDATION LOGIC ---
    function validateCurrentStep() {
        const currentSection = steps[currentStep];
        const inputs = currentSection.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        const errors = [];
        const processedGroups = new Set();

        inputs.forEach(input => {
            const optionalContainer = input.closest('.module-options-container');
            if (optionalContainer && !optionalContainer.classList.contains('visible')) {
                return;
            }

            if (input.offsetParent === null) {
                return;
            }

            let fieldIsValid = true;
            let errorKey = input.name;

            if (input.type === 'radio') {
                const groupName = input.name;
                errorKey = groupName;

                if (processedGroups.has(errorKey)) return;
                processedGroups.add(errorKey);

                const checkedRadio = form.querySelector(`input[name="${groupName}"]:checked`);
                if (!checkedRadio) {
                    fieldIsValid = false;
                    form.querySelectorAll(`input[name="${groupName}"]`).forEach(radio => {
                        const optionCard = radio.closest('.option-card');
                        if (optionCard) {
                            optionCard.style.borderColor = 'var(--accent-tertiary)';
                            optionCard.style.boxShadow = '0 0 0 1px var(--accent-tertiary)';
                        }
                    });
                }
            } else if (input.type === 'checkbox') {
                const groupName = input.name;

                if (groupName.includes('[]')) {
                    errorKey = groupName;
                    if (processedGroups.has(errorKey)) return;
                    processedGroups.add(errorKey);

                    const checkedCheckboxes = form.querySelectorAll(`input[name="${groupName}"]:checked`);
                    if (checkedCheckboxes.length === 0) {
                        fieldIsValid = false;
                        form.querySelectorAll(`input[name="${groupName}"]`).forEach(checkbox => {
                            const optionCard = checkbox.closest('.option-card');
                            if (optionCard) {
                                optionCard.style.borderColor = 'var(--accent-tertiary)';
                                optionCard.style.boxShadow = '0 0 0 1px var(--accent-tertiary)';
                            }
                        });
                    }
                } else {
                    fieldIsValid = input.checked;
                    if (!fieldIsValid) {
                        const optionCard = input.closest('.option-card');
                        if (optionCard) {
                            optionCard.style.borderColor = 'var(--accent-tertiary)';
                            optionCard.style.boxShadow = '0 0 0 1px var(--accent-tertiary)';
                        }
                    }
                }
            } else {
                fieldIsValid = input.value.trim() !== '';
                if (!fieldIsValid) {
                    input.classList.add('error');
                }
            }

            if (!fieldIsValid) {
                isValid = false;

                if (!processedGroups.has(errorKey)) {
                    const label = input.closest('.input-group')?.querySelector('label')?.textContent ||
                        input.closest('.option-card')?.querySelector('span')?.textContent ||
                        input.name;
                    errors.push(label.replace('*', '').trim());
                    processedGroups.add(errorKey);
                }
            } else {
                input.classList.remove('error');
                const optionCard = input.closest('.option-card');
                if (optionCard) {
                    optionCard.style.borderColor = '';
                    optionCard.style.boxShadow = '';
                }
            }
        });

        if (!isValid) {
            const errorMessage = errors.length > 0
                ? `Por favor, completa los siguientes campos:\n• ${errors.join('\n• ')}`
                : 'Por favor, completa todos los campos obligatorios (*) antes de continuar.';

            showAlert(errorMessage, 'error');
        }

        return isValid;
    }

    // --- DYNAMIC CONTENT & UI ---
    function createDynamicItem(container, templateFunction) {
        if (!container) return;
        const itemIndex = container.children.length + 1;
        const newItem = document.createElement('div');
        newItem.className = 'dynamic-item fade-up';
        newItem.innerHTML = templateFunction(itemIndex);
        container.appendChild(newItem);
        setupEventListenersForItem(newItem);
    }

    function generateSummary() {
        const summaryContainer = document.getElementById('summaryContent');
        if (!summaryContainer) {
            console.warn('No se encontró el contenedor #summaryContent para el resumen.');
            return;
        }

        const formData = new FormData(form);
        let summaryHTML = '';

        const fieldMappings = {
            'client_name': { label: 'Nombre Completo', step: 0 },
            'client_email': { label: 'Email', step: 0 },
            'client_phone': { label: 'WhatsApp', step: 0 },
            'business_type': { label: 'Tipo de Negocio', step: 1 },
            'main_product': { label: 'Producto Principal', step: 1 },
            'funnel_destination': { label: 'Objetivo del Funnel', step: 2 },
            'traffic_source': { label: 'Fuente de Tráfico', step: 2 },
            'target_audience': { label: 'Cliente Ideal', step: 2 },
            'followup_method': { label: 'Sistema de Seguimiento', step: 3 },
            'hero_title': { label: 'Título Principal', step: 4 },
            'cta_text': { label: 'Botón Principal (CTA)', step: 4 },
            'domain_option': { label: 'Opción de Dominio', step: 6 },
            'design_style': { label: 'Estilo de Diseño', step: 7 },
            'timeframe': { label: 'Tiempo de Entrega', step: 8 }
        };

        for (const [key, value] of formData.entries()) {
            if (fieldMappings[key] && value) {
                const { label, step } = fieldMappings[key];
                summaryHTML += `
        <div class="summary-item">
            <div class="summary-title">
                <span>${label}</span>
                <button type="button" class="edit-btn" onclick="editStepFromSummary(${step})">
                    Editar 
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path></svg>
                </button>
            </div>
            <div class="summary-content">${value.toString().replace(/\n/g, '<br>')}</div>
        </div>
    `;
            }
        }

        const extraModules = formData.getAll('extra_modules[]');
        if (extraModules.length > 0) {
            summaryHTML += `
    <div class="summary-item">
        <div class="summary-title">
            <span>Módulos Extras</span>
            <button type="button" class="edit-btn" onclick="editStepFromSummary(5)">Editar</button>
        </div>
        <div class="summary-content">${extraModules.join(', ')}</div>
    </div>
`;
        }

        summaryHTML = summaryHTML || '<p>No has seleccionado ninguna opción aún.</p>';
        summaryContainer.innerHTML = summaryHTML;
    }

    const dynamicItemTemplates = {
        testimonial: (i) => `
    <div class="item-header">
        <h5>Testimonio ${i}</h5>
        <button type="button" class="remove-btn" onclick="removeDynamicItem(this)">×</button>
    </div>
    <div class="input-group">
        <label class="input-label">Nombre del cliente</label>
        <input type="text" name="testimonial_author[]" class="premium-input" placeholder="Juan Pérez">
    </div>
    <div class="input-group">
        <label class="input-label">Cargo o empresa</label>
        <input type="text" name="testimonial_role[]" class="premium-input" placeholder="CEO, Empresa XYZ">
    </div>
    <div class="input-group">
        <label class="input-label">Testimonio</label>
        <textarea name="testimonial_content[]" class="premium-input premium-textarea" placeholder="Excelente servicio, recomendado al 100%..."></textarea>
    </div>
`,
        socialMedia: (i) => `
    <div class="item-header">
        <h5>Red Social ${i}</h5>
        <button type="button" class="remove-btn" onclick="removeDynamicItem(this)">×</button>
    </div>
    <div class="input-group">
        <label class="input-label">Plataforma</label>
        <select name="social_platform[]" class="premium-input">
            <option value="">Selecciona...</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">Twitter</option>
            <option value="linkedin">LinkedIn</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
        </select>
    </div>
    <div class="input-group">
        <label class="input-label">URL</label>
        <input type="url" name="social_url[]" class="premium-input" placeholder="https://facebook.com/tunegocio">
    </div>
`,
        faq: (i) => `
    <div class="item-header">
        <h5>Pregunta ${i}</h5>
        <button type="button" class="remove-btn" onclick="removeDynamicItem(this)">×</button>
    </div>
    <div class="input-group">
        <label class="input-label">Pregunta</label>
        <input type="text" name="faq_question[]" class="premium-input" placeholder="¿Cuál es el tiempo de entrega?">
    </div>
    <div class="input-group">
        <label class="input-label">Respuesta</label>
        <textarea name="faq_answer[]" class="premium-input premium-textarea" placeholder="El tiempo de entrega es de 3 a 5 días hábiles..."></textarea>
    </div>
`,
        pricingPlan: (i) => `
    <div class="item-header">
        <h5>Plan ${i}</h5>
        <button type="button" class="remove-btn" onclick="removeDynamicItem(this)">×</button>
    </div>
    <div class="input-group">
        <label class="input-label">Nombre del plan</label>
        <input type="text" name="pricing_plan_name[]" class="premium-input" placeholder="Plan Básico">
    </div>
    <div class="input-group">
        <label class="input-label">Características</label>
        <textarea name="pricing_plan_features[]" class="premium-input premium-textarea" placeholder="Característica 1&#10;Característica 2"></textarea>
    </div>
`,
        socialProof: (i) => `
    <div class="item-header">
        <h5>Contador ${i}</h5>
        <button type="button" class="remove-btn" onclick="removeDynamicItem(this)">×</button>
    </div>
    <div class="input-group">
        <label class="input-label">Tipo de contador</label>
        <select name="social_proof_type[]" class="premium-input">
            <option value="clients">Clientes satisfechos</option>
            <option value="projects">Proyectos completados</option>
            <option value="downloads">Descargas</option>
            <option value="users">Usuarios activos</option>
        </select>
    </div>
    <div class="input-group">
        <label class="input-label">Valor inicial</label>
        <input type="number" name="social_proof_value[]" class="premium-input" placeholder="1000">
    </div>
`,
        bonus: (i) => `
    <div class="item-header">
        <h5>Bono ${i}</h5>
        <button type="button" class="remove-btn" onclick="removeDynamicItem(this)">×</button>
    </div>
    <div class="input-group">
        <label class="input-label">Nombre del bono</label>
        <input type="text" name="bonus_name[]" class="premium-input" placeholder="Guía avanzada">
    </div>
    <div class="input-group">
        <label class="input-label">Valor percibido</label>
        <input type="text" name="bonus_value[]" class="premium-input" placeholder="Ej: 97">
    </div>
    <div class="input-group">
        <label class="input-label">Descripción del bono</label>
        <textarea name="bonus_description[]" class="premium-input premium-textarea" placeholder="Incluye técnicas avanzadas..."></textarea>
    </div>
`
    };

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        if (nextBtn) nextBtn.addEventListener('click', nextStep);
        if (prevBtn) prevBtn.addEventListener('click', prevStep);
        if (clearBtn) clearBtn.addEventListener('click', clearForm);
        if (saveProgressBtn) {
            saveProgressBtn.addEventListener('click', () => {
                saveProgress();
                showAlert('¡Progreso guardado exitosamente!', 'success');
            });
        }

        stepDots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const stepToGo = parseInt(e.target.dataset.step);
                if (stepToGo <= currentStep) {
                    if (isEditingFromSummary) {
                        isEditingFromSummary = false;
                        resetNavigationButtonText();
                    }
                    showStep(stepToGo);
                }
            });
        });

        form.addEventListener('change', handleFormChange);
        form.addEventListener('input', handleFormInput);

        setupCharacterCounters();
        setupModuleToggles();

        form.addEventListener('submit', handleFormSubmit);
    }

    function handleFormChange(e) {
        const target = e.target;

        if (target.name === 'followup_method') {
            const val = target.value;
            toggleElement('emailFollowupOptions', val === 'email' || val === 'both');
            toggleElement('whatsappFollowupOptions', val === 'whatsapp' || val === 'both');
        }

        if (target.name === 'additional_emails') {
            toggleElement('emailScheduleOptions', target.value !== 'none');
            toggleElement('emailSequenceBuilder', target.value !== 'none' && target.value !== 'custom');
        }

        if (target.name === 'domain_option') {
            toggleElement('customDomainOptions', target.value === 'custom');
        }

        if (target.type === 'color') {
            const hexInput = target.nextElementSibling;
            if (hexInput && hexInput.name.includes('_hex')) {
                hexInput.value = target.value;
            }
        }

        if (target.name && target.name.includes('_color_hex')) {
            const colorInput = target.previousElementSibling;
            if (colorInput && colorInput.type === 'color') {
                colorInput.value = target.value;
            }
        }

        if (target.type === 'radio' || target.type === 'checkbox') {
            updateOptionCardStyling(target);
        }

        clearValidationErrors(target);
    }

    function handleFormInput(e) {
        const target = e.target;

        if (target.tagName === 'TEXTAREA' && target.hasAttribute('maxlength')) {
            updateCharacterCounter(target);
        }

        clearValidationErrors(target);
    }

    function clearValidationErrors(input) {
        input.classList.remove('error');
        const optionCard = input.closest('.option-card');
        if (optionCard) {
            optionCard.style.borderColor = '';
            optionCard.style.boxShadow = '';
        }
    }

    function toggleElement(elementId, show) {
        const element = document.getElementById(elementId);
        if (element) {
            if (show) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        }
    }

    function updateOptionCardStyling(input) {
        const groupName = input.name;
        const allInputsInGroup = form.querySelectorAll(`input[name="${groupName}"]`);

        allInputsInGroup.forEach(groupInput => {
            const card = groupInput.closest('.option-card');
            if (card) {
                if (input.type === 'radio') {
                    card.classList.toggle('selected', groupInput.checked);
                } else if (input.type === 'checkbox') {
                    card.classList.toggle('selected', groupInput.checked);
                }
            }
        });
    }

    function setupCharacterCounters() {
        document.querySelectorAll('textarea[maxlength]').forEach(textarea => {
            const counter = textarea.nextElementSibling;
            if (counter && counter.classList.contains('char-counter')) {
                textarea.addEventListener('input', () => updateCharacterCounter(textarea));
                updateCharacterCounter(textarea);
            }
        });
    }

    function updateCharacterCounter(textarea) {
        const counter = textarea.nextElementSibling;
        if (counter && counter.classList.contains('char-counter')) {
            const current = textarea.value.length;
            const max = textarea.getAttribute('maxlength');
            counter.textContent = `${current} / ${max}`;

            if (current > max * 0.9) {
                counter.style.color = 'var(--accent-tertiary)';
            } else {
                counter.style.color = 'var(--text-muted)';
            }
        }
    }

    function setupModuleToggles() {
        document.querySelectorAll('input[name="extra_modules[]"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const value = e.target.value;
                const moduleMap = {
                    'testimonials': 'testimonials',
                    'social_media': 'socialMedia',
                    'faq': 'faq',
                    'countdown': 'countdown',
                    'pricing': 'pricing',
                    'video': 'video',
                    'Pop_Up': 'liveChat',
                    'social_proof': 'socialProof',
                    'bonus_stack': 'bonusStack',
                    'calculator': 'calculator',
                    'calendar': 'calendar',
                    'gallery': 'gallery'
                };

                const moduleId = moduleMap[value];
                if (moduleId) {
                    eventHandlers.toggleModuleOptions(moduleId, e.target.checked);
                }
            });
        });
    }

    function setupEventListenersForItem(item) {
        item.querySelectorAll('textarea[maxlength]').forEach(textarea => {
            const counter = textarea.nextElementSibling;
            if (counter && counter.classList.contains('char-counter')) {
                textarea.addEventListener('input', () => updateCharacterCounter(textarea));
                updateCharacterCounter(textarea);
            }
        });
    }

    // --- FORM SUBMISSION + CRM ---
    async function handleFormSubmit(event) {
        event.preventDefault();

        const formData = new FormData(form);

        const payload = {
            client_name: formData.get("client_name"),
            client_email: formData.get("client_email"),
            client_phone: formData.get("client_phone"),
            client_business: formData.get("client_business"),

            business_type: formData.get("business_type"),
            business_stage: formData.get("business_stage"),
            main_product: formData.get("main_product"),

            funnel_destination: formData.get("funnel_destination"),
            traffic_source: formData.get("traffic_source"),
            target_audience: formData.get("target_audience"),
            unique_value: formData.get("unique_value"),

            followup_method: formData.get("followup_method"),
            welcome_email: formData.get("welcome_email"),
            whatsapp_config: formData.get("whatsapp_config"),

            hero_title: formData.get("hero_title"),
            hero_description: formData.get("hero_description"),
            cta_text: formData.get("cta_text"),
            guarantee: formData.get("guarantee"),

            extra_modules: formData.getAll("extra_modules[]"),
            testimonials: JSON.parse(formData.get("testimonials_json") || "null"),
            faq: JSON.parse(formData.get("faq_json") || "null"),
            pricing_plans: JSON.parse(formData.get("pricing_plans_json") || "null"),
            social_links: JSON.parse(formData.get("social_links_json") || "null"),

            primary_color: formData.get("primary_color"),
            secondary_color: formData.get("secondary_color"),
            design_style: formData.get("design_style"),
            fonts: formData.get("fonts"),

            timeframe: formData.get("timeframe"),
            additional_notes: formData.get("additional_notes")
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/leads`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Error al enviar el formulario");
            }

            const savedLead = await response.json();

            // Aquí mantienes tu lógica actual de éxito:
            // limpiar localStorage, mostrar el modal de éxito, resetear pasos, etc.
            // ejemplo genérico:
            // localStorage.removeItem("requalvFormData");
            // showSuccessModal();

            console.log("Lead guardado:", savedLead);
        } catch (error) {
            console.error(error);
            alert("Hubo un error al enviar el formulario. Intenta de nuevo.");
        }
    }

    // Asegúrate de tener:
    form.addEventListener("submit", handleFormSubmit);


    function showSuccessModal() {
        if (successModal) {
            successModal.classList.remove('hidden');
            successModal.classList.add('flex');
            const modalCard = successModal.querySelector('.glass-card');
            if (modalCard) {
                setTimeout(() => {
                    modalCard.style.transform = 'scale(1)';
                }, 50);
            }
        }
    }

    // --- FORM RESET LOGIC ---
    function resetFormState() {
        form.reset();
        isEditingFromSummary = false;
        showStep(0);
        form.dispatchEvent(new Event('change', { bubbles: true }));
        resetNavigationButtonText();
    }

    // --- PERSISTENCE (SAVE/LOAD) ---
    function saveProgress() {
        try {
            const formData = new FormData(form);
            const dataToSave = {};

            formData.forEach((value, key) => {
                if (dataToSave.hasOwnProperty(key)) {
                    if (!Array.isArray(dataToSave[key])) {
                        dataToSave[key] = [dataToSave[key]];
                    }
                    dataToSave[key].push(value);
                } else {
                    dataToSave[key] = value;
                }
            });

            dataToSave._currentStep = currentStep;

            localStorage.setItem('funnelCraftProgress', JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Error saving progress:', error);
            showAlert('Error al guardar el progreso. Intenta nuevamente.', 'error');
        }
    }

    function loadProgress() {
        try {
            const savedData = localStorage.getItem('funnelCraftProgress');
            if (!savedData) return;

            const data = JSON.parse(savedData);
            let hasData = false;

            for (let key in data) {
                if (key.startsWith('_')) continue;

                const elements = form.querySelectorAll(`[name="${key}"]`);
                if (!elements.length) continue;

                hasData = true;
                const values = Array.isArray(data[key]) ? data[key] : [data[key]];

                if (elements[0].type === 'radio' || elements[0].type === 'checkbox') {
                    elements.forEach(input => {
                        if (values.includes(input.value)) {
                            input.checked = true;
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    });
                } else {
                    elements[0].value = data[key];
                    elements[0].dispatchEvent(new Event('input', { bubbles: true }));
                }
            }

            if (typeof data._currentStep === 'number' && data._currentStep >= 0) {
                currentStep = Math.min(data._currentStep, TOTAL_STEPS - 1);
            }

            showStep(currentStep);

            if (hasData) {
                console.log('Progreso anterior cargado exitosamente.');
            }
        } catch (error) {
            console.error('Error loading progress:', error);
            localStorage.removeItem('funnelCraftProgress');
        }
    }

    // --- CLEAR FORM ---
    function clearForm() {
        if (confirm('¿Estás seguro de que quieres limpiar todo el formulario?\n\nEsto eliminará todo el progreso guardado y no se puede deshacer.')) {
            try {
                localStorage.removeItem('funnelCraftProgress');
                resetFormState();

                const containersToReset = [
                    'testimonialsContainer',
                    'socialMediaContainer',
                    'faqContainer',
                    'pricingPlansContainer',
                    'socialProofContainer',
                    'bonusContainer'
                ];

                containersToReset.forEach(containerId => {
                    const container = document.getElementById(containerId);
                    if (container) {
                        while (container.children.length > 1) {
                            container.removeChild(container.lastChild);
                        }
                        const firstItem = container.firstElementChild;
                        if (firstItem) {
                            firstItem.querySelectorAll('input, select, textarea').forEach(field => {
                                if (field.type === 'checkbox' || field.type === 'radio') {
                                    field.checked = false;
                                } else {
                                    field.value = '';
                                }
                                field.dispatchEvent(new Event('change', { bubbles: true }));
                            });
                        }
                    }
                });

                showAlert('Formulario limpiado exitosamente.', 'success');
            } catch (error) {
                console.error('Error clearing form:', error);
                showAlert('Error al limpiar el formulario. Recarga la página para empezar desde cero.', 'error');
            }
        }
    }

    // --- UTILITY FUNCTIONS ---
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // --- ERROR HANDLING ---
    window.addEventListener('error', (event) => {
        console.error('JavaScript error:', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        event.preventDefault();
    });

    // --- ACCESSIBILITY IMPROVEMENTS ---
    function improveAccessibility() {
        stepDots.forEach((dot, index) => {
            dot.setAttribute('aria-label', `Paso ${index + 1}`);
            dot.setAttribute('role', 'button');
            dot.setAttribute('tabindex', '0');

            dot.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const stepToGo = parseInt(e.target.dataset.step);
                    if (stepToGo <= currentStep) {
                        if (isEditingFromSummary) {
                            isEditingFromSummary = false;
                            resetNavigationButtonText();
                        }
                        showStep(stepToGo);
                    }
                }
            });
        });

        form.querySelectorAll('input, select, textarea').forEach(field => {
            const label = field.closest('.input-group')?.querySelector('label');
            if (label && !field.getAttribute('aria-labelledby') && !field.getAttribute('aria-label')) {
                const labelId = `label-${Math.random().toString(36).substr(2, 9)}`;
                label.id = labelId;
                field.setAttribute('aria-labelledby', labelId);
            }
        });
    }

    // --- PERFORMANCE OPTIMIZATIONS ---
    function optimizePerformance() {
        const smoothScroll = (element) => {
            const start = window.pageYOffset;
            const target = element.offsetTop;
            const distance = target - start;
            const duration = 500;
            let startTime = null;

            const animation = (currentTime) => {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const progress = Math.min(timeElapsed / duration, 1);

                const ease = progress * (2 - progress);
                window.scrollTo(0, start + distance * ease);

                if (timeElapsed < duration) {
                    requestAnimationFrame(animation);
                }
            };

            requestAnimationFrame(animation);
        };

        const originalShowStep = showStep;
        window.showStepOptimized = function (stepIndex) {
            originalShowStep(stepIndex);
            smoothScroll(document.body);
        };
    }

    // --- BROWSER COMPATIBILITY ---
    function ensureCompatibility() {
        if (!FormData.prototype.forEach) {
            FormData.prototype.forEach = function (callback, thisArg) {
                for (const [key, value] of this.entries()) {
                    callback.call(thisArg, value, key, this);
                }
            };
        }

        if (!('scrollBehavior' in document.documentElement.style)) {
            window.scrollTo = (function (originalScrollTo) {
                return function (x, y) {
                    if (typeof x === 'object') {
                        originalScrollTo.call(this, x.left || 0, x.top || 0);
                    } else {
                        originalScrollTo.call(this, x, y);
                    }
                };
            })(window.scrollTo);
        }
    }

    // --- START APPLICATION ---
    function startApplication() {
        try {
            ensureCompatibility();
            initializeForm();
            improveAccessibility();
            optimizePerformance();
            document.body.classList.add('app-ready');
            console.log('FunnelCraft Pro form initialized successfully');
        } catch (error) {
            console.error('Error initializing application:', error);
            showAlert('Error al inicializar la aplicación. Por favor, recarga la página.', 'error');
        }
    }

    startApplication();

}); // End of DOMContentLoaded