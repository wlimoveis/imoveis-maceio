// js/modules/properties.js - VERSÃO CORRIGIDA (GALERIA FUNCIONAL)
console.log('🏠 properties.js - VERSÃO CORRIGIDA - GALERIA COM SETAS FUNCIONAIS');

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

// ========== TEMPLATE ENGINE COM CACHE AVANÇADO ==========
class PropertyTemplateEngine {
    constructor() {
        this.imageFallback = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
        this._localCache = new Map();
    }

    generate(property) {
        const cacheKey = `prop_${property.id}_${property.images?.length || 0}_${property.has_video}`;
        if (this._localCache.has(cacheKey)) {
            return this._localCache.get(cacheKey);
        }
        
        const html = this._generateTemplate(property);
        this._localCache.set(cacheKey, html);
        
        if (this._localCache.size > 50) {
            const keysToDelete = Array.from(this._localCache.keys()).slice(0, 10);
            keysToDelete.forEach(key => this._localCache.delete(key));
        }
        
        return html;
    }
    
    _generateTemplate(property) {
        const displayFeatures = window.SharedCore?.formatFeaturesForDisplay?.(property.features) ?? '';
        
        const formatPrice = (price) => {
            if (window.SharedCore?.PriceFormatter?.formatForCard) {
                return window.SharedCore.PriceFormatter.formatForCard(price);
            }
            if (!price) return 'R$ 0,00';
            if (typeof price === 'string' && price.includes('R$')) return price;
            return `R$ ${price.toString().replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`;
        };

        const html = `
            <div class="property-card" data-property-id="${property.id}" data-property-title="${property.title}">
                ${this.generateImageSection(property)}
                <div class="property-content">
                    <div class="property-price" data-price-field>${formatPrice(property.price)}</div>
                    <h3 class="property-title" data-title-field>${property.title || 'Sem título'}</h3>
                    <div class="property-location" data-location-field>
                        <i class="fas fa-map-marker-alt"></i> ${property.location || 'Local não informado'}
                    </div>
                    <p data-description-field>${property.description || 'Descrição não disponível.'}</p>
                    ${displayFeatures ? `
                        <div class="property-features" data-features-field>
                            ${displayFeatures.split(',').map(f => `
                                <span class="feature-tag ${property.rural ? 'rural-tag' : ''}">${f.trim()}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                    <button class="contact-btn" onclick="contactAgent(${property.id})">
                        <i class="fab fa-whatsapp"></i> Entrar em Contato
                    </button>
                </div>
            </div>
        `;

        return html;
    }

    // 🔧 CORREÇÃO CRÍTICA: Usa createPropertyGallery quando disponível
    generateImageSection(property) {
        const hasImages = property.images && property.images.length > 0 && property.images !== 'EMPTY';
        const imageUrls = hasImages ? property.images.split(',').filter(url => url.trim() !== '') : [];
        const imageCount = imageUrls.length;
        const hasGallery = imageCount > 1;
        const hasPdfs = property.pdfs && property.pdfs !== 'EMPTY' && property.pdfs.trim() !== '';
        const hasVideo = window.SharedCore?.ensureBooleanVideo?.(property.has_video) ?? false;
        
        // ✅ PRIORIDADE: Usa a função completa do gallery.js se disponível
        if (hasGallery && typeof window.createPropertyGallery === 'function') {
            try {
                return window.createPropertyGallery(property);
            } catch (e) {
                console.warn('❌ Erro na galeria, usando fallback:', e);
            }
        }
        
        // FALLBACK: Estrutura simples (apenas para compatibilidade)
        const firstImageUrl = imageCount > 0 ? imageUrls[0] : this.imageFallback;
        
        return `
            <div class="property-image ${property.rural ? 'rural-image' : ''}" 
                 style="position: relative; height: 250px;">
                <div class="property-gallery-container" 
                     onclick="if(window.openGalleryAtCurrentIndex) openGalleryAtCurrentIndex(${property.id})" 
                     style="cursor:pointer; position:relative; width:100%; height:100%;">
                    
                    <img src="${firstImageUrl}" 
                         style="width: 100%; height: 100%; object-fit: cover;"
                         alt="${property.title}"
                         onerror="this.src='${this.imageFallback}'">
                    
                    ${property.badge ? `<div class="property-badge ${property.rural ? 'rural-badge' : ''}">${property.badge}</div>` : ''}
                    
                    ${hasVideo ? `
                        <div class="video-indicator" style="
                            position: absolute;
                            top: 10px;
                            right: 10px;
                            background: rgba(0, 0, 0, 0.8);
                            color: white;
                            padding: 6px 12px;
                            border-radius: 6px;
                            font-size: 12px;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            z-index: 9;
                        ">
                            <i class="fas fa-video" style="color: #FFD700;"></i>
                            <span>TEM VÍDEO</span>
                        </div>
                    ` : ''}
                    
                    ${hasGallery ? `
                        <div class="image-count" style="
                            position: absolute;
                            top: 10px;
                            right: 10px;
                            background: rgba(0, 0, 0, 0.9);
                            color: white;
                            padding: 5px 10px;
                            border-radius: 4px;
                            font-size: 13px;
                            font-weight: bold;
                            z-index: 10;
                        ">
                            <i class="fas fa-images"></i> ${imageCount}
                        </div>
                    ` : ''}
                </div>
                
                ${hasPdfs ? `
                    <button class="pdf-access" onclick="event.stopPropagation(); window.PdfSystem.showModal(${property.id})" style="
                        position: absolute;
                        bottom: 2px;
                        right: 35px;
                        background: rgba(255, 255, 255, 0.95);
                        border: none;
                        border-radius: 50%;
                        width: 28px;
                        height: 28px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.75rem;
                        color: #1a5276;
                        z-index: 15;
                    ">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    updateCardContent(propertyId, propertyData) {
        console.log(`🔍 Atualizando conteúdo do card ${propertyId}`, propertyData);
        
        const card = document.querySelector(`.property-card[data-property-id="${propertyId}"]`);
        if (!card) {
            console.warn(`⚠️ Card ${propertyId} não encontrado`);
            return false;
        }
        
        try {
            if (propertyData.price !== undefined) {
                const priceElement = card.querySelector('[data-price-field]');
                if (priceElement) {
                    const formattedPrice = window.SharedCore?.PriceFormatter?.formatForCard 
                        ? window.SharedCore.PriceFormatter.formatForCard(propertyData.price)
                        : (propertyData.price.includes('R$') 
                            ? propertyData.price 
                            : `R$ ${propertyData.price.replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`);
                    priceElement.textContent = formattedPrice;
                }
            }
            
            if (propertyData.title !== undefined) {
                const titleElement = card.querySelector('[data-title-field]');
                if (titleElement) {
                    titleElement.textContent = propertyData.title;
                }
                card.setAttribute('data-property-title', propertyData.title);
            }
            
            if (propertyData.location !== undefined) {
                const locationElement = card.querySelector('[data-location-field]');
                if (locationElement) {
                    locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${propertyData.location}`;
                }
            }
            
            if (propertyData.description !== undefined) {
                const descriptionElement = card.querySelector('[data-description-field]');
                if (descriptionElement) {
                    descriptionElement.textContent = propertyData.description;
                }
            }
            
            if (propertyData.features !== undefined) {
                const featuresElement = card.querySelector('[data-features-field]');
                const displayFeatures = window.SharedCore?.formatFeaturesForDisplay?.(propertyData.features) ?? '';
                
                if (featuresElement) {
                    if (displayFeatures) {
                        featuresElement.innerHTML = displayFeatures.split(',').map(f => `
                            <span class="feature-tag ${propertyData.rural ? 'rural-tag' : ''}">${f.trim()}</span>
                        `).join('');
                    } else {
                        featuresElement.innerHTML = '';
                    }
                }
            }
            
            // Atualizar cache
            const pattern = `prop_${propertyId}_`;
            for (const key of this._localCache.keys()) {
                if (key.startsWith(pattern)) {
                    this._localCache.delete(key);
                }
            }
            
            card.classList.add('highlighted');
            setTimeout(() => {
                card.classList.remove('highlighted');
            }, 1000);
            
            return true;
            
        } catch (error) {
            console.error(`❌ Erro ao atualizar card:`, error);
            return false;
        }
    }
    
    clearCache() {
        const count = this._localCache.size;
        this._localCache.clear();
        return count;
    }
}

// Instância global
window.propertyTemplates = new PropertyTemplateEngine();

// ========== FUNÇÃO PARA ATUALIZAR CARD ESPECÍFICO ==========
window.updatePropertyCard = function(propertyId, updatedData = null) {
    console.log('🔄 Atualizando card do imóvel:', propertyId);
    
    const property = window.properties?.find(p => p.id === propertyId);
    if (!property) {
        console.error('❌ Imóvel não encontrado:', propertyId);
        return false;
    }
    
    const propertyToRender = updatedData ? { ...property, ...updatedData } : property;
    
    // Tentar atualização parcial
    if (updatedData && window.propertyTemplates.updateCardContent) {
        const partialSuccess = window.propertyTemplates.updateCardContent(propertyId, propertyToRender);
        if (partialSuccess) {
            const index = window.properties.findIndex(p => p.id === propertyId);
            if (index !== -1) {
                window.properties[index] = { ...window.properties[index], ...updatedData };
            }
            return true;
        }
    }
    
    // Substituição completa
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
        
        window.renderProperties('todos');
        
    } catch (error) {
        console.error('❌ Erro no carregamento:', error);
        loading?.setVariant?.('error');
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
            description: "Casa a 100m do CEASA - 125,40m² de área total - 02 Quartos, Sala - Cozinha - 02 Banheiros - Varanda - 02 Vagas de garagem",
            features: JSON.stringify(["02 Quartos", "Sala", "Cozinha", "02 Banheiros", "Varanda", "02 Vagas"]),
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
            description: "Apartamento amplo com 178m² de área privativa, 4 Qtos sendo 03 suítes, sala ampla com varanda, 02 vagas de garagem.",
            features: JSON.stringify(["4Qtos s/3 suítes", "Sala ampla", "Cozinha", "Área de serviço", "02 vagas"]),
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
        container.innerHTML = '<p class="no-properties">Nenhum imóvel para este filtro.</p>';
        return;
    }

    container.innerHTML = filtered.map(prop => 
        window.propertyTemplates.generate(prop)
    ).join('');

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
    try {
        if (!window.properties || !Array.isArray(window.properties)) {
            return false;
        }
        
        localStorage.setItem('properties', JSON.stringify(window.properties));
        
        ['weberlessa_properties', 'properties_backup', 'weberlessa_backup'].forEach(oldKey => {
            if (localStorage.getItem(oldKey)) localStorage.removeItem(oldKey);
        });
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        return false;
    }
};

// ========== 5. CONFIGURAR FILTROS ==========
window.setupFilters = function() {
    console.log('🎛️ Configurando filtros...');
    
    if (window.FilterManager && typeof window.FilterManager.setupWithFallback === 'function') {
        return window.FilterManager.setupWithFallback();
    }
    
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

// ========== 7. ADICIONAR IMÓVEL ==========
window.addNewProperty = async function(propertyData) {
    console.group('➕ ADICIONANDO NOVO IMÓVEL');

    if (!propertyData.title || !propertyData.price || !propertyData.location) {
        alert('❌ Preencha Título, Preço e Localização!');
        console.groupEnd();
        return null;
    }

    try {
        if (propertyData.price && !propertyData.price.startsWith('R$')) {
            propertyData.price = 'R$ ' + propertyData.price.replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
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
                    supabaseId = supabaseResponse.data?.id;
                }
            } catch (error) {
                console.error('❌ Erro Supabase:', error);
            }
        }

        const newId = supabaseSuccess && supabaseId 
            ? supabaseId 
            : Math.max(...window.properties.map(p => parseInt(p.id) || 0), 0) + 1;

        const newProperty = {
            id: newId,
            ...propertyData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            savedToSupabase: supabaseSuccess
        };

        window.properties.unshift(newProperty);
        window.savePropertiesToStorage();
        window.renderProperties('todos', true);

        alert(`✅ Imóvel "${newProperty.title}" cadastrado com sucesso!`);
        console.groupEnd();
        return newProperty;

    } catch (error) {
        console.error('❌ ERRO:', error);
        alert('❌ Erro ao cadastrar imóvel!');
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
        const updateData = {
            title: propertyData.title || window.properties[index].title,
            price: propertyData.price || window.properties[index].price,
            location: propertyData.location || window.properties[index].location,
            description: propertyData.description || window.properties[index].description || '',
            features: propertyData.features || window.properties[index].features || '[]',
            type: propertyData.type || window.properties[index].type || 'residencial',
            has_video: propertyData.has_video !== undefined 
                ? window.SharedCore?.ensureBooleanVideo?.(propertyData.has_video) 
                : window.properties[index].has_video,
            badge: propertyData.badge || window.properties[index].badge || 'Novo',
            rural: propertyData.type === 'rural' || window.properties[index].rural || false,
            images: propertyData.images || window.properties[index].images || '',
            pdfs: propertyData.pdfs || window.properties[index].pdfs || ''
        };

        window.updateLocalProperty(id, updateData);

        let supabaseSuccess = false;
        
        if (window.ensureSupabaseCredentials()) {
            try {
                const validId = window.validateIdForSupabase?.(id) || id;
                const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${validId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': window.SUPABASE_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_KEY}`
                    },
                    body: JSON.stringify(updateData)
                });
                supabaseSuccess = response.ok;
            } catch (error) {
                console.error('Erro Supabase:', error);
            }
        }

        alert(supabaseSuccess 
            ? `✅ Imóvel "${updateData.title}" atualizado com sucesso!` 
            : `⚠️ Imóvel "${updateData.title}" atualizado apenas localmente.`);

        console.groupEnd();
        return { success: true, localOnly: !supabaseSuccess };

    } catch (error) {
        console.error('❌ ERRO:', error);
        alert('❌ Erro ao atualizar imóvel!');
        console.groupEnd();
        return { success: false };
    }
};

