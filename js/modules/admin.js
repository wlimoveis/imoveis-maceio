// js/modules/admin.js - Versão ESTÁVEL v2.5 COM DIAGNÓSTICO AVANÇADO
// CORREÇÃO DEFINITIVA: Após OK, o painel aparece INSTANTANEAMENTE com aba GERENCIAR ativa
// 🔍 DIAGNÓSTICO AVANÇADO: Localiza EXATAMENTE a fonte do video-indicator

console.log('✅ admin.js carregado - Versão v2.5 (com diagnóstico avançado)');

const ADMIN_CONFIG = { password: "wl654", panelId: "adminPanel", buttonClass: "admin-toggle" };
window.editingPropertyId = null;

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

// ========== AUTOCOMPLETE ==========
window.setupLocationAutocomplete = function() {
    if (autocompleteInitialized) {
        return true;
    }
    
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

// ============================================================
// 🔍 DIAGNÓSTICO AVANÇADO: LOCALIZAR FONTE DO VIDEO-INDICATOR
// ============================================================

window.findVideoIndicatorSource = function() {
    console.group('🔍 [SOURCE-DIAG] LOCALIZANDO FONTE DO VIDEO-INDICATOR');
    
    // 1. Verificar no DOM quantos indicadores existem
    const indicators = document.querySelectorAll('.video-indicator');
    console.log(`📊 Total de indicadores no DOM: ${indicators.length}`);
    
    if (indicators.length === 0) {
        console.log('✅ Nenhum indicador encontrado');
        console.groupEnd();
        return null;
    }
    
    // 2. Analisar cada indicador e extrair informações
    indicators.forEach((el, idx) => {
        console.log(`\n📍 Indicador ${idx + 1}:`);
        console.log(`  - HTML completo: ${el.outerHTML}`);
        console.log(`  - Parent: ${el.parentElement?.tagName || 'N/A'} ${el.parentElement?.className || ''}`);
        console.log(`  - Dentro do property-gallery-container? ${!!el.closest('.property-gallery-container')}`);
        console.log(`  - Closest property-card: ${el.closest('.property-card')?.dataset?.propertyId || 'N/A'}`);
    });
    
    // 3. Buscar no código fonte do properties.js
    console.log('\n🔍 BUSCANDO NO properties.js...');
    fetch('js/modules/properties.js')
        .then(r => r.text())
        .then(code => {
            const lines = code.split('\n');
            let found = [];
            let contextLines = [];
            
            lines.forEach((line, idx) => {
                if (line.includes('video-indicator')) {
                    found.push({ 
                        line: idx + 1, 
                        content: line.trim(),
                        context: lines.slice(Math.max(0, idx - 2), Math.min(lines.length, idx + 3))
                    });
                }
            });
            
            console.log(`📄 Encontradas ${found.length} ocorrências de "video-indicator" em properties.js:`);
            found.forEach(item => {
                console.log(`\n  📍 Linha ${item.line}:`);
                console.log(`  ──────────────────────────────`);
                item.context.forEach((ctx, i) => {
                    const prefix = (i === 2) ? '  >>> ' : '      ';
                    console.log(`${prefix}${ctx.trim()}`);
                });
                console.log(`  ──────────────────────────────`);
            });
            
            // 4. Buscar no gallery.js
            console.log('\n🔍 BUSCANDO NO gallery.js...');
            return fetch('js/modules/gallery.js');
        })
        .then(r => r.text())
        .then(code => {
            const lines = code.split('\n');
            let found = [];
            
            lines.forEach((line, idx) => {
                if (line.includes('video-indicator')) {
                    found.push({ 
                        line: idx + 1, 
                        content: line.trim(),
                        context: lines.slice(Math.max(0, idx - 2), Math.min(lines.length, idx + 3))
                    });
                }
            });
            
            console.log(`📄 Encontradas ${found.length} ocorrências de "video-indicator" em gallery.js:`);
            found.forEach(item => {
                console.log(`\n  📍 Linha ${item.line}:`);
                console.log(`  ──────────────────────────────`);
                item.context.forEach((ctx, i) => {
                    const prefix = (i === 2) ? '  >>> ' : '      ';
                    console.log(`${prefix}${ctx.trim()}`);
                });
                console.log(`  ──────────────────────────────`);
            });
            
            // 5. Resumo final
            console.log('\n📊 RESUMO FINAL:');
            console.log(`  - properties.js: ${found.length} ocorrências`);
            console.log(`  - gallery.js: ${found.length} ocorrências`);
            console.log(`  - Total no DOM: ${indicators.length}`);
            
            if (found.length === 0 && indicators.length > 0) {
                console.warn('⚠️ INDICADORES NO DOM, MAS NENHUM ENCONTRADO NOS ARQUIVOS!');
                console.warn('   Possível fonte: index.html, admin.js, ou Support System');
            }
            
            console.groupEnd();
        })
        .catch(err => {
            console.error('❌ Erro ao buscar arquivos:', err);
            console.groupEnd();
        });
    
    // 5. Verificar se há elementos no index.html
    console.log('\n🔍 VERIFICANDO index.html...');
    const htmlContent = document.documentElement.outerHTML;
    const htmlMatches = htmlContent.match(/video-indicator/g);
    console.log(`📄 index.html: ${htmlMatches ? htmlMatches.length : 0} ocorrências de "video-indicator"`);
    if (htmlMatches && htmlMatches.length > 0) {
        console.warn('⚠️ index.html contém video-indicator inline!');
        const lines = htmlContent.split('\n');
        lines.forEach((line, idx) => {
            if (line.includes('video-indicator')) {
                console.log(`  - Linha ${idx + 1}: ${line.trim().substring(0, 150)}...`);
            }
        });
    }
    
    return indicators.length;
};

// ============================================================
// 🔧 CORREÇÃO DEFINITIVA: REMOVER INDICADORES DUPLICADOS
// ============================================================

window.fixVideoIndicatorDuplicates = function() {
    console.group('🔧 [ADMIN-FIX] CORRIGINDO DUPLICATAS DE VIDEO-INDICATOR');
    
    let removedCount = 0;
    
    // 1. Remover indicadores fora do container
    const outsideIndicators = document.querySelectorAll('.property-image > .video-indicator, .property-image .video-indicator:not(.property-gallery-container .video-indicator)');
    outsideIndicators.forEach(el => {
        console.log('🗑️ Removendo indicador fora do container');
        el.remove();
        removedCount++;
    });
    
    // 2. Remover duplicatas dentro do mesmo container (manter apenas o primeiro)
    const cards = document.querySelectorAll('.property-card');
    cards.forEach(card => {
        const container = card.querySelector('.property-gallery-container');
        if (container) {
            const indicators = container.querySelectorAll('.video-indicator');
            if (indicators.length > 1) {
                indicators.forEach((el, idx) => {
                    if (idx > 0) {
                        console.log(`🗑️ Removendo indicador duplicado ${idx + 1} do container`);
                        el.remove();
                        removedCount++;
                    }
                });
            }
        }
    });
    
    // 3. Verificar resultado
    const remaining = document.querySelectorAll('.video-indicator').length;
    console.log(`✅ ${removedCount} indicador(es) removido(s)`);
    console.log(`📊 ${remaining} indicador(es) restante(s)`);
    
    console.groupEnd();
    return { removed: removedCount, remaining: remaining };
};

// ============================================================
// AUTO-DIAGNÓSTICO NA INICIALIZAÇÃO
// ============================================================

// Executar diagnóstico completo após carregamento
setTimeout(() => {
    console.log('🔍 [ADMIN] Executando diagnóstico avançado de duplicidade...');
    window.findVideoIndicatorSource();
    
    // Verificar se há duplicatas e corrigir
    setTimeout(() => {
        const indicators = document.querySelectorAll('.video-indicator');
        if (indicators.length > 1) {
            console.warn(`⚠️ [ADMIN] ${indicators.length} indicadores encontrados. Aplicando correção...`);
            window.fixVideoIndicatorDuplicates();
        } else if (indicators.length === 1) {
            console.log('✅ [ADMIN] Apenas 1 indicador encontrado - OK');
        } else {
            console.log('✅ [ADMIN] Nenhum indicador encontrado - OK');
        }
    }, 500);
}, 1500);

// ============================================================
// EXPORTAÇÃO DE FUNÇÕES DE DIAGNÓSTICO
// ============================================================

window.findVideoIndicatorSource = window.findVideoIndicatorSource;
window.fixVideoIndicatorDuplicates = window.fixVideoIndicatorDuplicates;

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeAdmin);
else initializeAdmin();

console.log('✅ admin.js - Diagnóstico avançado de duplicidade adicionado');
console.log('   📌 Use window.findVideoIndicatorSource() para localizar a fonte');
console.log('   📌 Use window.fixVideoIndicatorDuplicates() para corrigir');
