/**
 * ==========================================================================
 * ROOMFINDER V2 CENTRAL HIGH PERFORMANCE CORE LOGIC RUNTIME ENGINE ARCHITECTURE
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Core Application Memory State Capsule
    const appState = {
        allRooms: [],
        filteredRooms: [],
        favoritesList: JSON.parse(localStorage.getItem('rf_favorites')) || [],
        unlockedRooms: JSON.parse(localStorage.getItem('rf_unlocked_rooms')) || [], // Tracks unlocked contact details
        onlyShowFavorites: false,
        paginationIndex: 0,
        cardsPerPage: 6
    };

    // 🔑 RAZORPAY PRODUCTION KEYS & SERVER CONFIGURATION
    const RAZORPAY_KEY_ID = 'rzp_live_TJoAyneYfwWlGl';
    const BACKEND_URL = 'https://room-universe.onrender.com'; // Express Server Endpoint on Render

    // Global DOM Query Element Grid Context Register
    const dom = {
        loader: document.getElementById('app-loader'),
        themeToggle: document.getElementById('theme-toggle'),
        hamburger: document.getElementById('hamburger'),
        navMenu: document.getElementById('nav-menu'),
        favToggleBtn: document.getElementById('fav-toggle-btn'),
        favCount: document.getElementById('fav-count'),
        roomsGrid: document.getElementById('rooms-grid'),
        adContainer: document.getElementById('ad-banner-container'),
        noResults: document.getElementById('no-results'),
        loadMoreBtn: document.getElementById('load-more-btn'),
        backToTop: document.getElementById('back-to-top'),
        
        // Search & Filter Registration Inputs
        searchInput: document.getElementById('search-input'),
        filterCity: document.getElementById('filter-city'),
        filterType: document.getElementById('filter-type'),
        filterGender: document.getElementById('filter-gender'),
        filterPrice: document.getElementById('filter-price'),
        priceVal: document.getElementById('price-val'),
        sortSelect: document.getElementById('sort-select'),
        
        // Modal System Nodes
        detailModal: document.getElementById('detail-modal'),
        modalClose: document.getElementById('modal-close'),
        modalMainImg: document.getElementById('modal-main-img'),
        modalThumbnails: document.getElementById('modal-thumbnails'),
        modalBadges: document.getElementById('modal-badges'),
        modalTitle: document.getElementById('modal-title'),
        modalPrice: document.getElementById('modal-price'),
        modalDesc: document.getElementById('modal-desc'),
        modalAmenities: document.getElementById('modal-amenities'),
        modalAddress: document.getElementById('modal-address'),
        modalOwner: document.getElementById('modal-owner'),
        btnCall: document.getElementById('btn-call'),
        btnWhatsapp: document.getElementById('btn-whatsapp'),
        modalMap: document.getElementById('modal-map')
    };

    /* ==========================================================================
       1. GLOBAL ACCESSIBILITY & STRUCTURAL UTILITY TOOL MECHANICS ENGINE HANDLERS
       ========================================================================== */

    setTimeout(() => {
        if (dom.loader) {
            dom.loader.style.opacity = '0';
            setTimeout(() => {
                dom.loader.classList.add('hidden');
            }, 500);
        }
    }, 600);

    const initializeColorSchemeSystem = () => {
        const activeThemeSaved = localStorage.getItem('rf_theme') || 'light';
        document.documentElement.setAttribute('data-theme', activeThemeSaved);
        updateThemeToggleButtonUI(activeThemeSaved);
    };

    if (dom.themeToggle) {
        dom.themeToggle.addEventListener('click', () => {
            const currentActiveTheme = document.documentElement.getAttribute('data-theme');
            const targetThemeCalculated = currentActiveTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', targetThemeCalculated);
            localStorage.setItem('rf_theme', targetThemeCalculated);
            updateThemeToggleButtonUI(targetThemeCalculated);
        });
    }

    function updateThemeToggleButtonUI(theme) {
        if (!dom.themeToggle) return;
        const iconNode = dom.themeToggle.querySelector('i');
        if (iconNode) {
            iconNode.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
    }

    if (dom.hamburger) {
        dom.hamburger.addEventListener('click', () => {
            const isMenuOpened = dom.navMenu.classList.toggle('is-active');
            dom.hamburger.setAttribute('aria-expanded', isMenuOpened);
        });
    }

    if (dom.navMenu) {
        dom.navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                dom.navMenu.classList.remove('is-active');
                if (dom.hamburger) dom.hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    window.addEventListener('scroll', () => {
        if (dom.backToTop) {
            if (window.scrollY > 400) {
                dom.backToTop.classList.add('is-visible');
            } else {
                dom.backToTop.classList.remove('is-visible');
            }
        }
    });

    if (dom.backToTop) {
        dom.backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ==========================================================================
       2. ASYNC CORE DATA SOURCE FETCH ENGINE PIPELINE
       ========================================================================== */
    const loadPropertiesDataSource = async () => {
        try {
            const networkResponse = await fetch('rooms/data/rooms.json');
            if (!networkResponse.ok) throw new Error('Data endpoint response failed.');
            
            appState.allRooms = await networkResponse.json();
            
            populateDynamicCityFilters(appState.allRooms);
            synchronizePricingSliderScaleBounds(appState.allRooms);
            
            syncFavoritesBadgeCounter();
            applyActiveFiltersEnginePipeline();
            
        } catch (errorLog) {
            console.error('RoomFinder Initialization Error Pipeline Dump:', errorLog);
            if (dom.roomsGrid) {
                dom.roomsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:var(--accent-danger); font-weight:700;">Error connecting to properties repository database.</p>`;
            }
        }
    };

    const loadAdData = async () => {
        try {
            const response = await fetch('ad.json');
            if (!response.ok) return;
            const ad = await response.json();
            
            if (dom.adContainer) {
                dom.adContainer.innerHTML = `
                    <div class="ad-card" style="margin-bottom: 2rem; padding: 20px; background: var(--card-bg); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; border: 1px solid var(--border-color);">
                        <h3 style="margin-bottom: 10px;">${ad.title}</h3>
                        <p style="margin-bottom: 15px; color: var(--text-muted);">${ad.description}</p>
                        <a href="${ad.link}" target="_blank" class="btn btn-primary">Check It Out</a>
                    </div>
                `;
            }
        } catch (err) {
            console.warn('Ad banner configuration not loaded.');
        }
    };

    /* ==========================================================================
       3. INTERACTIVE CORE FILTER MATRIX AND DATA SORT ROUTINES ENGINE LOGIC
       ========================================================================== */
    
    function populateDynamicCityFilters(roomsArray) {
        if (!dom.filterCity) return;
        const extractedCities = [...new Set(roomsArray.map(room => room.city))].sort();
        extractedCities.forEach(cityName => {
            const dynamicOptionElement = document.createElement('option');
            dynamicOptionElement.value = cityName;
            dynamicOptionElement.textContent = cityName;
            dom.filterCity.appendChild(dynamicOptionElement);
        });
    }

    function synchronizePricingSliderScaleBounds(roomsArray) {
        if (roomsArray.length === 0 || !dom.filterPrice) return;
        const pricesCollection = roomsArray.map(r => r.price);
        const topBoundCeilingPrice = Math.max(...pricesCollection);
        
        dom.filterPrice.max = topBoundCeilingPrice;
        dom.filterPrice.value = topBoundCeilingPrice;
        if (dom.priceVal) dom.priceVal.textContent = `₹${topBoundCeilingPrice}`;
    }

    const applyActiveFiltersEnginePipeline = () => {
        const searchKeywordString = dom.searchInput ? dom.searchInput.value.toLowerCase().trim() : '';
        const targetedCity = dom.filterCity ? dom.filterCity.value : '';
        const targetedType = dom.filterType ? dom.filterType.value : '';
        const targetedGender = dom.filterGender ? dom.filterGender.value : '';
        const maximumCostBudget = dom.filterPrice ? parseInt(dom.filterPrice.value) || Infinity : Infinity;

        appState.filteredRooms = appState.allRooms.filter(room => {
            const matchesSearchInput = !searchKeywordString || 
                room.title.toLowerCase().includes(searchKeywordString) ||
                room.description.toLowerCase().includes(searchKeywordString) ||
                room.city.toLowerCase().includes(searchKeywordString) ||
                (room.address && room.address.toLowerCase().includes(searchKeywordString));

            const matchesCitySelection = !targetedCity || room.city === targetedCity;
            const matchesTypeSelection = !targetedType || room.roomType === targetedType;
            const matchesGenderSelection = !targetedGender || room.gender === targetedGender;
            const matchesPricingThreshold = room.price <= maximumCostBudget;
            
            const matchesFavoritesRequirement = !appState.onlyShowFavorites || appState.favoritesList.includes(room.id);

            return matchesSearchInput && matchesCitySelection && matchesTypeSelection && matchesGenderSelection && matchesPricingThreshold && matchesFavoritesRequirement;
        });

        executeDataResultSetSorting();
    };

    function executeDataResultSetSorting() {
        const explicitSortingCriteria = dom.sortSelect ? dom.sortSelect.value : '';
        
        if (explicitSortingCriteria === 'low-high') {
            appState.filteredRooms.sort((a, b) => a.price - b.price);
        } else if (explicitSortingCriteria === 'high-low') {
            appState.filteredRooms.sort((a, b) => b.price - a.price);
        } else if (explicitSortingCriteria === 'newest') {
            appState.filteredRooms.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        }

        appState.paginationIndex = 0;
        injectFilteredCardLayoutViews(false);
    }

    // Attach Event Listeners to Search and Filters
    if (dom.searchInput) dom.searchInput.addEventListener('input', applyActiveFiltersEnginePipeline);
    if (dom.filterCity) dom.filterCity.addEventListener('change', applyActiveFiltersEnginePipeline);
    if (dom.filterType) dom.filterType.addEventListener('change', applyActiveFiltersEnginePipeline);
    if (dom.filterGender) dom.filterGender.addEventListener('change', applyActiveFiltersEnginePipeline);
    if (dom.sortSelect) dom.sortSelect.addEventListener('change', executeDataResultSetSorting);
    
    if (dom.filterPrice) {
        dom.filterPrice.addEventListener('input', () => {
            if (dom.priceVal) dom.priceVal.textContent = `₹${dom.filterPrice.value}`;
            applyActiveFiltersEnginePipeline();
        });
    }

    if (dom.loadMoreBtn) {
        dom.loadMoreBtn.addEventListener('click', () => {
            appState.paginationIndex++;
            injectFilteredCardLayoutViews(true);
        });
    }

    /* ==========================================================================
       4. DYNAMIC VIEW COMPONENT RENDERING
       ========================================================================== */
    function injectFilteredCardLayoutViews(appendDataStreamMode = false) {
        if (!dom.roomsGrid) return;

        if (!appendDataStreamMode) {
            dom.roomsGrid.innerHTML = '';
        }

        const exactTotalMatches = appState.filteredRooms.length;
        
        if (exactTotalMatches === 0) {
            if (dom.noResults) dom.noResults.classList.remove('hidden');
            if (dom.loadMoreBtn) dom.loadMoreBtn.classList.add('hidden');
            return;
        } else {
            if (dom.noResults) dom.noResults.classList.add('hidden');
        }

        const startingBoundaryPointer = appState.paginationIndex * appState.cardsPerPage;
        const terminalBoundaryPointer = Math.min(startingBoundaryPointer + appState.cardsPerPage, exactTotalMatches);
        const segmentRenderSet = appState.filteredRooms.slice(startingBoundaryPointer, terminalBoundaryPointer);

        segmentRenderSet.forEach((roomItem, absoluteIncrementalIndex) => {
            const isSavedFavorite = appState.favoritesList.includes(roomItem.id);
            const physicalCardNodeElement = document.createElement('article');
            physicalCardNodeElement.className = 'room-card';
            physicalCardNodeElement.style.animationDelay = `${absoluteIncrementalIndex * 0.05}s`;
            
            const coverImage = (roomItem.images && roomItem.images.length > 0) ? roomItem.images[0] : 'https://via.placeholder.com/400x300?text=No+Image';

            physicalCardNodeElement.innerHTML = `
                <div class="card-media-wrapper">
                    <button class="fav-trigger-btn ${isSavedFavorite ? 'is-favorite' : ''}" data-id="${roomItem.id}" aria-label="Add to favorites">
                        <i class="${isSavedFavorite ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                    </button>
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'%3E%3C/svg%3E" data-src="${coverImage}" alt="${roomItem.title}" class="lazy-load-img">
                    <span class="badge-pill">${roomItem.roomType}</span>
                </div>
                <div class="card-body-content">
                    <span class="card-location-meta"><i class="fa-solid fa-location-dot"></i> ${roomItem.city}</span>
                    <h3>${roomItem.title}</h3>
                    <div class="card-pricing-row">
                        <p class="price-currency-block">&#8377;${roomItem.price}<span>/mo</span></p>
                        <button class="btn btn-primary open-detail-trigger" data-id="${roomItem.id}">View Details</button>
                    </div>
                </div>
            `;
            dom.roomsGrid.appendChild(physicalCardNodeElement);
        });

        initializeLazyLoadingEngine();

        if (dom.loadMoreBtn) {
            if (terminalBoundaryPointer < exactTotalMatches) {
                dom.loadMoreBtn.classList.remove('hidden');
            } else {
                dom.loadMoreBtn.classList.add('hidden');
            }
        }
    }

    function initializeLazyLoadingEngine() {
        const imageElementsList = document.querySelectorAll('.lazy-load-img');
        if ('IntersectionObserver' in window) {
            const visualImageObserver = new IntersectionObserver((observedEntries, observerContext) => {
                observedEntries.forEach(entryNode => {
                    if (entryNode.isIntersecting) {
                        const directImageNode = entryNode.target;
                        directImageNode.src = directImageNode.getAttribute('data-src');
                        directImageNode.classList.remove('lazy-load-img');
                        observerContext.unobserve(directImageNode);
                    }
                });
            }, { rootMargin: '0px 0px 200px 0px' });
            imageElementsList.forEach(img => visualImageObserver.observe(img));
        } else {
            imageElementsList.forEach(img => img.src = img.getAttribute('data-src'));
        }
    }

    /* ==========================================================================
       5. PERSISTENT LOCAL STORAGE FAVORITE ARCHITECTURE
       ========================================================================== */
    if (dom.roomsGrid) {
        dom.roomsGrid.addEventListener('click', (clickEventContext) => {
            const contextualFavoriteTargetButton = clickEventContext.target.closest('.fav-trigger-btn');
            if (contextualFavoriteTargetButton) {
                clickEventContext.stopPropagation();
                const targetedPropertyID = contextualFavoriteTargetButton.getAttribute('data-id');
                toggleFavoriteElementPersistenceState(targetedPropertyID, contextualFavoriteTargetButton);
                return;
            }

            const contextualDetailTargetButton = clickEventContext.target.closest('.open-detail-trigger');
            if (contextualDetailTargetButton) {
                const targetedPropertyID = contextualDetailTargetButton.getAttribute('data-id');
                openDetailModalSheetWindow(targetedPropertyID);
            }
        });
    }

    function toggleFavoriteElementPersistenceState(propertyId, htmlButtonNode) {
        let internalFavoritesTrackArray = [...appState.favoritesList];
        const arrayIndexPointer = internalFavoritesTrackArray.indexOf(propertyId);

        if (arrayIndexPointer > -1) {
            internalFavoritesTrackArray.splice(arrayIndexPointer, 1);
            htmlButtonNode.classList.remove('is-favorite');
            htmlButtonNode.querySelector('i').className = 'fa-regular fa-heart';
        } else {
            internalFavoritesTrackArray.push(propertyId);
            htmlButtonNode.classList.add('is-favorite');
            htmlButtonNode.querySelector('i').className = 'fa-solid fa-heart';
        }

        appState.favoritesList = internalFavoritesTrackArray;
        localStorage.setItem('rf_favorites', JSON.stringify(internalFavoritesTrackArray));
        syncFavoritesBadgeCounter();

        if (appState.onlyShowFavorites) {
            applyActiveFiltersEnginePipeline();
        }
    }

    function syncFavoritesBadgeCounter() {
        if (dom.favCount) {
            dom.favCount.textContent = appState.favoritesList.length;
        }
    }

    if (dom.favToggleBtn) {
        dom.favToggleBtn.addEventListener('click', () => {
            appState.onlyShowFavorites = !appState.onlyShowFavorites;
            dom.favToggleBtn.classList.toggle('active-filter', appState.onlyShowFavorites);
            applyActiveFiltersEnginePipeline();
        });
    }

    /* ==========================================================================
       6. MODAL OVERLAY DETAIL DISPLAY SHEET & RAZORPAY INTEGRATION
       ========================================================================== */
    function openDetailModalSheetWindow(propertyId) {
        const foundRoomDataRecord = appState.allRooms.find(r => r.id === propertyId);
        if (!foundRoomDataRecord) return;

        if (dom.modalMainImg) {
            dom.modalMainImg.src = (foundRoomDataRecord.images && foundRoomDataRecord.images.length > 0) ? foundRoomDataRecord.images[0] : 'https://via.placeholder.com/600x400?text=No+Image';
            dom.modalMainImg.alt = foundRoomDataRecord.title;
        }

        if (dom.modalThumbnails) {
            dom.modalThumbnails.innerHTML = '';
            if (foundRoomDataRecord.images && foundRoomDataRecord.images.length > 0) {
                foundRoomDataRecord.images.forEach((imagePathString, dynamicIndexIndex) => {
                    const thumbnailImageNode = document.createElement('img');
                    thumbnailImageNode.src = imagePathString;
                    if (dynamicIndexIndex === 0) thumbnailImageNode.className = 'thumb-active';
                    thumbnailImageNode.addEventListener('click', () => {
                        dom.modalMainImg.src = imagePathString;
                        dom.modalThumbnails.querySelectorAll('img').forEach(t => t.classList.remove('thumb-active'));
                        thumbnailImageNode.classList.add('thumb-active');
                    });
                    dom.modalThumbnails.appendChild(thumbnailImageNode);
                });
            }
        }

        if (dom.modalBadges) {
            dom.modalBadges.innerHTML = `
                <span class="badge-gender">${foundRoomDataRecord.gender} Profile</span>
                <span class="badge-type">${foundRoomDataRecord.roomType} Allocation</span>
            `;
        }

        if (dom.modalTitle) dom.modalTitle.textContent = foundRoomDataRecord.title;
        if (dom.modalPrice) dom.modalPrice.textContent = foundRoomDataRecord.price;
        if (dom.modalDesc) dom.modalDesc.textContent = foundRoomDataRecord.description;
        
        if (dom.modalAddress) {
            const addressText = foundRoomDataRecord.address || foundRoomDataRecord.location || `${foundRoomDataRecord.city || 'Kasba Bawda'}, Kolhapur`;
            dom.modalAddress.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${addressText}`;
        }

        if (dom.modalOwner) dom.modalOwner.textContent = foundRoomDataRecord.ownerName || 'Verified Host';

        // Manage Unlocking State
        const isUnlocked = appState.unlockedRooms.includes(propertyId);
        renderContactButtonsState(foundRoomDataRecord, isUnlocked);

        if (dom.modalMap) dom.modalMap.src = foundRoomDataRecord.mapEmbedUrl || '';

        if (dom.detailModal) dom.detailModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function renderContactButtonsState(roomData, isUnlocked) {
        if (!dom.btnCall || !dom.btnWhatsapp) return;

        if (isUnlocked) {
            const phoneNum = roomData.phone || roomData.contact || "9876543210";
            const whatsappNum = roomData.whatsapp || roomData.phone || "919876543210";

            dom.btnCall.innerHTML = `<i class="fa-solid fa-phone"></i> Call ${phoneNum}`;
            dom.btnCall.onclick = () => window.location.href = `tel:${phoneNum}`;
            
            dom.btnWhatsapp.innerHTML = `<i class="fa-brands fa-whatsapp"></i> WhatsApp`;
            dom.btnWhatsapp.onclick = () => window.open(`https://wa.me/${whatsappNum}?text=Hello%20I%20am%20interested%20in%20${encodeURIComponent(roomData.title)}`, '_blank');
        } else {
            dom.btnCall.innerHTML = `<i class="fa-solid fa-lock"></i> Unlock Call Info (₹10)`;
            dom.btnCall.onclick = (e) => {
                e.preventDefault();
                initiateRazorpayPayment(roomData);
            };

            dom.btnWhatsapp.innerHTML = `<i class="fa-solid fa-lock"></i> Unlock WhatsApp (₹10)`;
            dom.btnWhatsapp.onclick = (e) => {
                e.preventDefault();
                initiateRazorpayPayment(roomData);
            };
        }
    }

    // Inject Razorpay SDK dynamically if missing
    const loadRazorpaySDK = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const scriptNode = document.createElement('script');
            scriptNode.src = 'https://checkout.razorpay.com/v1/checkout.js';
            scriptNode.onload = () => resolve(true);
            scriptNode.onerror = () => resolve(false);
            document.body.appendChild(scriptNode);
        });
    };

    const initiateRazorpayPayment = async (roomData) => {
        const isSDKLoaded = await loadRazorpaySDK();
        if (!isSDKLoaded) {
            alert('Razorpay Gateway SDK failed to load. Please check your network connection.');
            return;
        }

        // Show UI loading feedback on buttons during Render cold start
        if (dom.btnCall) dom.btnCall.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Connecting to Gateway...`;
        if (dom.btnWhatsapp) dom.btnWhatsapp.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Connecting to Gateway...`;

        try {
            // 1. Request server to create Razorpay Order (Sends ₹10)
            const response = await fetch(`${BACKEND_URL}/api/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: 10, // ₹10 INR
                    currency: 'INR',
                    receipt: `receipt_unlock_${roomData.id}`
                })
            });

            const orderData = await response.json();
            if (!response.ok) throw new Error(orderData.error || 'Failed to create payment order on server.');

            // Reset button text once order is prepared
            renderContactButtonsState(roomData, false);

            // 2. Open Razorpay Checkout modal
            const options = {
                "key": RAZORPAY_KEY_ID,
                "amount": orderData.amount, // 1000 paise (₹10) from backend
                "currency": orderData.currency,
                "name": "RoomFinder V2",
                "description": `Unlock owner contact details for ${roomData.title}`,
                "order_id": orderData.order_id,
                "handler": function (paymentResponse) {
                    // Update UI button while verification is taking place
                    if (dom.btnCall) dom.btnCall.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Verifying Payment...`;
                    if (dom.btnWhatsapp) dom.btnWhatsapp.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Verifying Payment...`;

                    // 3. Verify signature via Express backend (Promise chain prevents handler stalls)
                    fetch(`${BACKEND_URL}/api/verify-payment`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: paymentResponse.razorpay_order_id,
                            razorpay_payment_id: paymentResponse.razorpay_payment_id,
                            razorpay_signature: paymentResponse.razorpay_signature
                        })
                    })
                    .then(res => res.json().then(data => ({ status: res.status, ok: res.ok, data })))
                    .then(({ ok, data }) => {
                        if (ok) {
                            alert(`Payment Verified Successfully! Payment ID: ${paymentResponse.razorpay_payment_id}`);

                            if (!appState.unlockedRooms.includes(roomData.id)) {
                                appState.unlockedRooms.push(roomData.id);
                                localStorage.setItem('rf_unlocked_rooms', JSON.stringify(appState.unlockedRooms));
                            }

                            renderContactButtonsState(roomData, true);
                        } else {
                            alert(`Payment Verification Failed: ${data.message || 'Signature mismatch'}`);
                            renderContactButtonsState(roomData, false);
                        }
                    })
                    .catch(err => {
                        console.error('Verification Error:', err);
                        alert('Server verification failed. Payment ID: ' + paymentResponse.razorpay_payment_id);
                        renderContactButtonsState(roomData, false);
                    });
                },
                "modal": {
                    "ondismiss": function () {
                        console.log('Payment checkout closed.');
                        renderContactButtonsState(roomData, false);
                    }
                },
                "prefill": {
                    "name": "RoomFinder User",
                    "email": "user@roomfinder.com",
                    "contact": roomData.phone || "7745036055"
                },
                "theme": {
                    "color": "#2563eb"
                }
            };

            const rzp = new Razorpay(options);
            
            rzp.on('payment.failed', function (failureResponse) {
                alert(`Payment Failed: ${failureResponse.error.description}`);
                renderContactButtonsState(roomData, false);
            });

            rzp.open();

        } catch (err) {
            console.error('Payment Error:', err);
            alert(err.message || 'Payment initiation failed.');
            renderContactButtonsState(roomData, false);
        }
    };

    const closeDetailModalWindowSheet = () => {
        if (dom.detailModal) dom.detailModal.classList.add('hidden');
        document.body.style.overflow = '';
        if (dom.modalMap) dom.modalMap.src = '';
    };

    if (dom.modalClose) dom.modalClose.addEventListener('click', closeDetailModalWindowSheet);
    if (dom.detailModal) {
        dom.detailModal.addEventListener('click', (e) => { 
            if (e.target === dom.detailModal) closeDetailModalWindowSheet(); 
        });
    }
    
    document.addEventListener('keydown', (e) => { 
        if (e.key === 'Escape' && dom.detailModal && !dom.detailModal.classList.contains('hidden')) {
            closeDetailModalWindowSheet(); 
        }
    });

    /* ==========================================================================
       7. INITIALIZATION PIPELINES
       ========================================================================== */
    initializeColorSchemeSystem();
    loadPropertiesDataSource();
    loadAdData();
});