// ========== 9. ATUALIZAR PROPRIEDADE LOCALMENTE ==========
window.updateLocalProperty = function(propertyId, updatedData) {
    const index = window.properties.findIndex(p => p.id == propertyId);
    if (index === -1) return false;
    
    window.properties[index] = {
        ...window.properties[index],
        ...updatedData,
        updated_at: new Date().toISOString()
    };
    
    window.savePropertiesToStorage();
    window.updatePropertyCard(propertyId, updatedData);
    
    return true;
};

// ========== 10. EXCLUIR IMÓVEL ==========
window.deleteProperty = async function(id) {
    const property = window.properties.find(p => p.id === id);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return false;
    }

    if (!confirm(`⚠️ Tem certeza que deseja excluir "${property.title}"?`)) {
        return false;
    }

    // Excluir arquivos físicos
    if (typeof MediaSystem?.deleteFilesFromStorage === 'function') {
        const imageUrls = property.images?.split(',').filter(url => url?.trim()) || [];
        const pdfUrls = property.pdfs?.split(',').filter(url => url?.trim()) || [];
        const allFileUrls = [...imageUrls, ...pdfUrls];
        
        if (allFileUrls.length > 0) {
            await MediaSystem.deleteFilesFromStorage(allFileUrls);
        }
    }

    // Excluir do Supabase
    let supabaseSuccess = false;
    if (window.ensureSupabaseCredentials()) {
        try {
            const validId = window.validateIdForSupabase?.(id) || id;
            const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${validId}`, {
                method: 'DELETE',
                headers: {
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`
                }
            });
            supabaseSuccess = response.ok;
        } catch (error) {
            console.error('Erro Supabase:', error);
        }
    }

    // Excluir localmente
    window.properties = window.properties.filter(p => p.id !== id);
    window.savePropertiesToStorage();
    window.renderProperties('todos', true);

    alert(supabaseSuccess 
        ? `✅ Imóvel "${property.title}" excluído permanentemente!` 
        : `⚠️ Imóvel "${property.title}" excluído apenas localmente.`);

    return supabaseSuccess;
};

