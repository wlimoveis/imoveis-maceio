// js/modules/properties.js - VERSÃO FINAL CORRIGIDA (COM LIMPEZA DE STORAGE)
console.log('🏠 properties.js - VERSÃO FINAL - COM LIMPEZA DE ARQUIVOS FÍSICOS NO STORAGE');

// ========== VARIÁVEIS GLOBAIS ==========
window.properties = [];
window.editingPropertyId = null;
window.currentFilter = 'todos';

// ========== FALLBACK INLINE MÍNIMO E SEGURO PARA VALIDAÇÃO DE ID ==========
if (typeof window.validateIdForSupabase !== 'function') {
    window.validateIdForSupabase = function(propertyId) {
        if (!propertyId) return null;
        const num = Number(propertyId);
        return !isNaN(num) && num > 0 ? num : null;
    };
    console.log('ℹ️ [properties.js] Fallback de validação de ID ativado.');
}

// ========== FUNÇÃO PARA GARANTIR CREDENCIAIS SUPABASE ==========
window.ensureSupabaseCredentials = function() {
    if (!window.SUPABASE_CONSTANTS) {
        console.warn('⚠️ SUPABASE_CONSTANTS não definido, configurando...');
        window.SUPABASE_CONSTANTS = {
            URL: 'https://wxdiowpswepsvklumgvx.supabase.co',
            KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4ZGlvd3Bzd2Vwc3ZrbHVtZ3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MTExNzksImV4cCI6MjA4Nzk4NzE3OX0.QsUHE_w5m5-pz3LcwdREuwmwvCiX3Hz8FYv8SAwhD6U',
            ADMIN_PASSWORD: "wl654",
            PDF_PASSWORD: "doc123"
        };
    }
    
    if (!window.SUPABASE_URL) window.SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
    if (!window.SUPABASE_KEY) window.SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
    
    return !!window.SUPABASE_URL && !!window.SUPABASE_KEY;
};

// ========== TEMPLATE ENGINE COMPLETO (COM PRIORIDADE PARA GALERIA) ==========
class MinimalTemplateEngine {
    constructor() {
        this.imageFallback = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
    }

