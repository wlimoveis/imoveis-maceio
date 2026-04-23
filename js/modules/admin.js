// js/modules/admin.js - VERSÃO FINAL OTIMIZADA COM AUTOCOMPLETE DELEGADO E INICIALIZAÇÃO SOB DEMANDA
console.log('🔧 admin.js - Versão core com autocomplete delegado e inicialização sob demanda');

/* ==========================================================
   CONFIGURAÇÃO E CONSTANTES
   ========================================================== */
const ADMIN_CONFIG = {
    password: "wl654",
    panelId: "adminPanel",
    buttonClass: "admin-toggle"
};

// Estado global
window.editingPropertyId = null;

/* ==========================================================
   FUNÇÃO PRINCIPAL: TOGGLE ADMIN PANEL (COM INICIALIZAÇÃO SOB DEMANDA)
   ========================================================== */
window.toggleAdminPanel = function() {
    console.log('🔧 toggleAdminPanel chamada');
    const password = prompt("🔒 Acesso ao Painel do Corretor\n\nDigite a senha:");
    if (password === null) return;
    if (password === "") return alert('⚠️ Campo vazio!');
    
    if (password === ADMIN_CONFIG.password) {
        const panel = document.getElementById(ADMIN_CONFIG.panelId);
        if (panel) {
            const isVisible = panel.style.display === 'block';
            
            if (!isVisible) {
                window.resetAdminFormCompletely(false);
            }
            
            panel.style.display = isVisible ? 'none' : 'block';
            
            // ✅ NOVO: Se o painel foi aberto, tentar inicializar/verificar autocomplete
            if (!isVisible) {
                setTimeout(() => {
                    console.log('🔄 [Admin] Painel aberto, verificando autocomplete...');
                    
                    // Tentar ativar o Support System Autocomplete
                    if (window.LocationAutocomplete) {
                        if (typeof window.LocationAutocomplete.runFullDiagnostic === 'function') {
                            // Isso força o sistema a verificar novamente com o painel visível
                            console.log('🔍 [Admin] Executando diagnóstico completo...');
                            window.LocationAutocomplete.runFullDiagnostic();
                        } else if (typeof window.LocationAutocomplete.init === 'function') {
                            // Inicializar se disponível
                            console.log('🚀 [Admin] Inicializando autocomplete...');
                            window.LocationAutocomplete.init();
                        } else if (typeof window.LocationAutocomplete.checkAndInitialize === 'function') {
                            // Verificar e inicializar
                            console.log('🔧 [Admin] Verificando e inicializando...');
                            window.LocationAutocomplete.checkAndInitialize();
                        } else {
                            // Fallback: apenas chamar o setup do Core (que delegará)
                            if (typeof window.setupLocationAutocomplete === 'function') {
                                window.setupLocationAutocomplete();
                            }
                        }
                    } else {
                        // Support System não carregado, usar fallback do Core
                        if (typeof window.setupLocationAutocomplete === 'function') {
                            console.log('📝 [Admin] Support System não encontrado, usando fallback do Core');
                            window.setupLocationAutocomplete();
                        }
                    }
                }, 200);
            }
            
            if (!isVisible) {
                setTimeout(() => {
                    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    if (typeof window.loadPropertyList === 'function') window.loadPropertyList();
                }, 300);
            }
        }
    } else {
        alert('❌ Senha incorreta!');
    }
};

/* ==========================================================
   FUNÇÃO PARA LIMPAR FORMULÁRIO
   ========================================================== */
