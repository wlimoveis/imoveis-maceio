// js/modules/utils/FilterManager.js - Sistema unificado de filtros COM DROPDOWN DE BAIRROS
console.log('🎛️ FilterManager.js carregado - Sistema com dropdown de bairros');

const FilterManager = (function() {
    // Configuração centralizada
    const CONFIG = {
        containerClass: 'filter-options',
        buttonClass: 'filter-btn',
        activeClass: 'active',
        defaultFilter: 'todos',
        animationDuration: 200,
        dropdownDelay: 300, // Delay para hover (ms)
        useClickForDropdown: false, // false = hover, true = click
        maxBairrosPerCategory: 20 // Limite máximo de bairros por dropdown
    };

    // Estado global dos filtros
    const state = {
        currentFilter: CONFIG.defaultFilter,
        currentBairro: null,
        containers: new Map(),
        callbacks: new Map(),
        initialized: false,
        dropdownActive: false,
        hoverTimeout: null
    };

    // ========== FUNÇÃO PARA EXTRAIR BAIRROS DOS IMÓVEIS ==========
    function extractBairrosFromProperties(properties, categoryFilter = null) {
        if (!properties || !Array.isArray(properties)) return [];
        
        let filteredProperties = properties;
        
        // Filtrar por categoria se especificada
        if (categoryFilter && categoryFilter !== 'todos') {
            const filterMap = {
                'Residencial': p => p.type === 'residencial',
                'Comercial': p => p.type === 'comercial',
                'Rural': p => p.type === 'rural' || p.rural === true,
                'Minha Casa Minha Vida': p => p.badge === 'MCMV'
            };
            const filterFn = filterMap[categoryFilter];
            if (filterFn) {
                filteredProperties = properties.filter(filterFn);
            }
        }
        
        // Extrair bairros do campo location
        const bairrosSet = new Set();
        
        filteredProperties.forEach(property => {
            if (property.location) {
                // Padrões comuns de extração de bairro
                let location = property.location;
                
                // Tentar extrair bairro (texto antes de vírgula ou padrões conhecidos)
                let bairro = '';
                
                // Padrão: "Rua X, Bairro - Cidade/UF"
                const matchComma = location.match(/,\s*([^,-]+)/);
                if (matchComma) {
                    bairro = matchComma[1].trim();
                }
                
                // Padrão: "Bairro, Cidade/UF"
                if (!bairro && location.includes(',')) {
                    bairro = location.split(',')[0].trim();
                }
                
                // Padrão: "Bairro - Cidade/UF"
                if (!bairro && location.includes('-')) {
                    bairro = location.split('-')[0].trim();
                }
                
                // Fallback: pegar o primeiro segmento
                if (!bairro && location.length > 0) {
                    bairro = location.split(/[,-]/)[0].trim();
                }
                
                // Limpar e adicionar
                if (bairro && bairro.length > 0 && bairro.length < 50) {
                    // Remover "Maceió/AL" e similares
                    bairro = bairro.replace(/Maceió\/AL/i, '').trim();
                    if (bairro) {
                        bairrosSet.add(bairro);
                    }
                }
            }
        });
        
        // Converter para array e ordenar
        let bairros = Array.from(bairrosSet);
        bairros.sort((a, b) => a.localeCompare(b, 'pt-BR'));
        
        // Limitar quantidade
        if (bairros.length > CONFIG.maxBairrosPerCategory) {
            bairros = bairros.slice(0, CONFIG.maxBairrosPerCategory);
        }
        
        return bairros;
    }

    // ========== FUNÇÃO PARA CRIAR DROPDOWN ==========
    function createBairroDropdown(buttonElement, categoryFilter, bairros) {
        if (!bairros || bairros.length === 0) return null;
        
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
            min-width: 200px;
            max-height: 300px;
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
            <span><i class="fas fa-map-marker-alt"></i> Filtrar por bairro</span>
            <span style="cursor:pointer; font-size:1.1rem;" class="dropdown-close">×</span>
        `;
        dropdown.appendChild(header);
        
        // Opção "Todos os bairros"
        const allOption = document.createElement('div');
        allOption.style.cssText = `
            padding: 8px 12px;
            cursor: pointer;
            transition: background 0.2s ease;
            border-bottom: 1px solid #eee;
            font-weight: ${state.currentBairro === null ? 'bold' : 'normal'};
            background: ${state.currentBairro === null ? '#e8f4fd' : 'white'};
            color: ${state.currentBairro === null ? 'var(--primary)' : '#333'};
        `;
        allOption.innerHTML = `<i class="fas fa-globe"></i> Todos os bairros`;
        allOption.onmouseenter = () => { allOption.style.background = '#f0f7ff'; };
        allOption.onmouseleave = () => { allOption.style.background = state.currentBairro === null ? '#e8f4fd' : 'white'; };
        allOption.onclick = (e) => {
            e.stopPropagation();
            state.currentBairro = null;
            applyFilterWithBairro(categoryFilter, null);
            dropdown.remove();
            state.dropdownActive = false;
        };
        dropdown.appendChild(allOption);
        
        // Lista de bairros
        bairros.forEach(bairro => {
            const option = document.createElement('div');
            const isActive = state.currentBairro === bairro && state.currentFilter === categoryFilter;
            option.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                transition: background 0.2s ease;
                border-bottom: 1px solid #eee;
                font-weight: ${isActive ? 'bold' : 'normal'};
                background: ${isActive ? '#e8f4fd' : 'white'};
                color: ${isActive ? 'var(--primary)' : '#333'};
            `;
            option.innerHTML = `<i class="fas fa-location-dot"></i> ${escapeHtml(bairro)}`;
            option.onmouseenter = () => { option.style.background = '#f0f7ff'; };
            option.onmouseleave = () => { 
                option.style.background = isActive ? '#e8f4fd' : 'white'; 
            };
            option.onclick = (e) => {
                e.stopPropagation();
                state.currentBairro = bairro;
                applyFilterWithBairro(categoryFilter, bairro);
                dropdown.remove();
                state.dropdownActive = false;
            };
            dropdown.appendChild(option);
        });
        
        // Adicionar estatística
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
        footer.innerHTML = `<i class="fas fa-chart-line"></i> ${bairros.length} bairros disponíveis`;
        dropdown.appendChild(footer);
        
        return dropdown;
    }

    // ========== APLICAR FILTRO COM BAIRRO ==========
    function applyFilterWithBairro(categoryFilter, bairro) {
        state.currentFilter = categoryFilter;
        
        // Disparar callback com filtro composto
        const filterValue = bairro ? `${categoryFilter}|${bairro}` : categoryFilter;
        
        state.callbacks.forEach(callback => {
            if (typeof callback === 'function') {
                callback(filterValue, { category: categoryFilter, bairro: bairro });
            }
        });
        
        // Atualizar UI dos botões
        updateActiveButtonStyle(categoryFilter);
        
        console.log(`🎯 Filtro aplicado: Categoria="${categoryFilter}", Bairro="${bairro || 'Todos'}"`);
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

    // ========== FUNÇÃO PARA MOSTRAR DROPDOWN ==========
    function showDropdown(button, categoryFilter) {
        if (state.dropdownActive) return;
        
        // Extrair bairros da categoria atual
        const properties = window.properties || [];
        const bairros = extractBairrosFromProperties(properties, categoryFilter);
        
        if (bairros.length === 0) {
            console.log(`ℹ️ Nenhum bairro encontrado para categoria: ${categoryFilter}`);
            return;
        }
        
        const dropdown = createBairroDropdown(button, categoryFilter, bairros);
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
        
        // Fechar ao clicar no X
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
                console.log('⏭️ FilterManager já está inicializado, ignorando...');
                return;
            }
            
            console.log('🔧 Inicializando FilterManager com suporte a dropdown de bairros...');
            
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

            buttons.forEach((button, btnIndex) => {
                const newBtn = button.cloneNode(true);
                button.parentNode.replaceChild(newBtn, button);

                const filterText = newBtn.textContent.trim();
                const filterValue = filterText === 'Todos' ? 'todos' : filterText;
                
                // Configurar hover/click para mostrar dropdown
                newBtn.style.position = 'relative';
                newBtn.style.cursor = 'pointer';
                
                // Mostrar dropdown ao passar o mouse (ou clique)
                if (CONFIG.useClickForDropdown) {
                    newBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (filterValue !== 'todos') {
                            showDropdown(newBtn, filterValue);
                        }
                    });
                } else {
                    let hoverTimer;
                    newBtn.addEventListener('mouseenter', () => {
                        if (state.dropdownActive) return;
                        hoverTimer = setTimeout(() => {
                            if (filterValue !== 'todos') {
                                showDropdown(newBtn, filterValue);
                            }
                        }, CONFIG.dropdownDelay);
                    });
                    newBtn.addEventListener('mouseleave', () => {
                        clearTimeout(hoverTimer);
                    });
                }
                
                // Clique normal para filtro (sem dropdown) - apenas para 'Todos'
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Se for 'Todos', limpar filtro de bairro
                    if (filterValue === 'todos') {
                        state.currentBairro = null;
                        state.currentFilter = 'todos';
                        applyFilterWithBairro('todos', null);
                    }
                    
                    // Disparar callback padrão
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
            console.log(`🎯 Filtro alterado para: ${filterValue}`);
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
            if (state.initialized) {
                console.log('⏭️ setupWithFallback ignorado - FilterManager já inicializado');
                return true;
            }
            
            console.log('🎛️ Configurando filtros com fallback e dropdown...');
            
            if (this.init) {
                this.init((filterValue, details) => {
                    window.currentFilter = filterValue;
                    if (details && details.bairro) {
                        // Filtrar propriedades por categoria + bairro
                        if (typeof window.filterPropertiesByCategoryAndBairro === 'function') {
                            window.filterPropertiesByCategoryAndBairro(details.category, details.bairro);
                        } else if (typeof window.renderProperties === 'function') {
                            window.renderProperties(filterValue);
                        }
                    } else if (typeof window.renderProperties === 'function') {
                        window.renderProperties(filterValue);
                    }
                });
                console.log('✅ Filtros configurados via FilterManager com dropdown');
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
            console.log('🧹 FilterManager destruído');
        },
        
        isInitialized() {
            return state.initialized;
        },
        
        // Método para atualizar bairros dinamicamente (após adicionar/editar imóvel)
        refreshBairros() {
            console.log('🔄 Refresh de bairros solicitado');
            // Limpar dropdown ativo se existir
            const activeDropdown = document.querySelector('.filter-dropdown-active');
            if (activeDropdown) {
                activeDropdown.remove();
                state.dropdownActive = false;
            }
        }
    };
})();

// Função auxiliar escapeHtml
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
}

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

console.log('✅ FilterManager carregado - Modo dropdown de bairros ativo');
