// js/modules/admin.js - Versão ESTÁVEL v2.5
// NOVO: Indicador "Tempo de Mercado" (Days on Market) na lista de gerenciamento
// Mostra há quanto tempo o imóvel está cadastrado sem venda

console.log('✅ admin.js carregado - Versão ESTÁVEL v2.5 (com indicador Tempo de Mercado)');

const ADMIN_CONFIG = { password: "wl654", panelId: "adminPanel", buttonClass: "admin-toggle" };
window.editingPropertyId = null;

// ========== FUNÇÃO PARA CALCULAR TEMPO DE MERCADO (DOM) ==========
function getMarketTime(createdAt) {
    if (!createdAt) {
        // Se não tem data, usa data atual (hoje)
        createdAt = new Date().toISOString();
    }
    
    const createdDate = new Date(createdAt);
    const now = new Date();
    
    // Calcular diferença em milissegundos
    const diffMs = now - createdDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    // Formatar texto
    let text = '';
    let color = '';
    let status = '';
    
    if (diffDays < 1) {
        text = 'Hoje';
        color = '#27ae60';      // verde
        status = 'Liquidez Alta';
    } else if (diffDays <= 30) {
        text = `${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
        color = '#27ae60';      // verde
        status = 'Liquidez Alta';
    } else if (diffDays <= 90) {
        text = `${diffMonths} mês${diffMonths !== 1 ? 'es' : ''}`;
        color = '#f39c12';      // amarelo
        status = 'Liquidez Média';
    } else if (diffDays <= 180) {
        text = `${diffMonths} mês${diffMonths !== 1 ? 'es' : ''}`;
        color = '#e67e22';      // laranja
        status = 'Baixa Liquidez';
    } else if (diffDays <= 365) {
        text = `${diffMonths} mês${diffMonths !== 1 ? 'es' : ''}`;
        color = '#e74c3c';      // vermelho
        status = 'Estagnado';
    } else {
        text = `${diffYears} ano${diffYears !== 1 ? 's' : ''}`;
        color = '#c0392b';      // vermelho escuro
        status = 'Crítico';
    }
    
    return { text, color, status, days: diffDays };
}

// ========== SISTEMA DE DIAGNÓSTICO E ESTABILIDADE ==========
window.AUTOCOMPLETE_ACTIVE = false;
let autocompleteInitialized = false;

window.diagnoseAutocomplete = function() {
    console.group('🔍 DIAGNÓSTICO DO AUTOCOMPLETE');
    const input = document.getElementById('propLocation');
    const dropdown = document.querySelector('.admin-location-suggestions');
    const resultados = {
        'Campo existe': !!input,
        'Campo visível': input ? input.getBoundingClientRect().bottom > 0 : false,
        'Autocomplete inicializado': input ? input.hasAttribute('data-autocomplete-initialized') : false,
        'Flag AUTOCOMPLETE_ACTIVE': window.AUTOCOMPLETE_ACTIVE,
        'Dropdown existe': !!dropdown,
        'Dropdown visível': dropdown ? dropdown.style.display !== 'none' : false
    };
    console.table(resultados);
    console.groupEnd();
    return resultados;
};

let healthCheckInterval = null;

function startHealthCheck() {
    if (healthCheckInterval) clearInterval(healthCheckInterval);
    healthCheckInterval = setInterval(() => {
        if (window.AUTOCOMPLETE_ACTIVE) {
            const input = document.getElementById('propLocation');
            const dropdown = document.querySelector('.admin-location-suggestions');
            if (input && document.activeElement === input) {
                if (!dropdown && input.value.length >= 2) {
                    console.warn('⚠️ [HEALTH] Autocomplete pode estar com problema');
                }
            }
        }
    }, 30000);
}

function stopHealthCheck() {
    if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
    }
}

// ========== FUNÇÕES DE TROCA DE ABA ==========
function switchToFormTab() {
    const formTab = document.querySelector('.admin-tab[data-tab="form-tab"]');
    const manageTab = document.querySelector('.admin-tab[data-tab="manage-tab"]');
    const formContent = document.getElementById('form-tab');
    const manageContent = document.getElementById('manage-tab');
    
    if (formTab && formContent) {
        if (manageTab) manageTab.classList.remove('active');
        if (manageContent) manageContent.classList.remove('active');
        formTab.classList.add('active');
        formContent.classList.add('active');
        console.log('[ADMIN] ✅ Mudou para aba INCLUIR/EDITAR');
    }
}

function switchToManageTab() {
    const manageTab = document.querySelector('.admin-tab[data-tab="manage-tab"]');
    const formTab = document.querySelector('.admin-tab[data-tab="form-tab"]');
    const manageContent = document.getElementById('manage-tab');
    const formContent = document.getElementById('form-tab');
    
    if (manageTab && manageContent) {
        if (formTab) formTab.classList.remove('active');
        if (formContent) formContent.classList.remove('active');
        manageTab.classList.add('active');
        manageContent.classList.add('active');
        console.log('[ADMIN] ✅ Mudou para aba GERENCIAR');
        
        if (typeof window.loadPropertyList === 'function') {
            setTimeout(function() {
                window.loadPropertyList();
                console.log('[ADMIN] 📋 Lista de imóveis carregada');
            }, 50);
        }
    }
}

// ========== FUNÇÃO PRINCIPAL: TOGGLE DO PAINEL ADMIN ==========
window.toggleAdminPanel = function() {
    console.log('[ADMIN] 🔑 Solicitando acesso ao painel...');
    
    const password = prompt("🔒 Acesso ao Painel do Corretor\n\nDigite a senha:");
    
    if (!password) {
        console.log('[ADMIN] ❌ Acesso cancelado pelo usuário');
        return;
    }
    
    if (password !== ADMIN_CONFIG.password) {
        alert('❌ Senha incorreta!');
        console.log('[ADMIN] ❌ Senha incorreta');
        return;
    }
    
    console.log('[ADMIN] ✅ Senha correta! Abrindo painel...');
    
    const panel = document.getElementById(ADMIN_CONFIG.panelId);
    
    if (!panel) {
        console.error('[ADMIN] ❌ Painel não encontrado!');
        return;
    }
    
    panel.style.display = 'block';
    window.resetAdminFormCompletely(false);
    switchToManageTab();
    
    setTimeout(function() {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        console.log('[ADMIN] ✅ Painel aberto com sucesso - Aba GERENCIAR ativa');
        
        panel.classList.add('admin-panel-highlight');
        setTimeout(function() {
            panel.classList.remove('admin-panel-highlight');
        }, 1000);
    }, 100);
};

window.resetAdminFormCompletely = function(showNotification = true) {
    if (window.SupportCoreUtils?.manageEditingState) window.SupportCoreUtils.manageEditingState(null);
    else window.editingPropertyId = null;
    
    ['propTitle', 'propPrice', 'propLocation', 'propDescription', 'propFeatures', 'propType', 'propBadge', 'propHasVideo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (el.type === 'select-one') el.value = el.id === 'propType' ? 'residencial' : 'Novo';
            else if (el.type === 'checkbox') el.checked = false;
            else el.value = '';
        }
    });
    
    if (window.MediaSystem) {
        try {
            if (typeof window.MediaSystem.resetState === 'function') window.MediaSystem.resetState();
            ['uploadPreview', 'pdfUploadPreview'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ''; });
        } catch (error) { console.error('[ADMIN] Erro ao resetar MediaSystem:', error); }
    }
    
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.textContent = 'Adicionar Novo Imóvel';
    
    const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
        submitBtn.style.background = '#27ae60';
    }
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';
    
    if (showNotification && typeof window.showAdminNotification === 'function') window.showAdminNotification('✅ Formulário limpo para novo imóvel', 'info');
    return true;
};

window.cancelEdit = function() {
    if (window.editingPropertyId) {
        if (confirm('❓ Cancelar edição?\n\nTodos os dados não salvos serão perdidos.')) {
            window.resetAdminFormCompletely(true);
            setTimeout(switchToManageTab, 100);
            return true;
        }
    } else {
        window.resetAdminFormCompletely(false);
    }
    return false;
};

window.editProperty = function(id) {
    const property = window.properties?.find(p => p.id === id);
    if (!property) {
        if (typeof window.showAdminNotification === 'function') window.showAdminNotification('❌ Imóvel não encontrado!', 'error', 3000);
        else alert('❌ Imóvel não encontrado!');
        return false;
    }
    
    const panel = document.getElementById('adminPanel');
    if (panel && panel.style.display !== 'block') {
        panel.style.display = 'block';
    }
    
    switchToFormTab();
    window.resetAdminFormCompletely(false);
    
    const formatPrice = (price) => window.SharedCore.PriceFormatter.formatForAdmin(price) ?? '';
    const formatFeatures = (features) => window.SharedCore.formatFeaturesForDisplay(features) ?? '';
    
    const fieldMappings = {
        'propTitle': property.title || '',
        'propPrice': formatPrice(property.price) || '',
        'propLocation': property.location || '',
        'propDescription': property.description || '',
        'propFeatures': formatFeatures(property.features) || '',
        'propType': property.type || 'residencial',
        'propBadge': property.badge || 'Novo',
        'propHasVideo': window.SharedCore.ensureBooleanVideo(property.has_video)
    };
    
    Object.entries(fieldMappings).forEach(([fieldId, value]) => {
        const element = document.getElementById(fieldId);
        if (element) {
            if (element.type === 'checkbox') element.checked = Boolean(value);
            else element.value = value;
        }
    });
    
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.textContent = `Editando: ${property.title}`;
    
    const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        submitBtn.style.background = '#3498db';
    }
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
    
    if (window.SupportCoreUtils?.manageEditingState) window.SupportCoreUtils.manageEditingState(property.id);
    else window.editingPropertyId = property.id;
    
    if (window.MediaSystem?.loadExisting) window.MediaSystem.loadExisting(property);
    
    setTimeout(() => {
        const formElement = document.getElementById('propertyForm');
        if (formElement) {
            const firstInput = formElement.querySelector('input, textarea, select');
            if (firstInput && typeof firstInput.focus === 'function') {
                firstInput.focus();
            }
        }
    }, 200);
    
    setTimeout(() => {
        const card = document.querySelector(`.property-card[data-property-id="${id}"]`);
        if (card) {
            card.classList.add('editing-highlight');
            card.style.transition = 'all 0.3s ease';
            card.style.boxShadow = '0 0 0 3px #f39c12, 0 8px 25px rgba(0,0,0,0.15)';
            card.style.transform = 'scale(1.02)';
            setTimeout(() => {
                card.classList.remove('editing-highlight');
                card.style.boxShadow = '';
                card.style.transform = '';
            }, 5000);
        }
    }, 200);
    
    return true;
};

window.saveProperty = async function() {
    console.group('[ADMIN] 💾 SALVANDO IMÓVEL');
    try {
        const propertyData = {};
        const videoCheckbox = document.getElementById('propHasVideo');
        propertyData.has_video = window.SharedCore.ensureBooleanVideo(videoCheckbox?.checked);
        
        const fields = [
            { id: 'propTitle', key: 'title' }, { id: 'propPrice', key: 'price' },
            { id: 'propLocation', key: 'location' }, { id: 'propDescription', key: 'description' },
            { id: 'propFeatures', key: 'features' }, { id: 'propType', key: 'type' },
            { id: 'propBadge', key: 'badge' }
        ];
        
        fields.forEach(field => {
            const el = document.getElementById(field.id);
            propertyData[field.key] = el ? (el.type === 'select-one' ? el.value : el.value.trim()) : '';
        });
        
        if (!propertyData.title || !propertyData.price || !propertyData.location) throw new Error('Preencha Título, Preço e Localização!');
        
        if (window.SharedCore.PriceFormatter?.formatForAdmin) propertyData.price = window.SharedCore.PriceFormatter.formatForAdmin(propertyData.price);
        
        propertyData.features = window.SharedCore.parseFeaturesForStorage(propertyData.features);
        
        let imageUrls = '', pdfUrls = '';
        if (window.MediaSystem) {
            const hasSupabase = window.SUPABASE_CONSTANTS?.URL && window.SUPABASE_CONSTANTS?.KEY;
            const tempId = window.editingPropertyId || 'temp_' + Date.now();
            if (hasSupabase) {
                try {
                    const uploadResult = await MediaSystem.uploadAll(tempId, propertyData.title || 'Imóvel');
                    if (uploadResult.success) { imageUrls = uploadResult.images; pdfUrls = uploadResult.pdfs; }
                    else { const localResult = MediaSystem.saveAndKeepLocal(tempId, propertyData.title || 'Imóvel'); imageUrls = localResult.images; pdfUrls = localResult.pdfs; }
                } catch (e) { const localResult = MediaSystem.saveAndKeepLocal(tempId, propertyData.title || 'Imóvel'); imageUrls = localResult.images; pdfUrls = localResult.pdfs; }
            } else { const localResult = MediaSystem.saveAndKeepLocal(tempId, propertyData.title || 'Imóvel'); imageUrls = localResult.images; pdfUrls = localResult.pdfs; }
        }
        propertyData.images = imageUrls || 'EMPTY';
        propertyData.pdfs = pdfUrls || 'EMPTY';
        
        if (window.editingPropertyId) {
            if (typeof window.updateProperty === 'function') {
                const updateResult = await window.updateProperty(window.editingPropertyId, propertyData);
                if (updateResult?.success && typeof window.showAdminNotification === 'function') window.showAdminNotification('✅ Imóvel atualizado com sucesso!', 'success', 3000);
                else if (typeof window.showAdminNotification === 'function') window.showAdminNotification('⚠️ Imóvel salvo apenas localmente', 'info', 3000);
            }
            setTimeout(() => {
                if (typeof window.updatePropertyCard === 'function') window.updatePropertyCard(window.editingPropertyId);
                else if (typeof window.renderProperties === 'function') window.renderProperties(window.currentFilter || 'todos');
            }, 300);
            setTimeout(() => {
                window.resetAdminFormCompletely(true);
                setTimeout(switchToManageTab, 100);
            }, 1500);
        } else {
            const newProperty = { ...propertyData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
            if (typeof window.addNewProperty === 'function') {
                const result = await window.addNewProperty(newProperty);
                if (result) {
                    if (typeof window.showAdminNotification === 'function') window.showAdminNotification('✅ Imóvel criado com sucesso!', 'success', 3000);
                    setTimeout(() => { if (typeof window.renderProperties === 'function') window.renderProperties('todos'); }, 300);
                    setTimeout(() => window.resetAdminFormCompletely(true), 1500);
                } else throw new Error('addNewProperty retornou null');
            } else throw new Error('Função addNewProperty não disponível');
        }
    } catch (error) {
        console.error('[ADMIN] ❌ Erro ao salvar imóvel:', error);
        if (typeof window.showAdminNotification === 'function') window.showAdminNotification(`❌ Erro: ${error.message}`, 'error', 5000);
        else alert(`❌ Erro: ${error.message}`);
    } finally { console.groupEnd(); }
};

// ========== FUNÇÃO PARA CARREGAR LISTA DE IMÓVEIS COM INDICADOR DE TEMPO ==========
window.loadPropertyList = function(page = window.adminCurrentPage) {
    if (!window.properties || typeof window.properties.forEach !== 'function') {
        console.error('❌ window.properties não é um array válido');
        return;
    }
    
    const container = document.getElementById('propertyList');
    const countElement = document.getElementById('propertyCount');
    
    if (!container) return;
    
    const isMobile = window.innerWidth <= 768;
    const itemsPerPage = isMobile ? 3 : window.adminItemsPerPage;
    
    window.adminCurrentPage = page;
    
    const totalItems = window.properties.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedProperties = window.properties.slice(startIndex, endIndex);
    
    container.innerHTML = '';
    
    if (countElement) {
        countElement.textContent = totalItems;
    }
    
    if (totalItems === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Nenhum imóvel cadastrado</p>';
        return;
    }
    
    container.style.maxHeight = '650px';
    container.style.overflowY = 'auto';
    container.style.paddingRight = '5px';
    container.style.paddingBottom = '20px';
    
    const totalViews = window.getTotalGalleryViews ? window.getTotalGalleryViews() : 0;
    
    const statsHeader = document.createElement('div');
    statsHeader.style.cssText = 'background: #e8f4fd; padding: 0.5rem; border-radius: 8px; margin-bottom: 0.5rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem;';
    
    const statsContainer = document.createElement('div');
    statsContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.5rem;';
    
    const viewsSpan = document.createElement('span');
    viewsSpan.style.cssText = 'display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.7rem;';
    viewsSpan.innerHTML = `<i class="fas fa-eye"></i> <strong>Total Visualizações:</strong> ${totalViews}`;
    statsContainer.appendChild(viewsSpan);
    
    const itemsSpan = document.createElement('span');
    itemsSpan.style.cssText = 'display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.7rem;';
    itemsSpan.innerHTML = `<i class="fas fa-building"></i> <strong>Total imóveis:</strong> ${totalItems}`;
    statsContainer.appendChild(itemsSpan);
    
    const showingSpan = document.createElement('span');
    showingSpan.style.cssText = 'display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.7rem;';
    showingSpan.innerHTML = `<i class="fas fa-list"></i> <strong>Exibindo:</strong> ${startIndex + 1}-${endIndex} de ${totalItems}`;
    statsContainer.appendChild(showingSpan);
    
    statsHeader.appendChild(statsContainer);
    container.appendChild(statsHeader);
    
    const listContainer = document.createElement('div');
    listContainer.id = 'propertyListItems';
    listContainer.style.cssText = 'margin: 0.5rem 0;';
    
    const defaultImage = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80';
    
    paginatedProperties.forEach(property => {
        const viewCount = window.getGalleryViews ? window.getGalleryViews(property.id) : 0;
        const lastView = window.getLastGalleryView ? window.getLastGalleryView(property.id) : null;
        
        // NOVO: Calcular tempo de mercado (Days on Market)
        const marketTime = getMarketTime(property.created_at);
        
        let firstImage = defaultImage;
        let isVideo = false;
        
        if (property.images && property.images !== 'EMPTY') {
            const imageUrls = property.images.split(',').filter(url => url && url.trim() !== '');
            if (imageUrls.length > 0) {
                firstImage = imageUrls[0];
                isVideo = window.SharedCore ? window.SharedCore.isVideoUrl(firstImage) : false;
            }
        }
        
        const item = document.createElement('div');
        item.className = 'property-item';
        item.style.cssText = 'background: #f5f5f5; padding: 0.8rem; margin: 0.5rem 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-left: 4px solid var(--primary); transition: all 0.3s ease;';
        
        item.innerHTML = `
            <div style="flex-shrink: 0; width: 60px; height: 60px; border-radius: 8px; overflow: hidden; background: #2c3e50; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.1);" 
                 onclick="if(window.openGalleryAtCurrentIndex) window.openGalleryAtCurrentIndex(${property.id})"
                 title="Clique para abrir galeria">
                ${isVideo ? `
                    <div style="position: relative; width: 100%; height: 100%; background: linear-gradient(135deg, #1a5276, #2c3e50); display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-video" style="font-size: 1.5rem; color: rgba(255,255,255,0.8);"></i>
                    </div>
                ` : `
                    <img src="${firstImage}" 
                         loading="lazy"
                         style="width: 100%; height: 100%; object-fit: cover;"
                         onerror="this.src='${defaultImage}'; this.onerror=null;"
                         alt="${window.SharedCore ? window.SharedCore.escapeHtml(property.title) : property.title}">
                `}
            </div>
            <div style="flex: 3; min-width: 180px;">
                <strong style="color: var(--primary); font-size: 0.9rem; display: block; margin-bottom: 0.3rem;">
                    ${window.SharedCore ? window.SharedCore.escapeHtml(property.title) : property.title}
                </strong>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.3rem;">
                    <small style="background: #e9ecef; padding: 0.2rem 0.5rem; border-radius: 4px;">
                        <i class="fas fa-tag"></i> ${property.price}
                    </small>
                    <small style="background: #e9ecef; padding: 0.2rem 0.5rem; border-radius: 4px;">
                        <i class="fas fa-map-marker-alt"></i> ${property.location.substring(0, 40)}${property.location.length > 40 ? '...' : ''}
                    </small>
                </div>
                <div style="font-size: 0.65rem; color: #666; display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.2rem;">
                    <span><i class="fas fa-id-card"></i> ID: ${property.id}</span>
                    ${property.has_video ? '<span style="color: #9b59b6;"><i class="fas fa-video"></i> Tem vídeo</span>' : ''}
                    <span><i class="fas fa-images"></i> Imagens: ${property.images ? property.images.split(',').filter(i => i && i.trim() && i !== 'EMPTY').length : 0}</span>
                    ${property.pdfs && property.pdfs !== 'EMPTY' ? `<span><i class="fas fa-file-pdf"></i> PDFs: ${property.pdfs.split(',').filter(p => p && p.trim() && p !== 'EMPTY').length}</span>` : ''}
                    <span><i class="fas fa-eye"></i> <strong>Visualizações: ${viewCount}</strong></span>
                    ${lastView ? `<span><i class="fas fa-clock"></i> Última: ${new Date(lastView).toLocaleDateString('pt-BR')}</span>` : ''}
                    <!-- NOVO: Indicador de Tempo de Mercado -->
                    <span style="display: inline-flex; align-items: center; gap: 0.3rem; background: ${marketTime.color}20; padding: 0.15rem 0.4rem; border-radius: 12px; border-left: 3px solid ${marketTime.color};">
                        <i class="fas fa-hourglass-half" style="color: ${marketTime.color};"></i>
                        <strong style="color: ${marketTime.color};">${marketTime.text}</strong>
                        <small style="color: ${marketTime.color};">(${marketTime.status})</small>
                    </span>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; flex-shrink: 0;">
                <button onclick="editProperty(${property.id})" 
                        style="background: var(--accent); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer; font-size: 0.75rem;">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="if(window.resetGalleryViews) window.resetGalleryViews(${property.id}, '${property.title.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')" 
                        style="background: #e67e22; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer; font-size: 0.75rem;">
                    <i class="fas fa-eye-slash"></i> Zerar views
                </button>
                <button onclick="deleteProperty(${property.id})" 
                        style="background: #e74c3c; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer; font-size: 0.75rem;">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        listContainer.appendChild(item);
    });
    
    container.appendChild(listContainer);
    
    if (totalPages > 1) {
        const paginationWrapper = document.createElement('div');
        paginationWrapper.style.cssText = 'margin-top: 1rem; padding-top: 0.5rem; border-top: 1px solid #e0e0e0;';
        const paginationBottom = createPaginationControls(totalPages, page, itemsPerPage);
        paginationWrapper.appendChild(paginationBottom);
        container.appendChild(paginationWrapper);
    }
    
    console.log(`✅ Página ${page}/${totalPages} - ${paginatedProperties.length} imóveis exibidos (${itemsPerPage} por página, total: ${totalItems})`);
};

