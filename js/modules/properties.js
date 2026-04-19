// js/modules/properties.js - VERSÃO OTIMIZADA COM ENGINE DELEGADA PARA SUPORTE
console.log('🏠 properties.js - ENGINE DE TEMPLATE DELEGADA PARA SUPORTE');

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

// ========== TEMPLATE ENGINE PROXY (DELEGA PARA SUPPORT SYSTEM) ==========
// Fallback inline MELHORADO - COM SUPORTE COMPLETO A SETAS DE NAVEGAÇÃO
class MinimalTemplateEngine {
    constructor() {
        this.imageFallback = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
    }

    generate(property) {
        // Extrair imagens e verificar se tem múltiplas
        const hasImages = property.images && property.images !== 'EMPTY' && property.images.length > 0;
        const imageUrls = hasImages ? property.images.split(',').filter(url => url && url.trim()) : [];
        const hasMultipleImages = imageUrls.length > 1;
        const firstImageUrl = imageUrls.length > 0 ? imageUrls[0] : this.imageFallback;
        
        // ✅ PRIORIZA USAR A FUNÇÃO DE GALERIA COMPLETA (COM SETAS FUNCIONAIS)
        if (hasMultipleImages && typeof window.createPropertyGallery === 'function') {
            try {
                return window.createPropertyGallery(property);
            } catch (e) {
                console.warn('❌ Erro na galeria, usando fallback:', e);
                // Fallback para o método manual se falhar
            }
        }
        
        // FALLBACK: Gerar HTML manual com suporte a setas
        const hasPdfs = property.pdfs && property.pdfs !== 'EMPTY' && property.pdfs.trim() !== '';
        const hasVideo = window.SharedCore?.ensureBooleanVideo?.(property.has_video) ?? false;
        const displayFeatures = window.SharedCore?.formatFeaturesForDisplay?.(property.features) ?? '';
        
        const formatPrice = (price) => {
            if (!price) return 'R$ 0,00';
            if (typeof price === 'string' && price.includes('R$')) return price;
            return `R$ ${price.toString().replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`;
        };
        
        // Gerar setas de navegação (Liquid Glass) se tiver múltiplas imagens
        const arrowsHtml = hasMultipleImages ? `
            <button class="gallery-nav-arrow gallery-nav-prev" 
                    onclick="event.stopPropagation(); event.preventDefault(); navigatePropertyGallery(${property.id}, 'prev')"
                    style="position:absolute; left:10px; top:50%; transform:translateY(-50%); 
                           width:40px; height:40px; border-radius:50%; 
                           background:rgba(255,255,255,0.2); 
                           backdrop-filter:blur(8px);
                           border:1px solid rgba(255,255,255,0.3);
                           color:white; cursor:pointer; display:flex; align-items:center; justify-content:center;
                           font-size:18px; transition:all 0.3s ease; z-index:25;
                           box-shadow:0 2px 10px rgba(0,0,0,0.2);">
                <i class="fas fa-chevron-left"></i>
            </button>
            <button class="gallery-nav-arrow gallery-nav-next" 
                    onclick="event.stopPropagation(); event.preventDefault(); navigatePropertyGallery(${property.id}, 'next')"
                    style="position:absolute; right:10px; top:50%; transform:translateY(-50%); 
                           width:40px; height:40px; border-radius:50%; 
                           background:rgba(255,255,255,0.2); 
                           backdrop-filter:blur(8px);
                           border:1px solid rgba(255,255,255,0.3);
                           color:white; cursor:pointer; display:flex; align-items:center; justify-content:center;
                           font-size:18px; transition:all 0.3s ease; z-index:25;
                           box-shadow:0 2px 10px rgba(0,0,0,0.2);">
                <i class="fas fa-chevron-right"></i>
            </button>
        ` : '';
        
        // Gerar dots (indicadores)
        const dotsHtml = hasMultipleImages ? imageUrls.map((url, idx) => {
            const isVideoUrl = window.isVideoUrl ? window.isVideoUrl(url) : false;
            const icon = isVideoUrl ? '<i class="fas fa-video" style="font-size:0.6rem;"></i>' : '';
            return `
                <div class="gallery-dot ${idx === 0 ? 'active' : ''}" 
                     data-index="${idx}"
                     onclick="event.stopPropagation(); event.preventDefault(); updateCardMedia(${property.id}, ${idx})"
                     style="${isVideoUrl ? 'background:#9b59b6;' : ''}">
                    ${icon}
                </div>
            `;
        }).join('') : '';
        
        // Contador de imagens
        const counterHtml = hasMultipleImages ? `
            <div class="gallery-indicator-mobile" style="position:absolute; bottom:10px; right:10px; 
                        background:rgba(0,0,0,0.7); color:white; padding:4px 8px; border-radius:4px; 
                        font-size:0.7rem; z-index:20;">
                <i class="fas fa-images"></i>
                <span>1/${imageUrls.length}</span>
            </div>
        ` : '';
        
        // Contador de visualizações (Glassmorphism)
        const viewCount = window.getGalleryViews ? window.getGalleryViews(property.id) : 0;
        const viewCounterHtml = `
            <div class="gallery-view-counter" 
                 onclick="event.stopPropagation();"
                 style="position:absolute; bottom:10px; left:10px; 
                        background: rgba(255, 255, 255, 0.25);
                        backdrop-filter: blur(10px);
                        -webkit-backdrop-filter: blur(10px);
                        border-radius: 20px;
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        padding: 6px 12px;
                        font-size: 0.75rem;
                        color: white;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        z-index: 20;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                        transition: all 0.3s ease;
                        cursor: default;">
                <i class="fas fa-eye" style="font-size: 0.7rem;"></i>
                <span>${viewCount}</span>
            </div>
        `;
        
        // Ícone de expandir
        const expandIconHtml = `
            <div class="gallery-expand-icon" onclick="event.stopPropagation(); openGalleryAtCurrentIndex(${property.id})"
                 style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.7); color:white; 
                        width:28px; height:28px; border-radius:50%; display:flex; align-items:center; 
                        justify-content:center; font-size:0.8rem; cursor:pointer; transition:all 0.3s ease; 
                        z-index:20;">
                <i class="fas fa-expand"></i>
            </div>
        `;
        
        return `
            <div class="property-card" data-property-id="${property.id}" data-property-title="${property.title || ''}">
                <div class="property-image ${property.rural ? 'rural-image' : ''}" 
                     style="position: relative; height: 250px; overflow: hidden;">
                    
                    <div class="property-gallery-container" 
                         onclick="openGalleryAtCurrentIndex(${property.id})" 
                         style="cursor:pointer; position:relative; width:100%; height:100%;"
                         data-current-index="0"
                         data-property-id="${property.id}">
                        
                        <!-- Imagem principal -->
                        <img src="${firstImageUrl}" 
                             style="width:100%; height:100%; object-fit:cover;"
                             alt="${property.title || 'Imóvel'}"
                             data-original-src="${firstImageUrl}"
                             data-image-index="0"
                             data-total-images="${imageUrls.length}"
                             onerror="this.src='${this.imageFallback}'">
                        
                        <!-- Setas de navegação Liquid Glass -->
                        ${arrowsHtml}
                        
                        <!-- Badge do imóvel -->
                        ${property.badge ? `
                            <div class="property-badge ${property.rural ? 'rural-badge' : ''}" 
                                 style="position: absolute; top: 15px; left: 15px; background: var(--gold); 
                                        color: white; padding: 0.4rem 1rem; border-radius: 20px; 
                                        font-size: 0.8rem; font-weight: bold; z-index: 15;">
                                ${property.badge}
                            </div>
                        ` : ''}
                        
                        <!-- Indicador de VÍDEO -->
                        ${hasVideo ? `
                            <div class="video-indicator" 
                                 style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.8); 
                                        color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; 
                                        display: flex; align-items: center; gap: 5px; z-index: 15; 
                                        backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.2);">
                                <i class="fas fa-video" style="color: #FFD700; font-size: 12px;"></i>
                                <span>Vídeo</span>
                            </div>
                        ` : ''}
                        
                        <!-- Contador de imagens -->
                        ${counterHtml}
                        
                        <!-- Dots (indicadores) -->
                        ${hasMultipleImages ? `
                            <div class="gallery-controls" 
                                 style="position:absolute; bottom:15px; left:0; right:0; 
                                        display:flex; justify-content:center; gap:8px; z-index:20;">
                                ${dotsHtml}
                            </div>
                        ` : ''}
                        
                        <!-- Ícone de expandir -->
                        ${expandIconHtml}
                        
                        <!-- Contador de visualizações Glassmorphism -->
                        ${viewCounterHtml}
                        
                        <!-- Botão de acesso a PDFs -->
                        ${hasPdfs ? `
                            <button class="pdf-access" 
                                    onclick="event.stopPropagation(); if(window.PdfSystem) window.PdfSystem.showModal(${property.id})" 
                                    style="position: absolute; bottom: 2px; right: 35px; background: rgba(255,255,255,0.95); 
                                           border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; 
                                           display: flex; align-items: center; justify-content: center; font-size: 0.75rem; 
                                           color: #1a5276; transition: all 0.3s ease; z-index: 15; 
                                           box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                                <i class="fas fa-file-pdf"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="property-content" style="padding: 1.5rem;">
                    <div class="property-price" data-price-field 
                         style="font-size: 1.5rem; font-weight: bold; color: var(--primary); margin-bottom: 0.5rem;">
                        ${formatPrice(property.price)}
                    </div>
                    <h3 class="property-title" data-title-field 
                        style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text);">
                        ${property.title || 'Imóvel'}
                    </h3>
                    <div class="property-location" data-location-field 
                         style="color: #666; margin-bottom: 1rem; display: flex; align-items: center; gap: 5px;">
                        <i class="fas fa-map-marker-alt"></i> ${property.location || 'Local não informado'}
                    </div>
                    <p data-description-field style="margin-bottom: 1rem; color: #555; line-height: 1.5;">
                        ${(property.description || 'Descrição não disponível.').substring(0, 120)}${(property.description || '').length > 120 ? '...' : ''}
                    </p>
                    ${displayFeatures ? `
                        <div class="property-features" data-features-field 
                             style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 1rem;">
                            ${displayFeatures.split(',').slice(0, 4).map(f => `
                                <span class="feature-tag ${property.rural ? 'rural-tag' : ''}" 
                                      style="background: var(--accent); color: white; padding: 0.3rem 0.8rem; 
                                             border-radius: 20px; font-size: 0.85rem;">
                                    ${f.trim()}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                    <button class="contact-btn" onclick="contactAgent(${property.id})" 
                            style="background: linear-gradient(45deg, var(--primary), var(--secondary)); 
                                   color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; 
                                   font-size: 1rem; cursor: pointer; width: 100%; transition: all 0.3s ease; 
                                   display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i class="fab fa-whatsapp"></i> Entrar em Contato
                    </button>
                </div>
            </div>
        `;
    }
    
    updateCardContent(propertyId, propertyData) {
        console.log(`⚠️ [Fallback] Recarregando todos os cards para atualizar ${propertyId}`);
        if (typeof window.renderProperties === 'function') {
            window.renderProperties(window.currentFilter || 'todos', true);
            return true;
        }
        return false;
    }
    
    clearCache() {
        console.log('🧹 [Fallback] Cache limpo (fallback mínimo)');
        return 0;
    }
}

// Proxy: tenta usar módulo do Support System, fallback para mínimo
window.propertyTemplates = (() => {
    if (window.SupportTemplates && window.SupportTemplates.PropertyTemplateEngine) {
        console.log('✅ [properties.js] Usando PropertyTemplateEngine do Support System');
        return new window.SupportTemplates.PropertyTemplateEngine();
    }
    
    if (!window._propertyTemplatesProxyAttempted) {
        window._propertyTemplatesProxyAttempted = true;
        
        const checkSupportInterval = setInterval(() => {
            if (window.SupportTemplates && window.SupportTemplates.PropertyTemplateEngine) {
                console.log('✅ [properties.js] SupportTemplates carregado tardiamente, substituindo engine');
                const newEngine = new window.SupportTemplates.PropertyTemplateEngine();
                window.propertyTemplates = newEngine;
                clearInterval(checkSupportInterval);
                
                if (typeof window.renderProperties === 'function') {
                    window.renderProperties(window.currentFilter || 'todos', true);
                }
            }
        }, 500);
        
        setTimeout(() => {
            clearInterval(checkSupportInterval);
            if (!window.SupportTemplates?.PropertyTemplateEngine) {
                console.log('ℹ️ [properties.js] SupportTemplates não disponível, mantendo fallback mínimo');
            }
        }, 10000);
    }
    
    console.warn('⚠️ [properties.js] SupportTemplates não disponível. Usando fallback mínimo.');
    return new MinimalTemplateEngine();
})();

// ========== FUNÇÃO PARA ATUALIZAR CARD ESPECÍFICO APÓS EDIÇÃO ==========
window.updatePropertyCard = function(propertyId, updatedData = null) {
    console.log('🔄 Atualizando card do imóvel:', propertyId, updatedData ? 'com dados específicos' : '');
    
    const property = window.properties?.find(p => p.id === propertyId);
    if (!property) {
        console.error('❌ Imóvel não encontrado para atualizar card:', propertyId);
        return false;
    }
    
    const propertyToRender = updatedData ? { ...property, ...updatedData } : property;
    
    if (updatedData && window.propertyTemplates.updateCardContent) {
        const partialSuccess = window.propertyTemplates.updateCardContent(propertyId, propertyToRender);
        if (partialSuccess) {
            console.log(`✅ Atualização parcial bem-sucedida para ${propertyId}`);
            
            const index = window.properties.findIndex(p => p.id === propertyId);
            if (index !== -1) {
                window.properties[index] = { ...window.properties[index], ...updatedData };
            }
            
            return true;
        }
    }
    
    console.log(`🔄 Realizando substituição completa do card ${propertyId}`);
    
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
        
        console.log('✅ Card completamente substituído com todos os campos atualizados:', {
            título: propertyToRender.title,
            preço: propertyToRender.price,
            localização: propertyToRender.location,
            vídeo: propertyToRender.has_video
        });
        
        const index = window.properties.findIndex(p => p.id === propertyId);
        if (index !== -1) {
            window.properties[index] = propertyToRender;
        }
        
        setTimeout(() => {
            const updatedCard = document.querySelector(`[data-property-id="${propertyId}"]`);
            if (updatedCard) {
                updatedCard.classList.add('highlighted');
                setTimeout(() => {
                    updatedCard.classList.remove('highlighted');
                }, 1000);
            }
        }, 50);
        
        return true;
    } else {
        console.warn('⚠️ Card não encontrado na página, renderizando todos os imóveis');
        if (typeof window.renderProperties === 'function') {
            window.renderProperties(window.currentFilter || 'todos');
        }
        return false;
    }
};

// ========== 1. FUNÇÃO OTIMIZADA: CARREGAMENTO UNIFICADO ==========
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
        
        const saved = window.savePropertiesToStorage();
        if (!saved) {
            console.error('❌ CRÍTICO: Não foi possível salvar propriedades no localStorage!');
            try {
                sessionStorage.setItem('properties_backup', JSON.stringify(window.properties));
            } catch (backupError) {
                console.error('❌ Fallback também falhou!');
            }
        }

        loading?.setVariant?.('success');
        
        const propertyCount = window.properties.length;
        let finalMessage = '';
        
        if (propertyCount === 0) {
            finalMessage = 'Pronto para começar! 🏠';
        } else if (propertyCount === 1) {
            finalMessage = '✨ 1 imóvel disponível!';
        } else if (propertyCount <= 5) {
            finalMessage = `✨ ${propertyCount} opções incríveis!`;
        } else if (propertyCount <= 20) {
            finalMessage = `🏘️ ${propertyCount} oportunidades em Maceió!`;
        } else {
            finalMessage = `🏆 ${propertyCount} imóveis disponíveis!`;
        }
        
        loading?.updateMessage?.(finalMessage);
        window.renderProperties('todos');

        if (typeof window.waitForAllPropertyImages === 'function') {
            const imagesLoaded = await window.waitForAllPropertyImages();
            if (imagesLoaded >= (document.querySelectorAll('.property-image img').length || 0)) {
                loading?.setVariant?.('success');
                loading?.updateMessage?.(finalMessage + ' 🖼️');
            } else {
                loading?.setVariant?.('success');
                loading?.updateMessage?.(`${finalMessage} (${imagesLoaded} imagens carregadas)`);
            }
        }
        
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

// ========== 3. RENDERIZAÇÃO OTIMIZADA ==========
window.renderProperties = function(filter = 'todos', forceClearCache = false) {
    console.log(`🎨 Renderizando propriedades (filtro: ${filter})${forceClearCache ? ' - CACHE LIMPO' : ''}`);
    
    if (forceClearCache && window.propertyTemplates && window.propertyTemplates.clearCache) {
        window.propertyTemplates.clearCache();
    }
    
    const container = document.getElementById('properties-container');
    if (!container) {
        console.error('❌ Container de propriedades não encontrado');
        return;
    }

    if (!window.properties || window.properties.length === 0) {
        container.innerHTML = '<p class="no-properties">Nenhum imóvel disponível.</p>';
        return;
    }

    const filtered = window.filterProperties(window.properties, filter);
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-properties">Nenhum imóvel disponível para este filtro.</p>';
        return;
    }

    container.innerHTML = filtered.map(prop => 
        window.propertyTemplates.generate(prop)
    ).join('');

    console.log(`✅ ${filtered.length} imóveis renderizados (filtro: ${filter})`);
    
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

// ========== 4. SALVAR NO STORAGE - VERSÃO UNIFICADA ==========
window.savePropertiesToStorage = function() {
    console.log('💾 Salvando propriedades NO LOCALSTORAGE UNIFICADO...');
    
    try {
        if (!window.properties || !Array.isArray(window.properties)) {
            console.error('❌ window.properties não é um array válido para salvar');
            return false;
        }
        
        const propertiesToSave = JSON.stringify(window.properties);
        localStorage.setItem('properties', propertiesToSave);
        
        ['weberlessa_properties', 'properties_backup', 'weberlessa_backup'].forEach(oldKey => {
            if (localStorage.getItem(oldKey)) {
                localStorage.removeItem(oldKey);
            }
        });
        
        const verify = localStorage.getItem('properties');
        if (!verify) {
            console.error('❌ VERIFICAÇÃO FALHOU: localStorage vazio após salvar!');
            return false;
        }
        
        const parsedVerify = JSON.parse(verify);
        if (parsedVerify.length !== window.properties.length) {
            console.error(`❌ VERIFICAÇÃO FALHOU: Quantidade diferente! Salvo: ${parsedVerify.length}, Esperado: ${window.properties.length}`);
            return false;
        }
        
        console.log(`✅ ${window.properties.length} imóveis salvos em "properties"`);
        
        return true;
        
    } catch (error) {
        console.error('❌ ERRO CRÍTICO ao salvar:', error);
        
        try {
            const backupData = window.properties.map(p => ({
                id: p.id,
                title: p.title,
                price: p.price,
                location: p.location
            }));
            localStorage.setItem('properties_minimal', JSON.stringify(backupData));
        } catch (backupError) {
            console.error('❌ Fallback também falhou!');
        }
        
        return false;
    }
};

// ========== FUNÇÃO AUXILIAR: Atualizar localStorage sempre ==========
window.updateLocalStorage = function() {
    return window.savePropertiesToStorage();
};

// ========== 5. CONFIGURAR FILTROS (VERSÃO COMPATÍVEL) ==========
window.setupFilters = function() {
    console.log('🎛️ Configurando filtros (compatibilidade)...');
    
    if (window.FilterManager && typeof window.FilterManager.setupWithFallback === 'function') {
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
    const whatsappURL = `https://wa.me/5582996044513?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
};

