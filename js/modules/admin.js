// js/modules/admin.js - VERSÃO COM AUTOCOMPLETE NATIVO E CORES CORRIGIDAS
console.log('🔧 admin.js - Versão core com autocomplete nativo');

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
   FUNÇÃO PRINCIPAL: TOGGLE ADMIN PANEL
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
    
    // Usar função do Support System se disponível (fallback inline)
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
    
    // Atualizar UI
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
    
    // Usar função do Support System se disponível (fallback silencioso)
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
    
    // Formatar preço usando SharedCore
    const formatPrice = (price) => {
        if (window.SharedCore?.PriceFormatter?.formatForAdmin) {
            return window.SharedCore.PriceFormatter.formatForAdmin(price);
        }
        return price || '';
    };
    
    // ✅ PADRÃO HARMONIZADO: Formatar features usando SharedCore com fallback
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
        // ✅ PADRÃO HARMONIZADO: Usa SharedCore com fallback
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
    
    // Usar função do Support System se disponível (fallback inline)
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
        // Obter dados do formulário
        const propertyData = {};
        
        const videoCheckbox = document.getElementById('propHasVideo');
        if (videoCheckbox) {
            // ✅ PADRÃO HARMONIZADO: Usa SharedCore com fallback
            propertyData.has_video = window.SharedCore?.ensureBooleanVideo?.(videoCheckbox.checked) ?? false;
        } else {
            propertyData.has_video = false;
        }
        
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
        
        console.log('📋 Dados coletados:', propertyData);
        
        // Validação básica
        if (!propertyData.title || !propertyData.price || !propertyData.location) {
            throw new Error('Preencha Título, Preço e Localização!');
        }
        
        // Formatar dados usando SharedCore
        if (window.SharedCore?.PriceFormatter?.formatForAdmin) {
            propertyData.price = window.SharedCore.PriceFormatter.formatForAdmin(propertyData.price);
        }
        
        // ✅ PADRÃO HARMONIZADO: Parse features usando SharedCore
        propertyData.features = window.SharedCore?.parseFeaturesForStorage?.(propertyData.features) ?? '[]';
        
        // Processar mídias
        let imageUrls = '';
        let pdfUrls = '';
        
        if (window.MediaSystem) {
            console.log('📤 Processando mídias...');
            
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
                        console.log(`✅ Upload concluído: ${uploadResult.uploadedCount} arquivo(s)`);
                    } else {
                        console.warn('⚠️ Upload falhou, salvando localmente');
                        const localResult = MediaSystem.saveAndKeepLocal(
                            window.editingPropertyId || 'temp_' + Date.now(),
                            propertyData.title || 'Imóvel'
                        );
                        imageUrls = localResult.images;
                        pdfUrls = localResult.pdfs;
                    }
                } catch (uploadError) {
                    console.error('❌ Erro no upload:', uploadError);
                    const localResult = MediaSystem.saveAndKeepLocal(
                        window.editingPropertyId || 'temp_' + Date.now(),
                        propertyData.title || 'Imóvel'
                    );
                    imageUrls = localResult.images;
                    pdfUrls = localResult.pdfs;
                }
            } else {
                console.log('⚠️ Supabase não configurado, salvando localmente');
                const localResult = MediaSystem.saveAndKeepLocal(
                    window.editingPropertyId || 'temp_' + Date.now(),
                    propertyData.title || 'Imóvel'
                );
                imageUrls = localResult.images;
                pdfUrls = localResult.pdfs;
            }
        } else {
            console.warn('⚠️ MediaSystem não disponível');
            imageUrls = 'EMPTY';
            pdfUrls = 'EMPTY';
        }
        
        propertyData.images = imageUrls || 'EMPTY';
        propertyData.pdfs = pdfUrls || 'EMPTY';
        
        // Salvar no sistema
        if (window.editingPropertyId) {
            console.log(`✏️ Salvando edição do imóvel ${window.editingPropertyId}...`);
            
            if (typeof window.updateProperty === 'function') {
                try {
                    const updateResult = await window.updateProperty(window.editingPropertyId, propertyData);
                    
                    if (updateResult && updateResult.success) {
                        if (typeof window.showAdminNotification === 'function') {
                            window.showAdminNotification('✅ Imóvel atualizado com sucesso!', 'success', 3000);
                        }
                        console.log('✅ Imóvel salvo no Supabase');
                    } else {
                        if (typeof window.showAdminNotification === 'function') {
                            window.showAdminNotification('⚠️ Imóvel salvo apenas localmente', 'info', 3000);
                        }
                        console.log('⚠️ Imóvel salvo apenas localmente (Supabase falhou)');
                    }
                } catch (supabaseError) {
                    console.error('❌ Erro ao salvar no Supabase:', supabaseError);
                    if (typeof window.showAdminNotification === 'function') {
                        window.showAdminNotification('✅ Imóvel salvo localmente (Supabase offline)', 'info', 3000);
                    }
                }
            }
            
            // Atualizar galeria
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
            console.log('🆕 Criando novo imóvel...');
            
            const newProperty = {
                ...propertyData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            if (typeof window.addNewProperty === 'function') {
                console.log('✅ Usando addNewProperty()');
                
                try {
                    const result = await window.addNewProperty(newProperty);
                    
                    if (result) {
                        if (typeof window.showAdminNotification === 'function') {
                            window.showAdminNotification('✅ Imóvel criado com sucesso!', 'success', 3000);
                        }
                        console.log(`✅ Novo imóvel criado: ${result.id}`);
                        
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
                    console.error('❌ Erro em addNewProperty:', error);
                    
                    // Usar fallback do Support System se disponível
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
                console.warn('⚠️ addNewProperty não disponível');
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
   SISTEMA DE AUTOCOMPLETE PARA O CAMPO "LOCALIZAÇÃO"
   ========================================================== */
window.setupLocationAutocomplete = function() {
    // Lista oficial dos principais bairros de Maceió
    const bairrosMaceio = [
        'Pajuçara', 'Ponta Verde', 'Jatiúca', 'Jacarecica', 'Cruz das Almas',
        'Mangabeiras', 'Poço', 'Barro Duro', 'Gruta de Lourdes', 'Serraria',
        'Farol', 'Jardim Petrópolis', 'Centro', 'Prado', 'Jaraguá', 'Feitosa',
        'Pinheiro', 'Santa Lúcia', 'Santa Amélia', 'Tabuleiro do Martins',
        'Cidade Universitária', 'Clima Bom', 'Benedito Bentes', 'Santos Dumont',
        'São Jorge', 'Levada', 'Trapiche da Barra', 'Vergel do Lago',
        'Ouro Preto', 'Mutange', 'Fernão Velho', 'Rio Novo', 'Riacho Doce',
        'Pontal da Barra', 'Guaxuma', 'Ipioca', 'Garça Torta', 'Pescaria'
    ];

    const locationInput = document.getElementById('propLocation');
    if (!locationInput) {
        console.log('📍 Campo de localização não encontrado');
        return false;
    }
    
    if (locationInput.hasAttribute('data-autocomplete-initialized')) {
        console.log('📍 Autocomplete já inicializado');
        return true;
    }
    
    let suggestionsContainer = null;

    function createSuggestionsContainer() {
        const container = document.createElement('div');
        container.className = 'admin-location-suggestions';
        // ESTILOS CORRIGIDOS - CORES DE CONTRASTE
        container.style.cssText = `
            position: absolute;
            z-index: 999999;
            background: white;
            border: 2px solid #1a5276;
            border-top: none;
            max-height: 250px;
            overflow-y: auto;
            box-shadow: 0 4px 15px rgba(0,0,0,0.25);
            border-radius: 0 0 8px 8px;
        `;
        return container;
    }

    function showSuggestions(searchTerm) {
        if (!searchTerm || searchTerm.length < 2) {
            if (suggestionsContainer) suggestionsContainer.remove();
            return;
        }

        const termLower = searchTerm.toLowerCase();
        const matches = bairrosMaceio.filter(bairro => 
            bairro.toLowerCase().includes(termLower)
        );

        if (matches.length === 0) {
            if (suggestionsContainer) suggestionsContainer.remove();
            return;
        }

        if (!suggestionsContainer) {
            suggestionsContainer = createSuggestionsContainer();
            document.body.appendChild(suggestionsContainer);
        }

        const rect = locationInput.getBoundingClientRect();
        suggestionsContainer.style.top = `${rect.bottom + window.scrollY}px`;
        suggestionsContainer.style.left = `${rect.left + window.scrollX}px`;
        suggestionsContainer.style.width = `${rect.width}px`;

        suggestionsContainer.innerHTML = '';
        matches.forEach(bairro => {
            const suggestionItem = document.createElement('div');
            suggestionItem.style.cssText = `
                padding: 10px 14px;
                cursor: pointer;
                font-size: 0.9rem;
                color: #2c3e50 !important;
                background: white !important;
                border-bottom: 1px solid #ecf0f1;
                transition: background 0.2s ease;
            `;
            
            // Destaca o texto pesquisado
            const regex = new RegExp(`(${termLower})`, 'gi');
            suggestionItem.innerHTML = bairro.replace(regex, `<strong style="color: #1a5276; background: #d4e6f1; padding: 2px 4px; border-radius: 4px;">$1</strong>`);

            suggestionItem.addEventListener('click', () => {
                locationInput.value = bairro;
                if (suggestionsContainer) suggestionsContainer.remove();
                locationInput.dispatchEvent(new Event('input', { bubbles: true }));
            });
            
            suggestionItem.addEventListener('mouseenter', () => {
                suggestionItem.style.background = '#e8f4fd !important';
            });
            suggestionItem.addEventListener('mouseleave', () => {
                suggestionItem.style.background = 'white !important';
            });
            
            suggestionsContainer.appendChild(suggestionItem);
        });
        
        console.log(`📍 ${matches.length} sugestão(ões) exibida(s) para "${searchTerm}"`);
    }

    function hideSuggestions() {
        if (suggestionsContainer) {
            suggestionsContainer.remove();
            suggestionsContainer = null;
        }
    }

    // Eventos
    locationInput.addEventListener('input', (e) => {
        showSuggestions(e.target.value);
    });

    locationInput.addEventListener('blur', () => {
        setTimeout(hideSuggestions, 200);
    });

    locationInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && suggestionsContainer) {
            e.preventDefault();
            const firstSuggestion = suggestionsContainer.querySelector('div');
            if (firstSuggestion) {
                locationInput.value = firstSuggestion.textContent || firstSuggestion.innerText;
                hideSuggestions();
            }
        }
    });
    
    locationInput.setAttribute('data-autocomplete-initialized', 'true');
    locationInput.placeholder = 'Digite o bairro (ex: Ponta Verde)';
    
    // CSS GLOBAL DE GARANTIA
    const styleId = 'autocomplete-core-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .admin-location-suggestions {
                position: absolute !important;
                z-index: 999999 !important;
                background: white !important;
                border: 2px solid #1a5276 !important;
                border-top: none !important;
                max-height: 250px !important;
                overflow-y: auto !important;
                box-shadow: 0 4px 15px rgba(0,0,0,0.25) !important;
                border-radius: 0 0 8px 8px !important;
            }
            .admin-location-suggestions div {
                padding: 10px 14px !important;
                cursor: pointer !important;
                font-size: 0.9rem !important;
                color: #2c3e50 !important;
                background: white !important;
                border-bottom: 1px solid #ecf0f1 !important;
            }
            .admin-location-suggestions div:hover {
                background: #e8f4fd !important;
            }
            .admin-location-suggestions div strong {
                color: #1a5276 !important;
                background: #d4e6f1 !important;
                padding: 2px 4px !important;
                border-radius: 4px !important;
                font-weight: bold !important;
            }
        `;
        document.head.appendChild(style);
        console.log('🎨 Estilos globais do autocomplete injetados');
    }
    
    console.log('📍 Autocomplete de bairros inicializado no campo Localização.');
    return true;
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
        console.log('✅ Botão admin encontrado, configurando...');
        
        const newBtn = adminBtn.cloneNode(true);
        adminBtn.parentNode.replaceChild(newBtn, adminBtn);
        
        const freshBtn = document.querySelector('.admin-toggle');
        
        freshBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🟢 Botão admin clicado');
            window.toggleAdminPanel();
        };
        
        console.log('✅ Botão admin configurado');
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
    
    console.log('✅ UI do admin configurada');
};

/* ==========================================================
   INICIALIZAÇÃO (APENAS ESSENCIAL)
   ========================================================== */

function initializeAdmin() {
    console.log('🚀 Inicializando sistema admin...');
    
    // Apenas carregar dados do localStorage se necessário (essencial)
    try {
        const stored = JSON.parse(localStorage.getItem('properties') || '[]');
        if (!window.properties && stored.length > 0) {
            window.properties = stored;
            console.log(`✅ Carregado ${stored.length} imóveis do localStorage`);
        }
    } catch (e) {
        console.error('Erro ao carregar do localStorage:', e);
    }
    
    window.setupAdminUI();
    
    // Configurar autocomplete (agora com funcionalidade completa)
    setTimeout(() => {
        if (typeof window.setupLocationAutocomplete === 'function') {
            window.setupLocationAutocomplete();
        }
    }, 500);
}

// Iniciar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdmin);
} else {
    initializeAdmin();
}

console.log('✅ admin.js - Versão core com autocomplete nativo e cores corrigidas carregada');