// ========== FUNÇÃO DE PAGINAÇÃO PADRÃO DE MERCADO (CORRIGIDA) ==========
function createPaginationControls(totalPages, currentPage, itemsPerPage = null) {
    const paginationDiv = document.createElement('div');
    paginationDiv.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin: 1rem 0 0.5rem 0; flex-wrap: wrap; padding: 0.5rem 0.2rem; position: relative; z-index: 10;';
    
    const isMobile = window.innerWidth <= 768;
    const currentItemsPerPage = itemsPerPage || (isMobile ? 3 : window.adminItemsPerPage || 4);
    
    // Botão Primeira Página (<<)
    const firstBtn = document.createElement('button');
    firstBtn.innerHTML = '<i class="fas fa-angle-double-left"></i>';
    firstBtn.style.cssText = 'background: var(--primary); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s ease;';
    firstBtn.disabled = currentPage === 1;
    if (currentPage === 1) firstBtn.style.opacity = '0.5';
    firstBtn.onclick = () => window.loadPropertyList(1);
    paginationDiv.appendChild(firstBtn);
    
    // Botão Anterior (<)
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.style.cssText = 'background: var(--primary); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s ease;';
    prevBtn.disabled = currentPage === 1;
    if (currentPage === 1) prevBtn.style.opacity = '0.5';
    prevBtn.onclick = () => window.loadPropertyList(currentPage - 1);
    paginationDiv.appendChild(prevBtn);
    
    // Determinar intervalo de páginas visíveis (máximo 5)
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    // Ajustar se o final ultrapassou o limite
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    // LÓGICA CORRIGIDA: Mostrar primeira página e ellipsis se necessário
    if (startPage > 1) {
        // Botão da página 1
        const firstPageSpan = document.createElement('button');
        firstPageSpan.textContent = '1';
        firstPageSpan.style.cssText = 'background: #e9ecef; color: var(--text); border: none; padding: 0.3rem 0.7rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s ease; min-width: 32px; text-align: center;';
        firstPageSpan.onclick = () => window.loadPropertyList(1);
        paginationDiv.appendChild(firstPageSpan);
        
        // Ellipsis no início (se houver páginas ocultas entre 1 e startPage)
        if (startPage > 2) {
            const startEllipsis = document.createElement('span');
            startEllipsis.textContent = '...';
            startEllipsis.style.cssText = 'padding: 0.3rem 0.2rem; color: #666; font-size: 0.8rem; user-select: none;';
            startEllipsis.onclick = null; // Não é clicável
            paginationDiv.appendChild(startEllipsis);
        }
    }
    
    // Páginas do intervalo central
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.style.cssText = `background: ${i === currentPage ? '#f39c12' : '#e9ecef'}; color: ${i === currentPage ? 'white' : '#2c3e50'}; border: none; padding: 0.3rem 0.7rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s ease; font-weight: ${i === currentPage ? 'bold' : 'normal'}; min-width: 32px;`;
        pageBtn.onclick = () => window.loadPropertyList(i);
        paginationDiv.appendChild(pageBtn);
    }
    
    // LÓGICA CORRIGIDA: Mostrar ellipsis no final e última página
    if (endPage < totalPages) {
        // Ellipsis no final (se houver páginas ocultas entre endPage e totalPages)
        if (endPage < totalPages - 1) {
            const endEllipsis = document.createElement('span');
            endEllipsis.textContent = '...';
            endEllipsis.style.cssText = 'padding: 0.3rem 0.2rem; color: #666; font-size: 0.8rem; user-select: none;';
            endEllipsis.onclick = null; // Não é clicável
            paginationDiv.appendChild(endEllipsis);
        }
        
        // Botão da última página
        const lastPageSpan = document.createElement('button');
        lastPageSpan.textContent = totalPages;
        lastPageSpan.style.cssText = 'background: #e9ecef; color: var(--text); border: none; padding: 0.3rem 0.7rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s ease; min-width: 32px; text-align: center;';
        lastPageSpan.onclick = () => window.loadPropertyList(totalPages);
        paginationDiv.appendChild(lastPageSpan);
    }
    
    // Botão Próximo (>)
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.style.cssText = 'background: var(--primary); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s ease;';
    nextBtn.disabled = currentPage === totalPages;
    if (currentPage === totalPages) nextBtn.style.opacity = '0.5';
    nextBtn.onclick = () => window.loadPropertyList(currentPage + 1);
    paginationDiv.appendChild(nextBtn);
    
    // Botão Última Página (>>)
    const lastBtn = document.createElement('button');
    lastBtn.innerHTML = '<i class="fas fa-angle-double-right"></i>';
    lastBtn.style.cssText = 'background: var(--primary); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s ease;';
    lastBtn.disabled = currentPage === totalPages;
    if (currentPage === totalPages) lastBtn.style.opacity = '0.5';
    lastBtn.onclick = () => window.loadPropertyList(totalPages);
    paginationDiv.appendChild(lastBtn);
    
    // Seletor de itens por página
    const perPageSelect = document.createElement('select');
    perPageSelect.style.cssText = 'background: white; border: 1px solid #1a5276; padding: 0.3rem 0.5rem; border-radius: 5px; font-size: 0.75rem; margin-left: 0.5rem; cursor: pointer;';
    perPageSelect.innerHTML = `
        <option value="3" ${currentItemsPerPage === 3 ? 'selected' : ''}>3 por página</option>
        <option value="4" ${currentItemsPerPage === 4 ? 'selected' : ''}>4 por página</option>
        <option value="8" ${currentItemsPerPage === 8 ? 'selected' : ''}>8 por página</option>
        <option value="12" ${currentItemsPerPage === 12 ? 'selected' : ''}>12 por página</option>
    `;
    perPageSelect.onchange = (e) => {
        window.adminItemsPerPage = parseInt(e.target.value);
        window.adminCurrentPage = 1;
        window.loadPropertyList(1);
    };
    paginationDiv.appendChild(perPageSelect);
    
    return paginationDiv;
}