// ========== 7. ADICIONAR NOVO IMÓVEL ==========
window.addNewProperty = async function(propertyData) {
    console.group('➕ ADICIONANDO NOVO IMÓVEL - VERSÃO CORRIGIDA');

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

        if (propertyData.features) {
            propertyData.features = window.SharedCore?.parseFeaturesForStorage?.(propertyData.features) ?? '[]';
        } else {
            propertyData.features = '[]';
        }

        propertyData.has_video = window.SharedCore?.ensureBooleanVideo?.(propertyData.has_video) ?? false;

        let mediaResult = { images: '', pdfs: '' };
        let hasMedia = false;

        if (typeof MediaSystem !== 'undefined') {
            hasMedia = MediaSystem.state.files.length > 0 || MediaSystem.state.pdfs.length > 0;
            
            if (hasMedia) {
                const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2)}`;
                mediaResult = await MediaSystem.uploadAll(tempId, propertyData.title);
                
                if (mediaResult.images) {
                    propertyData.images = mediaResult.images;
                }
                
                if (mediaResult.pdfs) {
                    propertyData.pdfs = mediaResult.pdfs;
                }
            } else {
                propertyData.images = '';
                propertyData.pdfs = '';
            }
        }

        let supabaseSuccess = false;
        let supabaseId = null;

        if (window.ensureSupabaseCredentials() && typeof window.supabaseSaveProperty === 'function') {
            try {
                const supabaseData = {
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
                };

                const supabaseResponse = await window.supabaseSaveProperty(supabaseData);

                if (supabaseResponse && supabaseResponse.success) {
                    supabaseSuccess = true;
                    supabaseId = supabaseResponse.data?.id || supabaseResponse.data?.[0]?.id;
                }
            } catch (error) {
                console.error('❌ Erro ao salvar no Supabase:', error);
            }
        }

        let newId;
        
        if (supabaseSuccess && supabaseId) {
            newId = supabaseId;
            console.log(`✅ ID sincronizado do Supabase: ${newId}`);
        } else {
            const maxLocalId = window.properties.length > 0 ? 
                Math.max(...window.properties.map(p => parseInt(p.id) || 0)) : 0;
            newId = maxLocalId + 1;
            console.log(`⚠️ ID local temporário: ${newId} (sem conexão Supabase)`);
        }

        const newProperty = {
            id: newId,
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
            pdfs: propertyData.pdfs || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            savedToSupabase: supabaseSuccess,
            syncStatus: supabaseSuccess ? 'synced' : 'local_only'
        };

        console.log(`💾 Salvando imóvel ${newId} localmente...`);
        
        window.properties.unshift(newProperty);
        
        const saved = window.savePropertiesToStorage();
        
        if (!saved) {
            try {
                localStorage.setItem('properties_backup_' + Date.now(), JSON.stringify([newProperty]));
            } catch (backupError) {
                console.error('❌ Backup também falhou!');
                alert('⚠️ ATENÇÃO: Não foi possível salvar o imóvel localmente!\n\nO imóvel aparecerá agora mas pode desaparecer ao recarregar.');
            }
        }

        console.log('🎨 Atualizando interface...');
        
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos', true);
        }
        
        if (typeof window.loadPropertyList === 'function') {
            setTimeout(() => {
                window.loadPropertyList();
            }, 100);
        }
        
        setTimeout(() => {
            const cardExists = !!document.querySelector(`[data-property-id="${newId}"]`);
            const inList = window.properties.some(p => p.id === newId);
            
            if (!cardExists || !inList) {
                if (typeof window.renderProperties === 'function') {
                    window.renderProperties('todos', true);
                }
            }
        }, 300);

        const imageCount = newProperty.images
            ? newProperty.images.split(',').filter(u => u.trim() && u !== 'EMPTY').length
            : 0;

        const pdfCount = newProperty.pdfs
            ? newProperty.pdfs.split(',').filter(u => u.trim() && u !== 'EMPTY').length
            : 0;

        let message = `✅ Imóvel "${newProperty.title}" cadastrado com sucesso!\n\n`;
        message += `💰 Preço: ${newProperty.price}\n`;
        message += `📍 Local: ${newProperty.location}\n`;
        
        if (imageCount > 0) message += `📸 ${imageCount} foto(s)/vídeo(s) anexada(s)\n`;
        if (pdfCount > 0) message += `📄 ${pdfCount} documento(s) PDF anexado(s)\n`;
        if (newProperty.has_video) message += `🎬 Marcado como "Tem vídeo"\n`;
        
        if (!supabaseSuccess) {
            message += `\n⚠️ Salvo apenas localmente (sem conexão com servidor)`;
        } else {
            message += `\n🌐 Salvo no servidor com ID: ${supabaseId}`;
        }

        alert(message);

        setTimeout(() => {
            if (typeof MediaSystem !== 'undefined') {
                MediaSystem.resetState();
            }
        }, 300);

        if (window.SmartCache) {
            SmartCache.invalidatePropertiesCache();
        }

        console.log(`✅ Imóvel ${newId} cadastrado com sucesso`);
        console.groupEnd();
        return newProperty;

    } catch (error) {
        console.error('❌ ERRO CRÍTICO ao adicionar imóvel:', error);
        
        let errorMessage = '❌ Erro ao cadastrar imóvel:\n';
        errorMessage += error.message || 'Erro desconhecido';
        
        alert(errorMessage);
        
        console.groupEnd();
        return null;
    }
};

// ========== 8. ATUALIZAR IMÓVEL ==========
window.updateProperty = async function(id, propertyData) {
    console.group('📤 updateProperty - VERSÃO CORRIGIDA');

    if (!id || id === 'null' || id === 'undefined') {
        console.error('❌ ID inválido fornecido:', id);
        if (window.editingPropertyId) {
            console.log(`🔄 Usando editingPropertyId: ${window.editingPropertyId}`);
            id = window.editingPropertyId;
        } else {
            alert('❌ ERRO: Não foi possível identificar o imóvel para atualização!');
            console.groupEnd();
            return { success: false, localOnly: true, error: 'ID inválido' };
        }
    }

    const index = window.properties.findIndex(p => p.id == id || p.id === id);
    if (index === -1) {
        console.error('❌ Imóvel não encontrado! IDs disponíveis:', window.properties.map(p => p.id));
        alert(`❌ Imóvel não encontrado!\n\nIDs disponíveis: ${window.properties.map(p => p.id).join(', ')}`);
        console.groupEnd();
        return { success: false, localOnly: true, error: 'Imóvel não encontrado' };
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

        const processedData = {
            ...propertyData,
            has_video: window.SharedCore?.ensureBooleanVideo?.(propertyData.has_video) ?? false
        };

        const updateData = {
            title: processedData.title || window.properties[index].title,
            price: processedData.price || window.properties[index].price,
            location: processedData.location || window.properties[index].location,
            description: processedData.description || window.properties[index].description || '',
            features: processedData.features || window.properties[index].features || '[]',
            type: processedData.type || window.properties[index].type || 'residencial',
            has_video: processedData.has_video,
            badge: processedData.badge || window.properties[index].badge || 'Novo',
            rural: processedData.type === 'rural' || window.properties[index].rural || false,
            images: processedData.images || window.properties[index].images || '',
            pdfs: processedData.pdfs || window.properties[index].pdfs || ''
        };

        const localSuccess = window.updateLocalProperty(id, updateData);
        
        if (!localSuccess) {
            throw new Error('Falha ao atualizar localmente');
        }

        let supabaseSuccess = false;
        let supabaseError = null;
        let supabaseResponse = null;
        
        const hasSupabase = window.ensureSupabaseCredentials();
        
        if (hasSupabase) {
            try {
                const validId = window.validateIdForSupabase?.(id) || id;
                
                const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${validId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': window.SUPABASE_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(updateData)
                });

                if (response.ok) {
                    supabaseSuccess = true;
                    supabaseResponse = await response.json();
                } else {
                    supabaseError = await response.text();
                }
            } catch (error) {
                supabaseError = error.message;
            }
        }

        const imagesCount = updateData.images ? updateData.images.split(',').filter(p => p.trim()).length : 0;
        
        if (supabaseSuccess) {
            let msg = `✅ Imóvel "${updateData.title}" atualizado PERMANENTEMENTE!\n`;
            msg += `💰 Preço: ${updateData.price}\n`;
            msg += `📍 Local: ${updateData.location}\n`;
            if (imagesCount > 0) msg += `📸 ${imagesCount} imagem(ns)\n`;
            if (updateData.has_video) msg += `🎬 Agora tem vídeo\n`;
            alert(msg);
            return { success: true, localOnly: false, data: supabaseResponse };
        } else {
            let msg = `⚠️ Imóvel "${updateData.title}" atualizado apenas LOCALMENTE.\n`;
            msg += `💰 Preço: ${updateData.price}\n`;
            msg += `📍 Local: ${updateData.location}\n\n`;
            msg += `📱 As alterações foram salvas no seu navegador.\n`;
            msg += `🌐 Para salvar no servidor, verifique a conexão com internet.`;
            
            if (updateData.has_video) {
                msg += `\n\n✅ VÍDEO: Marcado como "Tem vídeo" (salvo localmente)`;
            }
            
            if (supabaseError) {
                msg += `\n\n❌ Erro: ${supabaseError.substring(0, 150)}...`;
            }
            
            alert(msg);
            return { success: true, localOnly: true, error: supabaseError };
        }

    } catch (error) {
        console.error('❌ ERRO ao atualizar imóvel:', error);
        console.groupEnd();
        alert(`❌ ERRO: Não foi possível atualizar o imóvel.\n\n${error.message}`);
        return { success: false, localOnly: true, error: error.message };
    }
};

// ========== 9. FUNÇÃO CRÍTICA: Atualizar propriedade localmente ==========
window.updateLocalProperty = function(propertyId, updatedData) {
    console.group(`💾 updateLocalProperty: ${propertyId}`);
    
    if (!window.properties || !Array.isArray(window.properties)) {
        console.error('❌ window.properties não é um array válido');
        return false;
    }
    
    const index = window.properties.findIndex(p => p.id == propertyId || p.id === propertyId);
    if (index === -1) {
        console.error('❌ Imóvel não encontrado localmente');
        return false;
    }
    
    if (updatedData.has_video !== undefined) {
        updatedData.has_video = window.SharedCore?.ensureBooleanVideo?.(updatedData.has_video) ?? false;
    }
    
    if (updatedData.features !== undefined && typeof updatedData.features !== 'string') {
        updatedData.features = window.SharedCore?.parseFeaturesForStorage?.(updatedData.features) ?? '[]';
    }
    
    const existingProperty = window.properties[index];
    
    window.properties[index] = {
        ...existingProperty,
        ...updatedData,
        id: propertyId,
        updated_at: new Date().toISOString()
    };
    
    const saved = window.savePropertiesToStorage();
    
    if (!saved) {
        console.error('❌ Falha crítica ao salvar no localStorage após atualização!');
        console.groupEnd();
        return false;
    }
    
    console.log(`✅ Imóvel ${propertyId} atualizado localmente:`, {
        título: updatedData.title || existingProperty.title,
        preço: updatedData.price || existingProperty.price,
        localização: updatedData.location || existingProperty.location,
        video: updatedData.has_video
    });
    
    if (typeof window.loadPropertyList === 'function') {
        setTimeout(() => {
            window.loadPropertyList();
        }, 100);
    }
    
    if (typeof window.updatePropertyCard === 'function') {
        setTimeout(() => {
            window.updatePropertyCard(propertyId, updatedData);
        }, 150);
    } else {
        if (typeof window.renderProperties === 'function') {
            setTimeout(() => {
                window.renderProperties(window.currentFilter || 'todos', true);
            }, 200);
        }
    }
    
    console.groupEnd();
    return true;
};

// ========== 10. FUNÇÃO CRÍTICA: Adicionar propriedade localmente ==========
window.addToLocalProperties = function(newProperty) {
    console.group('➕ addToLocalProperties');
    
    if (!window.properties) window.properties = [];
    
    let propertyWithId = newProperty;
    if (!propertyWithId.id) {
        const maxId = window.properties.length > 0 ? 
            Math.max(...window.properties.map(p => parseInt(p.id) || 0)) : 0;
        propertyWithId.id = maxId + 1;
    }
    
    if (!propertyWithId.created_at) {
        propertyWithId.created_at = new Date().toISOString();
    }
    if (!propertyWithId.updated_at) {
        propertyWithId.updated_at = new Date().toISOString();
    }
    
    propertyWithId.has_video = window.SharedCore?.ensureBooleanVideo?.(propertyWithId.has_video) ?? false;
    propertyWithId.features = window.SharedCore?.parseFeaturesForStorage?.(propertyWithId.features) ?? '[]';
    
    window.properties.unshift(propertyWithId);
    
    const saved = window.savePropertiesToStorage();
    
    if (!saved) {
        console.error('❌ Falha crítica ao salvar imóvel no localStorage!');
        console.groupEnd();
        return null;
    }
    
    console.log(`✅ Imóvel ${propertyWithId.id} adicionado localmente:`, {
        titulo: propertyWithId.title,
        preço: propertyWithId.price,
        localização: propertyWithId.location
    });
    
    setTimeout(() => {
        if (typeof window.loadPropertyList === 'function') {
            window.loadPropertyList();
        }
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos', true);
        }
    }, 100);
    
    console.groupEnd();
    return propertyWithId;
};

// ========== 11. EXCLUIR IMÓVEL ==========
window.deleteProperty = async function(id) {
    console.group(`🗑️ deleteProperty: ${id}`);

    const property = window.properties.find(p => p.id === id);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        console.groupEnd();
        return false;
    }

    if (!confirm(`⚠️ TEM CERTEZA que deseja excluir o imóvel?\n\n"${property.title}"\n\nEsta ação NÃO pode ser desfeita.`)) {
        console.log('❌ Exclusão cancelada pelo usuário');
        console.groupEnd();
        return false;
    }

    let mediaDeletionSuccess = true;
    let mediaDeletionError = null;

    if (typeof MediaSystem !== 'undefined' && typeof MediaSystem.deleteFilesFromStorage === 'function') {
        const imageUrls = property.images && property.images !== 'EMPTY' 
            ? property.images.split(',').filter(url => url && url.trim() !== '') 
            : [];
        const pdfUrls = property.pdfs && property.pdfs !== 'EMPTY' 
            ? property.pdfs.split(',').filter(url => url && url.trim() !== '') 
            : [];
        const allFileUrls = [...imageUrls, ...pdfUrls];

        if (allFileUrls.length > 0) {
            console.log(`🗑️ Iniciando exclusão física de ${allFileUrls.length} arquivo(s) associados ao imóvel.`);
            try {
                const deletionResult = await MediaSystem.deleteFilesFromStorage(allFileUrls);
                if (!deletionResult.success) {
                    console.warn(`⚠️ Exclusão de arquivos teve falhas: ${deletionResult.failedCount} erro(s).`);
                    mediaDeletionError = `Falha ao excluir ${deletionResult.failedCount} arquivo(s) físicos.`;
                    mediaDeletionSuccess = false;
                } else {
                    console.log(`✅ ${deletionResult.deletedCount} arquivo(s) excluídos fisicamente do Storage.`);
                }
            } catch (error) {
                console.error('❌ Erro crítico ao tentar excluir arquivos físicos:', error);
                mediaDeletionError = error.message;
                mediaDeletionSuccess = false;
                
                const userConfirmed = confirm(`⚠️ ERRO AO EXCLUIR ARQUIVOS FÍSICOS:\n\n${mediaDeletionError}\n\nDeseja continuar com a exclusão do registro do imóvel? Os arquivos órfãos permanecerão no Storage.`);
                if (!userConfirmed) {
                    console.log('❌ Exclusão cancelada pelo usuário devido a erro na exclusão de arquivos.');
                    alert('❌ Exclusão cancelada para preservar a integridade dos arquivos.');
                    console.groupEnd();
                    return false;
                }
            }
        } else {
            console.log('📭 Imóvel sem arquivos de mídia para excluir.');
        }
    } else {
        console.warn('⚠️ MediaSystem.deleteFilesFromStorage não disponível. Pulando exclusão física de arquivos.');
        const proceedWithoutMediaDeletion = confirm(`⚠️ O sistema de exclusão de arquivos não está disponível.\n\nOs arquivos de mídia do imóvel "${property.title}" NÃO serão removidos do Storage, permanecendo como arquivos órfãos.\n\nDeseja continuar apenas com a exclusão do registro do imóvel?`);
        if (!proceedWithoutMediaDeletion) {
            console.log('❌ Exclusão cancelada pelo usuário.');
            console.groupEnd();
            return false;
        }
        mediaDeletionSuccess = false;
        mediaDeletionError = 'Sistema de exclusão de arquivos indisponível.';
    }

    let supabaseSuccess = false;
    let supabaseError = null;

    if (window.ensureSupabaseCredentials()) {
        const validId = window.validateIdForSupabase?.(id) || id;
        
        try {
            const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${validId}`, {
                method: 'DELETE',
                headers: {
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                    'Prefer': 'return=representation'
                }
            });

            if (response.ok) {
                supabaseSuccess = true;
            } else {
                supabaseError = await response.text();
            }
        } catch (error) {
            supabaseError = error.message;
        }
    }

    window.properties = window.properties.filter(p => p.id !== id);
    
    const saved = window.savePropertiesToStorage();
    
    if (!saved) {
        console.error('❌ Falha ao salvar após exclusão!');
        alert('⚠️ Erro ao salvar alterações localmente!');
        console.groupEnd();
        return false;
    }

    if (typeof window.renderProperties === 'function') {
        window.renderProperties('todos', true);
    }

    if (typeof window.loadPropertyList === 'function') {
        setTimeout(() => {
            window.loadPropertyList();
        }, 100);
    }

    let finalMessage = '';
    if (supabaseSuccess) {
        finalMessage = `✅ Imóvel "${property.title}" excluído PERMANENTEMENTE do sistema!\n\n`;
        finalMessage += `✓ Registro removido do servidor.\n`;
        if (mediaDeletionSuccess) {
            finalMessage += `✓ Arquivos de mídia excluídos fisicamente do Storage.`;
        } else {
            finalMessage += `⚠️ ATENÇÃO: Falha na exclusão física dos arquivos de mídia (${mediaDeletionError || 'erro desconhecido'}). Os arquivos podem permanecer no Storage como órfãos.`;
        }
    } else {
        finalMessage = `⚠️ Imóvel "${property.title}" excluído apenas LOCALMENTE.\n\n`;
        finalMessage += `✓ Registro removido do seu navegador.\n`;
        if (!supabaseError && !window.ensureSupabaseCredentials()) {
            finalMessage += `🌐 O servidor não estava acessível. O imóvel ainda existe no servidor e reaparecerá ao sincronizar.\n`;
        } else if (supabaseError) {
            finalMessage += `❌ Erro no servidor: ${supabaseError.substring(0, 100)}...\n`;
        }
        if (!mediaDeletionSuccess) {
            finalMessage += `⚠️ ATENÇÃO: Os arquivos de mídia NÃO foram excluídos.`;
        }
    }
    alert(finalMessage);

    console.groupEnd();
    return supabaseSuccess;
};