    generate(property) {
        // Extrair imagens
        const hasImages = property.images && property.images !== 'EMPTY' && property.images.length > 0;
        const imageUrls = hasImages ? property.images.split(',').filter(url => url && url.trim()) : [];
        const hasMultipleImages = imageUrls.length > 1;
        const firstImageUrl = imageUrls.length > 0 ? imageUrls[0] : this.imageFallback;
        
        const hasPdfs = property.pdfs && property.pdfs !== 'EMPTY' && property.pdfs.trim() !== '';
        const hasVideo = window.SharedCore?.ensureBooleanVideo?.(property.has_video) ?? false;
        const displayFeatures = window.SharedCore?.formatFeaturesForDisplay?.(property.features) ?? '';
        
        const formatPrice = (price) => {
            if (!price) return 'R$ 0,00';
            if (typeof price === 'string' && price.includes('R$')) return price;
            return `R$ ${price.toString().replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`;
        };
        
        // ✅ PRIORIDADE MÁXIMA: Usar a galeria completa do gallery.js quando disponível
        if (hasMultipleImages && typeof window.createPropertyGallery === 'function') {
            try {
                console.log(`🎨 Usando galeria completa para imóvel ${property.id} (${imageUrls.length} imagens)`);
                const galleryHtml = window.createPropertyGallery(property);
                
                // Retorna o card completo com a galeria
                return `
                    <div class="property-card" data-property-id="${property.id}" data-property-title="${property.title || ''}">
                        ${galleryHtml}
                        <div class="property-content" style="padding: 1.5rem;">
                            <div class="property-price" data-price-field style="font-size: 1.5rem; font-weight: bold; color: var(--primary); margin-bottom: 0.5rem;">
                                ${formatPrice(property.price)}
                            </div>
                            <h3 class="property-title" data-title-field style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text);">
                                ${property.title || 'Imóvel'}
                            </h3>
                            <div class="property-location" data-location-field style="color: #666; margin-bottom: 1rem; display: flex; align-items: center; gap: 5px;">
                                <i class="fas fa-map-marker-alt"></i> ${property.location || 'Local não informado'}
                            </div>
                            <p data-description-field style="margin-bottom: 1rem; color: #555; line-height: 1.5;">
                                ${(property.description || 'Descrição não disponível.').substring(0, 120)}${(property.description || '').length > 120 ? '...' : ''}
                            </p>
                            ${displayFeatures ? `
                                <div class="property-features" data-features-field style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 1rem;">
                                    ${displayFeatures.split(',').slice(0, 4).map(f => `
                                        <span class="feature-tag ${property.rural ? 'rural-tag' : ''}" style="background: var(--accent); color: white; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.85rem;">
                                            ${f.trim()}
                                        </span>
                                    `).join('')}
                                </div>
                            ` : ''}
                            <button class="contact-btn" onclick="contactAgent(${property.id})" style="background: linear-gradient(45deg, var(--primary), var(--secondary)); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; font-size: 1rem; cursor: pointer; width: 100%; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <i class="fab fa-whatsapp"></i> Entrar em Contato
                            </button>
                        </div>
                    </div>
                `;
            } catch (e) {
                console.warn(`❌ Erro ao usar galeria para imóvel ${property.id}:`, e);
                // Fallback para o método manual
            }
        }
        
        // ========== FALLBACK: HTML MANUAL (SEM SETAS, APENAS PARA 1 IMAGEM) ==========
        const truncatedDescription = (property.description || 'Descrição não disponível.').substring(0, 120);
        const finalDescription = truncatedDescription + ((property.description || '').length > 120 ? '...' : '');
        
        const featuresArray = displayFeatures ? displayFeatures.split(',') : [];
        const limitedFeatures = featuresArray.slice(0, 4);
        
        return `
            <div class="property-card" data-property-id="${property.id}" data-property-title="${property.title || ''}">
                <div class="property-image ${property.rural ? 'rural-image' : ''}" style="position: relative; height: 250px; overflow: hidden;">
                    <div class="property-gallery-container" 
                         onclick="if(window.openGalleryAtCurrentIndex) openGalleryAtCurrentIndex(${property.id})" 
                         style="cursor:pointer; position:relative; width:100%; height:100%;">
                        
                        <img src="${firstImageUrl}" 
                             style="width:100%; height:100%; object-fit:cover;"
                             alt="${property.title || 'Imóvel'}"
                             data-original-src="${firstImageUrl}"
                             onerror="this.src='${this.imageFallback}'">
                        
                        ${property.badge ? `
                            <div class="property-badge ${property.rural ? 'rural-badge' : ''}" style="position: absolute; top: 15px; left: 15px; background: var(--gold); color: white; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.8rem; font-weight: bold; z-index: 10;">
                                ${property.badge}
                            </div>
                        ` : ''}
                        
                        ${hasVideo ? `
                            <div class="video-indicator" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; display: flex; align-items: center; gap: 5px; z-index: 10; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.2);">
                                <i class="fas fa-video" style="color: #FFD700; font-size: 12px;"></i>
                                <span>Vídeo</span>
                            </div>
                        ` : ''}
                        
                        ${hasPdfs ? `
                            <button class="pdf-access" onclick="event.stopPropagation(); if(window.PdfSystem) window.PdfSystem.showModal(${property.id})" style="position: absolute; bottom: 2px; right: 35px; background: rgba(255,255,255,0.95); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #1a5276; transition: all 0.3s ease; z-index: 15; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                                <i class="fas fa-file-pdf"></i>
                            </button>
                        ` : ''}
                        
                        <div class="gallery-expand-icon" onclick="event.stopPropagation(); if(window.openGalleryAtCurrentIndex) openGalleryAtCurrentIndex(${property.id})" style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; cursor: pointer; transition: all 0.3s ease; z-index: 10;">
                            <i class="fas fa-expand"></i>
                        </div>
                    </div>
                </div>
                
                <div class="property-content" style="padding: 1.5rem;">
                    <div class="property-price" data-price-field style="font-size: 1.5rem; font-weight: bold; color: var(--primary); margin-bottom: 0.5rem;">
                        ${formatPrice(property.price)}
                    </div>
                    <h3 class="property-title" data-title-field style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text);">
                        ${property.title || 'Imóvel'}
                    </h3>
                    <div class="property-location" data-location-field style="color: #666; margin-bottom: 1rem; display: flex; align-items: center; gap: 5px;">
                        <i class="fas fa-map-marker-alt"></i> ${property.location || 'Local não informado'}
                    </div>
                    <p data-description-field style="margin-bottom: 1rem; color: #555; line-height: 1.5;">
                        ${finalDescription}
                    </p>
                    ${limitedFeatures.length > 0 ? `
                        <div class="property-features" data-features-field style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 1rem;">
                            ${limitedFeatures.map(f => `
                                <span class="feature-tag ${property.rural ? 'rural-tag' : ''}" style="background: var(--accent); color: white; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.85rem;">
                                    ${f.trim()}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                    <button class="contact-btn" onclick="contactAgent(${property.id})" style="background: linear-gradient(45deg, var(--primary), var(--secondary)); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; font-size: 1rem; cursor: pointer; width: 100%; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i class="fab fa-whatsapp"></i> Entrar em Contato
                    </button>
                </div>
            </div>
        `;
    }
    
    updateCardContent(propertyId, propertyData) {
        console.log(`🔄 [Fallback] Recarregando card ${propertyId}`);
        if (typeof window.renderProperties === 'function') {
            window.renderProperties(window.currentFilter || 'todos', true);
            return true;
        }
        return false;
    }
    
    clearCache() {
        console.log('🧹 [Fallback] Cache limpo');
        return 0;
    }
}

// Instancia o template engine
window.propertyTemplates = new MinimalTemplateEngine();

// ========== FUNÇÃO PARA ATUALIZAR CARD ESPECÍFICO ==========
window.updatePropertyCard = function(propertyId, updatedData = null) {
    console.log('🔄 Atualizando card do imóvel:', propertyId);
    
    const property = window.properties?.find(p => p.id === propertyId);
    if (!property) {
        console.error('❌ Imóvel não encontrado:', propertyId);
        return false;
    }
    
    const propertyToRender = updatedData ? { ...property, ...updatedData } : property;
    
    const allCards = document.querySelectorAll('.property-card');
    let cardToUpdate = null;
    
    allCards.forEach(card => {
        const cardId = card.getAttribute('data-property-id');
        if (cardId && cardId == propertyId) {
            cardToUpdate = card;
        }
    });
    
    if (cardToUpdate) {
        const newCardHTML = window.propertyTemplates.generate(propertyToRender);
        cardToUpdate.outerHTML = newCardHTML;
        
        const index = window.properties.findIndex(p => p.id === propertyId);
        if (index !== -1) {
            window.properties[index] = propertyToRender;
        }
        
        setTimeout(() => {
            const updatedCard = document.querySelector(`[data-property-id="${propertyId}"]`);
            if (updatedCard) {
                updatedCard.classList.add('highlighted');
                setTimeout(() => updatedCard.classList.remove('highlighted'), 1000);
            }
        }, 50);
        
        return true;
    } else {
        if (typeof window.renderProperties === 'function') {
            window.renderProperties(window.currentFilter || 'todos');
        }
        return false;
    }
};

// ========== 1. CARREGAMENTO UNIFICADO ==========
window.loadPropertiesData = async function () {
    const loading = window.LoadingManager?.show?.(
        'Carregando imóveis...', 
        'Buscando as melhores oportunidades em Maceió',
        { variant: 'processing' }
    );
    
    try {
        window.ensureSupabaseCredentials();
        
        const loadStrategies = [
            () => window.supabaseLoadProperties?.()?.then(r => r?.data?.length ? r.data : null),
            () => window.supabaseFetch?.('/properties?select=*')?.then(r => r.ok ? r.data : null),
            () => {
                const stored = localStorage.getItem('properties');
                return stored ? JSON.parse(stored) : null;
            },
            () => getInitialProperties()
        ];

        let propertiesData = null;
        
        setTimeout(() => {
            loading?.updateMessage?.('Encontre seu imóvel dos sonhos em Maceió 🌴');
        }, 800);
        
        for (let i = 0; i < loadStrategies.length; i++) {
            try {
                propertiesData = await loadStrategies[i]();
                if (propertiesData && propertiesData.length > 0) {
                    break;
                }
            } catch (e) { 
                console.warn(`⚠️ Estratégia ${i+1} falhou:`, e.message);
            }
        }

        window.properties = propertiesData || getInitialProperties();
        
        window.properties = window.properties.map(prop => ({
            ...prop,
            has_video: window.SharedCore?.ensureBooleanVideo?.(prop.has_video) ?? false,
            features: window.SharedCore?.parseFeaturesForStorage?.(prop.features) ?? '[]'
        }));
        
        window.savePropertiesToStorage();

        loading?.setVariant?.('success');
        
        const propertyCount = window.properties.length;
        let finalMessage = propertyCount === 0 ? 'Pronto para começar! 🏠' :
                          propertyCount === 1 ? '✨ 1 imóvel disponível!' :
                          propertyCount <= 5 ? `✨ ${propertyCount} opções incríveis!` :
                          propertyCount <= 20 ? `🏘️ ${propertyCount} oportunidades em Maceió!` :
                          `🏆 ${propertyCount} imóveis disponíveis!`;
        
        loading?.updateMessage?.(finalMessage);
        window.renderProperties('todos');
        
    } catch (error) {
        console.error('❌ Erro no carregamento:', error);
        loading?.setVariant?.('error');
        loading?.updateMessage?.('⚠️ Erro ao carregar imóveis');
        window.properties = getInitialProperties();
        window.renderProperties('todos');
        
    } finally {
        setTimeout(() => loading?.hide?.(), 1200);
    }
};

// ========== 2. DADOS INICIAIS ==========
function getInitialProperties() {
    return [
        {
            id: 1,
            title: "Casa 2Qtos - Forene",
            price: "R$ 180.000",
            location: "Residência Conj. Portal do Renascer, Forene",
            description: "Casa a 100m do CEASA; - Medindo 6,60m frente X 19m lado; - 125,40m² de área total; -Somente um único dono; - 02 Quartos, Sala; - Cozinha; - 02 Banheiros; - Varanda; - 02 Vagas de garagem; - Água de Poço Artesiano;",
            features: JSON.stringify(["02 Quartos", "Sala", "Cozinha", "02 Banheiros", "Varanda", "02 Vagas de carro"]),
            type: "residencial",
            has_video: true,
            badge: "Destaque",
            rural: false,
            images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80,https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            title: "Apartamento 4Qtos (178m²) - Ponta Verde",
            price: "R$ 1.500.000",
            location: "Rua Saleiro Pitão, Ponta Verde - Maceió/AL",
            description: "Apartamento amplo, super claro e arejado, imóvel diferenciado com 178m² de área privativa, oferecendo conforto, espaço e alto padrão de acabamento. 4 Qtos, sendo 03 suítes, sala ampla com varanda, cozinha, dependência de empregada, área de serviço, 02 vagas de garagem no subsolo.",
            features: JSON.stringify(["4Qtos s/ 3 suítes", "Sala ampla com varanda", "Cozinha", "Área de serviço", "DCE", "02 vagas de garagem"]),
            type: "residencial",
            has_video: false,
            badge: "Luxo",
            rural: false,
            images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80,https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            created_at: new Date().toISOString()
        }
    ];
}

// ========== 3. RENDERIZAÇÃO ==========
window.renderProperties = function(filter = 'todos', forceClearCache = false) {
    console.log(`🎨 Renderizando propriedades (filtro: ${filter})`);
    
    if (forceClearCache && window.propertyTemplates?.clearCache) {
        window.propertyTemplates.clearCache();
    }
    
    const container = document.getElementById('properties-container');
    if (!container) {
        console.error('❌ Container não encontrado');
        return;
    }

    if (!window.properties?.length) {
        container.innerHTML = '<p class="no-properties">Nenhum imóvel disponível.</p>';
        return;
    }

    const filtered = window.filterProperties(window.properties, filter);
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-properties">Nenhum imóvel disponível para este filtro.</p>';
        return;
    }

