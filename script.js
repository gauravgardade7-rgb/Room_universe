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
        onlyShowFavorites: false,
        paginationIndex: 0,
        cardsPerPage: 6
    };

    // Global DOM Query Element Grid Context Register
    const dom = {
        loader: document.getElementById('app-loader'),
        themeToggle: document.getElementById('theme-toggle'),
        hamburger: document.getElementById('hamburger'),
        navMenu: document.getElementById('nav-menu'),
        favToggleBtn: document.getElementById('fav-toggle-btn'),
        favCount: document.getElementById('fav-count'),
        roomsGrid: document.getElementById('rooms-grid'),
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
        modal: document.getElementById('detail-modal'),
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

    // Initialization App Loading Sequence Fading Out Frame View Execution
    setTimeout(() => {
        dom.loader.style.opacity = '0';
        setTimeout(() => {
            dom.loader.classList.add('hidden');
        }, 500);
    }, 600);

    // Color Scheme Dark Mode Light Mode Structural State Tracking Persistence Setup
    const initializeColorSchemeSystem = () => {
        const activeThemeSaved = localStorage.getItem('rf_theme') || 'light';
        document.documentElement.setAttribute('data-theme', activeThemeSaved);
        updateThemeToggleButtonUI(activeThemeSaved);
    };

    dom.themeToggle.addEventListener('click', () => {
        const currentActiveTheme = document.documentElement.getAttribute('data-theme');
        const targetThemeCalculated = currentActiveTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', targetThemeCalculated);
        localStorage.setItem('rf_theme', targetThemeCalculated);
        updateThemeToggleButtonUI(targetThemeCalculated);
    });

    function updateThemeToggleButtonUI(theme) {
        const iconNode = dom.themeToggle.querySelector('i');
        if (theme === 'dark') {
            iconNode.className = 'fa-solid fa-sun';
        } else {
            iconNode.className = 'fa-solid fa-moon';
        }
    }

    // Mobile Navigation Drawer Toggle Handler Logic Matrix Controller Map
    dom.hamburger.addEventListener('click', () => {
        const isMenuOpened = dom.navMenu.classList.toggle('is-active');
        dom.hamburger.setAttribute('aria-expanded', isMenuOpened);
    });

    // Close mobile menu if a navigation point is clicked
    dom.navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            dom.navMenu.classList.remove('is-active');
            dom.hamburger.setAttribute('aria-expanded', 'false');
        });
    });

    // Back-to-Top Navigation Button Behavior Control System Routine
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            dom.backToTop.classList.add('is-visible');
        } else {
            dom.backToTop.classList.remove('is-visible');
        }
    });

    dom.backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    /* ==========================================================================
       2. ASYNC CORE DATA SOURCE FETCH ENGINE PIPELINE
       ========================================================================== */
    const loadPropertiesDataSource = async () => {
        try {
            // Localized structured filepath reference relative map array extraction
            const networkResponse = await fetch('rooms/data/rooms.json');
            if (!networkResponse.ok) throw new Error('Data endpoint response failed.');
            
            appState.allRooms = await networkResponse.json();
            
            // Build and dynamically seed dynamic input filters matching data matrix variables
            populateDynamicCityFilters(appState.allRooms);
            synchronizePricingSliderScaleBounds(appState.allRooms);
            
            // Execute layout compilation render operations cycle context
            syncFavoritesBadgeCounter();
            applyActiveFiltersEnginePipeline();
            
        } catch (errorLog) {
            console.error('RoomFinder Initialization Error Pipeline Dump:', errorLog);
            dom.roomsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:var(--accent-danger); font-weight:700;">Error connecting to properties repository database. Please refresh or check infrastructure parameters.</p>`;
        }
    };

    /* ==========================================================================
       3. INTERACTIVE CORE FILTER MATRIX AND DATA SORT ROUTINES ENGINE LOGIC
       ========================================================================== */
    
    function populateDynamicCityFilters(roomsArray) {
        const extractedCities = [...new Set(roomsArray.map(room => room.city))].sort();
        extractedCities.forEach(cityName => {
            const dynamicOptionElement = document.createElement('option');
            dynamicOptionElement.value = cityName;
            dynamicOptionElement.textContent = cityName;
            dom.filterCity.appendChild(dynamicOptionElement);
        });
    }

    function synchronizePricingSliderScaleBounds(roomsArray) {
        if (roomsArray.length === 0) return;
        const pricesCollection = roomsArray.map(r => r.price);
        const topBoundCeilingPrice = Math.max(...pricesCollection);
        
        dom.filterPrice.max = topBoundCeilingPrice;
        dom.filterPrice.value = topBoundCeilingPrice;
        dom.priceVal.textContent = `₹${topBoundCeilingPrice}`;
    }

    const applyActiveFiltersEnginePipeline = () => {
        const searchKeywordString = dom.searchInput.value.toLowerCase().trim();
        const targetedCity = dom.filterCity.value;
        const targetedType = dom.filterType.value;
        const targetedGender = dom.filterGender.value;
        const maximumCostBudget = parseInt(dom.filterPrice.value) || Infinity;

        appState.filteredRooms = appState.allRooms.filter(room => {
            // Structural evaluations verification logical array filters
            const matchesSearchInput = !searchKeywordString || 
                room.title.toLowerCase().includes(searchKeywordString) ||
                room.description.toLowerCase().includes(searchKeywordString) ||
                room.city.toLowerCase().includes(searchKeywordString) ||
                room.address.toLowerCase().includes(searchKeywordString);

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
        const explicitSortingCriteria = dom.sortSelect.value;
        
        if (explicitSortingCriteria === 'low-high') {
            appState.filteredRooms.sort((a, b) => a.price - b.price);
        } else if (explicitSortingCriteria === 'high-low') {
            appState.filteredRooms.sort((a, b) => b.price - a.price);
        } else if (explicitSortingCriteria === 'newest') {
            appState.filteredRooms.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        }

        // Reset pagination viewport windows and dispatch template injection engine
        appState.paginationIndex = 0;
        injectFilteredCardLayoutViews(false);
    }

    /* ==========================================================================
       4. DYNAMIC VIEW COMPONENT RENDERING MATRIX ENGINE WITH IMAGE LAZY-LOADING
       ========================================================================== */
    function injectFilteredCardLayoutViews(appendDataStreamMode = false) {
        if (!appendDataStreamMode) {
            dom.roomsGrid.innerHTML = '';
        }

        const exactTotalMatches = appState.filteredRooms.length;
        
        if (exactTotalMatches === 0) {
            dom.noResults.classList.remove('hidden');
            dom.loadMoreBtn.classList.add('hidden');
            return;
        } else {
            dom.noResults.classList.add('hidden');
        }

        // Slice calculations execution block array data stream bounds mappings
        const startingBoundaryPointer = appState.paginationIndex * appState.cardsPerPage;
        const terminalBoundaryPointer = Math.min(startingBoundaryPointer + appState.cardsPerPage, exactTotalMatches);
        const segmentRenderSet = appState.filteredRooms.slice(startingBoundaryPointer, terminalBoundaryPointer);

        segmentRenderSet.forEach((roomItem, absoluteIncrementalIndex) => {
            const isSavedFavorite = appState.favoritesList.includes(roomItem.id);
            const physicalCardNodeElement = document.createElement('article');
            physicalCardNodeElement.className = 'room-card';
            // Stagger animation timing for smooth presentation load-in effects
            physicalCardNodeElement.style.animationDelay = `${absoluteIncrementalIndex * 0.05}s`;
            
            physicalCardNodeElement.innerHTML = `
                <div class="card-media-wrapper">
                    <button class="fav-trigger-btn ${isSavedFavorite ? 'is-favorite' : ''}" data-id="${roomItem.id}" aria-label="Add listing to custom saved dashboard list">
                        <i class="${isSavedFavorite ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                    </button>
                    <!-- Enhanced Image Performance Lazy Loading Configuration Mode -->
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'%3E%3C/svg%3E" data-src="${roomItem.images[0]}" alt="${roomItem.title}" class="lazy-load-img">
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

        // Initialize Native IntersectionObserver Engine for Image Lazy Loading
        initializeLazyLoadingEngine();

        // Evaluate state parameters to hide or display the "Load More" pagination trigger
        if (terminalBoundaryPointer < exactTotalMatches) {
            dom.loadMoreBtn.classList.remove('hidden');
        } else {
            dom.loadMoreBtn.classList.add('hidden');
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
            }, { rootMargin: '0px 0px 200px 0px' }); // Load ahead for smooth scrolling

            imageElementsList.forEach(img => visualImageObserver.observe(img));
        } else {
            // Fallback strategy execution mechanism for legacy ecosystem compatibility maps
            imageElementsList.forEach(img => {
                img.src = img.getAttribute('data-src');
            });
        }
    }

    /* ==========================================================================
       5. PERSISTENT LOCAL STORAGE FAVORITE ARCHITECTURE INFRASTRUCTURE MODULE
       ========================================================================== */
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

        // Hot refresh dynamic listing view states if viewing favorite dashboard metrics only
        if (appState.onlyShowFavorites) {
            applyActiveFiltersEnginePipeline();
        }
    }

    function syncFavoritesBadgeCounter() {
        dom.favCount.textContent = appState.favoritesList.length;
    }

    dom.favToggleBtn.addEventListener('click', () => {
        appState.onlyShowFavorites = !appState.onlyShowFavorites;
        if (appState.onlyShowFavorites) {
            dom.favToggleBtn.classList.add('active-filter');
        } else {
            dom.favToggleBtn.classList.remove('active-filter');
        }
        applyActiveFiltersEnginePipeline();
    });

    /* ==========================================================================
       6. MODAL OVERLAY DETAIL DISPLAY SHEET CONTROL SYSTEM ENGINE ROUTINES
       ========================================================================== */
    function openDetailModalSheetWindow(propertyId) {
        const foundRoomDataRecord = appState.allRooms.find(r => r.id === propertyId);
        if (!foundRoomDataRecord) return;

        // Reset and inject primary focal display photo asset image
        dom.modalMainImg.src = foundRoomDataRecord.images[0];
        dom.modalMainImg.alt = foundRoomDataRecord.title;

        // Build responsive thumbnail click handlers
        dom.modalThumbnails.innerHTML = '';
        foundRoomDataRecord.images.forEach((imagePathString, dynamicIndexIndex) => {
            const thumbnailImageNode = document.createElement('img');
            thumbnailImageNode.src = imagePathString;
            thumbnailImageNode.alt = `View thumbnail index mapping ${dynamicIndexIndex}`;
            if (dynamicIndexIndex === 0) thumbnailImageNode.className = 'thumb-active';
            
            thumbnailImageNode.addEventListener('click', () => {
                dom.modalMainImg.src = imagePathString;
                dom.modalThumbnails.querySelectorAll('img').forEach(t => t.classList.remove('thumb-active'));
                thumbnailImageNode.classList.add('thumb-active');
            });
            dom.modalThumbnails.appendChild(thumbnailImageNode);
        });

        // Seed descriptive semantic standard textual information metadata variables blocks
        dom.modalBadges.innerHTML = `
            <span class="badge-gender">${foundRoomDataRecord.gender} Profile</span>
            <span class="badge-type">${foundRoomDataRecord.roomType} Allocation</span>
        `;
        dom.modalTitle.textContent = foundRoomDataRecord.title;
        dom.modalPrice.textContent = foundRoomDataRecord.price;
        dom.modalDesc.textContent = foundRoomDataRecord.description;
        dom.modalAddress.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${foundRoomDataRecord.address}`;
        dom.modalOwner.textContent = foundRoomDataRecord.ownerName;

        // Instantiate operational interactive structural vendor communication links mapping vectors
        dom.btnCall.href = `tel:${foundRoomDataRecord.phone}`;
        dom.btnWhatsapp.href = `https://wa.me/${foundRoomDataRecord.whatsapp}?text=Hello%20${encodeURIComponent(foundRoomDataRecord.ownerName)},%20I%20am%20interested%20in%20your%20listing:%20${encodeURIComponent(foundRoomDataRecord.title)}.`;

        // Inject active location address embedding tracking mapping link parameters frameworks
        dom.modalMap.src = foundRoomDataRecord.mapEmbedUrl;

        // Open layout configuration matrix parameters update views changes targets
        dom.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Lock scrolling behind modal window viewport boundaries
        dom.modalClose.focus();
    }

    const closeDetailModalWindowSheet = () => {
        dom.modal.classList.add('hidden');
        document.body.style.overflow = ''; // Unblock background main frame page scroll vectors
        dom.modalMap.src = ''; // Flush running embedded frames maps vectors out immediately to save memory channels
    };

    dom.modalClose.addEventListener('click', closeDetailModalWindowSheet);
    dom.modal.addEventListener('click', (eventInstanceContext) => {
        if (eventInstanceContext.target === dom.modal) {
            closeDetailModalWindowSheet();
        }
    });

    // Capture system hardware keyboard escape events to close active screen layouts
    document.addEventListener('keydown', (keyboardEvent) => {
        if (keyboardEvent.key === 'Escape' && !dom.modal.classList.contains('hidden')) {
            closeDetailModalWindowSheet();
        }
    });

    /* ==========================================================================
       7. ACTIVE DISPATCH REALTIME EVENT LISTENERS ATTACHMENTS PIPELINES MAPS
       ========================================================================== */
    
    // Instant Live Capture Filtering Input Sequence Trigger Handler Engine Hook
    dom.searchInput.addEventListener('input', applyActiveFiltersEnginePipeline);
    
    // Regular Dashboard Dropdown Dynamic Select Filter Input Interactivity Listeners Hooks
    dom.filterCity.addEventListener('change', applyActiveFiltersEnginePipeline);
    dom.filterType.addEventListener('change', applyActiveFiltersEnginePipeline);
    dom.filterGender.addEventListener('change', applyActiveFiltersEnginePipeline);
    
    // Pricing slider range monitoring updates logic loops
    dom.filterPrice.addEventListener('input', (eventObj) => {
        dom.priceVal.textContent = `₹${eventObj.target.value}`;
        applyActiveFiltersEnginePipeline();
    });

    dom.sortSelect.addEventListener('change', executeDataResultSetSorting);

    // Pagination dynamic layout appending action handlers linkage wire-up setup
    dom.loadMoreBtn.addEventListener('click', () => {
        appState.paginationIndex++;
        injectFilteredCardLayoutViews(true);
    });

    // Launch structural system execution sequence processes profiles
    initializeColorSchemeSystem();
    loadPropertiesDataSource();
});