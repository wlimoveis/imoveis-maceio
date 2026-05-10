console.log('✅ admin.js carregado');

const ADMIN_CONFIG = { password: "wl654", panelId: "adminPanel", buttonClass: "admin-toggle" };
window.editingPropertyId = null;

// ========== FUNÇÕES DE TROCA DE ABA (GARANTIDAS) ==========
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
        console.log('✅ Mudou para aba INCLUIR/EDITAR');
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
        console.log('✅ Mudou para aba GERENCIAR');
    }
}

window.toggleAdminPanel = function() {
    const password = prompt("🔒 Acesso ao Painel do Corretor\n\nDigite a senha:");
    if (!password) return;
    if (password !== ADMIN_CONFIG.password) return alert('❌ Senha incorreta!');
    
    const panel = document.getElementById(ADMIN_CONFIG.panelId);
    if (panel) {
        const isVisible = panel.style.display === 'block';
        if (!isVisible) {
            window.resetAdminFormCompletely(false);
            setTimeout(switchToManageTab, 50);
        }
        panel.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            setTimeout(() => {
                panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (typeof window.loadPropertyList === 'function') window.loadPropertyList();
            }, 300);
        }
    }
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
        } catch (error) { console.error('Erro ao resetar MediaSystem:', error); }
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
        const panel = document.getElementById('adminPanel');
        if (panel && panel.style.display !== 'block') {
            panel.style.display = 'block';
        }
        const formElement = document.getElementById('propertyForm');
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 150);
    
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
    console.group('💾 SALVANDO IMÓVEL');
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
        console.error('❌ Erro ao salvar imóvel:', error);
        if (typeof window.showAdminNotification === 'function') window.showAdminNotification(`❌ Erro: ${error.message}`, 'error', 5000);
        else alert(`❌ Erro: ${error.message}`);
    } finally { console.groupEnd(); }
};

