console.log('✅ admin.js carregado');

const ADMIN_CONFIG = { password: "wl654", panelId: "adminPanel", buttonClass: "admin-toggle" };
window.editingPropertyId = null;

window.toggleAdminPanel = function() {
    const password = prompt("🔒 Acesso ao Painel do Corretor\n\nDigite a senha:");
    if (!password) return;
    if (password !== ADMIN_CONFIG.password) return alert('❌ Senha incorreta!');
    
    const panel = document.getElementById(ADMIN_CONFIG.panelId);
    if (panel) {
        const isVisible = panel.style.display === 'block';
        if (!isVisible) window.resetAdminFormCompletely(false);
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

// ========== FUNÇÃO CANCEL EDIT CORRIGIDA ==========
window.cancelEdit = function() {
    console.log('🔧 cancelEdit chamado. editingPropertyId:', window.editingPropertyId);
    
    if (window.editingPropertyId) {
        if (confirm('❓ Cancelar edição?\n\nTodos os dados não salvos serão perdidos.')) {
            window.resetAdminFormCompletely(true);
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
        if (panel) {
            panel.style.display = 'block';
            panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            setTimeout(() => window.resetAdminFormCompletely(true), 1500);
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

window.setupLocationAutocomplete = function() {
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
    if (!locationInput || locationInput.hasAttribute('data-autocomplete-initialized')) return false;
    
    let suggestionsContainer = null;
    function createSuggestionsContainer() {
        const container = document.createElement('div');
        container.className = 'admin-location-suggestions';
        container.style.cssText = `position:absolute !important; z-index:9999999 !important; background:#fff !important; border:2px solid #1a5276 !important; border-top:none !important; max-height:250px !important; overflow-y:auto !important; box-shadow:0 4px 15px rgba(0,0,0,0.3) !important; border-radius:0 0 8px 8px !important;`;
        return container;
    }

    function showSuggestions(searchTerm) {
        if (!searchTerm || searchTerm.length < 2) { if (suggestionsContainer) suggestionsContainer.remove(); return; }
        const termLower = searchTerm.toLowerCase();
        const matches = bairrosMaceio.filter(b => b.toLowerCase().includes(termLower));
        if (!matches.length) { if (suggestionsContainer) suggestionsContainer.remove(); return; }
        
        let parentContainer = locationInput.parentElement;
        while (parentContainer && parentContainer !== document.body && getComputedStyle(parentContainer).position !== 'relative') parentContainer = parentContainer.parentElement;
        if (parentContainer === document.body) parentContainer = locationInput.parentElement;
        if (getComputedStyle(parentContainer).position !== 'relative') parentContainer.style.position = 'relative';
        
        if (!suggestionsContainer) suggestionsContainer = createSuggestionsContainer();
        if (suggestionsContainer.parentElement !== parentContainer) parentContainer.appendChild(suggestionsContainer);
        
        const inputRect = locationInput.getBoundingClientRect();
        const parentRect = parentContainer.getBoundingClientRect();
        suggestionsContainer.style.top = `${inputRect.bottom - parentRect.top}px`;
        suggestionsContainer.style.left = `${inputRect.left - parentRect.left}px`;
        suggestionsContainer.style.width = `${locationInput.offsetWidth}px`;
        suggestionsContainer.style.display = 'block';
        suggestionsContainer.innerHTML = '';
        
        matches.forEach(bairro => {
            const div = document.createElement('div');
            div.style.cssText = `padding:10px 14px !important; cursor:pointer !important; font-size:0.9rem !important; color:#1a5276 !important; background:#fff !important; border-bottom:1px solid #e0e0e0 !important;`;
            const regex = new RegExp(`(${termLower})`, 'gi');
            div.innerHTML = bairro.replace(regex, `<strong style="color:#c0392b; background:#fdebd0; padding:2px 4px; border-radius:4px;">$1</strong>`);
            div.onclick = () => { locationInput.value = bairro; if (suggestionsContainer) suggestionsContainer.remove(); suggestionsContainer = null; locationInput.dispatchEvent(new Event('input', { bubbles: true })); };
            div.onmouseenter = () => div.style.background = '#e8f4fd';
            div.onmouseleave = () => div.style.background = '#fff';
            suggestionsContainer.appendChild(div);
        });
    }
    
    function hideSuggestions() { if (suggestionsContainer) { suggestionsContainer.remove(); suggestionsContainer = null; } }
    
    locationInput.addEventListener('input', e => showSuggestions(e.target.value));
    locationInput.addEventListener('blur', () => setTimeout(hideSuggestions, 200));
    locationInput.addEventListener('keydown', e => { if (e.key === 'Enter' && suggestionsContainer) { e.preventDefault(); const first = suggestionsContainer.querySelector('div'); if (first) { locationInput.value = first.textContent; hideSuggestions(); } } });
    locationInput.setAttribute('data-autocomplete-initialized', 'true');
    locationInput.placeholder = 'Digite o bairro (ex: Ponta Verde)';
    return true;
};

window.setupForm = function() {
    const form = document.getElementById('propertyForm');
    if (!form) return;
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    if (window.setupPriceAutoFormat) window.setupPriceAutoFormat();
    document.getElementById('propertyForm').addEventListener('submit', async function(e) {
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
};

// ========== SETUP ADMIN UI CORRIGIDO ==========
window.setupAdminUI = function() {
    const panel = document.getElementById('adminPanel');
    if (panel) panel.style.display = 'none';
    
    const adminBtn = document.querySelector('.admin-toggle');
    if (adminBtn) {
        const newBtn = adminBtn.cloneNode(true);
        adminBtn.parentNode.replaceChild(newBtn, adminBtn);
        document.querySelector('.admin-toggle').onclick = function(e) { 
            e.preventDefault(); 
            e.stopPropagation(); 
            window.toggleAdminPanel(); 
        };
    }
    
    // CORREÇÃO: Garantir que o botão cancelar tenha o evento corretamente
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        // Remover eventos antigos clonando
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        // Adicionar evento correto
        const freshCancelBtn = document.getElementById('cancelEditBtn');
        freshCancelBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🛑 Botão Cancelar clicado');
            window.cancelEdit();
        };
        freshCancelBtn.style.display = 'none';
        console.log('✅ Botão Cancelar configurado');
    } else {
        console.warn('⚠️ Botão Cancelar não encontrado no DOM');
    }
    
    if (typeof window.setupForm === 'function') setTimeout(window.setupForm, 100);
};

function initializeAdmin() {
    try { const stored = JSON.parse(localStorage.getItem('properties') || '[]'); if (!window.properties && stored.length) window.properties = stored; }
    catch (e) { console.error('Erro ao carregar do localStorage:', e); }
    window.setupAdminUI();
    setTimeout(() => { if (typeof window.setupLocationAutocomplete === 'function') window.setupLocationAutocomplete(); }, 500);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeAdmin);
else initializeAdmin();