// ========== AUTOCOMPLETE ==========
window.setupLocationAutocomplete = function() {
    if (autocompleteInitialized) return true;
    
    const bairrosMaceio = [
        'Pajuçara, Maceió/AL', 'Ponta Verde, Maceió/AL', 'Jatiúca, Maceió/AL', 'Jacarecica, Maceió/AL', 'Cruz das Almas, Maceió/AL',
        'Mangabeiras, Maceió/AL', 'Poço, Maceió/AL', 'Barro Duro, Maceió/AL', 'Gruta de Lourdes, Maceió/AL', 'Serraria, Maceió/AL',
        'Farol, Maceió/AL', 'Jardim Petrópolis, Maceió/AL', 'Centro, Maceió/AL', 'Prado, Maceió/AL', 'Jaraguá, Maceió/AL', 'Feitosa, Maceió/AL',
        'Pinheiro, Maceió/AL', 'Santa Lúcia, Maceió/AL', 'Santa Amélia, Maceió/AL', 'Tabuleiro do Martins, Maceió/AL',
        'Cidade Universitária, Maceió/AL', 'Clima Bom, Maceió/AL', 'Benedito Bentes, Maceió/AL', 'Santos Dumont, Maceió/AL',
        'São Jorge, Maceió/AL', 'Levada, Maceió/AL', 'Trapiche da Barra, Maceió/AL', 'Vergel do Lago, Maceió/AL',
        'Ouro Preto, Maceió/AL', 'Mutange, Maceió/AL', 'Fernão Velho, Maceió/AL', 'Forene, Maceió/AL', 'Rio Novo, Maceió/AL', 
        'Riacho Doce, Maceió/AL', 'Pontal da Barra, Maceió/AL', 'Guaxuma, Maceió/AL',
        'Ipioca, Maceió/AL', 'Garça Torta, Maceió/AL', 'Pescaria, Maceió/AL', 'Ponta da Terra, Maceió/AL', 
        'São Miguel dos Campos, AL', 'Murilopes, Maceió/AL',
        'Barra de São Miguel, AL', 'Boa Viagem, Recife/PE', 'São Miguel dos Milagres, AL', 'Zona Rural, AL'
    ];

    const locationInput = document.getElementById('propLocation');
    if (!locationInput) return false;
    
    if (locationInput.hasAttribute('data-autocomplete-initialized')) {
        autocompleteInitialized = true;
        window.AUTOCOMPLETE_ACTIVE = true;
        return true;
    }
    
    if (!document.getElementById('admin-autocomplete-style')) {
        const style = document.createElement('style');
        style.id = 'admin-autocomplete-style';
        style.textContent = `
            .admin-location-suggestions {
                position: fixed !important;
                z-index: 9999999 !important;
                background: white !important;
                border: 2px solid #1a5276 !important;
                border-top: none !important;
                border-radius: 0 0 8px 8px !important;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
                max-height: 250px !important;
                overflow-y: auto !important;
            }
            .admin-location-suggestions div {
                padding: 10px 14px !important;
                cursor: pointer !important;
                font-size: 0.9rem !important;
                color: #1a5276 !important;
                background: white !important;
                border-bottom: 1px solid #e0e0e0 !important;
            }
            .admin-location-suggestions div:hover {
                background: #e8f4fd !important;
            }
            .admin-location-suggestions strong {
                color: #c0392b !important;
                background: #fdebd0 !important;
                padding: 2px 4px !important;
                border-radius: 4px !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    let suggestionsContainer = null;
    
    function showSuggestions(searchTerm) {
        if (suggestionsContainer && suggestionsContainer.parentElement) {
            suggestionsContainer.remove();
            suggestionsContainer = null;
        }
        if (!searchTerm || searchTerm.length < 2) return;
        
        const termLower = searchTerm.toLowerCase();
        const matches = bairrosMaceio.filter(b => b.toLowerCase().includes(termLower));
        if (!matches.length) return;
        if (!locationInput) return;
        
        const rect = locationInput.getBoundingClientRect();
        if (rect.bottom === 0 && rect.top === 0) return;
        
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'admin-location-suggestions';
        suggestionsContainer.style.cssText = `
            position: fixed !important;
            top: ${rect.bottom + 5}px !important;
            left: ${rect.left}px !important;
            width: ${locationInput.offsetWidth}px !important;
            z-index: 9999999 !important;
            background: white !important;
            border: 2px solid #1a5276 !important;
            border-top: none !important;
            border-radius: 0 0 8px 8px !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
            max-height: 250px !important;
            overflow-y: auto !important;
        `;
        
        matches.forEach(bairro => {
            const div = document.createElement('div');
            div.style.cssText = `
                padding: 10px 14px !important;
                cursor: pointer !important;
                font-size: 0.9rem !important;
                color: #1a5276 !important;
                background: white !important;
                border-bottom: 1px solid #e0e0e0 !important;
            `;
            div.onmouseenter = () => div.style.background = '#e8f4fd';
            div.onmouseleave = () => div.style.background = 'white';
            
            const escapedTerm = termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedTerm})`, 'gi');
            div.innerHTML = bairro.replace(regex, `<strong style="color:#c0392b; background:#fdebd0; padding:2px 4px; border-radius:4px;">$1</strong>`);
            
            div.onclick = () => {
                locationInput.value = bairro;
                if (suggestionsContainer) {
                    suggestionsContainer.remove();
                    suggestionsContainer = null;
                }
                locationInput.dispatchEvent(new Event('input', { bubbles: true }));
                locationInput.dispatchEvent(new Event('change', { bubbles: true }));
            };
            
            suggestionsContainer.appendChild(div);
        });
        
        document.body.appendChild(suggestionsContainer);
    }
    
    function hideSuggestions() {
        if (suggestionsContainer) {
            suggestionsContainer.remove();
            suggestionsContainer = null;
        }
    }
    
    locationInput.addEventListener('input', function(e) { showSuggestions(e.target.value); });
    locationInput.addEventListener('blur', function() { setTimeout(hideSuggestions, 200); });
    locationInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && suggestionsContainer) {
            e.preventDefault();
            const first = suggestionsContainer.querySelector('div');
            if (first) {
                locationInput.value = first.textContent;
                hideSuggestions();
                locationInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    });
    
    window.addEventListener('scroll', hideSuggestions, { passive: true });
    window.addEventListener('resize', hideSuggestions);
    
    locationInput.setAttribute('data-autocomplete-initialized', 'true');
    locationInput.placeholder = 'Digite o bairro (ex: Ponta Verde)';
    
    autocompleteInitialized = true;
    window.AUTOCOMPLETE_ACTIVE = true;
    
    return true;
};

