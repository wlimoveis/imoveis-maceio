// js/modules/admin.js - VERSÃO OTIMIZADA
console.log('🔧 admin.js - Versão core com autocomplete funcional');

const ADMIN_CONFIG = {
    password: "wl654",
    panelId: "adminPanel",
    buttonClass: "admin-toggle"
};

window.editingPropertyId = null;

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

window.cancelEdit = function() {
    if (window.editingPropertyId) {
        if (confirm('❓ Cancelar edição?\n\nTodos os dados não salvos serão perdidos.')) {
            console.log('❌ Cancelando edição do imóvel:', window.editingPropertyId);
            window.resetAdminFormCompletely(true);
            return true;
        }
    } else {
        console.log('ℹ️ Nenhuma edição em andamento');
        window.resetAdminFormCompletely(false);
    }
    return false;
};

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
    
    console.log('✅ Modo edição ativado para ID:', property.id);
    return true;
};

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

window.setupLocationAutocomplete = function() {
    const bairrosMaceio = [
        'Pajuçara, Maceió/AL', 'Ponta Verde, Maceió/AL', 'Jatiúca, Maceió/AL', 'Jacarecica, Maceió/AL', 'Cruz das Almas, Maceió/AL',
        'Mangabeiras, Maceió/AL', 'Poço, Maceió/AL', 'Barro Duro, Maceió/AL', 'Gruta de Lourdes, Maceió/AL', 'Serraria, Maceió/AL',
        'Farol, Maceió/AL', 'Jardim Petrópolis, Maceió/AL', 'Centro, Maceió/AL', 'Prado, Maceió/AL', 'Jaraguá, Maceió/AL', 'Feitosa, Maceió/AL',
        'Pinheiro, Maceió/AL', 'Santa Lúcia, Maceió/AL', 'Santa Amélia, Maceió/AL', 'Tabuleiro do Martins, Maceió/AL',
        'Cidade Universitária, Maceió/AL', 'Clima Bom, Maceió/AL', 'Benedito Bentes, Maceió/AL', 'Santos Dumont, Maceió/AL',
        'São Jorge, Maceió/AL', 'Levada, Maceió/AL', 'Trapiche da Barra, Maceió/AL', 'Vergel do Lago, Maceió/AL',
        'Ouro Preto, Maceió/AL', 'Mutange, Maceió/AL', 'Fernão Velho, Maceió/AL', 'Forene, Maceió/AL', 'Rio Novo, Maceió/AL', 'Riacho Doce, Maceió/AL', 'Pontal da Barra, Maceió/AL', 'Guaxuma',
        'Ipioca, Maceió/AL', 'Garça Torta, Maceió/AL', 'Pescaria, Maceió/AL', 'Ponta da Terra, Maceió/AL', 'São Miguel dos Campos, AL', 'Murilopes, Maceió/AL',
        'Barra de São Miguel, AL', 'Boa Viagem, Recife/PE', 'São Miguel dos Milagres, AL', 'Zona Rural, AL',
    ];

    const locationInput = document.getElementById('propLocation');
    if (!locationInput) return false;
    if (locationInput.hasAttribute('data-autocomplete-initialized')) return true;
    
    let suggestionsContainer = null;

    function createSuggestionsContainer() {
        const container = document.createElement('div');
        container.className = 'admin-location-suggestions';
        container.style.cssText = `
            position: absolute !important;
            z-index: 9999999 !important;
            background: #ffffff !important;
            border: 2px solid #1a5276 !important;
            border-top: none !important;
            max-height: 250px !important;
            overflow-y: auto !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
            border-radius: 0 0 8px 8px !important;
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

        let parentContainer = locationInput.parentElement;
        while (parentContainer && parentContainer !== document.body) {
            const position = window.getComputedStyle(parentContainer).position;
            if (position === 'relative' || position === 'absolute') break;
            parentContainer = parentContainer.parentElement;
        }
        
        if (parentContainer === document.body) {
            parentContainer = locationInput.parentElement;
        }
        
        if (window.getComputedStyle(parentContainer).position !== 'relative') {
            parentContainer.style.position = 'relative';
        }

        if (!suggestionsContainer) {
            suggestionsContainer = createSuggestionsContainer();
            parentContainer.appendChild(suggestionsContainer);
        } else if (suggestionsContainer.parentElement !== parentContainer) {
            parentContainer.appendChild(suggestionsContainer);
        }

        const inputRect = locationInput.getBoundingClientRect();
        const parentRect = parentContainer.getBoundingClientRect();
        
        const relativeTop = inputRect.bottom - parentRect.top;
        const relativeLeft = inputRect.left - parentRect.left;
        
        suggestionsContainer.style.top = `${relativeTop}px`;
        suggestionsContainer.style.left = `${relativeLeft}px`;
        suggestionsContainer.style.width = `${locationInput.offsetWidth}px`;
        suggestionsContainer.style.display = 'block';

        suggestionsContainer.innerHTML = '';
        matches.forEach(bairro => {
            const suggestionItem = document.createElement('div');
            suggestionItem.style.cssText = `
                padding: 10px 14px !important;
                cursor: pointer !important;
                font-size: 0.9rem !important;
                color: #1a5276 !important;
                background: #ffffff !important;
                border-bottom: 1px solid #e0e0e0 !important;
            `;
            
            const regex = new RegExp(`(${termLower})`, 'gi');
            suggestionItem.innerHTML = bairro.replace(regex, `<strong style="color: #c0392b; background: #fdebd0; padding: 2px 4px; border-radius: 4px;">$1</strong>`);

            suggestionItem.addEventListener('click', () => {
                locationInput.value = bairro;
                if (suggestionsContainer) suggestionsContainer.remove();
                suggestionsContainer = null;
                locationInput.dispatchEvent(new Event('input', { bubbles: true }));
            });
            
            suggestionItem.addEventListener('mouseenter', () => {
                suggestionItem.style.background = '#e8f4fd';
            });
            suggestionItem.addEventListener('mouseleave', () => {
                suggestionItem.style.background = '#ffffff';
            });
            
            suggestionsContainer.appendChild(suggestionItem);
        });
    }

    function hideSuggestions() {
        if (suggestionsContainer) {
            suggestionsContainer.remove();
            suggestionsContainer = null;
        }
    }

    locationInput.addEventListener('input', (e) => showSuggestions(e.target.value));
    locationInput.addEventListener('blur', () => setTimeout(hideSuggestions, 200));
    locationInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && suggestionsContainer) {
            e.preventDefault();
            const firstSuggestion = suggestionsContainer.querySelector('div');
            if (firstSuggestion) {
                locationInput.value = firstSuggestion.textContent;
                hideSuggestions();
            }
        }
    });
    
    locationInput.setAttribute('data-autocomplete-initialized', 'true');
    locationInput.placeholder = 'Digite o bairro (ex: Ponta Verde)';
    
    if (!document.getElementById('autocomplete-core-styles')) {
        const style = document.createElement('style');
        style.id = 'autocomplete-core-styles';
        style.textContent = `
            .admin-location-suggestions {
                position: absolute !important;
                z-index: 9999999 !important;
                background: #ffffff !important;
                border: 2px solid #1a5276 !important;
                border-top: none !important;
                max-height: 250px !important;
                overflow-y: auto !important;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
                border-radius: 0 0 8px 8px !important;
            }
            .admin-location-suggestions div {
                padding: 10px 14px !important;
                cursor: pointer !important;
                font-size: 0.9rem !important;
                color: #1a5276 !important;
                background: #ffffff !important;
                border-bottom: 1px solid #e0e0e0 !important;
            }
            .admin-location-suggestions div:hover {
                background: #e8f4fd !important;
            }
            .admin-location-suggestions div strong {
                color: #c0392b !important;
                background: #fdebd0 !important;
                padding: 2px 4px !important;
                border-radius: 4px !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    console.log('✅ Autocomplete de bairros inicializado');
    return true;
};

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
    
    setTimeout(() => {
        if (typeof window.setupLocationAutocomplete === 'function') {
            window.setupLocationAutocomplete();
        }
    }, 500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdmin);
} else {
    initializeAdmin();
}

console.log('✅ admin.js - Versão otimizada carregada');
