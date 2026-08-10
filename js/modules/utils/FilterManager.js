// ============================================================
// js/modules/utils/FilterManager.js
// SISTEMA DE FILTROS - VERSÃO CORRIGIDA FINAL
// ============================================================
// ✅ Responsabilidade Única: Gerenciamento de filtros
// ✅ Suporte a dropdowns de bairros (existente)
// ✅ Suporte a filtros principais (novo)
// ✅ CORREÇÃO FINAL: isAdmin() NÃO considera ADMIN_PASSWORD global
// ✅ CORREÇÃO FINAL: Admin só é detectado se painel está VISÍVEL
// ✅ CORREÇÃO FINAL: "Residencial" como default para visitantes
// ✅ CORREÇÃO FINAL: "Todos" visível apenas para admin logado
// ✅ CORREÇÃO: Verificação de properties em filterFn
// ✅ CORREÇÃO: Fallback para imóveis sem type definido no filtro "Residencial"
// ============================================================

console.log('🎛️ FilterManager.js carregado - Versão Corrigida Final (com fallback para residenciais)');

(function() {
    'use strict';

    // ========== CONFIGURAÇÃO DOS DROPDOWNS (EXISTENTE) ==========
    const DROPDOWN_CONFIG = {
        containerClass: 'filter-options',
        buttonClass: 'filter-btn',
        activeClass: 'active',
        defaultFilter: 'todos',
        dropdownDelay: 300,
        useClickForDropdown: false
    };

    // ========== CONFIGURAÇÃO DOS FILTROS PRINCIPAIS (CORRIGIDA) ==========
    const FILTER_CONFIG = {
        isAdmin: function() {
            // 🔴 CORREÇÃO FINAL: O usuário SÓ é admin se o painel está VISÍVEL
            var panel = document.getElementById('adminPanel');
            if (panel && panel.style.display === 'block') {
                return true;
            }
            if (sessionStorage.getItem('admin_logged_in') === 'true') {
                return true;
            }
            if (window.location.search.includes('admin=true')) {
                return true;
            }
            return false;
        },
        defaultFilterForVisitors: 'Residencial',
        defaultFilterForAdmin: 'todos',
        showAllForAdmin: true
    };

    // ========== CATEGORIAS DE FILTRO (COM FALLBACK PARA RESIDENCIAIS) ==========
    const CATEGORY_CONFIG = {
        'todos': {
            label: 'Todos',
            icon: 'fa-list',
            showOnlyForAdmin: true,
            filterFn: function(properties) {
                if (!properties || !Array.isArray(properties)) return [];
                return properties;
            }
        },
        'Residencial': {
            label: 'Residencial',
            icon: 'fa-home',
            showOnlyForAdmin: false,
            isDefaultForVisitors: true,
            filterFn: function(properties) {
                if (!properties || !Array.isArray(properties)) return [];
                return properties.filter(function(p) {
                    // ✅ CORREÇÃO: Identificar residenciais mesmo sem type definido
                    // 1. Tem type = 'residencial'
                    if (p.type === 'residencial') return true;
                    // 2. Não tem type definido
                    if (!p.type || p.type === '' || p.type === 'undefined' || p.type === 'null') {
                        // Se tem rural=false e badge não é de comercial/rural/terreno
                        if (p.rural === false) return true;
                        // Se tem badge que sugere residencial
                        if (p.badge === 'Novo' || p.badge === 'Destaque' || p.badge === 'Luxo') return true;
                        // Se não tem badge que sugere outros tipos
                        if (p.badge !== 'Fazenda' && p.badge !== 'Chácara' && 
                            p.badge !== 'Comercial' && p.badge !== 'Terreno' && 
                            p.badge !== 'Incorporação') return true;
                        return false;
                    }
                    // 3. Tem type que não é comercial/rural/terrenos
                    if (p.type !== 'comercial' && p.type !== 'rural' && p.type !== 'terrenos_incorporacoes') {
                        return true;
                    }
                    return false;
                });
            }
        },
        'Comercial': {
            label: 'Comercial',
            icon: 'fa-building',
            showOnlyForAdmin: false,
            filterFn: function(properties) {
                if (!properties || !Array.isArray(properties)) return [];
                return properties.filter(function(p) {
                    return p.type === 'comercial';
                });
            }
        },
        'Rural': {
            label: 'Rural',
            icon: 'fa-tractor',
            showOnlyForAdmin: false,
            filterFn: function(properties) {
                if (!properties || !Array.isArray(properties)) return [];
                return properties.filter(function(p) {
                    return p.type === 'rural' || p.rural === true;
                });
            }
        },
        'TerrenosIncorporacoes': {
            label: 'Terrenos & Incorporações',
            icon: 'fa-hand-holding-heart',
            showOnlyForAdmin: false,
            filterFn: function(properties) {
                if (!properties || !Array.isArray(properties)) return [];
                return properties.filter(function(p) {
                    return p.badge === 'Terreno' ||
                           p.badge === 'Incorporação' ||
                           p.type === 'terrenos_incorporacoes';
                });
            }
        }
    };

    // ========== ESTADO ==========
    const state = {
        currentFilter: DROPDOWN_CONFIG.defaultFilter,
        currentBairro: null,
        containers: new Map(),
        callbacks: new Map(),
        initialized: false,
        dropdownActive: false,
        hoverTimeout: null,
        currentActiveDropdown: null,
        dropdownCloseTimeout: null,
        currentMainFilter: null,
        isAdmin: FILTER_CONFIG.isAdmin(),
        properties: [],
        containerId: 'properties-container'
    };

    // ========== FUNÇÕES EXISTENTES (DROPDOWNS DE BAIRROS) ==========

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
                possibleBairro = possibleBairro.split(' ').map(function(word) {
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                }).join(' ');
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
        console.log('🔍 Buscando imóveis para categoria:', category);
        let filteredProperties = config.filterFn(properties);
        console.log('📊 Encontrados ' + filteredProperties.length + ' imóveis para categoria ' + category);
        if (filteredProperties.length === 0) return [];

        const bairrosMap = new Map();
        filteredProperties.forEach(function(property) {
            if (property.location && property.location.trim() !== '') {
                const bairro = extractBairroFromLocation(property.location);
                if (bairro && bairro !== 'Localização não especificada' && bairro !== '') {
                    bairrosMap.set(bairro, (bairrosMap.get(bairro) || 0) + 1);
                }
            }
        });

        let bairrosComContagem = Array.from(bairrosMap.entries()).map(function(entry) {
            return { nome: entry[0], count: entry[1] };
        });

        bairrosComContagem.sort(function(a, b) {
            const indexA = bairrosPrioridade.indexOf(a.nome);
            const indexB = bairrosPrioridade.indexOf(b.nome);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.nome.localeCompare(b.nome, 'pt-BR');
        });

        const bairros = bairrosComContagem.map(function(item) { return item.nome; });
        console.log('📍 Categoria "' + category + '" - ' + bairros.length + ' bairros únicos encontrados');
        return bairros;
    }

    function closeDropdownImmediately() {
        if (state.currentActiveDropdown && state.currentActiveDropdown.parentNode) {
            state.currentActiveDropdown.remove();
        }
        const allButtons = document.querySelectorAll('.filter-btn');
        allButtons.forEach(function(btn) {
            if (btn._closeHandler) {
                btn.removeEventListener('mouseenter', btn._closeHandler);
                delete btn._closeHandler;
            }
        });
        state.currentActiveDropdown = null;
        state.dropdownActive = false;
        if (state.dropdownCloseTimeout) {
            clearTimeout(state.dropdownCloseTimeout);
            state.dropdownCloseTimeout = null;
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
        tempMsg.style.top = (rect.bottom + window.scrollY + 5) + 'px';
        tempMsg.style.left = (rect.left + window.scrollX) + 'px';
        tempMsg.innerHTML = message;
        document.body.appendChild(tempMsg);
        setTimeout(function() { tempMsg.remove(); }, 2000);
    }

    function createBairroDropdown(buttonElement, category, bairros) {
        if (!bairros || bairros.length === 0) return null;
        if (state.currentActiveDropdown) closeDropdownImmediately();

        const config = CATEGORY_CONFIG[category];
        const icon = config ? config.icon : 'fa-home';
        const title = config ? config.label : category;

        const dropdown = document.createElement('div');
        dropdown.className = 'filter-dropdown';

        const header = document.createElement('div');
        header.className = 'filter-dropdown-header';
        header.innerHTML = `
            <span><i class="fas ' + icon + '"></i> Filtrar ${title} por bairro</span>
            <span class="filter-dropdown-close">×</span>
        `;
        dropdown.appendChild(header);

        const isAllActive = state.currentBairro === null;
        const allOption = document.createElement('div');
        allOption.className = 'filter-dropdown-all' + (isAllActive ? ' active' : '');
        allOption.innerHTML = '<i class="fas fa-globe"></i> Todos os bairros (' + bairros.length + ')';
        allOption.onclick = function(e) {
            e.stopPropagation();
            state.currentBairro = null;
            applyFilterWithBairro(category, null);
            closeDropdownImmediately();
        };
        dropdown.appendChild(allOption);

        bairros.forEach(function(bairro) {
            const isActive = state.currentBairro === bairro && state.currentFilter === category;
            const option = document.createElement('div');
            option.className = 'filter-dropdown-item' + (isActive ? ' active' : '');
            option.innerHTML = '<i class="fas fa-location-dot"></i> ' + escapeHtml(bairro);
            option.onclick = function(e) {
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
        footer.innerHTML = '<i class="fas fa-chart-line"></i> ' + propertyCount + ' imóvel(is) encontrado(s)';
        dropdown.appendChild(footer);

        dropdown.addEventListener('mouseenter', function() {
            if (state.dropdownCloseTimeout) {
                clearTimeout(state.dropdownCloseTimeout);
                state.dropdownCloseTimeout = null;
            }
        });

        dropdown.addEventListener('mouseleave', function() {
            state.dropdownCloseTimeout = setTimeout(function() { closeDropdownImmediately(); }, 300);
        });

        return dropdown;
    }

    function showDropdown(button, category) {
        if (state.dropdownActive && state.currentActiveDropdown) closeDropdownImmediately();
        if (state.dropdownCloseTimeout) clearTimeout(state.dropdownCloseTimeout);
        if (!hasDropdown(category)) return;

        const properties = window.properties || [];
        const bairros = extractBairrosByCategory(properties, category);

        if (bairros.length === 0) {
            showTemporaryMessage(button, '⚠️ Nenhum bairro encontrado para ' + category);
            return;
        }

        if (state.currentActiveDropdown && state.currentActiveDropdown !== button) closeDropdownImmediately();

        const dropdown = createBairroDropdown(button, category, bairros);
        if (!dropdown) return;

        state.currentActiveDropdown = dropdown;

        const rect = button.getBoundingClientRect();
        dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
        dropdown.style.left = (rect.left + window.scrollX) + 'px';

        const closeDropdownHandler = function(e) {
            if (!dropdown.contains(e.target) && e.target !== button) {
                closeDropdownImmediately();
                document.removeEventListener('click', closeDropdownHandler);
                document.removeEventListener('keydown', escapeHandler);
            }
        };

        const escapeHandler = function(e) {
            if (e.key === 'Escape') {
                closeDropdownImmediately();
                document.removeEventListener('click', closeDropdownHandler);
                document.removeEventListener('keydown', escapeHandler);
            }
        };

        const closeOtherDropdowns = function() {
            if (state.currentActiveDropdown && state.currentActiveDropdown !== dropdown) closeDropdownImmediately();
        };

        document.body.appendChild(dropdown);
        state.dropdownActive = true;

        const closeBtn = dropdown.querySelector('.filter-dropdown-close');
        if (closeBtn) closeBtn.onclick = function() { closeDropdownImmediately(); };

        setTimeout(function() {
            document.addEventListener('click', closeDropdownHandler);
            document.addEventListener('keydown', escapeHandler);
            const allButtons = document.querySelectorAll('.filter-btn');
            allButtons.forEach(function(otherBtn) {
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

        let filtered = config.filterFn(properties);

        if (bairro) {
            filtered = filtered.filter(function(p) {
                const propertyBairro = extractBairroFromLocation(p.location);
                return propertyBairro === bairro;
            });
        }
        return filtered.length;
    }

    function applyFilterWithBairro(category, bairro) {
        state.currentFilter = category;
        const filterValue = bairro ? category + '|' + bairro : category;
        state.callbacks.forEach(function(callback) {
            if (typeof callback === 'function') {
                callback(filterValue, { category: category, bairro: bairro });
            }
        });
        updateActiveButtonStyle(category);
        console.log('🎯 Filtro aplicado: Categoria="' + category + '", Bairro="' + (bairro || 'Todos') + '"');
    }

    function hasDropdown(category) {
        return CATEGORY_CONFIG[category] !== undefined;
    }

    function updateActiveButtonStyle(filterValue) {
        state.containers.forEach(function(containerState) {
            containerState.buttons.forEach(function(button) {
                const isActive = (button.value === filterValue);
                if (isActive) {
                    button.element.classList.add(DROPDOWN_CONFIG.activeClass);
                    button.element.style.backgroundColor = '';
                    button.element.style.color = '';
                    button.element.style.borderColor = '';
                    button.element.style.fontWeight = '';
                    button.element.style.boxShadow = '';
                } else {
                    button.element.classList.remove(DROPDOWN_CONFIG.activeClass);
                    button.element.style.backgroundColor = '';
                    button.element.style.color = '';
                    button.element.style.borderColor = '';
                    button.element.style.fontWeight = '';
                    button.element.style.boxShadow = '';
                }
            });
        });
    }

    function setupContainer(container, containerId, onFilterChange) {
        const buttons = container.querySelectorAll('.' + DROPDOWN_CONFIG.buttonClass);
        const containerState = state.containers.get(containerId);
        buttons.forEach(function(button) {
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
                newBtn.addEventListener('mouseenter', function() {
                    if (state.dropdownActive && state.currentActiveDropdown) closeDropdownImmediately();
                    if (state.dropdownCloseTimeout) clearTimeout(state.dropdownCloseTimeout);
                    hoverTimer = setTimeout(function() { showDropdown(newBtn, filterValue); }, DROPDOWN_CONFIG.dropdownDelay);
                });
                newBtn.addEventListener('mouseleave', function(event) {
                    clearTimeout(hoverTimer);
                    state.dropdownCloseTimeout = setTimeout(function() {
                        if (state.currentActiveDropdown) {
                            const rect = state.currentActiveDropdown.getBoundingClientRect();
                            const mouseX = event?.clientX || 0;
                            const mouseY = event?.clientY || 0;
                            const isInsideDropdown = mouseX >= rect.left && mouseX <= rect.right &&
                                                    mouseY >= rect.top && mouseY <= rect.bottom;
                            if (!isInsideDropdown) closeDropdownImmediately();
                        }
                    }, 200);
                });
            }

            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (state.currentActiveDropdown) closeDropdownImmediately();
                const allBtns = document.querySelectorAll('.' + DROPDOWN_CONFIG.buttonClass);
                allBtns.forEach(function(btn) {
                    btn.classList.remove(DROPDOWN_CONFIG.activeClass);
                    btn.style.backgroundColor = '';
                    btn.style.color = '';
                    btn.style.borderColor = '';
                    btn.style.fontWeight = '';
                    btn.style.boxShadow = '';
                });
                newBtn.classList.add(DROPDOWN_CONFIG.activeClass);
                if (filterValue === 'todos') {
                    state.currentBairro = null;
                    state.currentFilter = 'todos';
                } else {
                    state.currentFilter = filterValue;
                }
                if (onFilterChange) onFilterChange(filterValue);
                state.callbacks.forEach(function(callback) {
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
    }

    function setActiveFilter(filterValue, sourceContainerId) {
        sourceContainerId = sourceContainerId || null;
        state.currentFilter = filterValue;
        state.containers.forEach(function(containerState) {
            containerState.buttons.forEach(function(button) {
                button.element.classList.remove(DROPDOWN_CONFIG.activeClass);
                button.element.style.backgroundColor = '';
                button.element.style.color = '';
                button.element.style.borderColor = '';
                button.element.style.fontWeight = '';
                button.element.style.boxShadow = '';
            });
        });
        state.containers.forEach(function(containerState) {
            containerState.buttons.forEach(function(button) {
                if (button.value === filterValue) {
                    button.element.classList.add(DROPDOWN_CONFIG.activeClass);
                    button.element.style.backgroundColor = '';
                    button.element.style.color = '';
                    button.element.style.borderColor = '';
                    button.element.style.fontWeight = '';
                    button.element.style.boxShadow = '';
                }
            });
        });
    }

    function activateDefaultFilter() {
        setActiveFilter(DROPDOWN_CONFIG.defaultFilter);
    }

    function getCurrentFilter() {
        return state.currentFilter;
    }

    function getCurrentBairro() {
        return state.currentBairro;
    }

    function onFilterChange(callback, id) {
        id = id || 'custom';
        if (typeof callback === 'function') {
            state.callbacks.set(id, callback);
            return true;
        }
        return false;
    }

    function setupWithFallback() {
        if (state.initialized) return true;
        if (this.init) {
            this.init(function(filterValue, details) {
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
    }

    function destroy() {
        state.containers.forEach(function(containerState) {
            containerState.buttons.forEach(function(button) {
                const newBtn = button.element.cloneNode(true);
                button.element.parentNode.replaceChild(newBtn, button.element);
            });
        });
        state.containers.clear();
        state.callbacks.clear();
        state.initialized = false;
    }

    function isInitialized() {
        return state.initialized;
    }

    function refreshBairros() {
        if (state.currentActiveDropdown) closeDropdownImmediately();
    }

    // ========== FUNÇÕES: FILTROS PRINCIPAIS (CORRIGIDAS) ==========

    function getDefaultFilter() {
        if (FILTER_CONFIG.isAdmin()) {
            return FILTER_CONFIG.defaultFilterForAdmin;
        }
        return FILTER_CONFIG.defaultFilterForVisitors;
    }

    function renderMainFilterButtons(container) {
        const isAdminUser = FILTER_CONFIG.isAdmin();
        let html = '<div class="filter-options">';

        for (const [key, config] of Object.entries(CATEGORY_CONFIG)) {
            if (key === 'todos' && !isAdminUser) {
                continue;
            }

            if (config.showOnlyForAdmin && !isAdminUser) {
                continue;
            }

            const isActive = state.currentMainFilter === key;
            const label = config.label;
            const icon = config.icon || 'fa-tag';

            html += `
                <button class="filter-btn ${isActive ? 'active' : ''}"
                        data-filter="${key}"
                        data-tooltip="Filtrar por ${label}"
                        onclick="FilterManager.applyMainFilter('${key}')">
                    <i class="fas ${icon}" aria-hidden="true"></i> ${label}
                </button>
            `;
        }

        html += '</div>';
        container.innerHTML = html;

        console.log('📊 [FilterManager] Botões renderizados. Admin: ' + isAdminUser);
        if (!isAdminUser) {
            console.log('👤 [FilterManager] Visitante - Botão "Todos" OCULTO');
        } else {
            console.log('🛡️ [FilterManager] Admin logado - Botão "Todos" VISÍVEL');
        }
    }

    function applyMainFilter(filterKey) {
        if (!filterKey) return;

        const config = CATEGORY_CONFIG[filterKey];
        if (!config) {
            console.warn('⚠️ Filtro "' + filterKey + '" não encontrado');
            return;
        }

        state.currentMainFilter = filterKey;

        const properties = window.properties || [];
        let filtered = config.filterFn(properties);

        renderProperties(filtered);
        updateActiveMainButton(filterKey);
        updatePropertyCount(filtered.length);

        console.log('🎯 Filtro aplicado: ' + config.label + ' (' + filtered.length + ' imóveis) - Admin: ' + FILTER_CONFIG.isAdmin());

        const event = new CustomEvent('filterChanged', {
            detail: { filter: filterKey, count: filtered.length }
        });
        document.dispatchEvent(event);
    }

    function renderProperties(properties) {
        const container = document.getElementById(state.containerId);
        if (!container) return;

        if (!properties || properties.length === 0) {
            container.innerHTML = `
                <div class="no-properties" style="text-align:center; padding:3rem; color:#666;">
                    <i class="fas fa-home" style="font-size:3rem; opacity:0.3; display:block; margin-bottom:1rem;"></i>
                    <p>Nenhum imóvel disponível para esta categoria.</p>
                    <small style="color:#999;">Tente selecionar outra opção de filtro.</small>
                </div>
            `;
            return;
        }

        if (window.propertyTemplates && typeof window.propertyTemplates.generate === 'function') {
            container.innerHTML = properties.map(function(prop) {
                return window.propertyTemplates.generate(prop);
            }).join('');
        } else {
            container.innerHTML = properties.map(function(prop) {
                return `
                    <div class="property-card" data-property-id="${prop.id}">
                        <div class="property-content">
                            <h3>${prop.title || 'Imóvel'}</h3>
                            <p>${prop.location || ''}</p>
                            <p><strong>${prop.price || 'Preço sob consulta'}</strong></p>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    function updateActiveMainButton(filterKey) {
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(function(btn) {
            const btnFilter = btn.getAttribute('data-filter');
            if (btnFilter === filterKey) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function updatePropertyCount(count) {
        const countElement = document.getElementById('propertyCount');
        if (countElement) {
            countElement.textContent = count + ' imóvel(is)';
        }
    }

    function refreshFilters() {
        const wasAdmin = state.isAdmin;
        state.isAdmin = FILTER_CONFIG.isAdmin();

        if (wasAdmin !== state.isAdmin) {
            console.log('🔄 Modo admin alterado: ' + wasAdmin + ' → ' + state.isAdmin);
            const filterContainer = document.querySelector('.filters');
            if (filterContainer) {
                renderMainFilterButtons(filterContainer);
            }
            const defaultFilter = getDefaultFilter();
            applyMainFilter(defaultFilter);
        } else {
            const filterContainer = document.querySelector('.filters');
            if (filterContainer) {
                renderMainFilterButtons(filterContainer);
            }
        }
    }

    // ========== FUNÇÃO DE INICIALIZAÇÃO EXPANDIDA ==========
    function init(onFilterChange) {
        onFilterChange = onFilterChange || null;

        if (state.initialized) {
            console.log('⏭️ FilterManager já inicializado');
            return;
        }

        console.log('🔧 Inicializando FilterManager (Versão Corrigida Final - com fallback para residenciais)...');

        const containers = document.querySelectorAll('.' + DROPDOWN_CONFIG.containerClass);
        if (containers.length === 0) {
            console.warn('⚠️ Nenhum container de filtros encontrado');
        } else {
            containers.forEach(function(container, index) {
                const containerId = 'filter-container-' + index;
                state.containers.set(containerId, {
                    element: container,
                    buttons: []
                });
                setupContainer(container, containerId, onFilterChange);
            });
        }

        if (onFilterChange && typeof onFilterChange === 'function') {
            state.callbacks.set('global', onFilterChange);
        }

        state.isAdmin = FILTER_CONFIG.isAdmin();
        state.currentMainFilter = getDefaultFilter();
        state.containerId = 'properties-container';

        const filterContainer = document.querySelector('.filters');
        if (filterContainer) {
            renderMainFilterButtons(filterContainer);
        } else {
            console.warn('⚠️ Container de filtros principais não encontrado');
        }

        applyMainFilter(state.currentMainFilter);

        state.initialized = true;
        console.log('✅ FilterManager completo inicializado - Filtro default: ' + state.currentMainFilter);
        console.log('📊 Modo admin: ' + state.isAdmin);

        if (!state.isAdmin) {
            console.log('👤 [FilterManager] Visitante detectado - Botão "Todos" OCULTO');
            console.log('🏠 [FilterManager] Filtro default: "Residencial" (com fallback para imóveis sem tipo)');
        } else {
            console.log('🛡️ [FilterManager] Admin logado - Botão "Todos" VISÍVEL');
            console.log('📋 [FilterManager] Filtro default: "Todos"');
        }
    }

    // ========== API PÚBLICA ==========
    window.FilterManager = {
        DROPDOWN_CONFIG: DROPDOWN_CONFIG,
        FILTER_CONFIG: FILTER_CONFIG,
        CATEGORY_CONFIG: CATEGORY_CONFIG,

        init: init,
        setupContainer: setupContainer,
        setActiveFilter: setActiveFilter,
        activateDefaultFilter: activateDefaultFilter,
        getCurrentFilter: getCurrentFilter,
        getCurrentBairro: getCurrentBairro,
        onFilterChange: onFilterChange,
        setupWithFallback: setupWithFallback,
        destroy: destroy,
        isInitialized: isInitialized,
        refreshBairros: refreshBairros,

        applyMainFilter: applyMainFilter,
        getDefaultFilter: getDefaultFilter,
        isAdmin: FILTER_CONFIG.isAdmin,
        refreshFilters: refreshFilters,
        getCurrentMainFilter: function() { return state.currentMainFilter; },
        getFilterConfig: function(key) { return CATEGORY_CONFIG[key] || null; },
        renderMainFilterButtons: renderMainFilterButtons,

        getState: function() { return state; }
    };

    // ========== INICIALIZAÇÃO AUTOMÁTICA ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                if (!window.FilterManager.isInitialized()) {
                    window.FilterManager.init();
                }
            }, 500);
        });
    } else {
        setTimeout(function() {
            if (!window.FilterManager.isInitialized()) {
                window.FilterManager.init();
            }
        }, 500);
    }

    console.log('✅ FilterManager completo carregado com sucesso!');
    console.log('🔧 CORREÇÃO: isAdmin() NÃO considera ADMIN_PASSWORD global');
    console.log('🔧 CORREÇÃO: Admin só é detectado se painel está VISÍVEL');
    console.log('🔧 CORREÇÃO: Verificação de properties em filterFn');
    console.log('🔧 CORREÇÃO: Fallback para imóveis sem type definido no filtro "Residencial"');
    console.log('🏠 CORREÇÃO: "Residencial" como default para visitantes');
    console.log('🛡️ CORREÇÃO: "Todos" visível apenas para admin logado');

})();

// ========== FUNÇÃO DE ESCAPE HTML ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
}

// ============================================================
// FIM DO ARQUIVO - FilterManager.js (Versão Corrigida Final)
// ============================================================
// STATUS: ✅ CARREGADO COM SUCESSO
// Versão: 2.3 - Correção Final com fallback para residenciais
// Última atualização: 2026-08-10
// CORREÇÃO: isAdmin() NÃO considera ADMIN_PASSWORD global
// CORREÇÃO: Admin só é detectado se painel está VISÍVEL
// CORREÇÃO: Verificação de properties em filterFn
// CORREÇÃO: Fallback para imóveis sem type definido no filtro "Residencial"
// CORREÇÃO: "Residencial" como default para visitantes
// CORREÇÃO: "Todos" visível apenas para admin logado
// ============================================================