function ensureAutocomplete(retries = 5, delay = 100) {
    if (document.getElementById('propLocation')) {
        if (window.setupLocationAutocomplete && window.setupLocationAutocomplete()) {
            startHealthCheck();
            return true;
        }
    }
    if (retries > 0) {
        setTimeout(() => ensureAutocomplete(retries - 1, delay * 2), delay);
    }
    return false;
}

window.setupForm = function() {
    const form = document.getElementById('propertyForm');
    if (!form) return;
    
    if (window.setupPriceAutoFormat) window.setupPriceAutoFormat();
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn?.innerHTML;
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...'; }
        const loading = window.LoadingManager?.show?.('Salvando Imóvel...', 'Por favor, aguarde...', { variant: 'processing' });
        try { await window.saveProperty(); }
        catch (error) { console.error('[ADMIN] ❌ Erro no salvamento:', error); if (typeof window.showAdminNotification === 'function') window.showAdminNotification(`❌ ${error.message}`, 'error', 5000); }
        finally {
            if (submitBtn) setTimeout(() => { submitBtn.disabled = false; submitBtn.innerHTML = originalText || (window.editingPropertyId ? '<i class="fas fa-save"></i> Salvar Alterações' : '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site'); }, 1000);
            if (loading) loading.hide();
        }
    });
    
    setTimeout(() => { ensureAutocomplete(5, 100); }, 200);
};

