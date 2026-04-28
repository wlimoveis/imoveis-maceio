// js/modules/utils/FilterManager.js - Sistema de filtros COM DROPDOWN POR CAMPO DESTAQUE
console.log('🎛️ FilterManager.js carregado - Dropdown por campo Destaque');

const FilterManager = (function() {
    // Configuração centralizada
    const CONFIG = {
        containerClass: 'filter-options',
        buttonClass: 'filter-btn',
        activeClass: 'active',
        defaultFilter: 'todos',
        animationDuration: 200,
        dropdownDelay: 300,
        useClickForDropdown: false
    };

    // Estado global
    const state = {
        currentFilter: CONFIG.defaultFilter,
        currentDestaque: null,
        containers: new Map(),
        callbacks: new Map(),
        initialized: false,
        dropdownActive: false,
        hoverTimeout: null
    };

    // ========== MAPEAMENTO: BOTÃO MENU → CAMPO DESTAQUE ==========
    const DESTAQUE_MAPPING = {
        'Rural': {
            displayName: 'Zona Rural, AL',
            destaqueValues: ['Fazenda', 'Chácara'],
            icon: 'fa-tractor'
        },
        'Residencial': {
            displayName: 'Residencial',
            destaqueValues: ['Novo', 'Destaque', 'Luxo'],
            icon: 'fa-home'
        },
        'Comercial': {
            displayName: 'Comercial',
            destaqueValues: ['Comercial', 'Empresarial'],
            icon: 'fa-building'
        },
        'Minha Casa Minha Vida': {
            displayName: 'Minha Casa Minha Vida',
            destaqueValues: ['MCMV'],
            icon: 'fa-hand-holding-heart'
        }
    };

    // ========== EXTRAIR OPÇÕES DE DESTAQUE DOS IMÓVEIS ==========
    function extractDestaqueOptions(properties, categoryFilter) {
        if (!properties || !Array.isArray(properties)) return [];
        
        const mapping = DESTAQUE_MAPPING[categoryFilter];
        if (!mapping) return [];
        
        // Filtrar imóveis da categoria
        let filteredProperties = properties;
        
        if (categoryFilter === 'Rural') {
            filteredProperties = properties.filter(p => p.type === 'rural' || p.rural === true);
        } else if (categoryFilter === 'Residencial') {
            filteredProperties = properties.filter(p => p.type === 'residencial');
        } else if (categoryFilter === 'Comercial') {
            filteredProperties = properties.filter(p => p.type === 'comercial');
        } else if (categoryFilter === 'Minha Casa Minha Vida') {
            filteredProperties = properties.filter(p => p.badge === 'MCMV');
        }
        
        // Extrair valores únicos do campo badge que correspondem ao mapeamento
        const optionsSet = new Set();
        
        filteredProperties.forEach(property => {
            if (property.badge && mapping.destaqueValues.includes(property.badge)) {
                optionsSet.add(property.badge);
            }
        });
        
        // Converter para array e ordenar
        let options = Array.from(optionsSet);
        
        // Garantir que opções padrão existam mesmo sem imóveis
        if (options.length === 0) {
            options = [...mapping.destaqueValues];
        }
        
        // Criar opções com nome amigável
        const friendlyOptions = options.map(opt => {
            let displayName = opt;
            if (opt === 'Fazenda') displayName = '🏡 Fazenda';
            else if (opt === 'Chácara') displayName = '🌳 Chácara';
            else if (opt === 'Novo') displayName = '🆕 Novo';
            else if (opt === 'Destaque') displayName = '⭐ Destaque';
            else if (opt === 'Luxo') displayName = '💎 Luxo';
            else if (opt === 'MCMV') displayName = '🏠 Minha Casa Minha Vida';
            else if (opt === 'Comercial') displayName = '🏢 Comercial';
            
            return {
                value: opt,
                display: displayName
            };
        });
        
        return friendlyOptions;
    }

    // ========== CRIAR DROPDOWN ==========
    function createDestaqueDropdown(buttonElement, categoryFilter, options) {
        if (!options || options.length === 0) return null;
        
        const mapping = DESTAQUE_MAPPING[categoryFilter];
        if (!mapping) return null;
        
        // Remover dropdown existente
        const existingDropdown = document.querySelector('.filter-dropdown-active');
        if (existingDropdown) {
            existingDropdown.remove();
        }
        
        // Criar container dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'filter-dropdown filter-dropdown-active';
        dropdown.style.cssText = `
            position: absolute;
            z-index: 10000;
            background: white;
            border: 2px solid var(--primary);
            border-radius: 8px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            min-width: 220px;
            max-height: 320px;
            overflow-y: auto;
            overflow-x: hidden;
            top: 100%;
            left: 0;
            margin-top: 5px;
        `;
        
        // Cabeçalho do dropdown
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 10px 12px;
            background: var(--primary);
            color: white;
            font-weight: 600;
            font-size: 0.85rem;
            border-radius: 6px 6px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        header.innerHTML = `
            <span><i class="fas ${mapping.icon}"></i> ${mapping.displayName}</span>
            <span style="cursor:pointer; font-size:1.1rem;" class="dropdown-close">×</span>
        `;
        dropdown.appendChild(header);
        
        // Opção "Todos"
        const allOption = document.createElement('div');
        allOption.style.cssText = `
            padding: 10px 12px;
            cursor: pointer;
            transition: background 0.2s ease;
            border-bottom: 1px solid #eee;
            font-weight: ${state.currentDestaque === null ? 'bold' : 'normal'};
            background: ${state.currentDestaque === null ? '#e8f4fd' : 'white'};
            color: ${state.currentDestaque === null ? 'var(--primary)' : '#333'};
        `;
        allOption.innerHTML = `<i class="fas fa-globe"></i> Todos os ${mapping.displayName.toLowerCase()}`;
        allOption.onmouseenter = () => { allOption.style.background = '#f0f7ff'; };
        allOption.onmouseleave = () => { allOption.style.background = state.currentDestaque === null ? '#e8f4fd' : 'white'; };
        allOption.onclick = (e) => {
            e.stopPropagation();
            state.currentDestaque = null;
            applyFilterWithDestaque(categoryFilter, null);
            dropdown.remove();
            state.dropdownActive = false;
        };
        dropdown.appendChild(allOption);
        
        // Lista de opções de destaque
        options.forEach(opt => {
            const isActive = state.currentDestaque === opt.value && state.currentFilter === categoryFilter;
            const optionDiv = document.createElement('div');
            optionDiv.style.cssText = `
                padding: 10px 12px;
                cursor: pointer;
                transition: background 0.2s ease;
                border-bottom: 1px solid #eee;
                font-weight: ${isActive ? 'bold' : 'normal'};
                background: ${isActive ? '#e8f4fd' : 'white'};
                color: ${isActive ? 'var(--primary)' : '#333'};
            `;
            optionDiv.innerHTML = opt.display;
            optionDiv.onmouseenter = () => { optionDiv.style.background = '#f0f7ff'; };
            optionDiv.onmouseleave = () => { 
                optionDiv.style.background = isActive ? '#e8f4fd' : 'white'; 
            };
            optionDiv.onclick = (e) => {
                e.stopPropagation();
                state.currentDestaque = opt.value;
                applyFilterWithDestaque(categoryFilter, opt.value);
                dropdown.remove();
                state.dropdownActive = false;
            };
            dropdown.appendChild(optionDiv);
        });
        
        // Adicionar contagem
        const propertyCount = getPropertyCountByCategoryAndDestaque(categoryFilter, null);
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 8px 12px;
            background: #f8f9fa;
            font-size: 0.7rem;
            color: #666;
            text-align: center;
            border-top: 1px solid #eee;
            border-radius: 0 0 6px 6px;
        `;
        footer.innerHTML = `<i class="fas fa-chart-line"></i> ${propertyCount} imóveis encontrados`;
        dropdown.appendChild(footer);
        
        return dropdown;
    }

    // ========== CONTAR IMÓVEIS POR CATEGORIA E DESTAQUE ==========
    function getPropertyCountByCategoryAndDestaque(category, destaqueValue) {
        const properties = window.properties || [];
        let filtered = [...properties];
        
        if (category === 'Rural') {
            filtered = filtered.filter(p => p.type === 'rural' || p.rural === true);
            if (destaqueValue) {
                filtered = filtered.filter(p => p.badge === destaqueValue);
            }
        } else if (category === 'Residencial') {
            filtered = filtered.filter(p => p.type === 'residencial');
            if (destaqueValue) {
                filtered = filtered.filter(p => p.badge === destaqueValue);
            }
        } else if (category === 'Comercial') {
            filtered = filtered.filter(p => p.type === 'comercial');
            if (destaqueValue) {
                filtered = filtered.filter(p => p.badge === destaqueValue);
            }
        } else if (category === 'Minha Casa Minha Vida') {
            filtered = filtered.filter(p => p.badge === 'MCMV');
            if (destaqueValue) {
                filtered = filtered.filter(p => p.badge === destaqueValue);
            }
        }
        
        return filtered.length;
    }

    // ========== APLICAR FILTRO COM DESTAQUE ==========
    function applyFilterWithDestaque(categoryFilter, destaqueValue) {
        state.currentFilter = categoryFilter;
        
        // Disparar callback com filtro composto
        const filterValue = destaqueValue ? `${categoryFilter}|${destaqueValue}` : categoryFilter;
        
        state.callbacks.forEach(callback => {
            if (typeof callback === 'function') {
                callback(filterValue, { category: categoryFilter, destaque: destaqueValue });
            }
        });
        
        // Atualizar UI dos botões
        updateActiveButtonStyle(categoryFilter);
        
        console.log(`🎯 Filtro aplicado: Categoria="${categoryFilter}", Destaque="${destaqueValue || 'Todos'}"`);
    }

    // ========== ATUALIZAR ESTILO DOS BOTÕES ==========
    function updateActiveButtonStyle(filterValue) {
        state.containers.forEach((containerState) => {
            containerState.buttons.forEach(button => {
                const isActive = button.value === filterValue;
                button.element.classList.toggle(CONFIG.activeClass, isActive);
                
                if (isActive) {
                    button.element.style.backgroundColor = 'var(--primary)';
                    button.element.style.color = 'white';
                    button.element.style.borderColor = 'var(--primary)';
                    button.element.style.fontWeight = '700';
                    button.element.style.boxShadow = '0 4px 12px rgba(26, 82, 118, 0.3)';
                } else {
                    button.element.style.backgroundColor = '';
                    button.element.style.color = '';
                    button.element.style.borderColor = '';
                    button.element.style.fontWeight = '';
                    button.element.style.boxShadow = '';
                }
            });
        });
    }

    // ========== MOSTRAR DROPDOWN ==========
    function showDropdown(button, categoryFilter) {
        if (state.dropdownActive) return;
        
        // Verificar se a categoria tem mapeamento
        if (!DESTAQUE_MAPPING[categoryFilter]) {
            console.log(`ℹ️ Categoria "${categoryFilter}" não tem dropdown configurado`);
            return;
        }
        
        const properties = window.properties || [];
        const options = extractDestaqueOptions(properties, categoryFilter);
        
        if (options.length === 0) {
            console.log(`ℹ️ Nenhuma opção de destaque encontrada para categoria: ${categoryFilter}`);
            return;
        }
        
        const dropdown = createDestaqueDropdown(button, categoryFilter, options);
        if (!dropdown) return;
        
        // Posicionar dropdown
        const rect = button.getBoundingClientRect();
        dropdown.style.position = 'absolute';
        dropdown.style.top = `${rect.bottom + window.scrollY}px`;
        dropdown.style.left = `${rect.left + window.scrollX}px`;
        
        // Fechar ao clicar fora
        const closeDropdown = (e) => {
            if (!dropdown.contains(e.target) && e.target !== button) {
                dropdown.remove();
                state.dropdownActive = false;
                document.removeEventListener('click', closeDropdown);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                dropdown.remove();
                state.dropdownActive = false;
                document.removeEventListener('click', closeDropdown);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        
        document.body.appendChild(dropdown);
        state.dropdownActive = true;
        
        const closeBtn = dropdown.querySelector('.dropdown-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                dropdown.remove();
                state.dropdownActive = false;
            };
        }
        
        setTimeout(() => {
            document.addEventListener('click', closeDropdown);
            document.addEventListener('keydown', escapeHandler);
        }, 100);
    }

    // ========== API PÚBLICA ==========
    return {
        init(onFilterChange = null) {
            if (state.initialized) {
                console.log('⏭️ FilterManager já inicializado');
                return;
            }
            
            console.log('🔧 Inicializando FilterManager com dropdown por campo Destaque...');
            
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
                
                newBtn.style.position = 'relative';
                newBtn.style.cursor = 'pointer';
                
                // Adicionar indicador de dropdown para botões com mapeamento
                if (filterValue !== 'todos' && DESTAQUE_MAPPING[filterValue]) {
                    newBtn.classList.add('has-dropdown');
                    
                    // Mostrar dropdown ao passar mouse
                    let hoverTimer;
                    newBtn.addEventListener('mouseenter', () => {
                        if (state.dropdownActive) return;
                        hoverTimer = setTimeout(() => {
                            showDropdown(newBtn, filterValue);
                        }, CONFIG.dropdownDelay);
                    });
                    newBtn.addEventListener('mouseleave', () => {
                        clearTimeout(hoverTimer);
                    });
                }
                
                // Clique normal para filtro
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (filterValue === 'todos') {
                        state.currentDestaque = null;
                        state.currentFilter = 'todos';
                    }
                    
                    if (onFilterChange) {
                        onFilterChange(filterValue);
                    }
                    
                    state.callbacks.forEach(callback => {
                        if (typeof callback === 'function') {
                            callback(filterValue);
                        }
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
            updateActiveButtonStyle(filterValue);
        },

        activateDefaultFilter() {
            this.setActiveFilter(CONFIG.defaultFilter);
        },

        getCurrentFilter() {
            return state.currentFilter;
        },
        
        getCurrentDestaque() {
            return state.currentDestaque;
        },

        onFilterChange(callback, id = 'custom') {
            if (typeof callback === 'function') {
                state.callbacks.set(id, callback);
                return true;
            }
            return false;
        },

        setupWithFallback() {
            if (state.initialized) {
                return true;
            }
            
            if (this.init) {
                this.init((filterValue, details) => {
                    window.currentFilter = filterValue;
                    if (details && details.destaque) {
                        if (typeof window.filterPropertiesByCategoryAndDestaque === 'function') {
                            window.filterPropertiesByCategoryAndDestaque(details.category, details.destaque);
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
        
        refreshDestaques() {
            const activeDropdown = document.querySelector('.filter-dropdown-active');
            if (activeDropdown) {
                activeDropdown.remove();
                state.dropdownActive = false;
            }
        }
    };
})();

window.FilterManager = FilterManager;

// Auto-inicialização
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

console.log('✅ FilterManager carregado - Dropdown por campo Destaque ativo');
