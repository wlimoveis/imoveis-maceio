// js/modules/utils/FilterManager.js - Dropdown de BAIRROS por tipo de Destaque
console.log('🎛️ FilterManager.js carregado - Dropdown de bairros por Destaque');

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

    // ========== MAPEAMENTO: BOTÃO → (BADGES + TIPO) ==========
    const DESTAQUE_TO_BADGES_AND_TYPE = {
        'Rural': {
            badges: ['Fazenda', 'Chácara'],
            tipos: ['rural']
        },
        'Residencial': {
            badges: ['Novo', 'Destaque', 'Luxo'],
            tipos: ['residencial']
        },
        'Comercial': {
            badges: ['Comercial'],
            tipos: ['comercial']
        },
        'Minha Casa Minha Vida': {
            badges: ['MCMV'],
            tipos: ['residencial']  // MCMV é um tipo de residencial
        }
    };

    // ========== FUNÇÃO ROBUSTA PARA EXTRAIR BAIRRO DA LOCALIZAÇÃO ==========
    function extractBairroFromLocation(location) {
        if (!location || typeof location !== 'string') return null;
        
        let bairro = '';
        const locationClean = location.trim();
        
        // Lista de bairros conhecidos de Maceió para matching
        const bairrosConhecidos = [
            'Pajuçara', 'Ponta Verde', 'Jatiúca', 'Jacarecica', 'Cruz das Almas',
            'Mangabeiras', 'Poço', 'Barro Duro', 'Gruta de Lourdes', 'Serraria',
            'Farol', 'Jardim Petrópolis', 'Centro', 'Prado', 'Jaraguá', 'Feitosa',
            'Pinheiro', 'Santa Lúcia', 'Santa Amélia', 'Tabuleiro do Martins',
            'Cidade Universitária', 'Clima Bom', 'Benedito Bentes', 'Santos Dumont',
            'São Jorge', 'Levada', 'Trapiche da Barra', 'Vergel do Lago',
            'Ouro Preto', 'Mutange', 'Fernão Velho', 'Forene', 'Rio Novo', 
            'Riacho Doce', 'Pontal da Barra', 'Guaxuma', 'Ipioca', 'Garça Torta',
            'Pescaria', 'Ponta da Terra', 'Murilopes', 'Zona Rural'
        ];
        
        // Tentativa 1: Procurar por bairro conhecido na string
        for (const b of bairrosConhecidos) {
            if (locationClean.includes(b)) {
                bairro = b;
                break;
            }
        }
        
        // Tentativa 2: Extrair texto após vírgula (padrão "Rua X, Bairro - Cidade")
        if (!bairro && locationClean.includes(',')) {
            const parts = locationClean.split(',');
            if (parts.length >= 2) {
                let possibleBairro = parts[1].trim();
                // Remover sufixos comuns
                possibleBairro = possibleBairro.replace(/-.*$/, '').replace(/AL$/i, '').trim();
                if (possibleBairro.length > 0 && possibleBairro.length < 40) {
                    bairro = possibleBairro;
                }
            }
        }
        
        // Tentativa 3: Extrair texto antes de vírgula (padrão "Bairro, Cidade")
        if (!bairro && locationClean.includes(',')) {
            let possibleBairro = locationClean.split(',')[0].trim();
            possibleBairro = possibleBairro.replace(/Rua |Av\. |Avenida /i, '').trim();
            if (possibleBairro.length > 0 && possibleBairro.length < 40 && !possibleBairro.includes(' ')) {
                bairro = possibleBairro;
            }
        }
        
        // Tentativa 4: Extrair último segmento antes de hífen
        if (!bairro && locationClean.includes('-')) {
            let possibleBairro = locationClean.split('-')[0].trim();
            if (possibleBairro.length > 0 && possibleBairro.length < 40) {
                bairro = possibleBairro;
            }
        }
        
        // Tentativa 5: Se for "Zona Rural" ou similar
        if (!bairro && (locationClean.toLowerCase().includes('rural') || 
                        locationClean.toLowerCase().includes('zona rural'))) {
            bairro = 'Zona Rural';
        }
        
        // Fallback: limpar e usar a primeira palavra significativa
        if (!bairro && locationClean.length > 0) {
            let words = locationClean.split(/[ ,-]/);
            for (let word of words) {
                word = word.trim();
                if (word.length > 3 && !word.match(/^(Rua|Av|Avenida|Travessa|Alameda|Praça)$/i)) {
                    bairro = word;
                    break;
                }
            }
        }
        
        // Limpeza final
        if (bairro) {
            bairro = bairro.replace(/Maceió\/AL/i, '').replace(/AL$/i, '').trim();
            // Capitalizar primeira letra
            bairro = bairro.charAt(0).toUpperCase() + bairro.slice(1).toLowerCase();
        }
        
        return bairro || 'Localização não especificada';
    }

    // ========== EXTRAIR BAIRROS POR CATEGORIA (FILTRANDO POR BADGE + TIPO) ==========
    function extractBairrosByDestaqueCategory(properties, category) {
        if (!properties || !Array.isArray(properties)) return [];
        
        const config = DESTAQUE_TO_BADGES_AND_TYPE[category];
        if (!config) return [];
        
        const { badges, tipos } = config;
        
        console.log(`🔍 Buscando imóveis com badges: ${badges.join(', ')} E tipo: ${tipos.join(', ')}`);
        
        // Filtrar imóveis que têm o badge correspondente E o tipo correspondente
        const filteredProperties = properties.filter(property => {
            const hasCorrectBadge = property.badge && badges.includes(property.badge);
            const hasCorrectType = property.type && tipos.includes(property.type);
            return hasCorrectBadge && hasCorrectType;
        });
        
        console.log(`📊 Encontrados ${filteredProperties.length} imóveis para categoria ${category}`);
        
        // Se não houver imóveis, mostrar aviso com dica de cadastro
        if (filteredProperties.length === 0) {
            console.warn(`⚠️ Nenhum imóvel encontrado para categoria ${category}.`);
            console.warn(`   Condições: badge IN (${badges.join(', ')}) AND type IN (${tipos.join(', ')})`);
            console.warn(`   💡 Dica: Cadastre um imóvel com badge="${badges[0]}" e type="${tipos[0]}"`);
            return [];
        }
        
        // Extrair bairros únicos
        const bairrosSet = new Set();
        
        filteredProperties.forEach(property => {
            if (property.location) {
                const bairro = extractBairroFromLocation(property.location);
                if (bairro && bairro !== 'Localização não especificada') {
                    bairrosSet.add(bairro);
                    console.log(`  📍 Imóvel "${property.title}" (badge: ${property.badge}, type: ${property.type}) → Bairro: ${bairro}`);
                }
            }
        });
        
        // Converter para array e ordenar
        let bairros = Array.from(bairrosSet);
        bairros.sort((a, b) => a.localeCompare(b, 'pt-BR'));
        
        console.log(`📍 Categoria "${category}" - ${bairros.length} bairros únicos encontrados:`, bairros);
        
        return bairros;
    }

    // ========== CRIAR DROPDOWN DE BAIRROS ==========
    function createBairroDropdown(buttonElement, category, bairros) {
        if (!bairros || bairros.length === 0) return null;
        
        // Remover dropdown existente
        const existingDropdown = document.querySelector('.filter-dropdown-active');
        if (existingDropdown) existingDropdown.remove();
        
        // Definir ícone e título
        let icon = 'fa-home';
        let title = category;
        
        switch(category) {
            case 'Rural':
                icon = 'fa-tractor';
                title = '🏡 Zona Rural';
                break;
            case 'Residencial':
                icon = 'fa-building';
                title = '🏘️ Residencial';
                break;
            case 'Comercial':
                icon = 'fa-store';
                title = '🏢 Comercial';
                break;
            case 'Minha Casa Minha Vida':
                icon = 'fa-hand-holding-heart';
                title = '❤️ Minha Casa Minha Vida';
                break;
        }
        
        // Criar dropdown
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
            max-height: 350px;
            overflow-y: auto;
            overflow-x: hidden;
            top: 100%;
            left: 0;
            margin-top: 5px;
        `;
        
        // Cabeçalho
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
            position: sticky;
            top: 0;
            z-index: 1;
        `;
        header.innerHTML = `
            <span><i class="fas ${icon}"></i> Filtrar ${title} por bairro</span>
            <span style="cursor:pointer; font-size:1.2rem;" class="dropdown-close">×</span>
        `;
        dropdown.appendChild(header);
        
        // Opção "Todos os bairros"
        const allOption = document.createElement('div');
        allOption.style.cssText = `
            padding: 10px 12px;
            cursor: pointer;
            transition: background 0.2s ease;
            border-bottom: 1px solid #eee;
            font-weight: ${state.currentBairro === null ? 'bold' : 'normal'};
            background: ${state.currentBairro === null ? '#e8f4fd' : 'white'};
            color: ${state.currentBairro === null ? 'var(--primary)' : '#333'};
        `;
        allOption.innerHTML = `<i class="fas fa-globe"></i> Todos os bairros (${bairros.length})`;
        allOption.onmouseenter = () => { allOption.style.background = '#f0f7ff'; };
        allOption.onmouseleave = () => { 
            allOption.style.background = state.currentBairro === null ? '#e8f4fd' : 'white'; 
        };
        allOption.onclick = (e) => {
            e.stopPropagation();
            state.currentBairro = null;
            applyFilterWithBairro(category, null);
            dropdown.remove();
            state.dropdownActive = false;
        };
        dropdown.appendChild(allOption);
        
        // Lista de bairros
        bairros.forEach(bairro => {
            const isActive = state.currentBairro === bairro && state.currentFilter === category;
            const option = document.createElement('div');
            option.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                transition: background 0.2s ease;
                border-bottom: 1px solid #f0f0f0;
                font-weight: ${isActive ? 'bold' : 'normal'};
                background: ${isActive ? '#e8f4fd' : 'white'};
                color: ${isActive ? 'var(--primary)' : '#333'};
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            option.innerHTML = `<i class="fas fa-location-dot" style="color: var(--accent);"></i> ${escapeHtml(bairro)}`;
            option.onmouseenter = () => { option.style.background = '#f0f7ff'; };
            option.onmouseleave = () => { 
                option.style.background = isActive ? '#e8f4fd' : 'white'; 
            };
            option.onclick = (e) => {
                e.stopPropagation();
                state.currentBairro = bairro;
                applyFilterWithBairro(category, bairro);
                dropdown.remove();
                state.dropdownActive = false;
            };
            dropdown.appendChild(option);
        });
        
        // Footer com estatísticas
        const propertyCount = getPropertyCountByCategoryAndBairro(category, null);
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 8px 12px;
            background: #f8f9fa;
            font-size: 0.7rem;
            color: #666;
            text-align: center;
            border-top: 1px solid #eee;
            border-radius: 0 0 6px 6px;
            position: sticky;
            bottom: 0;
        `;
        footer.innerHTML = `<i class="fas fa-chart-line"></i> ${propertyCount} imóvel(is) encontrado(s)`;
        dropdown.appendChild(footer);
        
        return dropdown;
    }

    // ========== CONTAR IMÓVEIS POR CATEGORIA E BAIRRO ==========
    function getPropertyCountByCategoryAndBairro(category, bairro) {
        const properties = window.properties || [];
        const config = DESTAQUE_TO_BADGES_AND_TYPE[category];
        
        if (!config) return 0;
        
        const { badges, tipos } = config;
        
        let filtered = properties.filter(p => 
            p.badge && badges.includes(p.badge) && 
            p.type && tipos.includes(p.type)
        );
        
        if (bairro) {
            filtered = filtered.filter(p => {
                const propertyBairro = extractBairroFromLocation(p.location);
                return propertyBairro === bairro;
            });
        }
        
        return filtered.length;
    }

    // ========== APLICAR FILTRO COM BAIRRO ==========
    function applyFilterWithBairro(category, bairro) {
        state.currentFilter = category;
        
        // Disparar callback com filtro composto
        const filterValue = bairro ? `${category}|${bairro}` : category;
        
        state.callbacks.forEach(callback => {
            if (typeof callback === 'function') {
                callback(filterValue, { category: category, bairro: bairro });
            }
        });
        
        updateActiveButtonStyle(category);
        console.log(`🎯 Filtro aplicado: Categoria="${category}", Bairro="${bairro || 'Todos'}"`);
    }

    // ========== VERIFICAR SE CATEGORIA TEM DROPDOWN ==========
    function hasDropdown(category) {
        return DESTAQUE_TO_BADGES_AND_TYPE[category] !== undefined;
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
                } else {
                    button.element.style.backgroundColor = '';
                    button.element.style.color = '';
                    button.element.style.borderColor = '';
                    button.element.style.fontWeight = '';
                }
            });
        });
    }

    // ========== MOSTRAR DROPDOWN ==========
    function showDropdown(button, category) {
        if (state.dropdownActive) return;
        
        if (!hasDropdown(category)) {
            console.log(`ℹ️ Categoria "${category}" não tem dropdown configurado`);
            return;
        }
        
        const properties = window.properties || [];
        const bairros = extractBairrosByDestaqueCategory(properties, category);
        
        if (bairros.length === 0) {
            console.log(`ℹ️ Nenhum bairro encontrado para categoria: ${category}`);
            // Mostrar mensagem temporária
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
            tempMsg.innerHTML = '⚠️ Nenhum bairro cadastrado para esta categoria';
            document.body.appendChild(tempMsg);
            setTimeout(() => tempMsg.remove(), 2000);
            return;
        }
        
        const dropdown = createBairroDropdown(button, category, bairros);
        if (!dropdown) return;
        
        const rect = button.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + window.scrollY}px`;
        dropdown.style.left = `${rect.left + window.scrollX}px`;
        
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
            
            console.log('🔧 Inicializando FilterManager com dropdown de bairros por destaque...');
            
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
                if (filterValue !== 'todos' && hasDropdown(filterValue)) {
                    newBtn.classList.add('has-dropdown');
                    
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
                
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (filterValue === 'todos') {
                        state.currentBairro = null;
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
            const activeDropdown = document.querySelector('.filter-dropdown-active');
            if (activeDropdown) {
                activeDropdown.remove();
                state.dropdownActive = false;
            }
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

console.log('✅ FilterManager carregado - Dropdown de BAIRROS por Destaque com filtro por TIPO');