// ========== AUTOCOMPLETE COM CSS FORÇADO ==========
window.setupLocationAutocomplete = function() {
    console.log('🔧 setupLocationAutocomplete chamado');
    
    // Adicionar estilo global para garantir que o dropdown apareça
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
                box-sizing: border-box !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
            .admin-location-suggestions div {
                padding: 10px 14px !important;
                cursor: pointer !important;
                font-size: 0.9rem !important;
                color: #1a5276 !important;
                background: white !important;
                border-bottom: 1px solid #e0e0e0 !important;
                transition: background 0.2s ease !important;
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
        console.log('✅ Estilo global do autocomplete adicionado');
    }
    
    const bairrosMaceio = [
        'Pajuçara, Maceió/AL', 'Ponta Verde, Maceió/AL', 'Jatiúca, Maceió/AL', 'Jacarecica, Maceió/AL', 'Cruz das Almas, Maceió/AL',
        'Mangabeiras, Maceió/AL', 'Poço, Maceió/AL', 'Barro Duro, Maceió/AL', 'Gruta de Lourdes, Maceió/AL', 'Serraria, Maceió/AL',
        'Farol, Maceió/AL', 'Jardim Petrópolis, Maceió/AL', 'Centro, Maceió/AL', 'Prado, Maceió/AL', 'Jaraguá, Maceió/AL', 'Feitosa, Maceió/AL',
        'Pinheiro, Maceió/AL', 'Santa Lúcia, Maceió/AL', 'Santa Amélia, Maceió/AL', 'Tabuleiro do Martins, Maceió/AL',
        'Cidade Universitária, Maceió/AL', 'Clima Bom, Maceió/AL', 'Benedito Bentes, Maceió/AL', 'Santos Dumont, Maceió/AL',
        'São Jorge, Maceió/AL', 'Levada, Maceió/AL', 'Trapiche da Barra, Maceió/AL', 'Vergel do Lago, Maceió/AL',
        'Ouro Preto, Maceió/AL', 'Mutange, Maceió/AL', 'Fernão Velho, Maceió/AL', 'Forene, Maceió/AL', 'Rio Novo, Maceió/AL'
    ];

    const locationInput = document.getElementById('propLocation');
    if (!locationInput) {
        console.warn('⚠️ Campo propLocation não encontrado');
        return false;
    }
    
    if (locationInput.hasAttribute('data-autocomplete-initialized')) {
        console.log('ℹ️ Autocomplete já inicializado neste campo');
        return true;
    }
    
    console.log('📝 Configurando autocomplete no campo:', locationInput);
    
    let suggestionsContainer = null;
    
    function showSuggestions(searchTerm) {
        // Limpar container anterior se existir
        if (suggestionsContainer && suggestionsContainer.parentElement) {
            suggestionsContainer.remove();
            suggestionsContainer = null;
        }
        
        if (!searchTerm || searchTerm.length < 2) return;
        
        const termLower = searchTerm.toLowerCase();
        const matches = bairrosMaceio.filter(b => b.toLowerCase().includes(termLower));
        if (!matches.length) return;
        
        if (!locationInput) return;
        
        // Obter posição do campo
        const rect = locationInput.getBoundingClientRect();
        
        // Se o campo não estiver visível, não mostrar dropdown
        if (rect.bottom === 0 && rect.top === 0) {
            console.log('⏸️ Campo não visível, dropdown não será mostrado');
            return;
        }
        
        // Criar novo container
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'admin-location-suggestions';
        
        // Estilos inline forçados
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
            box-sizing: border-box !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
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
                transition: background 0.2s ease !important;
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
                console.log('📍 Bairro selecionado:', bairro);
            };
            
            suggestionsContainer.appendChild(div);
        });
        
        document.body.appendChild(suggestionsContainer);
        console.log(`📋 ${matches.length} sugestões para "${searchTerm}" - top=${rect.bottom + 5}px, left=${rect.left}px, width=${locationInput.offsetWidth}px`);
        
        // Debug: verificar se o elemento foi realmente adicionado
        console.log('✅ Dropdown adicionado ao body:', suggestionsContainer);
        console.log('📐 Dimensões do dropdown:', suggestionsContainer.getBoundingClientRect());
    }
    
    function hideSuggestions() {
        if (suggestionsContainer) {
            suggestionsContainer.remove();
            suggestionsContainer = null;
        }
    }
    
    // Configurar eventos
    locationInput.addEventListener('input', function(e) {
        showSuggestions(e.target.value);
    });
    
    locationInput.addEventListener('blur', function() {
        setTimeout(hideSuggestions, 200);
    });
    
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
    
    // Fechar dropdown ao rolar ou redimensionar
    window.addEventListener('scroll', hideSuggestions, { passive: true });
    window.addEventListener('resize', hideSuggestions);
    
    locationInput.setAttribute('data-autocomplete-initialized', 'true');
    locationInput.placeholder = 'Digite o bairro (ex: Ponta Verde)';
    
    console.log('✅ Autocomplete configurado com sucesso!');
    return true;
};

function ensureAutocomplete(retries = 10, delay = 500) {
    if (document.getElementById('propLocation')) {
        if (window.setupLocationAutocomplete && window.setupLocationAutocomplete()) {
            console.log('✅ Autocomplete configurado com sucesso!');
            return true;
        }
    }
    
    if (retries > 0) {
        setTimeout(() => ensureAutocomplete(retries - 1, delay), delay);
    } else {
        console.error('❌ Falha ao configurar autocomplete após múltiplas tentativas');
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
        catch (error) { console.error('❌ Erro no salvamento:', error); if (typeof window.showAdminNotification === 'function') window.showAdminNotification(`❌ ${error.message}`, 'error', 5000); }
        finally {
            if (submitBtn) setTimeout(() => { submitBtn.disabled = false; submitBtn.innerHTML = originalText || (window.editingPropertyId ? '<i class="fas fa-save"></i> Salvar Alterações' : '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site'); }, 1000);
            if (loading) loading.hide();
        }
    });
    
    setTimeout(() => {
        ensureAutocomplete(10, 500);
    }, 200);
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
    try { const stored = JSON.parse(localStorage.getItem('properties') || '[]'); if (!window.properties && stored.length) window.properties = stored; }
    catch (e) { console.error('Erro ao carregar do localStorage:', e); }
    window.setupAdminUI();
    setTimeout(() => {
        ensureAutocomplete(10, 500);
    }, 600);
}

window.switchToManageTab = switchToManageTab;
window.switchToFormTab = switchToFormTab;

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeAdmin);
else initializeAdmin();