window.setupAdminUI = function() {
    const panel = document.getElementById('adminPanel');
    if (panel) panel.style.display = 'none';
    
    const adminBtn = document.querySelector('.admin-toggle');
    if (adminBtn) {
        adminBtn.onclick = function(e) { 
            e.preventDefault(); 
            e.stopPropagation(); 
            window.toggleAdminPanel(); 
        };
    }
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.onclick = function(e) { 
            e.preventDefault(); 
            e.stopPropagation(); 
            window.cancelEdit(); 
        };
        cancelBtn.style.display = 'none';
    }
    
    if (typeof window.setupForm === 'function') setTimeout(window.setupForm, 100);
};

function initializeAdmin() {
    try { 
        const stored = JSON.parse(localStorage.getItem('properties') || '[]'); 
        if (!window.properties && stored.length) window.properties = stored;
    } catch (e) { 
        console.error('[ADMIN] Erro ao carregar do localStorage:', e); 
    }
    
    window.setupAdminUI();
    setTimeout(() => { ensureAutocomplete(5, 100); }, 600);
}

window.diagnoseAutocomplete = window.diagnoseAutocomplete;
window.getAutocompleteStatus = () => window.AUTOCOMPLETE_ACTIVE;
window.stopHealthCheck = stopHealthCheck;
window.switchToManageTab = switchToManageTab;
window.switchToFormTab = switchToFormTab;

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeAdmin);
else initializeAdmin();