    container.innerHTML = filtered.map(prop => window.propertyTemplates.generate(prop)).join('');

    console.log(`✅ ${filtered.length} imóveis renderizados`);
    
    const countElement = document.getElementById('propertyCount');
    if (countElement) {
        countElement.textContent = `${filtered.length} imóveis`;
    }
};

window.filterProperties = function(properties, filter) {
    if (filter === 'todos' || !filter) return properties;
    
    const filterMap = {
        'Residencial': p => p.type === 'residencial',
        'Comercial': p => p.type === 'comercial',
        'Rural': p => p.type === 'rural' || p.rural === true,
        'Minha Casa Minha Vida': p => p.badge === 'MCMV'
    };

    const filterFn = filterMap[filter];
    return filterFn ? properties.filter(filterFn) : properties;
};

// ========== 4. SALVAR NO STORAGE ==========
window.savePropertiesToStorage = function() {
    console.log('💾 Salvando propriedades...');
    
    try {
        if (!window.properties || !Array.isArray(window.properties)) {
            return false;
        }
        
        localStorage.setItem('properties', JSON.stringify(window.properties));
        
        // Limpar chaves antigas
        ['weberlessa_properties', 'properties_backup', 'weberlessa_backup'].forEach(key => {
            if (localStorage.getItem(key)) localStorage.removeItem(key);
        });
        
        console.log(`✅ ${window.properties.length} imóveis salvos`);
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        return false;
    }
};