window.resetAdminFormCompletely = function(showNotification = true) {
    console.log('🧹 RESET COMPLETO DO FORMULÁRIO');
    
    if (window.SupportCoreUtils?.manageEditingState) {
        window.SupportCoreUtils.manageEditingState(null);
    } else {
        window.editingPropertyId = null;
    }
    
    const fields = [
        'propTitle', 'propPrice', 'propLocation', 'propDescription',
        'propFeatures', 'propType', 'propBadge', 'propHasVideo'
    ];
    
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (el.type === 'select-one') {
                el.value = el.id === 'propType' ? 'residencial' : 'Novo';
            } else if (el.type === 'checkbox') {
                el.checked = false;
            } else {
                el.value = '';
            }
        }
    });
    
    if (window.MediaSystem) {
        try {
            if (typeof window.MediaSystem.resetState === 'function') {
                window.MediaSystem.resetState();
            }
            
            ['uploadPreview', 'pdfUploadPreview'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = '';
            });
        } catch (error) {
            console.error('Erro ao resetar MediaSystem:', error);
        }
    }
    
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.textContent = 'Adicionar Novo Imóvel';
    
    const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site';
        submitBtn.style.background = '#27ae60';
    }
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
    
    setTimeout(() => {
        const form = document.getElementById('propertyForm');
        if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    if (showNotification && typeof window.showAdminNotification === 'function') {
        window.showAdminNotification('✅ Formulário limpo para novo imóvel', 'info');
    }
    
    return true;
};

/* ==========================================================
   FUNÇÃO DE CANCELAMENTO
   ========================================================== */
window.cancelEdit = function() {
    if (window.editingPropertyId) {
        if (confirm('❓ Cancelar edição?\n\nTodos os dados não salvos serão perdidos.')) {
            console.log('❌ Cancelando edição do imóvel:', window.editingPropertyId);
            window.resetAdminFormCompletely(true);
            return true;
        }
    } else {
        console.log('ℹ️ Nenhuma edição em andamento para cancelar');
        window.resetAdminFormCompletely(false);
    }
    return false;
};

/* ==========================================================
   FUNÇÃO EDIT PROPERTY
   ========================================================== */
window.editProperty = function(id) {
    console.log('✏️ Iniciando edição do imóvel ID:', id);
    
    const property = window.properties?.find(p => p.id === id);
    if (!property) {
        if (typeof window.showAdminNotification === 'function') {
            window.showAdminNotification('❌ Imóvel não encontrado!', 'error', 3000);
        } else {
            alert('❌ Imóvel não encontrado!');
        }
        return false;
    }
    
    window.resetAdminFormCompletely(false);
    
    const formatPrice = (price) => {
        if (window.SharedCore?.PriceFormatter?.formatForAdmin) {
            return window.SharedCore.PriceFormatter.formatForAdmin(price);
        }
        return price || '';
    };
    
    const formatFeatures = (features) => {
        return window.SharedCore?.formatFeaturesForDisplay?.(features) ?? features ?? '';
    };
    
    const fieldMappings = {
        'propTitle': property.title || '',
        'propPrice': formatPrice(property.price) || '',
        'propLocation': property.location || '',
        'propDescription': property.description || '',
        'propFeatures': formatFeatures(property.features) || '',
        'propType': property.type || 'residencial',
        'propBadge': property.badge || 'Novo',
        'propHasVideo': window.SharedCore?.ensureBooleanVideo?.(property.has_video) ?? false
    };
    
    Object.entries(fieldMappings).forEach(([fieldId, value]) => {
        const element = document.getElementById(fieldId);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = Boolean(value);
            } else {
                element.value = value;
            }
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
    if (cancelBtn) {
        cancelBtn.style.display = 'inline-block';
    }
    
    if (window.SupportCoreUtils?.manageEditingState) {
        window.SupportCoreUtils.manageEditingState(property.id);
    } else {
        window.editingPropertyId = property.id;
    }
    
    if (window.MediaSystem && typeof window.MediaSystem.loadExisting === 'function') {
        window.MediaSystem.loadExisting(property);
    }
    
    setTimeout(() => {
        const panel = document.getElementById('adminPanel');
        if (panel) {
            panel.style.display = 'block';
            panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 150);
    
    console.log('✅ Modo edição ativado para imóvel ID:', property.id);
    return true;
};

/* ==========================================================
   FUNÇÃO PRINCIPAL DE SALVAMENTO
   ========================================================== */
window.saveProperty = async function() {
    console.group('💾 SALVANDO IMÓVEL');
    
    try {
        const propertyData = {};
        
        const videoCheckbox = document.getElementById('propHasVideo');
        propertyData.has_video = window.SharedCore?.ensureBooleanVideo?.(videoCheckbox?.checked) ?? false;
        
        const fields = [
            { id: 'propTitle', key: 'title' },
            { id: 'propPrice', key: 'price' },
            { id: 'propLocation', key: 'location' },
            { id: 'propDescription', key: 'description' },
            { id: 'propFeatures', key: 'features' },
            { id: 'propType', key: 'type' },
            { id: 'propBadge', key: 'badge' }
        ];
        
        fields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) {
                if (element.type === 'select-one') {
                    propertyData[field.key] = element.value;
                } else {
                    propertyData[field.key] = element.value.trim();
                }
            } else {
                propertyData[field.key] = '';
            }
        });
        
        if (!propertyData.title || !propertyData.price || !propertyData.location) {
            throw new Error('Preencha Título, Preço e Localização!');
        }
        
        if (window.SharedCore?.PriceFormatter?.formatForAdmin) {
            propertyData.price = window.SharedCore.PriceFormatter.formatForAdmin(propertyData.price);
        }
        
        propertyData.features = window.SharedCore?.parseFeaturesForStorage?.(propertyData.features) ?? '[]';
        
        let imageUrls = '';
        let pdfUrls = '';
        
        if (window.MediaSystem) {
            const hasSupabase = window.SUPABASE_CONSTANTS && 
                              window.SUPABASE_CONSTANTS.URL && 
                              window.SUPABASE_CONSTANTS.KEY;
            
            if (hasSupabase) {
                try {
                    const uploadResult = await MediaSystem.uploadAll(
                        window.editingPropertyId || 'temp_' + Date.now(),
                        propertyData.title || 'Imóvel'
                    );
                    
                    if (uploadResult.success) {
                        imageUrls = uploadResult.images;
                        pdfUrls = uploadResult.pdfs;
                    } else {
                        const localResult = MediaSystem.saveAndKeepLocal(
                            window.editingPropertyId || 'temp_' + Date.now(),
                            propertyData.title || 'Imóvel'
                        );
                        imageUrls = localResult.images;
                        pdfUrls = localResult.pdfs;
                    }
                } catch (uploadError) {
                    const localResult = MediaSystem.saveAndKeepLocal(
                        window.editingPropertyId || 'temp_' + Date.now(),
                        propertyData.title || 'Imóvel'
                    );
                    imageUrls = localResult.images;
                    pdfUrls = localResult.pdfs;
                }
            } else {
                const localResult = MediaSystem.saveAndKeepLocal(
                    window.editingPropertyId || 'temp_' + Date.now(),
                    propertyData.title || 'Imóvel'
                );
                imageUrls = localResult.images;
                pdfUrls = localResult.pdfs;
            }
        } else {
            imageUrls = 'EMPTY';
            pdfUrls = 'EMPTY';
        }
        
        propertyData.images = imageUrls || 'EMPTY';
        propertyData.pdfs = pdfUrls || 'EMPTY';
        
        if (window.editingPropertyId) {
            if (typeof window.updateProperty === 'function') {
                try {
                    const updateResult = await window.updateProperty(window.editingPropertyId, propertyData);
                    
                    if (updateResult && updateResult.success) {
                        if (typeof window.showAdminNotification === 'function') {
                            window.showAdminNotification('✅ Imóvel atualizado com sucesso!', 'success', 3000);
                        }
                    } else {
                        if (typeof window.showAdminNotification === 'function') {
                            window.showAdminNotification('⚠️ Imóvel salvo apenas localmente', 'info', 3000);
                        }
                    }
                } catch (supabaseError) {
                    if (typeof window.showAdminNotification === 'function') {
                        window.showAdminNotification('✅ Imóvel salvo localmente (Supabase offline)', 'info', 3000);
                    }
                }
            }
            
            setTimeout(() => {
                if (typeof window.updatePropertyCard === 'function') {
                    window.updatePropertyCard(window.editingPropertyId);
                } else if (typeof window.renderProperties === 'function') {
                    window.renderProperties(window.currentFilter || 'todos');
                }
            }, 300);
            
            setTimeout(() => {
                window.resetAdminFormCompletely(true);
            }, 1500);
            
        } else {
            const newProperty = {
                ...propertyData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            if (typeof window.addNewProperty === 'function') {
                try {
                    const result = await window.addNewProperty(newProperty);
                    
                    if (result) {
                        if (typeof window.showAdminNotification === 'function') {
                            window.showAdminNotification('✅ Imóvel criado com sucesso!', 'success', 3000);
                        }
                        
                        setTimeout(() => {
                            if (typeof window.renderProperties === 'function') {
                                window.renderProperties('todos');
                            }
                        }, 300);
                        
                        setTimeout(() => {
                            window.resetAdminFormCompletely(true);
                        }, 1500);
                        
                    } else {
                        throw new Error('addNewProperty retornou null');
                    }
                    
                } catch (error) {
                    if (typeof window.savePropertyLocalFallback === 'function') {
                        const fallbackResult = await window.savePropertyLocalFallback(newProperty);
                        
                        if (fallbackResult.success) {
                            if (typeof window.showAdminNotification === 'function') {
                                window.showAdminNotification('⚠️ Imóvel salvo apenas localmente', 'info', 3000);
                            }
                            
                            setTimeout(() => {
                                if (typeof window.renderProperties === 'function') {
                                    window.renderProperties('todos');
                                }
                            }, 500);
                        } else {
                            throw new Error(`Falha completa: ${fallbackResult.error}`);
                        }
                    } else {
                        throw error;
                    }
                }
            } else {
                throw new Error('Função addNewProperty não disponível');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao salvar imóvel:', error);
        if (typeof window.showAdminNotification === 'function') {
            window.showAdminNotification(`❌ Erro: ${error.message}`, 'error', 5000);
        } else {
            alert(`❌ Erro: ${error.message}`);
        }
        
    } finally {
        console.groupEnd();
    }
};

/* ==========================================================
   SISTEMA DE AUTOCOMPLETE - DELEGAÇÃO PARA SUPPORT SYSTEM
   ========================================================== */
window.setupLocationAutocomplete = function() {
    console.log('📍 [Core] setupLocationAutocomplete chamado');
    
    // Verificar se Support System já está ativo
    if (window.LocationAutocomplete && typeof window.LocationAutocomplete.isActive === 'function') {
        if (window.LocationAutocomplete.isActive()) {
            console.log('✅ [Core] Autocomplete já gerenciado pelo Support System');
            return true;
        }
        
        // Tentar iniciar o Support System se disponível mas não ativo
        if (typeof window.LocationAutocomplete.init === 'function') {
            console.log('🔄 [Core] Tentando inicializar Support System...');
            window.LocationAutocomplete.init();
            return true;
        } else if (typeof window.LocationAutocomplete.checkAndInitialize === 'function') {
            console.log('🔄 [Core] Verificando e inicializando Support System...');
            window.LocationAutocomplete.checkAndInitialize();
            return true;
        }
    }
    
    // Fallback: NÃO marcar o campo com atributo que bloqueia o Support System
    const locationInput = document.getElementById('propLocation');
    if (locationInput) {
        // ✅ REMOVIDO: locationInput.setAttribute('data-core-fallback', 'true');
        // ✅ Apenas configurar placeholder se estiver vazio
        if (!locationInput.placeholder || locationInput.placeholder === '') {
            locationInput.placeholder = 'Digite a localização do imóvel';
        }
        console.log('📝 [Core] Placeholder configurado, campo pronto para Support System');
    }
    
    return false;
};

/* ==========================================================
   CONFIGURAÇÃO DO FORMULÁRIO
   ========================================================== */
window.setupForm = function() {
    const form = document.getElementById('propertyForm');
    if (!form) {
        console.warn('⚠️ Formulário não encontrado');
        return;
    }
    
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    if (window.setupPriceAutoFormat) window.setupPriceAutoFormat();
    
    const videoCheckbox = document.getElementById('propHasVideo');
    if (videoCheckbox) {
        videoCheckbox.addEventListener('change', function() {
            console.log(`🎬 Checkbox de vídeo alterado: ${this.checked}`);
        });
    }
    
    document.getElementById('propertyForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn?.innerHTML;
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        }
        
        const loading = window.LoadingManager?.show?.('Salvando Imóvel...', 'Por favor, aguarde...', { variant: 'processing' });
        
        try {
            await window.saveProperty();
        } catch (error) {
            console.error('❌ Erro no salvamento:', error);
            if (typeof window.showAdminNotification === 'function') {
                window.showAdminNotification(`❌ ${error.message}`, 'error', 5000);
            }
        } finally {
            if (submitBtn) {
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText || 
                        (window.editingPropertyId ? 
                            '<i class="fas fa-save"></i> Salvar Alterações' : 
                            '<i class="fas fa-plus"></i> Adicionar Imóvel ao Site');
                }, 1000);
            }
            
            if (loading) loading.hide();
        }
    });
};

