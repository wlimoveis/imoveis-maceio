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

    // ========== MAPEAMENTO CORRETO POR CATEGORIA ==========
    const CATEGORY_CONFIG = {
        'Comercial': {
            filterBy: 'type',           // Filtra pelo campo "type"
            expectedValues: ['comercial'],
            icon: 'fa-building',
            title: 'Comercial'
        },
        'Residencial': {
            filterBy: 'badge',          // Filtra pelo campo "badge" + type
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
            requiredType: null,         // Sem restrição de tipo
            icon: 'fa-hand-holding-heart',
            title: 'Minha Casa Minha Vida'
        }
    };

    // ========== FUNÇÃO ROBUSTA PARA EXTRAIR BAIRRO DA LOCALIZAÇÃO ==========
    function extractBairroFromLocation(location) {
        if (!location || typeof location !== 'string') return null;
        
        let bairro = '';
        const locationClean = location.trim();
        
        // Lista de bairros conhecidos de Maceió (para referência)
        const bairrosConhecidos = [
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
        
        // Tentativa 1: Procurar por bairro conhecido na string (match exato ou contido)
        for (const b of bairrosConhecidos) {
            // Criar regex para match exato (case insensitive)
            const regex = new RegExp(`\\b${b.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(locationClean)) {
                bairro = b;
                break;
            }
        }
        
        // Tentativa 2: Extrair texto após vírgula (padrão "Rua X, Bairro - Cidade")
        if (!bairro && locationClean.includes(',')) {
            const parts = locationClean.split(',');
            if (parts.length >= 2) {
                let possibleBairro = parts[1].trim();
                // Remover sufixos comuns como "Maceió/AL", "AL", etc.
                possibleBairro = possibleBairro.replace(/Maceió\/AL/i, '').replace(/AL$/i, '').replace(/-.*$/, '').trim();
                if (possibleBairro.length > 0 && possibleBairro.length < 50 && !possibleBairro.match(/^(Rua|Av|Avenida|Travessa)$/i)) {
                    bairro = possibleBairro;
                }
            }
        }
        
        // Tentativa 3: Se for "Zona Rural" ou similar
        if (!bairro && (locationClean.toLowerCase().includes('rural') || 
                        locationClean.toLowerCase().includes('zona rural'))) {
            bairro = 'Zona Rural';
        }
        
        // Limpeza final
        if (bairro) {
            // Remover palavras comuns
            bairro = bairro.replace(/Maceió\/AL/i, '').replace(/AL$/i, '').trim();
            // Remover números
            bairro = bairro.replace(/^\d+/, '').trim();
            // Capitalizar primeira letra de cada palavra
            bairro = bairro.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
        }
        
        // Validar se o bairro extraído é válido (não é muito longo ou contém caracteres estranhos)
        if (bairro && bairro.length > 0 && bairro.length < 50 && !bairro.match(/[<>{}]/)) {
            return bairro;
        }
        
        return null;
    }

    // ========== EXTRAIR BAIRROS POR CATEGORIA (APENAS COM IMÓVEIS VÁLIDOS) ==========
    function extractBairrosByCategory(properties, category) {
        if (!properties || !Array.isArray(properties)) return [];
        
        const config = CATEGORY_CONFIG[category];
        if (!config) return [];
        
        console.log(`🔍 Buscando imóveis para categoria: ${category}`);
        console.log(`   Critério: filterBy="${config.filterBy}", valores=${config.expectedValues.join(', ')}`);
        
        let filteredProperties = [];
        
        if (config.filterBy === 'type') {
            // Filtrar APENAS pelo campo "type" (para Comercial)
            filteredProperties = properties.filter(property => 
                property.type && config.expectedValues.includes(property.type)
            );
        } else {
            // Filtrar por badge e opcionalmente por tipo
            filteredProperties = properties.filter(property => {
                const hasCorrectBadge = property.badge && config.expectedValues.includes(property.badge);
                if (config.requiredType) {
                    return hasCorrectBadge && property.type === config.requiredType;
                }
                return hasCorrectBadge;
            });
        }
        
        console.log(`📊 Encontrados ${filteredProperties.length} imóveis para categoria ${category}`);
        
        if (filteredProperties.length === 0) {
            console.warn(`⚠️ Nenhum imóvel encontrado para categoria ${category}.`);
            return [];
        }
        
        // Extrair bairros APENAS dos imóveis que realmente existem
        const bairrosMap = new Map(); // Usar Map para evitar duplicatas e contar ocorrências
        
        filteredProperties.forEach(property => {
            if (property.location && property.location.trim() !== '') {
                const bairro = extractBairroFromLocation(property.location);
                if (bairro && bairro !== 'Localização não especificada' && bairro !== '') {
                    // Contar quantos imóveis têm este bairro
                    if (bairrosMap.has(bairro)) {
                        bairrosMap.set(bairro, bairrosMap.get(bairro) + 1);
                    } else {
                        bairrosMap.set(bairro, 1);
                    }
                    console.log(`  📍 "${property.title}" → Bairro: ${bairro} (${bairrosMap.get(bairro)}º imóvel)`);
                } else {
                    console.warn(`  ⚠️ Não foi possível extrair bairro de: "${property.location}"`);
                }
            }
        });
        
        // Converter para array de objetos com nome e contagem
        let bairrosComContagem = Array.from(bairrosMap.entries()).map(([nome, count]) => ({
            nome: nome,
            count: count
        }));
        
        // Ordenar por nome (alfabeticamente)
        bairrosComContagem.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        
        // Extrair apenas os nomes para o dropdown
        let bairros = bairrosComContagem.map(item => item.nome);
        
        console.log(`📍 Categoria "${category}" - ${bairros.length} bairros únicos encontrados:`);
        bairrosComContagem.forEach(item => {
            console.log(`   - ${item.nome}: ${item.count} imóvel(is)`);
        });
        
        return bairros;
    }

    // ========== CRIAR DROPDOWN DE BAIRROS ==========
    function createBairroDropdown(buttonElement, category, bairros) {
        if (!bairros || bairros.length === 0) return null;
        
        // Remover dropdown existente
        const existingDropdown = document.querySelector('.filter-dropdown-active');
        if (existingDropdown) existingDropdown.remove();
        
        // Obter configuração da categoria
        const config = CATEGORY_CONFIG[category];
        const icon = config ? config.icon : 'fa-home';
        const title = config ? config.title : category;
        
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
        const config = CATEGORY_CONFIG[category];
        
        if (!config) return 0;
        
        let filtered = [];
        
        if (config.filterBy === 'type') {
            filtered = properties.filter(p => 
                p.type && config.expectedValues.includes(p.type)
            );
        } else {
            filtered = properties.filter(p => {
                const hasCorrectBadge = p.badge && config.expectedValues.includes(p.badge);
                if (config.requiredType) {
                    return hasCorrectBadge && p.type === config.requiredType;
                }
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
        
        // Atualizar estilo dos botões (garantir que o botão da categoria fique ativo)
        updateActiveButtonStyle(category);
        
        console.log(`🎯 Filtro aplicado: Categoria="${category}", Bairro="${bairro || 'Todos'}"`);
    }

    // ========== VERIFICAR SE CATEGORIA TEM DROPDOWN ==========
    function hasDropdown(category) {
        return CATEGORY_CONFIG[category] !== undefined;
    }

    // ========== ATUALIZAR ESTILO DOS BOTÕES ==========
    function updateActiveButtonStyle(filterValue) {
        console.log(`🎨 Atualizando estilo dos botões para filtro: ${filterValue}`);
        
        state.containers.forEach((containerState) => {
            containerState.buttons.forEach(button => {
                const isActive = (button.value === filterValue);
                
                if (isActive) {
                    button.element.classList.add(CONFIG.activeClass);
                    button.element.style.backgroundColor = 'var(--primary)';
                    button.element.style.color = 'white';
                    button.element.style.borderColor = 'var(--primary)';
                    button.element.style.fontWeight = '700';
                    button.element.style.boxShadow = '0 4px 12px rgba(26, 82, 118, 0.3)';
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

    // ========== MOSTRAR DROPDOWN ==========
    function showDropdown(button, category) {
        if (state.dropdownActive) return;
        
        if (!hasDropdown(category)) {
            console.log(`ℹ️ Categoria "${category}" não tem dropdown configurado`);
            return;
        }
        
        const properties = window.properties || [];
        const bairros = extractBairrosByCategory(properties, category);
        
        if (bairros.length === 0) {
            console.log(`ℹ️ Nenhum bairro encontrado para categoria: ${category}`);
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
            
            const config = CATEGORY_CONFIG[category];
            if (config.filterBy === 'type') {
                tempMsg.innerHTML = `⚠️ Nenhum imóvel com tipo "${config.expectedValues[0]}" encontrado`;
            } else {
                tempMsg.innerHTML = `⚠️ Nenhum imóvel com badge "${config.expectedValues[0]}" encontrado`;
            }
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
                if (filterValue !== 'todos' && CATEGORY_CONFIG[filterValue]) {
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
                
                // ========== CORREÇÃO: EVENTO DE CLIQUE COM LIMPEZA DE CLASSES ==========
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // REMOVER CLASSE ACTIVE DE TODOS OS BOTÕES
                    const allBtns = document.querySelectorAll(`.${CONFIG.buttonClass}`);
                    allBtns.forEach(btn => {
                        btn.classList.remove(CONFIG.activeClass);
                        // Resetar estilos inline também
                        btn.style.backgroundColor = '';
                        btn.style.color = '';
                        btn.style.borderColor = '';
                        btn.style.fontWeight = '';
                        btn.style.boxShadow = '';
                    });
                    
                    // ADICIONAR CLASSE ACTIVE APENAS NO BOTÃO CLICADO
                    newBtn.classList.add(CONFIG.activeClass);
                    newBtn.style.backgroundColor = 'var(--primary)';
                    newBtn.style.color = 'white';
                    newBtn.style.borderColor = 'var(--primary)';
                    newBtn.style.fontWeight = '700';
                    newBtn.style.boxShadow = '0 4px 12px rgba(26, 82, 118, 0.3)';
                    
                    // Atualizar estado do filtro
                    if (filterValue === 'todos') {
                        state.currentBairro = null;
                        state.currentFilter = 'todos';
                    } else {
                        state.currentFilter = filterValue;
                    }
                    
                    // Disparar callbacks
                    if (onFilterChange) {
                        onFilterChange(filterValue);
                    }
                    
                    state.callbacks.forEach(callback => {
                        if (typeof callback === 'function') {
                            callback(filterValue);
                        }
                    });
                    
                    console.log(`🎯 Botão clicado: "${filterText}" - Classe active aplicada`);
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
            
            // Limpar todos os estilos ativos primeiro
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
            
            // Aplicar estilo apenas ao botão correspondente
            state.containers.forEach((containerState) => {
                containerState.buttons.forEach(button => {
                    if (button.value === filterValue) {
                        button.element.classList.add(CONFIG.activeClass);
                        button.element.style.backgroundColor = 'var(--primary)';
                        button.element.style.color = 'white';
                        button.element.style.borderColor = 'var(--primary)';
                        button.element.style.fontWeight = '700';
                        button.element.style.boxShadow = '0 4px 12px rgba(26, 82, 118, 0.3)';
                    }
                });
            });
            
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

console.log('✅ FilterManager carregado - Correção de classe active nos botões');