// ========== 11. CARREGAR LISTA ADMIN ==========
window.loadPropertyList = function() {
    const container = document.getElementById('propertyList');
    const countElement = document.getElementById('propertyCount');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (countElement) {
        countElement.textContent = window.properties?.length || 0;
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
                <strong>${property.title}</strong><br>
                <small>${property.price} - ${property.location}</small>
                <div style="font-size: 0.8em; color: #666;">
                    ID: ${property.id} | 
                    ${property.has_video ? '🎬 Vídeo | ' : ''}
                    Imagens: ${property.images?.split(',').filter(i => i?.trim()).length || 0}
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="editProperty(${property.id})" class="edit-property-btn">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="deleteProperty(${property.id})" class="delete-property-btn">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        container.appendChild(item);
    });
};

// ========== INICIALIZAÇÃO ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.loadPropertiesData();
        window.setupFilters();
    });
} else {
    window.loadPropertiesData();
    window.setupFilters();
}

window.getInitialProperties = getInitialProperties;
window.updateLocalStorage = window.savePropertiesToStorage;
window.addToLocalProperties = function(prop) {
    window.properties.unshift(prop);
    window.savePropertiesToStorage();
    window.renderProperties('todos', true);
    return prop;
};

console.log('✅ properties.js VERSÃO CORRIGIDA CARREGADA - GALERIA FUNCIONAL');