// ========== 12. CARREGAR LISTA PARA ADMIN ==========
window.loadPropertyList = function() {
    if (!window.properties || typeof window.properties.forEach !== 'function') {
        console.error('❌ window.properties não é um array válido');
        return;
    }
    
    const container = document.getElementById('propertyList');
    const countElement = document.getElementById('propertyCount');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (countElement) {
        countElement.textContent = window.properties.length;
    }
    
    if (window.properties.length === 0) {
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
                    ${property.has_video ? '🎬 Tem vídeo | ' : ''}
                    Imagens: ${property.images ? property.images.split(',').filter(i => i.trim()).length : 0}
                    ${property.pdfs ? ` | PDFs: ${property.pdfs.split(',').filter(p => p.trim()).length}` : ''}
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="editProperty(${property.id})" 
                        style="background: var(--accent); color: white; border: none; padding: 0.5rem 1rem; border-radius: 3px; cursor: pointer;">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="deleteProperty(${property.id})" 
                        style="background: #e74c3c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 3px; cursor: pointer;">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        container.appendChild(item);
    });
    
    console.log(`✅ ${window.properties.length} imóveis listados no admin`);
};

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
console.log('✅ properties.js VERSÃO OTIMIZADA COM ENGINE DELEGADA CARREGADA');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🏠 DOM carregado - inicializando properties...');

        if (typeof window.runLowPriority === 'function') {
            window.runLowPriority(() => {
                if (typeof window.loadPropertiesData === 'function') {
                    window.loadPropertiesData();
                }

                window.runLowPriority(() => {
                    if (typeof window.setupFilters === 'function') {
                        window.setupFilters();
                    }
                });
            });
        } else {
            setTimeout(() => {
                if (typeof window.loadPropertiesData === 'function') {
                    window.loadPropertiesData();
                }
                setTimeout(() => {
                    if (typeof window.setupFilters === 'function') {
                        window.setupFilters();
                    }
                }, 100);
            }, 100);
        }
    });
} else {
    if (typeof window.runLowPriority === 'function') {
        window.runLowPriority(() => {
            if (typeof window.loadPropertiesData === 'function') {
                window.loadPropertiesData();
            }

            window.runLowPriority(() => {
                if (typeof window.setupFilters === 'function') {
                    window.setupFilters();
                }
            });
        });
    } else {
        setTimeout(() => {
            if (typeof window.loadPropertiesData === 'function') {
                window.loadPropertiesData();
            }
            setTimeout(() => {
                if (typeof window.setupFilters === 'function') {
                    window.setupFilters();
                }
            }, 100);
        }, 100);
    }
}

window.getInitialProperties = getInitialProperties;

console.log('🎯 VERSÃO OTIMIZADA - Template Engine delegada para Support System.');
console.log('💡 Adicione ?debug=true na URL para carregar o template completo do Support System.');