/* ==========================================================
   SETUP ADMIN UI
   ========================================================== */
window.setupAdminUI = function() {
    console.log('🔧 Configurando UI do admin...');
    
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = 'none';
    }
    
    const adminBtn = document.querySelector('.admin-toggle');
    if (adminBtn) {
        const newBtn = adminBtn.cloneNode(true);
        adminBtn.parentNode.replaceChild(newBtn, adminBtn);
        
        const freshBtn = document.querySelector('.admin-toggle');
        
        freshBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.toggleAdminPanel();
        };
    }
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        const freshCancelBtn = document.getElementById('cancelEditBtn');
        freshCancelBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.cancelEdit();
        };
        freshCancelBtn.style.display = 'none';
    }
    
    if (typeof window.setupForm === 'function') {
        setTimeout(window.setupForm, 100);
    }
};

/* ==========================================================
   INICIALIZAÇÃO
   ========================================================== */

function initializeAdmin() {
    console.log('🚀 Inicializando sistema admin...');
    
    try {
        const stored = JSON.parse(localStorage.getItem('properties') || '[]');
        if (!window.properties && stored.length > 0) {
            window.properties = stored;
        }
    } catch (e) {
        console.error('Erro ao carregar do localStorage:', e);
    }
    
    window.setupAdminUI();
    
    // Não inicializar autocomplete automaticamente - será iniciado quando o painel for aberto
    // Isso evita o problema do campo estar invisível (display: none)
    console.log('📌 [Core] Autocomplete será inicializado quando o painel admin for aberto');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdmin);
} else {
    initializeAdmin();
}

console.log('✅ admin.js - Versão final otimizada com autocomplete sob demanda carregada');
