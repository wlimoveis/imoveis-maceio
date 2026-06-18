// js/modules/utils/FilterManager.js - Dropdown de BAIRROS por tipo de Destaque
// ✅ CSS inline movido para main.css (classes CSS)
console.log('🎛️ FilterManager.js carregado - Dropdown de bairros por Destaque (CSS externalizado)');

const FilterManager = (function() {
    const CONFIG = {
        containerClass: 'filter-options',
        buttonClass: 'filter-btn',
        activeClass: 'active',
        defaultFilter: 'todos',
        dropdownDelay: 300,
        useClickForDropdown: false
    };

    const state = {
        currentFilter: CONFIG.defaultFilter,
        currentBairro: null,
        containers: new Map(),
        callbacks: new Map(),
        initialized: false,
        dropdownActive: false,
        hoverTimeout: null
    };

    let currentActiveDropdown = null;
    let dropdownCloseTimeout = null;

    const CATEGORY_CONFIG = {
        'Comercial': {
            filterBy: 'type',
            expectedValues: ['comercial'],
            icon: 'fa-building',
            title: 'Comercial'
        },
        'Residencial': {
            filterBy: 'badge',
            expectedValues: ['Novo', 'Destaque', 'Luxo'],
            requiredType: 'residencial',
            icon: 'fa-home',
            title: 'Residencial'
        },
        'Rural': {
            filterBy: 'badge',
            expectedValues: ['Fazenda', 'Chácara'],
            requiredType: 'rural',
            icon: 'fa-tractor',
            title: 'Zona Rural'
        },
        'Minha Casa Minha Vida': {
            filterBy: 'badge',
            expectedValues: ['MCMV'],
            requiredType: null,
            icon: 'fa-hand-holding-heart',
            title: 'Incorporações & Empreendimentos'
        }
    };

    function extractBairroFromLocation(location) {
        if (window.SharedCore && typeof window.SharedCore.extractBairroFromLocation === 'function') {
            return window.SharedCore.extractBairroFromLocation(location);
        }
        if (!location || typeof location !== 'string') return null;
        const locationClean = location.trim();
        if (locationClean.includes(',')) {
            const parts = locationClean.split(',');
            if (parts.length >= 2) {
                let possibleBairro = parts[1].trim();
                possibleBairro = possibleBairro.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
                if (possibleBairro.length > 0 && possibleBairro.length < 50) {
                    return possibleBairro;
                }
            }
        }
        if (locationClean.toLowerCase().includes('rural') || locationClean.toLowerCase().includes('zona rural')) {
            return 'Zona Rural';
        }
        return null;
    }

    const bairrosPrioridade = [
        'Pajuçara', 'Ponta Verde', 'Jatiúca', 'Jacarecica', 'Cruz das Almas',
        'Mangabeiras', 'Poço', 'Barro Duro', 'Gruta de Lourdes', 'Serraria',
        'Farol', 'Jardim Petrópolis', 'Centro', 'Prado', 'Jaraguá', 'Feitosa',
        'Pinheiro', 'Santa Lúcia', 'Santa Amélia', 'Tabuleiro do Martins',
        'Cidade Universitária', 'Clima Bom', 'Benedito Bentes', 'Santos Dumont',
        'São Jorge', 'Levada', 'Trapiche da Barra', 'Vergel do Lago',
        'Ouro Preto', 'Mutange', 'Fernão Velho', 'Forene', 'Rio Novo', 
        'Riacho Doce', 'Pontal da Barra', 'Guaxuma', 'Ipioca', 'Garça Torta',
        'Pescaria', 'Ponta da Terra', 'Murilopes', 'Zona Rural', 'Barra',
        'Barra de São Miguel', 'São Miguel dos Milagres', 'Boa Viagem'
    ];

    function extractBairrosByCategory(properties, category) {
        if (!properties || !Array.isArray(properties)) return [];
        const config = CATEGORY_CONFIG[category];
        if (!config) return [];
        console.log(`🔍 Buscando imóveis para categoria: ${category}`);
        let filteredProperties = [];
        if (config.filterBy === 'type') {
            filteredProperties = properties.filter(property => 
                property.type && config.expectedValues.includes(property.type)
            );
        } else {
            filteredProperties = properties.filter(property => {
                const hasCorrectBadge = property.badge && config.expectedValues.includes(property.badge);
                if (config.requiredType) {
                    return hasCorrectBadge && property.type === config.requiredType;
                }
                return hasCorrectBadge;
            });
        }
        console.log(`📊 Encontrados ${filteredProperties.length} imóveis para categoria ${category}`);
        if (filteredProperties.length === 0) return [];
        const bairrosMap = new Map();
        filteredProperties.forEach(property => {
            if (property.location && property.location.trim() !== '') {
                const bairro = extractBairroFromLocation(property.location);
                if (bairro && bairro !== 'Localização não especificada' && bairro !== '') {
                    bairrosMap.set(bairro, (bairrosMap.get(bairro) || 0) + 1);
                }
            }
        });
        let bairrosComContagem = Array.from(bairrosMap.entries()).map(([nome, count]) => ({
            nome: nome,
            count: count
        }));
        bairrosComContagem.sort((a, b) => {
            const indexA = bairrosPrioridade.indexOf(a.nome);
            const indexB = bairrosPrioridade.indexOf(b.nome);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.nome.localeCompare(b.nome, 'pt-BR');
        });
        const bairros = bairrosComContagem.map(item => item.nome);
        console.log(`📍 Categoria "${category}" - ${bairros.length} bairros únicos encontrados`);
        return bairros;
    }

    function closeDropdownImmediately() {
        if (currentActiveDropdown && currentActiveDropdown.parentNode) {
            currentActiveDropdown.remove();
        }
        const allButtons = document.querySelectorAll('.filter-btn');
        allButtons.forEach(btn => {
            if (btn._closeHandler) {
                btn.removeEventListener('mouseenter', btn._closeHandler);
                delete btn._closeHandler;
            }
        });
        currentActiveDropdown = null;
        state.dropdownActive = false;
        if (dropdownCloseTimeout) {
            clearTimeout(dropdownCloseTimeout);
            dropdownCloseTimeout = null;
        }
    }

    function showTemporaryMessage(button, message) {
        const tempMsg = document.createElement('div');
        tempMsg.style.cssText = `
            position: absolute;
            background: #f0f0f0;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 0.75rem;
            color: #666;
            z-index: 10000;
            white-space: nowrap;
        `;
        const rect = button.getBoundingClientRect();
        tempMsg.style.top = `${rect.bottom + window.scrollY + 5}px`;
        tempMsg.style.left = `${rect.left + window.scrollX}px`;
        tempMsg.innerHTML = message;
        document.body.appendChild(tempMsg);
        setTimeout(() => tempMsg.remove(), 2000);
    }

    function createBairroDropdown(buttonElement, category, bairros) {
        if (!bairros || bairros.length === 0) return null;
        if (currentActiveDropdown) closeDropdownImmediately();
        
        const config = CATEGORY_CONFIG[category];
        const icon = config ? config.icon : 'fa-home';
        const title = config ? config.title : category;
        
        const dropdown = document.createElement('div');
        dropdown.className = 'filter-dropdown';
        
        const header = document.createElement('div');
        header.className = 'filter-dropdown-header';
        header.innerHTML = `
            <span><i class="fas ${icon}"></i> Filtrar ${title} por bairro</span>
            <span class="filter-dropdown-close">×</span>
        `;
        dropdown.appendChild(header);
        
        const isAllActive = state.currentBairro === null;
        const allOption = document.createElement('div');
        allOption.className = 'filter-dropdown-all' + (isAllActive ? ' active' : '');
        allOption.innerHTML = `<i class="fas fa-globe"></i> Todos os bairros (${bairros.length})`;
        allOption.onclick = (e) => {
            e.stopPropagation();
            state.currentBairro = null;
            applyFilterWithBairro(category, null);
            closeDropdownImmediately();
        };
        dropdown.appendChild(allOption);
        
        bairros.forEach(bairro => {
            const isActive = state.currentBairro === bairro && state.currentFilter === category;
            const option = document.createElement('div');
            option.className = 'filter-dropdown-item' + (isActive ? ' active' : '');
            option.innerHTML = `<i class="fas fa-location-dot"></i> ${escapeHtml(bairro)}`;
            option.onclick = (e) => {
                e.stopPropagation();
                state.currentBairro = bairro;
                applyFilterWithBairro(category, bairro);
                closeDropdownImmediately();
            };
            dropdown.appendChild(option);
        });
        
        const propertyCount = getPropertyCountByCategoryAndBairro(category, null);
        const footer = document.createElement('div');
        footer.className = 'filter-dropdown-footer';
        footer.innerHTML = `<i class="fas fa-chart-line"></i> ${propertyCount} imóvel(is) encontrado(s)`;
        dropdown.appendChild(footer);
        
        dropdown.addEventListener('mouseenter', () => {
            if (dropdownCloseTimeout) {
                clearTimeout(dropdownCloseTimeout);
                dropdownCloseTimeout = null;
            }
        });
        
        dropdown.addEventListener('mouseleave', () => {
            dropdownCloseTimeout = setTimeout(() => closeDropdownImmediately(), 300);
        });
        
        return dropdown;
    }

    function showDropdown(button, category) {
        if (state.dropdownActive && currentActiveDropdown) closeDropdownImmediately();
        if (dropdownCloseTimeout) clearTimeout(dropdownCloseTimeout);
        if (!hasDropdown(category)) return;
        
        const properties = window.properties || [];
        const bairros = extractBairrosByCategory(properties, category);
        
        if (bairros.length === 0) {
            showTemporaryMessage(button, `⚠️ Nenhum bairro encontrado para ${category}`);
            return;
        }
        
        if (currentActiveDropdown && currentActiveDropdown !== button) closeDropdownImmediately();
        
        const dropdown = createBairroDropdown(button, category, bairros);
        if (!dropdown) return;
        
        currentActiveDropdown = dropdown;
        
        const rect = button.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + window.scrollY}px`;
        dropdown.style.left = `${rect.left + window.scrollX}px`;
        
        const closeDropdownHandler = (e) => {
            if (!dropdown.contains(e.target) && e.target !== button) {
                closeDropdownImmediately();
                document.removeEventListener('click', closeDropdownHandler);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeDropdownImmediately();
                document.removeEventListener('click', closeDropdownHandler);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        
        const closeOtherDropdowns = () => {
            if (currentActiveDropdown && currentActiveDropdown !== dropdown) closeDropdownImmediately();
        };
        
        document.body.appendChild(dropdown);
        state.dropdownActive = true;
        
        const closeBtn = dropdown.querySelector('.filter-dropdown-close');
        if (closeBtn) closeBtn.onclick = () => closeDropdownImmediately();
        
        setTimeout(() => {
            document.addEventListener('click', closeDropdownHandler);
            document.addEventListener('keydown', escapeHandler);
            const allButtons = document.querySelectorAll('.filter-btn');
            allButtons.forEach(otherBtn => {
                if (otherBtn !== button) {
                    otherBtn.addEventListener('mouseenter', closeOtherDropdowns);
                    otherBtn._closeHandler = closeOtherDropdowns;
                }
            });
        }, 100);
    }

    function getPropertyCountByCategoryAndBairro(category, bairro) {
        const properties = window.properties || [];
        const config = CATEGORY_CONFIG[category];
        if (!config) return 0;
        let filtered = [];
        if (config.filterBy === 'type') {
            filtered = properties.filter(p => p.type && config.expectedValues.includes(p.type));
        } else {
            filtered = properties.filter(p => {
                const hasCorrectBadge = p.badge && config.expectedValues.includes(p.badge);
                if (config.requiredType) return hasCorrectBadge && p.type === config.requiredType;
                return hasCorrectBadge;
            });
        }
        if (bairro) {
            filtered = filtered.filter(p => {
                const propertyBairro = extractBairroFromLocation(p.location);
                return propertyBairro === bairro;
            });
        }
        return filtered.length;
    }

    function applyFilterWithBairro(category, bairro) {
        state.currentFilter = category;
        const filterValue = bairro ? `${category}|${bairro}` : category;
        state.callbacks.forEach(callback => {
            if (typeof callback === 'function') {
                callback(filterValue, { category: category, bairro: bairro });
            }
        });
        updateActiveButtonStyle(category);
        console.log(`🎯 Filtro aplicado: Categoria="${category}", Bairro="${bairro || 'Todos'}"`);
    }

    function hasDropdown(category) {
        return CATEGORY_CONFIG[category] !== undefined;
    }

    function updateActiveButtonStyle(filterValue) {
        state.containers.forEach((containerState) => {
            containerState.buttons.forEach(button => {
                const isActive = (button.value === filterValue);
                if (isActive) {
                    button.element.classList.add(CONFIG.activeClass);
                    button.element.style.backgroundColor = '';
                    button.element.style.color = '';
                    button.element.style.borderColor = '';
                    button.element.style.fontWeight = '';
                    button.element.style.boxShadow = '';
                } else {
                    button.element.classList.remove(CONFIG.activeClass);
                    button.element.style.backgroundColor = '';
                    button.element.style.color = '';
                    button.element.style.borderColor = '';
                    button.element.style.fontWeight = '';
                    button.element.style.boxShadow = '';
                }
            });
        });
    }

    return {
        init(onFilterChange = null) {
            if (state.initialized) {
                console.log('⏭️ FilterManager já inicializado');
                return;
            }
            console.log('🔧 Inicializando FilterManager...');
            const containers = document.querySelectorAll(`.${CONFIG.containerClass}`);
            if (containers.length === 0) {
                console.warn('⚠️ Nenhum container de filtros encontrado');
                return;
            }
            containers.forEach((container, index) => {
                const containerId = `filter-container-${index}`;
                state.containers.set(containerId, {
                    element: container,
                    buttons: []
                });
                this.setupContainer(container, containerId, onFilterChange);
            });
            if (onFilterChange && typeof onFilterChange === 'function') {
                state.callbacks.set('global', onFilterChange);
            }
            this.activateDefaultFilter();
            state.initialized = true;
            console.log(`✅ FilterManager inicializado: ${state.containers.size} container(s)`);
        },

        setupContainer(container, containerId, onFilterChange) {
            const buttons = container.querySelectorAll(`.${CONFIG.buttonClass}`);
            const containerState = state.containers.get(containerId);
            buttons.forEach((button) => {
                const newBtn = button.cloneNode(true);
                button.parentNode.replaceChild(newBtn, button);
                const filterText = newBtn.textContent.trim();
                const filterValue = filterText === 'Todos' ? 'todos' : filterText;
                newBtn.style.backgroundColor = '';
                newBtn.style.color = '';
                newBtn.style.borderColor = '';
                newBtn.style.fontWeight = '';
                newBtn.style.boxShadow = '';
                newBtn.style.position = 'relative';
                newBtn.style.cursor = 'pointer';
                if (filterValue !== 'todos' && CATEGORY_CONFIG[filterValue]) {
                    newBtn.classList.add('has-dropdown');
                    let hoverTimer;
                    newBtn.addEventListener('mouseenter', () => {
                        if (state.dropdownActive && currentActiveDropdown) closeDropdownImmediately();
                        if (dropdownCloseTimeout) clearTimeout(dropdownCloseTimeout);
                        hoverTimer = setTimeout(() => showDropdown(newBtn, filterValue), CONFIG.dropdownDelay);
                    });
                    newBtn.addEventListener('mouseleave', (event) => {
                        clearTimeout(hoverTimer);
                        dropdownCloseTimeout = setTimeout(() => {
                            if (currentActiveDropdown) {
                                const rect = currentActiveDropdown.getBoundingClientRect();
                                const mouseX = event?.clientX || 0;
                                const mouseY = event?.clientY || 0;
                                const isInsideDropdown = mouseX >= rect.left && mouseX <= rect.right && 
                                                        mouseY >= rect.top && mouseY <= rect.bottom;
                                if (!isInsideDropdown) closeDropdownImmediately();
                            }
                        }, 200);
                    });
                }
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (currentActiveDropdown) closeDropdownImmediately();
                    const allBtns = document.querySelectorAll(`.${CONFIG.buttonClass}`);
                    allBtns.forEach(btn => {
                        btn.classList.remove(CONFIG.activeClass);
                        btn.style.backgroundColor = '';
                        btn.style.color = '';
                        btn.style.borderColor = '';
                        btn.style.fontWeight = '';
                        btn.style.boxShadow = '';
                    });
                    newBtn.classList.add(CONFIG.activeClass);
                    if (filterValue === 'todos') {
                        state.currentBairro = null;
                        state.currentFilter = 'todos';
                    } else {
                        state.currentFilter = filterValue;
                    }
                    if (onFilterChange) onFilterChange(filterValue);
                    state.callbacks.forEach(callback => {
                        if (typeof callback === 'function') callback(filterValue);
                    });
                });
                containerState.buttons.push({
                    element: newBtn,
                    originalText: filterText,
                    value: filterValue
                });
            });
            state.containers.set(containerId, containerState);
        },

        setActiveFilter(filterValue, sourceContainerId = null) {
            state.currentFilter = filterValue;
            state.containers.forEach((containerState) => {
                containerState.buttons.forEach(button => {
                    button.element.classList.remove(CONFIG.activeClass);
                    button.element.style.backgroundColor = '';
                    button.element.style.color = '';
                    button.element.style.borderColor = '';
                    button.element.style.fontWeight = '';
                    button.element.style.boxShadow = '';
                });
            });
            state.containers.forEach((containerState) => {
                containerState.buttons.forEach(button => {
                    if (button.value === filterValue) {
                        button.element.classList.add(CONFIG.activeClass);
                        button.element.style.backgroundColor = '';
                        button.element.style.color = '';
                        button.element.style.borderColor = '';
                        button.element.style.fontWeight = '';
                        button.element.style.boxShadow = '';
                    }
                });
            });
        },

        activateDefaultFilter() {
            this.setActiveFilter(CONFIG.defaultFilter);
        },

        getCurrentFilter() {
            return state.currentFilter;
        },
        
        getCurrentBairro() {
            return state.currentBairro;
        },

        onFilterChange(callback, id = 'custom') {
            if (typeof callback === 'function') {
                state.callbacks.set(id, callback);
                return true;
            }
            return false;
        },

        setupWithFallback() {
            if (state.initialized) return true;
            if (this.init) {
                this.init((filterValue, details) => {
                    window.currentFilter = filterValue;
                    if (details && details.bairro) {
                        if (typeof window.filterPropertiesByCategoryAndBairro === 'function') {
                            window.filterPropertiesByCategoryAndBairro(details.category, details.bairro);
                        }
                    } else if (typeof window.renderProperties === 'function') {
                        window.renderProperties(filterValue);
                    }
                });
                return true;
            }
            return false;
        },

        destroy() {
            state.containers.forEach(containerState => {
                containerState.buttons.forEach(button => {
                    const newBtn = button.element.cloneNode(true);
                    button.element.parentNode.replaceChild(newBtn, button.element);
                });
            });
            state.containers.clear();
            state.callbacks.clear();
            state.initialized = false;
        },
        
        isInitialized() {
            return state.initialized;
        },
        
        refreshBairros() {
            if (currentActiveDropdown) closeDropdownImmediately();
        }
    };
})();

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
}

window.FilterManager = FilterManager;

if (!window._filterManagerInitScheduled) {
    window._filterManagerInitScheduled = true;
    setTimeout(() => {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            if (document.querySelector('.filter-options') && !FilterManager.isInitialized()) {
                FilterManager.setupWithFallback();
            }
        }
    }, 500);
}

console.log('✅ FilterManager carregado - CSS externalizado para main.css');