window.updateLocalStorage = function() {
    return window.savePropertiesToStorage();
};

// ========== 5. FILTROS ==========
window.setupFilters = function() {
    console.log('🎛️ Configurando filtros...');
    
    if (window.FilterManager?.setupWithFallback) {
        return window.FilterManager.setupWithFallback();
    }
    
    console.error('❌ Sistema de filtros não disponível!');
    return false;
};

// ========== 6. CONTATAR AGENTE ==========
window.contactAgent = function(id) {
    const property = window.properties.find(p => p.id === id);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return;
    }
    
    const message = `Olá! Tenho interesse no imóvel: ${property.title} - ${property.price}`;
    window.open(`https://wa.me/5582996044513?text=${encodeURIComponent(message)}`, '_blank');
};

// ========== 7. ADICIONAR NOVO IMÓVEL ==========
window.addNewProperty = async function(propertyData) {
    console.group('➕ ADICIONANDO NOVO IMÓVEL');

    if (!propertyData.title || !propertyData.price || !propertyData.location) {
        alert('❌ Preencha Título, Preço e Localização!');
        console.groupEnd();
        return null;
    }

    try {
        if (propertyData.price) {
            if (window.SharedCore?.PriceFormatter?.formatForInput) {
                propertyData.price = window.SharedCore.PriceFormatter.formatForInput(propertyData.price);
            } else {
                let formattedPrice = propertyData.price;
                if (!formattedPrice.startsWith('R$')) {
                    formattedPrice = 'R$ ' + formattedPrice.replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                }
                propertyData.price = formattedPrice;
            }
        }

        propertyData.features = window.SharedCore?.parseFeaturesForStorage?.(propertyData.features) ?? '[]';
        propertyData.has_video = window.SharedCore?.ensureBooleanVideo?.(propertyData.has_video) ?? false;

        let mediaResult = { images: '', pdfs: '' };

        if (typeof MediaSystem !== 'undefined') {
            const hasMedia = MediaSystem.state.files.length > 0 || MediaSystem.state.pdfs.length > 0;
            
            if (hasMedia) {
                const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2)}`;
                mediaResult = await MediaSystem.uploadAll(tempId, propertyData.title);
                propertyData.images = mediaResult.images || '';
                propertyData.pdfs = mediaResult.pdfs || '';
            } else {
                propertyData.images = '';
                propertyData.pdfs = '';
            }
        }

        let supabaseSuccess = false;
        let supabaseId = null;

        if (window.ensureSupabaseCredentials() && typeof window.supabaseSaveProperty === 'function') {
            try {
                const supabaseResponse = await window.supabaseSaveProperty({
                    title: propertyData.title,
                    price: propertyData.price,
                    location: propertyData.location,
                    description: propertyData.description || '',
                    features: propertyData.features,
                    type: propertyData.type || 'residencial',
                    has_video: propertyData.has_video,
                    badge: propertyData.badge || 'Novo',
                    rural: propertyData.type === 'rural',
                    images: propertyData.images || '',
                    pdfs: propertyData.pdfs || ''
                });

                if (supabaseResponse?.success) {
                    supabaseSuccess = true;
                    supabaseId = supabaseResponse.data?.id || supabaseResponse.data?.[0]?.id;
                }
            } catch (error) {
                console.error('❌ Erro ao salvar no Supabase:', error);
            }
        }

        const newId = supabaseSuccess && supabaseId 
            ? supabaseId 
            : (Math.max(...window.properties.map(p => parseInt(p.id) || 0), 0) + 1);

        const newProperty = {
            id: newId,
            ...propertyData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            savedToSupabase: supabaseSuccess,
            syncStatus: supabaseSuccess ? 'synced' : 'local_only'
        };

        window.properties.unshift(newProperty);
        window.savePropertiesToStorage();
        window.renderProperties('todos', true);

        alert(`✅ Imóvel "${newProperty.title}" cadastrado com sucesso!`);
        console.groupEnd();
        return newProperty;

    } catch (error) {
        console.error('❌ ERRO:', error);
        alert(`❌ Erro ao cadastrar imóvel: ${error.message}`);
        console.groupEnd();
        return null;
    }
};

// ========== 8. ATUALIZAR IMÓVEL ==========
window.updateProperty = async function(id, propertyData) {
    console.group('📤 updateProperty');

    const index = window.properties.findIndex(p => p.id == id);
    if (index === -1) {
        alert('❌ Imóvel não encontrado!');
        console.groupEnd();
        return { success: false };
    }

    try {
        if (propertyData.price && !propertyData.price.startsWith('R$')) {
            propertyData.price = 'R$ ' + propertyData.price.replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        }

        const updateData = {
            ...window.properties[index],
            ...propertyData,
            has_video: window.SharedCore?.ensureBooleanVideo?.(propertyData.has_video) ?? false,
            updated_at: new Date().toISOString()
        };

        window.properties[index] = updateData;
        window.savePropertiesToStorage();
        window.updatePropertyCard(id, updateData);

        alert(`✅ Imóvel "${updateData.title}" atualizado com sucesso!`);
        console.groupEnd();
        return { success: true };

    } catch (error) {
        console.error('❌ ERRO:', error);
        alert(`❌ Erro ao atualizar: ${error.message}`);
        console.groupEnd();
        return { success: false };
    }
};

// ========== 9. ATUALIZAR LOCALMENTE ==========
window.updateLocalProperty = function(propertyId, updatedData) {
    const index = window.properties.findIndex(p => p.id == propertyId);
    if (index === -1) return false;
    
    window.properties[index] = { ...window.properties[index], ...updatedData, updated_at: new Date().toISOString() };
    window.savePropertiesToStorage();
    window.updatePropertyCard(propertyId, updatedData);
    
    return true;
};

// ========== 10. ADICIONAR LOCALMENTE ==========
window.addToLocalProperties = function(newProperty) {
    if (!newProperty.id) {
        newProperty.id = Math.max(...window.properties.map(p => parseInt(p.id) || 0), 0) + 1;
    }
    newProperty.created_at = newProperty.created_at || new Date().toISOString();
    newProperty.updated_at = new Date().toISOString();
    
    window.properties.unshift(newProperty);
    window.savePropertiesToStorage();
    window.renderProperties('todos', true);
    
    return newProperty;
};

// ========== 11. EXCLUIR IMÓVEL (CORRIGIDO COM LIMPEZA DE STORAGE) ==========
window.deleteProperty = async function(id) {
    const property = window.properties.find(p => p.id === id);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return false;
    }

    if (!confirm(`⚠️ Excluir "${property.title}" permanentemente?\n\nIsso também removerá TODAS as imagens, vídeos e PDFs associados.`)) {
        return false;
    }

    // --- INÍCIO DA CORREÇÃO: LIMPEZA FÍSICA DOS ARQUIVOS NO STORAGE ---
    let storageCleanupSuccess = true;
    if (window.MediaSystem && typeof window.MediaSystem.deleteFilesFromStorage === 'function') {
        const allFileUrls = [];
        
        // Coletar URLs de imagens
        if (property.images && property.images !== 'EMPTY') {
            const imageUrls = property.images.split(',').filter(url => url && url.trim());
            imageUrls.forEach(url => {
                allFileUrls.push({
                    url: url.trim(),
                    type: 'image'
                });
            });
        }
        
        // Coletar URLs de PDFs
        if (property.pdfs && property.pdfs !== 'EMPTY') {
            const pdfUrls = property.pdfs.split(',').filter(url => url && url.trim());
            pdfUrls.forEach(url => {
                allFileUrls.push({
                    url: url.trim(),
                    type: 'pdf'
                });
            });
        }

        if (allFileUrls.length > 0) {
            console.log(`🗑️ Iniciando limpeza física de ${allFileUrls.length} arquivo(s) do Storage para o imóvel ${id}...`);
            try {
                const result = await window.MediaSystem.deleteFilesFromStorage(allFileUrls);
                if (result && result.success) {
                    console.log(`✅ ${result.deletedCount || allFileUrls.length} arquivo(s) removido(s) do Storage com sucesso.`);
                } else {
                    console.warn(`⚠️ Limpeza do Storage retornou resultado inesperado:`, result);
                    storageCleanupSuccess = false;
                }
            } catch (error) {
                console.error(`❌ Erro crítico ao tentar excluir arquivos do Storage para o imóvel ${id}:`, error);
                storageCleanupSuccess = false;
            }
        } else {
            console.log(`ℹ️ Nenhum arquivo de mídia encontrado para exclusão física no imóvel ${id}.`);
        }
    } else {
        console.warn(`⚠️ MediaSystem.deleteFilesFromStorage não disponível. Os arquivos de mídia NÃO serão excluídos fisicamente.`);
        storageCleanupSuccess = false;
    }

    if (!storageCleanupSuccess) {
        const userConfirmed = confirm(`⚠️ Aviso: Não foi possível limpar todos os arquivos de mídia do Storage.\n\nDeseja continuar com a exclusão do registro do imóvel "${property.title}"?`);
        if (!userConfirmed) {
            console.log(`❌ Exclusão cancelada pelo usuário devido a falha na limpeza do Storage.`);
            return false;
        }
    }
    // --- FIM DA CORREÇÃO: LIMPEZA FÍSICA DOS ARQUIVOS NO STORAGE ---

    // Remover do Supabase (se aplicável)
    if (window.ensureSupabaseCredentials && typeof window.supabaseDeleteProperty === 'function') {
        try {
            const supabaseResult = await window.supabaseDeleteProperty(id);
            if (!supabaseResult.success) {
                console.warn(`⚠️ Falha ao excluir do Supabase: ${supabaseResult.error}`);
            } else {
                console.log(`✅ Imóvel ${id} removido do Supabase.`);
            }
        } catch (error) {
            console.error(`❌ Erro ao excluir do Supabase:`, error);
        }
    }

    // Remover do array local e do storage
    window.properties = window.properties.filter(p => p.id !== id);
    window.savePropertiesToStorage();
    window.renderProperties('todos', true);

    alert(`✅ Imóvel "${property.title}" e seus arquivos foram excluídos!`);
    return true;
};

// ========== 12. LISTA ADMIN ==========
window.loadPropertyList = function() {
    const container = document.getElementById('propertyList');
    const countElement = document.getElementById('propertyCount');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (countElement) {
        countElement.textContent = window.properties.length;
    }
    
    if (!window.properties?.length) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Nenhum imóvel</p>';
        return;
    }
    
    window.properties.forEach(property => {
        const item = document.createElement('div');
        item.className = 'property-item';
        item.innerHTML = `
            <div style="flex: 1;">
                <strong style="color: var(--primary);">${property.title}</strong><br>
                <small>${property.price} - ${property.location}</small>
                <div style="font-size: 0.8em; color: #666; margin-top: 0.2rem;">
                    ID: ${property.id} | 
                    ${property.has_video ? '🎬 Vídeo | ' : ''}
                    Imagens: ${property.images ? property.images.split(',').filter(i => i.trim()).length : 0}
                    ${property.pdfs ? ` | PDFs: ${property.pdfs.split(',').filter(p => p.trim()).length}` : ''}
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="editProperty(${property.id})" style="background: var(--accent); color: white; border: none; padding: 0.5rem 1rem; border-radius: 3px; cursor: pointer;">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="deleteProperty(${property.id})" style="background: #e74c3c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 3px; cursor: pointer;">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        container.appendChild(item);
    });
};

// ========== INICIALIZAÇÃO ==========
console.log('✅ properties.js VERSÃO FINAL CARREGADA');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.loadPropertiesData();
            setTimeout(() => window.setupFilters(), 100);
        }, 100);
    });
} else {
    setTimeout(() => {
        window.loadPropertiesData();
        setTimeout(() => window.setupFilters(), 100);
    }, 100);
}

window.getInitialProperties = getInitialProperties;

console.log('🎯 VERSÃO FINAL - Com limpeza de arquivos físicos no Storage!');
