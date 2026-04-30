// js/modules/properties.js - VERSÃO COMPLETA COM PAGINAÇÃO + ÍCONES NORMALIZADOS + FILTRO DIFERENCIADO + SHARE + NOVO BADGE + LINK DIRETO
console.log('🏠 properties.js - VERSÃO COMPLETA COM PAGINAÇÃO + ÍCONES NORMALIZADOS + FILTRO DIFERENCIADO + SHARE + NOVO BADGE + LINK DIRETO');

window.properties = [];
window.editingPropertyId = null;
window.currentFilter = 'todos';

// ========== VARIÁVEIS DE PAGINAÇÃO DO ADMIN ==========
window.adminCurrentPage = 1;
window.adminItemsPerPage = 4; // Itens por página padrão (4/8/12/16) - Padrão 4 para melhor experiência mobile

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

// ========== COMPARTILHAR IMÓVEL (COPIA LINK) - VERSÃO MELHORADA COM URL ABSOLUTA ==========
window.shareProperty = async function(id) {
    const property = window.properties.find(p => p.id === id);
    if (!property) {
        console.error('❌ Imóvel não encontrado');
        return;
    }
    
    // Gera uma URL absoluta garantindo que o protocolo e domínio estejam corretos
    const shareUrl = new URL(`?property=${id}`, window.location.href).href;
    console.log(`🔗 Link de compartilhamento gerado: ${shareUrl}`);
    
    try {
        await navigator.clipboard.writeText(shareUrl);
        
        // Mostrar feedback visual temporário
        const card = document.querySelector(`.property-card[data-property-id="${id}"]`);
        if (card) {
            // Criar toast de confirmação
            const toast = document.createElement('div');
            toast.textContent = '✅ Link copiado! Compartilhe com seus amigos.';
            toast.style.cssText = `
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                background: #27ae60;
                color: white;
                padding: 12px 24px;
                border-radius: 50px;
                font-size: 0.9rem;
                font-weight: 600;
                z-index: 10000;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                animation: slideUpFade 0.3s ease;
                pointer-events: none;
            `;
            
            // Adicionar animação via CSS se não existir
            if (!document.querySelector('#shareToastStyle')) {
                const style = document.createElement('style');
                style.id = 'shareToastStyle';
                style.textContent = `
                    @keyframes slideUpFade {
                        from {
                            opacity: 0;
                            transform: translateX(-50%) translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateX(-50%) translateY(0);
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(toast);
            
            // Remover toast após 2 segundos
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }
        
        console.log(`✅ Link copiado: ${shareUrl}`);
    } catch (err) {
        console.error('❌ Erro ao copiar:', err);
        alert('⚠️ Não foi possível copiar o link. Copie manualmente da barra de endereços.');
    }
};

// ============================================================
// FUNÇÃO PARA FILTRAR IMÓVEL INDIVIDUAL POR ID (via URL)
// ============================================================
window.filterPropertyById = function(propertyId) {
    if (!propertyId) return null;
    
    // Converte o parâmetro da URL (string) para número, para comparar com os IDs dos imóveis
    const idToFind = Number(propertyId);
    
    // Verifica se a conversão foi válida
    if (isNaN(idToFind)) {
        console.warn(`⚠️ ID inválido na URL: "${propertyId}"`);
        return null;
    }
    
    // Procura o imóvel na lista global
    const foundProperty = window.properties.find(p => p.id === idToFind);
    
    if (foundProperty) {
        console.log(`🔍 Link direto: Exibindo apenas o imóvel ID ${idToFind} - "${foundProperty.title}"`);
    } else {
        console.warn(`⚠️ Link direto: Imóvel com ID ${idToFind} não encontrado.`);
    }
    
    return foundProperty;
};

// ============================================================
// FUNÇÃO PARA INICIALIZAR A EXIBIÇÃO BASEADA NA URL
// ============================================================
window.loadPropertiesBasedOnUrl = function() {
    // 1. Obtém o parâmetro 'property' da URL
    const urlParams = new URLSearchParams(window.location.search);
    const propertyIdFromUrl = urlParams.get('property');
    
    // 2. Se o parâmetro NÃO EXISTE, exibe todos os imóveis (comportamento padrão)
    if (!propertyIdFromUrl) {
        console.log('🏠 Nenhum imóvel específico na URL. Exibindo todos.');
        // Chama a função de renderização padrão com o filtro 'todos'
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos');
        }
        return;
    }
    
    // 3. Se o parâmetro EXISTE, tenta encontrar o imóvel
    console.log(`🔗 Link direto detectado para o imóvel ID: ${propertyIdFromUrl}`);
    const singleProperty = window.filterPropertyById(propertyIdFromUrl);
    
    // 4. Obtém o container onde os imóveis são renderizados
    const container = document.getElementById('properties-container');
    if (!container) {
        console.error('❌ Container "properties-container" não encontrado.');
        return;
    }
    
    // 5. Se o imóvel foi encontrado, renderiza SOMENTE ele
    if (singleProperty) {
        // Usa o template engine existente para gerar o HTML do card individual
        if (window.propertyTemplates && typeof window.propertyTemplates.generate === 'function') {
            const singlePropertyHtml = window.propertyTemplates.generate(singleProperty);
            container.innerHTML = singlePropertyHtml;
            console.log(`✨ Exibindo apenas o imóvel: "${singleProperty.title}"`);
        } else {
            console.error('❌ Template engine não encontrado.');
            container.innerHTML = '<p class="error-message">Erro ao carregar o imóvel solicitado.</p>';
        }
    } 
    // 6. Se o imóvel NÃO FOI ENCONTRADO, exibe uma mensagem amigável
    else {
        container.innerHTML = `
            <div class="no-properties" style="text-align: center; padding: 3rem;">
                <i class="fas fa-home" style="font-size: 3rem; color: #95a5a6; margin-bottom: 1rem; display: block;"></i>
                <h3>Imóvel não encontrado</h3>
                <p>O imóvel que você está procurando pode não existir mais ou o link pode estar incorreto.</p>
                <a href="./" style="display: inline-block; margin-top: 1rem; padding: 0.8rem 1.5rem; background: var(--primary); color: white; border-radius: 5px; text-decoration: none;">
                    <i class="fas fa-arrow-left"></i> Ver todos os imóveis
                </a>
            </div>
        `;
        console.warn(`⚠️ Imóvel com ID ${propertyIdFromUrl} não encontrado na base de dados.`);
    }
};

// ========== TEMPLATE ENGINE COM CACHE (OTIMIZADO) ==========
class PropertyTemplateEngine {
    constructor() {
        this.imageFallback = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
        this._localCache = new Map();
    }

    generate(property) {
        if (window.TemplateCache && typeof window.TemplateCache.getTemplate === 'function') {
            return window.TemplateCache.getTemplate(property, (prop) => this._generateTemplate(prop));
        }
        
        const cacheKey = `prop_${property.id}_${property.images?.length || 0}_${property.has_video}`;
        if (this._localCache.has(cacheKey)) {
            return this._localCache.get(cacheKey);
        }
        
        const html = this._generateTemplate(property);
        this._localCache.set(cacheKey, html);
        
        // Otimização: Limite reduzido de 50 para 30 (mais que suficiente para a maioria das páginas)
        if (this._localCache.size > 30) {
            const keysToDelete = Array.from(this._localCache.keys()).slice(0, 10);
            keysToDelete.forEach(key => this._localCache.delete(key));
        }
        
        return html;
    }
    
    // ========== FUNÇÃO AUXILIAR PARA VERIFICAR IMÓVEL NOVO ==========
    isNewProperty(createdAt) {
        if (!createdAt) return false;
        const createdDate = new Date(createdAt);
        const now = new Date();
        const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        return diffDays <= 7; // Imóveis dos últimos 7 dias
    }
    
    _generateTemplate(property) {
        const displayFeatures = window.SharedCore?.formatFeaturesForDisplay?.(property.features) ?? '';
        
        // Usar o PriceFormatter centralizado do SharedCore (única fonte da verdade)
        const formatPrice = (price) => {
            return window.SharedCore?.PriceFormatter?.formatForCard(price) ?? 'R$ 0,00';
        };

        const descriptionText = property.description || 'Descrição não disponível.';
        const truncatedDesc = descriptionText.length > 120 
            ? descriptionText.substring(0, 120) + '...' 
            : descriptionText;

        // ========== INDICADOR "NOVO" PARA IMÓVEIS RECENTES ==========
        const showNewBadge = this.isNewProperty(property.created_at);
        const newBadgeHtml = showNewBadge ? `
            <div style="
                position: absolute;
                top: ${property.badge ? '45px' : '15px'};
                right: 15px;
                background: linear-gradient(135deg, #27ae60, #2ecc71);
                color: white;
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 0.7rem;
                font-weight: bold;
                z-index: 15;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                animation: pulse 1.5s infinite;
            ">
                <i class="fas fa-star"></i> NOVO
            </div>
        ` : '';

        const html = `
            <div class="property-card" data-property-id="${property.id}" data-property-title="${property.title}">
                ${this.generateImageSection(property, newBadgeHtml)}
                <div class="property-content">
                    <div class="property-price" data-price-field>${formatPrice(property.price)}</div>
                    <h3 class="property-title" data-title-field>${this.escapeHtml(property.title) || 'Sem título'}</h3>
                    <div class="property-location" data-location-field>
                        <i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(property.location) || 'Local não informado'}
                    </div>
                    <p data-description-field>${this.escapeHtml(truncatedDesc)}</p>
                    ${displayFeatures ? `
                        <div class="property-features" data-features-field style="display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0;">
                            ${displayFeatures.split(',').map(f => {
                                const feature = f.trim();
                                if (feature) {
                                    return window.FeatureIconMapper.renderFeatureWithIcon(feature, property.rural);
                                }
                                return '';
                            }).join('')}
                        </div>
                    ` : ''}
                    <div style="display: flex; gap: 8px; margin-top: 10px;">
                        <button class="contact-btn" onclick="contactAgent(${property.id})" style="flex: 2;">
                            <i class="fab fa-whatsapp"></i> Entrar em Contato
                        </button>
                        <button class="share-btn" onclick="shareProperty(${property.id})" style="
                            background: #3498db;
                            color: white;
                            border: none;
                            padding: 0.8rem;
                            border-radius: 8px;
                            cursor: pointer;
                            flex: 1;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 5px;
                            transition: all 0.3s ease;
                        ">
                            <i class="fas fa-share-alt"></i>
                            <span style="font-size: 0.8rem;">Compartilhar</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    generateImageSection(property, newBadgeHtml = '') {
        const hasImages = property.images && property.images.length > 0 && property.images !== 'EMPTY';
        const imageUrls = hasImages ? property.images.split(',').filter(url => url && url.trim() !== '') : [];
        const imageCount = imageUrls.length;
        const hasGallery = imageCount > 1;
        const hasPdfs = property.pdfs && property.pdfs !== 'EMPTY' && property.pdfs.trim() !== '';
        const hasVideo = window.SharedCore?.ensureBooleanVideo?.(property.has_video) ?? false;
        
        if (hasGallery && typeof window.createPropertyGallery === 'function') {
            try {
                return window.createPropertyGallery(property);
            } catch (e) {
                console.warn('❌ Erro na galeria, usando fallback:', e);
            }
        }
        
        const firstImageUrl = imageCount > 0 ? imageUrls[0] : this.imageFallback;
        
        return `
            <div class="property-image ${property.rural ? 'rural-image' : ''}" 
                 style="position: relative; height: 250px; overflow: hidden;">
                <div class="property-gallery-container" 
                     onclick="if(window.openGalleryAtCurrentIndex) openGalleryAtCurrentIndex(${property.id})" 
                     style="cursor:pointer; position:relative; width:100%; height:100%;">
                    
                    <img src="${firstImageUrl}" 
                         loading="lazy"
                         style="width: 100%; height: 100%; object-fit: cover;"
                         alt="${this.escapeHtml(property.title)}"
                         data-original-src="${firstImageUrl}"
                         onerror="this.src='${this.imageFallback}'">
                    
                    ${property.badge ? `
                        <div class="property-badge ${property.rural ? 'rural-badge' : ''}" style="
                            position: absolute; 
                            top: 15px; 
                            left: 15px; 
                            background: var(--gold, #FFD700); 
                            color: white; 
                            padding: 0.4rem 1rem; 
                            border-radius: 20px; 
                            font-size: 0.8rem; 
                            font-weight: bold; 
                            z-index: 10;
                        ">
                            ${this.escapeHtml(property.badge)}
                        </div>
                    ` : ''}
                    
                    ${newBadgeHtml}
                    
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
                            backdrop-filter: blur(4px);
                            border: 1px solid rgba(255,255,255,0.2);
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
                            box-shadow: 0 2px 6px rgba(0,0,0,0.5);
                        ">
                            <i class="fas fa-images"></i> ${imageCount}
                        </div>
                    ` : ''}
                    
                    <div class="gallery-expand-icon" 
                         onclick="event.stopPropagation(); if(window.openGalleryAtCurrentIndex) openGalleryAtCurrentIndex(${property.id})" 
                         style="
                            position: absolute; 
                            bottom: 10px; 
                            right: 10px; 
                            background: rgba(0,0,0,0.7); 
                            color: white; 
                            width: 28px; 
                            height: 28px; 
                            border-radius: 50%; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            font-size: 0.8rem; 
                            cursor: pointer; 
                            transition: all 0.3s ease; 
                            z-index: 10;
                         ">
                        <i class="fas fa-expand"></i>
                    </div>
                </div>
                
                ${hasPdfs ? `
                    <button class="pdf-access" onclick="event.stopPropagation(); if(window.PdfSystem) window.PdfSystem.showModal(${property.id})" style="
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
                        transition: all 0.3s ease;
                        z-index: 15;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                        border: 1px solid rgba(0,0,0,0.15);
                    ">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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
                    const formattedPrice = window.SharedCore?.PriceFormatter?.formatForCard(propertyData.price) ?? 'R$ 0,00';
                    priceElement.textContent = formattedPrice;
                }
            }
            
            if (propertyData.title !== undefined) {
                const titleElement = card.querySelector('[data-title-field]');
                if (titleElement) {
                    titleElement.textContent = this.escapeHtml(propertyData.title);
                }
                card.setAttribute('data-property-title', propertyData.title);
            }
            
            if (propertyData.location !== undefined) {
                const locationElement = card.querySelector('[data-location-field]');
                if (locationElement) {
                    locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(propertyData.location)}`;
                }
            }
            
            if (propertyData.description !== undefined) {
                const descriptionElement = card.querySelector('[data-description-field]');
                if (descriptionElement) {
                    const descriptionText = propertyData.description || 'Descrição não disponível.';
                    const truncatedDesc = descriptionText.length > 120 
                        ? descriptionText.substring(0, 120) + '...' 
                        : descriptionText;
                    descriptionElement.textContent = this.escapeHtml(truncatedDesc);
                }
            }
            
            // Atualizar features se fornecido (COM ÍCONES NORMALIZADOS)
            if (propertyData.features !== undefined) {
                const featuresElement = card.querySelector('[data-features-field]');
                const displayFeatures = window.SharedCore?.formatFeaturesForDisplay?.(propertyData.features) ?? '';
                
                if (featuresElement) {
                    if (displayFeatures) {
                        featuresElement.innerHTML = displayFeatures.split(',').map(f => {
                            const feature = f.trim();
                            if (feature) {
                                return window.FeatureIconMapper.renderFeatureWithIcon(feature, propertyData.rural);
                            }
                            return '';
                        }).join('');
                        featuresElement.style.display = 'flex';
                        featuresElement.style.flexWrap = 'wrap';
                        featuresElement.style.gap = '8px';
                        featuresElement.style.margin = '12px 0';
                    } else {
                        featuresElement.innerHTML = '';
                        featuresElement.style.display = 'none';
                    }
                }
            }
            
            if (propertyData.has_video !== undefined) {
                const videoIndicator = card.querySelector('.video-indicator');
                const hasVideo = window.SharedCore?.ensureBooleanVideo?.(propertyData.has_video) ?? false;
                
                if (hasVideo && !videoIndicator) {
                    const imageSection = card.querySelector('.property-image');
                    if (imageSection) {
                        const imageCount = imageSection.querySelector('.image-count');
                        const topPosition = imageCount ? '35px' : '10px';
                        
                        imageSection.innerHTML += `
                            <div class="video-indicator" style="
                                position: absolute;
                                top: ${topPosition};
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
                                backdrop-filter: blur(4px);
                                border: 1px solid rgba(255,255,255,0.2);
                            ">
                                <i class="fas fa-video" style="color: #FFD700;"></i>
                                <span>TEM VÍDEO</span>
                            </div>
                        `;
                    }
                } else if (!hasVideo && videoIndicator) {
                    videoIndicator.remove();
                }
            }
            
            if (window.TemplateCache && typeof window.TemplateCache.invalidate === 'function') {
                window.TemplateCache.invalidate(propertyId);
            } else if (this._localCache) {
                const pattern = `prop_${propertyId}_`;
                for (const key of this._localCache.keys()) {
                    if (key.startsWith(pattern)) {
                        this._localCache.delete(key);
                    }
                }
            }
            
            card.classList.add('highlighted');
            setTimeout(() => {
                card.classList.remove('highlighted');
            }, 1000);
            
            console.log(`✅ Conteúdo do card ${propertyId} atualizado`);
            return true;
            
        } catch (error) {
            console.error(`❌ Erro ao atualizar card ${propertyId}:`, error);
            return false;
        }
    }
    
    clearCache() {
        if (window.TemplateCache && typeof window.TemplateCache.invalidateAll === 'function') {
            return window.TemplateCache.invalidateAll();
        }
        const count = this._localCache.size;
        this._localCache.clear();
        console.log(`🧹 Cache local limpo: ${count} entradas`);
        return count;
    }
}

window.propertyTemplates = new PropertyTemplateEngine();

// ========== SISTEMA DE ÍCONES PARA FEATURES (COM NORMALIZAÇÃO) ==========
window.FeatureIconMapper = {
    // Mapeamento de palavras-chave para ícones e cores
    mappings: [
        // GARAGEM/VAGA
        { 
            keywords: ['garagem', 'vaga', 'estacionamento', 'garagens', 'vagas'], 
            icon: 'fa-car', 
            color: '#3498db', 
            label: 'Garagem/Vaga' 
        },
        
        // QUARTO/DORMITÓRIO (NORMALIZADO PARA INCLUIR TODAS VARIAÇÕES)
        { 
            keywords: ['quarto', 'dormitório', 'dormitorio', 'suíte', 'suite', 'quartos', 'qtos', 'qto', 'qts', 'QUARTO', 'Qtos', 'Qto', 'Qts'], 
            icon: 'fa-bed', 
            color: '#e74c3c', 
            label: 'Quarto' 
        },
        
        // BANHEIRO
        { 
            keywords: ['banheiro', 'wc', 'lavabo', 'banheiros', 'suíte'], 
            icon: 'fa-shower', 
            color: '#1abc9c', 
            label: 'Banheiro' 
        },
        
        // COZINHA
        { 
            keywords: ['cozinha', 'copa', 'cozinha americana'], 
            icon: 'fa-utensils', 
            color: '#f39c12', 
            label: 'Cozinha' 
        },
        
        // SALA/ESTAR
        { 
            keywords: ['sala', 'estar', 'living', 'salao', 'salão', 'sala de estar'], 
            icon: 'fa-couch', 
            color: '#9b59b6', 
            label: 'Sala' 
        },
        
        // VARANDA/SACADA
        { 
            keywords: ['varanda', 'sacada', 'terraço', 'terraco'], 
            icon: 'fa-umbrella-beach', 
            color: '#e67e22', 
            label: 'Varanda' 
        },
        
        // PISCINA
        { 
            keywords: ['piscina'], 
            icon: 'fa-swimmer', 
            color: '#3498db', 
            label: 'Piscina' 
        },
        
        // CHURRASQUEIRA
        { 
            keywords: ['churrasqueira', 'churrasco'], 
            icon: 'fa-drumstick-bite', 
            color: '#e67e22', 
            label: 'Churrasqueira' 
        },
        
        // AR CONDICIONADO
        { 
            keywords: ['ar condicionado', 'ar-condicionado', 'climatização', 'ac'], 
            icon: 'fa-snowflake', 
            color: '#1abc9c', 
            label: 'Ar Condicionado' 
        },
        
        // ELEVADOR
        { 
            keywords: ['elevador'], 
            icon: 'fa-arrow-up', 
            color: '#7f8c8d', 
            label: 'Elevador' 
        },
        
        // SEGURANÇA/PORTARIA
        { 
            keywords: ['portaria', '24h', 'segurança', 'vigilância', 'porteiro'], 
            icon: 'fa-shield-alt', 
            color: '#2c3e50', 
            label: 'Segurança' 
        },
        
        // JARDIM
        { 
            keywords: ['jardim', 'paisagismo'], 
            icon: 'fa-leaf', 
            color: '#27ae60', 
            label: 'Jardim' 
        },
        
        // QUINTAL
        { 
            keywords: ['quintal', 'área externa', 'area externa'], 
            icon: 'fa-tree', 
            color: '#27ae60', 
            label: 'Quintal' 
        },
        
        // ACADEMIA
        { 
            keywords: ['academia', 'ginásio', 'ginasio'], 
            icon: 'fa-dumbbell', 
            color: '#e74c3c', 
            label: 'Academia' 
        },
        
        // LAVANDERIA
        { 
            keywords: ['área de serviço', 'lavanderia', 'area de servico'], 
            icon: 'fa-tshirt', 
            color: '#95a5a6', 
            label: 'Lavanderia' 
        },
        
        // ESCRITÓRIO
        { 
            keywords: ['escritório', 'home office', 'escritorio'], 
            icon: 'fa-laptop', 
            color: '#3498db', 
            label: 'Escritório' 
        },
        
        // LAZER
        { 
            keywords: ['lazer'], 
            icon: 'fa-gamepad', 
            color: '#9b59b6', 
            label: 'Lazer' 
        },
        
        // PLAYGROUND
        { 
            keywords: ['playground', 'parque infantil', 'parquinho'], 
            icon: 'fa-child', 
            color: '#f39c12', 
            label: 'Playground' 
        },
        
        // MOBILIADO
        { 
            keywords: ['mobiliado', 'mobília', 'mobilia'], 
            icon: 'fa-couch', 
            color: '#e67e22', 
            label: 'Mobiliado' 
        },
        
        // VISTA MAR
        { 
            keywords: ['vista mar', 'vista para o mar', 'vista pro mar'], 
            icon: 'fa-water', 
            color: '#3498db', 
            label: 'Vista Mar' 
        },
        
        // PERTO PRAIA
        { 
            keywords: ['perto praia', 'proximo praia', 'próximo praia', 'beira mar'], 
            icon: 'fa-umbrella-beach', 
            color: '#f39c12', 
            label: 'Perto da Praia' 
        },
        
        // COMERCIAL/LOJA
        { 
            keywords: ['comércio', 'loja', 'comercial', 'ponto comercial'], 
            icon: 'fa-store', 
            color: '#e74c3c', 
            label: 'Comercial' 
        },
        
        // RURAL
        { 
            keywords: ['sítio', 'chácara', 'fazenda', 'rural', 'sitio', 'chacara'], 
            icon: 'fa-tractor', 
            color: '#27ae60', 
            label: 'Rural' 
        },
        
        // REFORMA/NOVO
        { 
            keywords: ['reforma', 'novo', 'novo em folha'], 
            icon: 'fa-hammer', 
            color: '#f39c12', 
            label: 'Novo/Reforma' 
        }
    ],
    
    // Função para normalizar texto (remover acentos, lower case)
    normalizeText: function(text) {
        if (!text) return '';
        return text.toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .trim();
    },
    
    // Função para verificar se texto contém alguma palavra-chave
    matchesKeyword: function(text, keywordList) {
        const normalizedText = this.normalizeText(text);
        
        for (const keyword of keywordList) {
            const normalizedKeyword = this.normalizeText(keyword);
            // Verificar se a palavra completa está contida ou se é igual
            if (normalizedText === normalizedKeyword || 
                normalizedText.includes(normalizedKeyword) ||
                normalizedKeyword.includes(normalizedText)) {
                return true;
            }
            // Verificar quebra por espaços (para casos como "2 Quartos" -> "quartos")
            const words = normalizedText.split(/\s+/);
            for (const word of words) {
                if (word === normalizedKeyword || 
                    (normalizedKeyword.length > 2 && word.includes(normalizedKeyword))) {
                    return true;
                }
            }
        }
        return false;
    },
    
    // Função para obter ícone baseado no texto da feature
    getIconForFeature: function(featureText) {
        if (!featureText) {
            return { icon: 'fa-tag', color: '#95a5a6', label: 'Característica' };
        }
        
        const lowerText = this.normalizeText(featureText);
        
        for (let mapping of this.mappings) {
            if (this.matchesKeyword(lowerText, mapping.keywords)) {
                return {
                    icon: mapping.icon,
                    color: mapping.color,
                    label: mapping.label || featureText
                };
            }
        }
        
        // Fallback: ícone padrão para features não mapeadas
        return {
            icon: 'fa-tag',
            color: '#95a5a6',
            label: featureText
        };
    },
    
    // Função para gerar HTML da feature com ícone
    renderFeatureWithIcon: function(featureText, isRural = false) {
        const iconData = this.getIconForFeature(featureText);
        const ruralClass = isRural ? 'rural-tag' : '';
        
        return `
            <span class="feature-tag ${ruralClass}" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #f0f0f0; border-radius: 20px; font-size: 0.75rem;">
                <i class="fas ${iconData.icon}" style="color: ${iconData.color}; font-size: 0.7rem;"></i>
                <span>${window.SharedCore?.escapeHtml(featureText) || featureText}</span>
            </span>
        `;
    }
};

// Tornar acessível globalmente
window.FeatureIconMapper = FeatureIconMapper;

// ========== FUNÇÃO AUXILIAR PARA EXTRAIR BAIRRO (COMPATIBILIDADE) ==========
// ✅ REMOVIDA - utilizando a versão centralizada do SharedCore
// Agora: window.SharedCore.extractBairroFromLocation

// ========== FUNÇÃO NORMALIZADA PARA EXTRAIR BAIRRO (USADA NO FILTRO) ==========
// ✅ REMOVIDA - utilizando a versão centralizada do SharedCore
// Agora: window.SharedCore.extractBairroFromLocation

// ========== FILTRAR PROPRIEDADES POR CATEGORIA E BAIRRO (VERSÃO CORRIGIDA COM NORMALIZAÇÃO) ==========
window.filterPropertiesByCategoryAndBairro = function(category, bairro) {
    console.log(`🎯 Filtrando: categoria="${category}", bairro="${bairro}"`);
    
    if (!window.properties) return [];
    
    const CATEGORY_CONFIG = {
        'Comercial': {
            filterBy: 'type',
            expectedValues: ['comercial']
        },
        'Residencial': {
            filterBy: 'badge',
            expectedValues: ['Novo', 'Destaque', 'Luxo'],
            requiredType: 'residencial'
        },
        'Rural': {
            filterBy: 'badge',
            expectedValues: ['Fazenda', 'Chácara', 'Rural'],
            requiredType: 'rural'
        },
        'Minha Casa Minha Vida': {
            filterBy: 'badge',
            expectedValues: ['MCMV'],
            requiredType: null
        }
    };
    
    const config = CATEGORY_CONFIG[category];
    if (!config) {
        console.warn(`⚠️ Categoria "${category}" não reconhecida, usando fallback`);
        if (typeof window.renderProperties === 'function') {
            window.renderProperties(category);
        }
        return [];
    }
    
    let filtered = [];
    
    if (config.filterBy === 'type') {
        // PARA COMERCIAL: filtrar APENAS por tipo (ignora badge)
        filtered = window.properties.filter(p => 
            p.type && config.expectedValues.includes(p.type)
        );
        console.log(`📊 Filtrando Comercial por tipo (${config.expectedValues.join(', ')}): ${filtered.length} imóveis`);
    } else if (config.filterBy === 'badge') {
        // Para outras categorias: filtrar por badge + tipo (quando aplicável)
        filtered = window.properties.filter(p => {
            const hasCorrectBadge = p.badge && config.expectedValues.includes(p.badge);
            if (config.requiredType) {
                return hasCorrectBadge && p.type === config.requiredType;
            }
            return hasCorrectBadge;
        });
        console.log(`📊 Filtrando ${category} por badge (${config.expectedValues.join(', ')}): ${filtered.length} imóveis`);
    }
    
    // Filtrar por bairro (usando função centralizada do SharedCore)
    if (bairro && bairro !== 'null' && bairro !== 'undefined' && bairro !== '') {
        const normalizedBairroFilter = bairro.trim().toLowerCase();
        
        filtered = filtered.filter(p => {
            if (!p.location) return false;
            
            // ✅ AGORA USANDO A FUNÇÃO CENTRALIZADA DO SHAREDCORE
            let propertyBairro = window.SharedCore.extractBairroFromLocation(p.location);
            
            // Normalizar para comparação (lowercase)
            if (propertyBairro) {
                propertyBairro = propertyBairro.trim().toLowerCase();
                const isMatch = propertyBairro === normalizedBairroFilter;
                if (isMatch) {
                    console.log(`  ✅ Match: "${p.title}" → Bairro extraído: "${propertyBairro}"`);
                }
                return isMatch;
            }
            return false;
        });
        console.log(`📊 Após filtro por bairro "${bairro}" (normalizado: "${normalizedBairroFilter}"): ${filtered.length} imóveis`);
    }
    
    // Mostrar resultados detalhados se nenhum imóvel for encontrado
    if (filtered.length === 0 && bairro && bairro !== 'null' && bairro !== 'undefined' && bairro !== '') {
        console.warn(`⚠️ Nenhum imóvel encontrado para bairro "${bairro}" na categoria ${category}`);
        
        // Diagnóstico: mostrar quais bairros existem na categoria
        const allBairrosNaCategoria = new Set();
        let tempFiltered = [];
        
        if (category === 'Comercial') {
            tempFiltered = window.properties.filter(p => p.type && config.expectedValues.includes(p.type));
        } else {
            tempFiltered = window.properties.filter(p => {
                const hasCorrectBadge = p.badge && config.expectedValues.includes(p.badge);
                if (config.requiredType) {
                    return hasCorrectBadge && p.type === config.requiredType;
                }
                return hasCorrectBadge;
            });
        }
        
        tempFiltered.forEach(p => {
            if (p.location) {
                // ✅ AGORA USANDO A FUNÇÃO CENTRALIZADA DO SHAREDCORE
                const b = window.SharedCore.extractBairroFromLocation(p.location);
                if (b) allBairrosNaCategoria.add(b);
            }
        });
        
        console.log(`📋 Bairros disponíveis na categoria ${category}:`, Array.from(allBairrosNaCategoria));
    }
    
    // Renderizar resultados
    if (typeof window.renderPropertiesWithFilter === 'function') {
        window.renderPropertiesWithFilter(filtered);
    } else {
        const container = document.getElementById('properties-container');
        if (container) {
            if (filtered.length === 0) {
                container.innerHTML = '<p class="no-properties">Nenhum imóvel encontrado para este filtro.</p>';
            } else {
                container.innerHTML = filtered.map(prop => 
                    window.propertyTemplates.generate(prop)
                ).join('');
            }
        }
    }
    
    console.log(`✅ ${filtered.length} imóvel(is) encontrado(s)`);
    
    const countElement = document.getElementById('propertyCount');
    if (countElement) {
        countElement.textContent = `${filtered.length} imóvel(is)`;
    }
    
    return filtered;
};

// ========== FILTRAR PROPRIEDADES POR CATEGORIA E DESTAQUE ==========
window.filterPropertiesByCategoryAndDestaque = function(category, destaqueValue) {
    console.log(`🎯 Filtrando: categoria="${category}", destaque="${destaqueValue}"`);
    
    if (!window.properties) return [];
    
    let filtered = [...window.properties];
    
    // Filtrar por categoria
    if (category && category !== 'todos') {
        if (category === 'Rural') {
            filtered = filtered.filter(p => p.type === 'rural' || p.rural === true);
        } else if (category === 'Residencial') {
            filtered = filtered.filter(p => p.type === 'residencial');
        } else if (category === 'Comercial') {
            filtered = filtered.filter(p => p.type === 'comercial');
        } else if (category === 'Minha Casa Minha Vida') {
            filtered = filtered.filter(p => p.badge === 'MCMV');
        } else {
            const filterMap = {
                'Residencial': p => p.type === 'residencial',
                'Comercial': p => p.type === 'comercial',
                'Rural': p => p.type === 'rural' || p.rural === true,
                'Minha Casa Minha Vida': p => p.badge === 'MCMV'
            };
            const filterFn = filterMap[category];
            if (filterFn) {
                filtered = filtered.filter(filterFn);
            }
        }
    }
    
    // Filtrar por destaque (badge)
    if (destaqueValue && destaqueValue !== 'null' && destaqueValue !== 'undefined' && destaqueValue !== '') {
        filtered = filtered.filter(p => p.badge === destaqueValue);
    }
    
    // Renderizar resultados
    if (typeof window.renderPropertiesWithFilter === 'function') {
        window.renderPropertiesWithFilter(filtered);
    }
    
    const message = destaqueValue 
        ? `Mostrando ${filtered.length} imóvel(is) da categoria "${category}" com destaque "${destaqueValue}"`
        : `Mostrando ${filtered.length} imóvel(is) da categoria "${category}"`;
    console.log(message);
    
    return filtered;
};

// ========== RENDERIZAR COM FILTRO PERSONALIZADO ==========
window.renderPropertiesWithFilter = function(filteredProperties) {
    const container = document.getElementById('properties-container');
    if (!container) {
        console.error('❌ Container properties-container não encontrado');
        return;
    }
    
    if (!filteredProperties || filteredProperties.length === 0) {
        container.innerHTML = '<p class="no-properties">Nenhum imóvel encontrado para este filtro.</p>';
        console.log('ℹ️ Nenhum imóvel encontrado para o filtro aplicado');
        return;
    }
    
    container.innerHTML = filteredProperties.map(prop => 
        window.propertyTemplates.generate(prop)
    ).join('');
    
    console.log(`✅ ${filteredProperties.length} imóveis renderizados com filtro personalizado`);
    
    const countElement = document.getElementById('propertyCount');
    if (countElement) {
        countElement.textContent = `${filteredProperties.length} imóvel(is)`;
    }
};

window.updatePropertyCard = function(propertyId, updatedData = null) {
    console.log('🔄 Atualizando card do imóvel:', propertyId);
    
    const property = window.properties?.find(p => p.id === propertyId);
    if (!property) {
        console.error('❌ Imóvel não encontrado');
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
    
    console.log(`🔄 Substituição completa do card ${propertyId}`);
    
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
        
        console.log('✅ Card substituído');
        
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
        console.warn('⚠️ Card não encontrado');
        if (typeof window.renderProperties === 'function') {
            window.renderProperties(window.currentFilter || 'todos');
        }
        return false;
    }
};

window.waitForAllPropertyImages = async function() {
    console.log('🖼️ Aguardando carregamento de imagens...');
    
    const images = document.querySelectorAll('.property-image img');
    if (images.length === 0) {
        console.log('ℹ️ Nenhuma imagem encontrada');
        return 0;
    }
    
    const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
            img.addEventListener('load', () => resolve());
            img.addEventListener('error', () => resolve());
        });
    });
    
    await Promise.all(imagePromises);
    console.log(`✅ ${images.length} imagens carregadas`);
    
    return images.length;
};

window.runLowPriority = function(callback) {
    if (typeof callback !== 'function') return;
    
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => callback(), { timeout: 2000 });
    } else {
        setTimeout(callback, 100);
    }
};

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
                if (stored) {
                    try {
                        return JSON.parse(stored);
                    } catch (e) {
                        console.warn('⚠️ Erro ao parsear localStorage:', e);
                        return null;
                    }
                }
                return null;
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
                    console.log(`✅ Dados carregados pela estratégia ${i+1}`);
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
            features: window.SharedCore?.parseFeaturesForStorage?.(prop.features) ?? '[]',
            images: prop.images || '',
            pdfs: prop.pdfs || ''
        }));
        
        const saved = window.savePropertiesToStorage();
        if (!saved) {
            console.error('❌ Não foi possível salvar no localStorage');
            try {
                sessionStorage.setItem('properties_backup', JSON.stringify(window.properties));
                console.log('✅ Backup salvo no sessionStorage');
            } catch (backupError) {
                console.error('❌ Fallback também falhou');
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
        
        // *** NOVO: Após carregar os dados, verifica se há um imóvel específico na URL ***
        if (typeof window.loadPropertiesBasedOnUrl === 'function') {
            window.loadPropertiesBasedOnUrl();
        } else {
            // Fallback: se a nova função não existir, exibe todos (comportamento antigo)
            console.warn('⚠️ Função loadPropertiesBasedOnUrl não encontrada. Usando fallback.');
            if (typeof window.renderProperties === 'function') {
                window.renderProperties('todos');
            }
        }

        if (typeof window.waitForAllPropertyImages === 'function') {
            const imagesLoaded = await window.waitForAllPropertyImages();
            const totalImages = document.querySelectorAll('.property-image img').length || 0;
            
            if (imagesLoaded >= totalImages) {
                loading?.setVariant?.('success');
                loading?.updateMessage?.(finalMessage + ' 🖼️');
            } else {
                loading?.setVariant?.('success');
                loading?.updateMessage?.(`${finalMessage} (${imagesLoaded} imagens carregadas)`);
            }
        }
        
        if (window.SmartCache && typeof window.SmartCache.invalidatePropertiesCache === 'function') {
            window.SmartCache.invalidatePropertiesCache();
        }
        
        console.log(`✅ ${window.properties.length} imóveis carregados`);
        
    } catch (error) {
        console.error('❌ Erro no carregamento:', error);
        loading?.setVariant?.('error');
        loading?.updateMessage?.('⚠️ Erro ao carregar imóveis');
        window.properties = getInitialProperties();
        
        // Fallback: exibe todos os imóveis em caso de erro
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos');
        }
        
    } finally {
        setTimeout(() => loading?.hide?.(), 1200);
    }
};

function getInitialProperties() {
    return [
        {
            id: 1,
            title: "Casa 2Qtos - Forene",
            price: "R$ 180.000",
            location: "Residência Conj. Portal do Renascer, Forene",
            description: "Casa a 100m do CEASA; - Medindo 6,60m frente X 19m lado; - 125,40m² de área total; -Somente um único dono; - 02 Quartos, Sala; - Cozinha; - 02 Banheiros; - Varanda; - 02 Vagas de garagem; - Água de Poço Artesiano;",
            features: JSON.stringify(["02 Quartos", "Sala", "Cozinha", "02 Banheiros", "Varanda", "02 Vagas de garagem"]),
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
            features: JSON.stringify(["4 Qtos s/ 3 suítes", "Sala ampla com varanda", "Cozinha", "Área de serviço", "DCE", "02 vagas de garagem"]),
            type: "residencial",
            has_video: false,
            badge: "Luxo",
            rural: false,
            images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80,https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            created_at: new Date().toISOString()
        },
        // ========== IMÓVEIS COMERCIAIS DE EXEMPLO ==========
        {
            id: 99,
            title: "Loja Comercial - Centro",
            price: "R$ 350.000",
            location: "Rua do Comércio, Centro, Maceió/AL",
            description: "Loja comercial em ponto privilegiado no Centro de Maceió. Ótima para comércio varejista, com grande fluxo de pessoas e fácil acesso.",
            features: JSON.stringify(["100m²", "Banheiro", "Ponto comercial", "Boa localização"]),
            type: "comercial",
            has_video: false,
            badge: "Comercial",
            rural: false,
            images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            created_at: new Date().toISOString()
        },
        {
            id: 100,
            title: "Sala Comercial - Ponta Verde",
            price: "R$ 280.000",
            location: "Av. Álvaro Otacílio, Ponta Verde, Maceió/AL",
            description: "Sala comercial no coração de Ponta Verde. Ambiente moderno, ideal para escritórios, consultórios ou pequenos negócios.",
            features: JSON.stringify(["50m²", "Ar condicionado", "Estacionamento", "Excelente localização"]),
            type: "comercial",
            has_video: false,
            badge: "Comercial",
            rural: false,
            images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            created_at: new Date().toISOString()
        },
        {
            id: 101,
            title: "Loja Comercial - Centro",
            price: "R$ 450.000",
            location: "Rua do Comércio, Centro, Maceió/AL",
            description: "Loja comercial em ponto privilegiado no Centro de Maceió. Ótimo para qualquer negócio.",
            features: JSON.stringify(["80m²", "Banheiro", "Ponto comercial", "Vidraça frontal"]),
            type: "comercial",
            has_video: false,
            badge: "Comercial",
            rural: false,
            images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            created_at: new Date().toISOString()
        },
        {
            id: 102,
            title: "Sala Comercial - Ponta Verde",
            price: "R$ 320.000",
            location: "Av. Álvaro Otacílio, Ponta Verde, Maceió/AL",
            description: "Sala comercial no coração de Ponta Verde. Próximo a bancos e comércio.",
            features: JSON.stringify(["50m²", "Ar condicionado", "2 vagas garagem", "Recepção"]),
            type: "comercial",
            has_video: false,
            badge: "Comercial",
            rural: false,
            images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            created_at: new Date().toISOString()
        },
        {
            id: 103,
            title: "Galpão Comercial - Tabuleiro",
            price: "R$ 850.000",
            location: "Av. Menino Marcelo, Tabuleiro do Martins, Maceió/AL",
            description: "Galpão comercial para depósito ou indústria. Área ampla com escritório.",
            features: JSON.stringify(["300m²", "Pé direito alto", "Escritório", "Banheiros", "Estacionamento"]),
            type: "comercial",
            has_video: false,
            badge: "Comercial",
            rural: false,
            images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            created_at: new Date().toISOString()
        }
    ];
}

window.renderProperties = function(filter = 'todos', forceClearCache = false) {
    console.log(`🎨 Renderizando (filtro: ${filter})${forceClearCache ? ' - CACHE LIMPO' : ''}`);
    
    if (forceClearCache && window.propertyTemplates && window.propertyTemplates.clearCache) {
        window.propertyTemplates.clearCache();
    }
    
    const container = document.getElementById('properties-container');
    if (!container) {
        console.error('❌ Container não encontrado');
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

window.savePropertiesToStorage = function() {
    console.log('💾 Salvando no localStorage...');
    
    try {
        if (!window.properties || !Array.isArray(window.properties)) {
            console.error('❌ properties não é um array válido');
            return false;
        }
        
        const propertiesToSave = JSON.stringify(window.properties);
        localStorage.setItem('properties', propertiesToSave);
        
        ['weberlessa_properties', 'properties_backup', 'weberlessa_backup'].forEach(oldKey => {
            if (localStorage.getItem(oldKey)) {
                localStorage.removeItem(oldKey);
                console.log(`🧹 Chave antiga removida: ${oldKey}`);
            }
        });
        
        const verify = localStorage.getItem('properties');
        if (!verify) {
            console.error('❌ Verificação falhou');
            return false;
        }
        
        const parsedVerify = JSON.parse(verify);
        if (parsedVerify.length !== window.properties.length) {
            console.error(`❌ Verificação falhou: ${parsedVerify.length} vs ${window.properties.length}`);
            return false;
        }
        
        console.log(`✅ ${window.properties.length} imóveis salvos`);
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        
        try {
            const backupData = window.properties.map(p => ({
                id: p.id,
                title: p.title,
                price: p.price,
                location: p.location
            }));
            localStorage.setItem('properties_minimal', JSON.stringify(backupData));
            console.log('✅ Backup minimal salvo');
        } catch (backupError) {
            console.error('❌ Fallback também falhou');
        }
        
        return false;
    }
};

window.updateLocalStorage = function() {
    return window.savePropertiesToStorage();
};

window.setupFilters = function() {
    console.log('🎛️ Configurando filtros...');
    
    if (window.FilterManager && typeof window.FilterManager.setupWithFallback === 'function') {
        return window.FilterManager.setupWithFallback();
    }
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter');
                if (filter) {
                    window.currentFilter = filter;
                    window.renderProperties(filter);
                    
                    filterButtons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                }
            });
        });
        console.log('✅ Filtros configurados');
        return true;
    }
    
    console.warn('⚠️ Nenhum filtro encontrado');
    return false;
};

// ========== 6. CONTATAR AGENTE (COM ÍCONE WHATSAPP) ==========
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

window.addNewProperty = async function(propertyData) {
    console.group('➕ ADICIONANDO NOVO IMÓVEL');

    if (!propertyData.title || !propertyData.price || !propertyData.location) {
        alert('❌ Preencha Título, Preço e Localização!');
        console.groupEnd();
        return null;
    }

    try {
        // Usar o PriceFormatter centralizado do SharedCore
        if (propertyData.price) {
            propertyData.price = window.SharedCore?.PriceFormatter?.formatForInput(propertyData.price) ?? propertyData.price;
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
            hasMedia = MediaSystem.state?.files?.length > 0 || MediaSystem.state?.pdfs?.length > 0;
            
            if (hasMedia) {
                const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2)}`;
                mediaResult = await MediaSystem.uploadAll(tempId, propertyData.title);
                
                if (mediaResult.images) propertyData.images = mediaResult.images;
                if (mediaResult.pdfs) propertyData.pdfs = mediaResult.pdfs;
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
                    console.log(`✅ ID do Supabase: ${supabaseId}`);
                }
            } catch (error) {
                console.error('❌ Erro ao salvar no Supabase:', error);
            }
        }

        let newId;
        
        if (supabaseSuccess && supabaseId) {
            newId = supabaseId;
        } else {
            const maxLocalId = window.properties.length > 0 ? 
                Math.max(...window.properties.map(p => parseInt(p.id) || 0)) : 0;
            newId = maxLocalId + 1;
            console.log(`⚠️ ID local: ${newId}`);
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

        window.properties.unshift(newProperty);
        
        const saved = window.savePropertiesToStorage();
        
        if (!saved) {
            try {
                localStorage.setItem('properties_backup_' + Date.now(), JSON.stringify([newProperty]));
                console.log('✅ Backup criado');
            } catch (backupError) {
                console.error('❌ Backup falhou');
                alert('⚠️ Não foi possível salvar o imóvel localmente!');
            }
        }

        window.renderProperties('todos', true);
        
        if (typeof window.loadPropertyList === 'function') {
            setTimeout(() => window.loadPropertyList(), 100);
        }
        
        setTimeout(() => {
            const cardExists = !!document.querySelector(`[data-property-id="${newId}"]`);
            const inList = window.properties.some(p => p.id === newId);
            
            if (!cardExists || !inList) {
                console.warn('⚠️ Card não encontrado, re-renderizando...');
                window.renderProperties('todos', true);
            }
        }, 300);

        const imageCount = newProperty.images
            ? newProperty.images.split(',').filter(u => u.trim() && u !== 'EMPTY').length
            : 0;
        const pdfCount = newProperty.pdfs
            ? newProperty.pdfs.split(',').filter(u => u.trim() && u !== 'EMPTY').length
            : 0;

        let message = `✅ Imóvel "${newProperty.title}" cadastrado!\n\n`;
        message += `💰 Preço: ${newProperty.price}\n`;
        message += `📍 Local: ${newProperty.location}\n`;
        
        if (imageCount > 0) message += `📸 ${imageCount} foto(s)/vídeo(s)\n`;
        if (pdfCount > 0) message += `📄 ${pdfCount} documento(s) PDF\n`;
        if (newProperty.has_video) message += `🎬 Marcado como "Tem vídeo"\n`;
        
        if (!supabaseSuccess) {
            message += `\n⚠️ Salvo apenas localmente`;
        } else {
            message += `\n🌐 Salvo no servidor com ID: ${supabaseId}`;
        }

        alert(message);

        setTimeout(() => {
            if (typeof MediaSystem !== 'undefined' && MediaSystem.resetState) {
                MediaSystem.resetState();
            }
        }, 300);

        if (window.SmartCache && window.SmartCache.invalidatePropertiesCache) {
            window.SmartCache.invalidatePropertiesCache();
        }

        console.log(`✅ Imóvel ${newId} cadastrado`);
        console.groupEnd();
        return newProperty;

    } catch (error) {
        console.error('❌ Erro ao adicionar imóvel:', error);
        alert(`❌ Erro ao cadastrar imóvel:\n${error.message || 'Erro desconhecido'}`);
        console.groupEnd();
        return null;
    }
};

window.updateProperty = async function(id, propertyData) {
    console.group('📤 updateProperty');

    if (!id || id === 'null' || id === 'undefined') {
        console.error('❌ ID inválido:', id);
        if (window.editingPropertyId) {
            console.log(`🔄 Usando editingPropertyId: ${window.editingPropertyId}`);
            id = window.editingPropertyId;
        } else {
            alert('❌ Não foi possível identificar o imóvel!');
            console.groupEnd();
            return { success: false, localOnly: true, error: 'ID inválido' };
        }
    }

    const index = window.properties.findIndex(p => p.id == id);
    if (index === -1) {
        console.error('❌ Imóvel não encontrado');
        alert(`❌ Imóvel não encontrado!`);
        console.groupEnd();
        return { success: false, localOnly: true, error: 'Imóvel não encontrado' };
    }

    try {
        // Usar o PriceFormatter centralizado do SharedCore
        if (propertyData.price) {
            propertyData.price = window.SharedCore?.PriceFormatter?.formatForInput(propertyData.price) ?? propertyData.price;
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
                    const supabaseResponse = await response.json();
                    console.log('✅ Atualizado no Supabase:', supabaseResponse);
                } else {
                    supabaseError = await response.text();
                    console.warn('⚠️ Erro no Supabase:', supabaseError);
                }
            } catch (error) {
                supabaseError = error.message;
                console.error('❌ Erro ao atualizar Supabase:', error);
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
            console.groupEnd();
            return { success: true, localOnly: false };
        } else {
            let msg = `⚠️ Imóvel "${updateData.title}" atualizado apenas LOCALMENTE.\n`;
            msg += `💰 Preço: ${updateData.price}\n`;
            msg += `📍 Local: ${updateData.location}\n\n`;
            msg += `📱 As alterações foram salvas no seu navegador.\n`;
            msg += `🌐 Para salvar no servidor, verifique a conexão.`;
            
            if (updateData.has_video) {
                msg += `\n\n✅ VÍDEO: Marcado como "Tem vídeo" (salvo localmente)`;
            }
            
            if (supabaseError) {
                msg += `\n\n❌ Erro: ${supabaseError.substring(0, 150)}...`;
            }
            
            alert(msg);
            console.groupEnd();
            return { success: true, localOnly: true, error: supabaseError };
        }

    } catch (error) {
        console.error('❌ Erro ao atualizar imóvel:', error);
        console.groupEnd();
        alert(`❌ Erro: ${error.message}`);
        return { success: false, localOnly: true, error: error.message };
    }
};

window.updateLocalProperty = function(propertyId, updatedData) {
    console.group(`💾 updateLocalProperty: ${propertyId}`);
    
    if (!window.properties || !Array.isArray(window.properties)) {
        console.error('❌ properties não é um array válido');
        console.groupEnd();
        return false;
    }
    
    const index = window.properties.findIndex(p => p.id == propertyId);
    if (index === -1) {
        console.error('❌ Imóvel não encontrado localmente');
        console.groupEnd();
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
        console.error('❌ Falha ao salvar no localStorage');
        console.groupEnd();
        return false;
    }
    
    console.log(`✅ Imóvel ${propertyId} atualizado localmente`);
    
    if (typeof window.loadPropertyList === 'function') {
        setTimeout(() => window.loadPropertyList(), 100);
    }
    
    if (typeof window.updatePropertyCard === 'function') {
        setTimeout(() => window.updatePropertyCard(propertyId, updatedData), 150);
    } else {
        if (typeof window.renderProperties === 'function') {
            setTimeout(() => window.renderProperties(window.currentFilter || 'todos', true), 200);
        }
    }
    
    console.groupEnd();
    return true;
};

window.addToLocalProperties = function(newProperty) {
    console.group('➕ addToLocalProperties');
    
    if (!window.properties) window.properties = [];
    
    let propertyWithId = { ...newProperty };
    if (!propertyWithId.id) {
        const maxId = window.properties.length > 0 ? 
            Math.max(...window.properties.map(p => parseInt(p.id) || 0)) : 0;
        propertyWithId.id = maxId + 1;
    }
    
    if (!propertyWithId.created_at) propertyWithId.created_at = new Date().toISOString();
    if (!propertyWithId.updated_at) propertyWithId.updated_at = new Date().toISOString();
    
    propertyWithId.has_video = window.SharedCore?.ensureBooleanVideo?.(propertyWithId.has_video) ?? false;
    propertyWithId.features = window.SharedCore?.parseFeaturesForStorage?.(propertyWithId.features) ?? '[]';
    
    window.properties.unshift(propertyWithId);
    
    const saved = window.savePropertiesToStorage();
    
    if (!saved) {
        console.error('❌ Falha ao salvar no localStorage');
        console.groupEnd();
        return null;
    }
    
    console.log(`✅ Imóvel ${propertyWithId.id} adicionado localmente`);
    
    setTimeout(() => {
        if (typeof window.loadPropertyList === 'function') window.loadPropertyList();
        if (typeof window.renderProperties === 'function') window.renderProperties('todos', true);
    }, 100);
    
    console.groupEnd();
    return propertyWithId;
};

window.deleteProperty = async function(id) {
    console.group(`🗑️ deleteProperty: ${id}`);

    const property = window.properties.find(p => p.id === id);
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        console.groupEnd();
        return false;
    }

    if (!confirm(`⚠️ TEM CERTEZA que deseja excluir o imóvel?\n\n"${property.title}"\n\nEsta ação NÃO pode ser desfeita.`)) {
        console.log('❌ Exclusão cancelada');
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
            console.log(`🗑️ Excluindo ${allFileUrls.length} arquivo(s)...`);
            try {
                const deletionResult = await MediaSystem.deleteFilesFromStorage(allFileUrls);
                if (!deletionResult.success) {
                    console.warn(`⚠️ Falha ao excluir ${deletionResult.failedCount} arquivo(s)`);
                    mediaDeletionError = `Falha ao excluir ${deletionResult.failedCount} arquivo(s)`;
                    mediaDeletionSuccess = false;
                } else {
                    console.log(`✅ ${deletionResult.deletedCount} arquivo(s) excluídos`);
                }
            } catch (error) {
                console.error('❌ Erro ao excluir arquivos:', error);
                mediaDeletionError = error.message;
                mediaDeletionSuccess = false;
                
                const userConfirmed = confirm(`⚠️ ERRO AO EXCLUIR ARQUIVOS:\n\n${mediaDeletionError}\n\nDeseja continuar com a exclusão do registro?`);
                if (!userConfirmed) {
                    console.log('❌ Exclusão cancelada');
                    alert('❌ Exclusão cancelada');
                    console.groupEnd();
                    return false;
                }
            }
        }
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
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`
                }
            });

            if (response.ok) {
                supabaseSuccess = true;
                console.log('✅ Excluído do Supabase');
            } else {
                supabaseError = await response.text();
                console.warn('⚠️ Erro no Supabase:', supabaseError);
            }
        } catch (error) {
            supabaseError = error.message;
            console.error('❌ Erro ao excluir do Supabase:', error);
        }
    }

    window.properties = window.properties.filter(p => p.id !== id);
    
    const saved = window.savePropertiesToStorage();
    
    if (!saved) {
        console.error('❌ Falha ao salvar após exclusão');
        alert('⚠️ Erro ao salvar alterações localmente!');
        console.groupEnd();
        return false;
    }

    if (typeof window.renderProperties === 'function') window.renderProperties('todos', true);
    if (typeof window.loadPropertyList === 'function') setTimeout(() => window.loadPropertyList(), 100);

    let finalMessage = '';
    if (supabaseSuccess) {
        finalMessage = `✅ Imóvel "${property.title}" excluído PERMANENTEMENTE!\n\n`;
        finalMessage += `✓ Registro removido do servidor.\n`;
        if (mediaDeletionSuccess) {
            finalMessage += `✓ Arquivos de mídia excluídos.`;
        } else {
            finalMessage += `⚠️ Falha na exclusão de arquivos: ${mediaDeletionError || 'erro desconhecido'}`;
        }
    } else {
        finalMessage = `⚠️ Imóvel "${property.title}" excluído apenas LOCALMENTE.\n\n`;
        finalMessage += `✓ Registro removido do navegador.\n`;
        if (supabaseError) {
            finalMessage += `❌ Erro no servidor: ${supabaseError.substring(0, 100)}...\n`;
        }
        if (!mediaDeletionSuccess) {
            finalMessage += `⚠️ Arquivos de mídia NÃO foram excluídos.`;
        }
    }
    alert(finalMessage);

    console.groupEnd();
    return supabaseSuccess;
};

// ========== 12. CARREGAR LISTA PARA ADMIN (COM PAGINAÇÃO, PREVIEW E CONTADOR) ==========
window.loadPropertyList = function(page = window.adminCurrentPage) {
    if (!window.properties || typeof window.properties.forEach !== 'function') {
        console.error('❌ window.properties não é um array válido');
        return;
    }
    
    const container = document.getElementById('propertyList');
    const countElement = document.getElementById('propertyCount');
    
    if (!container) return;
    
    // Salvar página atual
    window.adminCurrentPage = page;
    
    // Calcular paginação
    const totalItems = window.properties.length;
    const totalPages = Math.ceil(totalItems / window.adminItemsPerPage);
    const startIndex = (page - 1) * window.adminItemsPerPage;
    const endIndex = Math.min(startIndex + window.adminItemsPerPage, totalItems);
    const paginatedProperties = window.properties.slice(startIndex, endIndex);
    
    // Limpar container mas manter estrutura para paginação
    container.innerHTML = '';
    
    if (countElement) {
        countElement.textContent = totalItems;
    }
    
    if (totalItems === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Nenhum imóvel cadastrado</p>';
        return;
    }
    
    // Adicionar estilo para scroll suave na lista
    container.style.maxHeight = '600px';
    container.style.overflowY = 'auto';
    container.style.paddingRight = '5px';
    
    // Calcular total de visualizações
    const totalViews = window.getTotalGalleryViews ? window.getTotalGalleryViews() : 0;
    
    // ========== CABEÇALHO COM ESTATÍSTICAS ==========
    const statsHeader = document.createElement('div');
    statsHeader.style.cssText = 'background: #e8f4fd; padding: 0.8rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;';
    statsHeader.innerHTML = `
        <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;">
            <span><i class="fas fa-eye"></i> <strong>Total de visualizações:</strong> ${totalViews}</span>
            <span><i class="fas fa-building"></i> <strong>Total de imóveis:</strong> ${totalItems}</span>
            <span><i class="fas fa-images"></i> <strong>Exibindo:</strong> ${startIndex + 1}-${endIndex} de ${totalItems}</span>
        </div>
        <button onclick="if(window.resetAllGalleryViews) window.resetAllGalleryViews()" style="background: #e67e22; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer; font-size: 0.75rem;">
            <i class="fas fa-trash-alt"></i> Zerar TODAS
        </button>
    `;
    container.appendChild(statsHeader);
    
    // ========== CONTROLES DE PAGINAÇÃO (TOPO) ==========
    if (totalPages > 1) {
        const paginationTop = createPaginationControls(totalPages, page);
        container.appendChild(paginationTop);
    }
    
    // ========== LISTA DE IMÓVEIS (APENAS PÁGINA ATUAL) ==========
    const listContainer = document.createElement('div');
    listContainer.id = 'propertyListItems';
    listContainer.style.cssText = 'margin: 1rem 0;';
    
    const defaultImage = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80';
    
    paginatedProperties.forEach(property => {
        const viewCount = window.getGalleryViews ? window.getGalleryViews(property.id) : 0;
        const lastView = window.getLastGalleryView ? window.getLastGalleryView(property.id) : null;
        
        // Extrair a primeira imagem do imóvel
        let firstImage = defaultImage;
        let isVideo = false;
        
        if (property.images && property.images !== 'EMPTY') {
            const imageUrls = property.images.split(',').filter(url => url && url.trim() !== '');
            if (imageUrls.length > 0) {
                firstImage = imageUrls[0];
                // Verificar se é vídeo
                isVideo = window.isVideoUrl ? window.isVideoUrl(firstImage) : 
                          (firstImage.toLowerCase().includes('.mp4') || firstImage.toLowerCase().includes('.mov') || firstImage.toLowerCase().includes('video/'));
            }
        }
        
        const item = document.createElement('div');
        item.className = 'property-item';
        item.style.cssText = 'background: #f5f5f5; padding: 1rem; margin: 0.5rem 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-left: 4px solid var(--primary); transition: all 0.3s ease;';
        
        item.innerHTML = `
            <!-- MINIATURA DA IMAGEM -->
            <div style="flex-shrink: 0; width: 70px; height: 70px; border-radius: 8px; overflow: hidden; background: #2c3e50; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s ease;" 
                 onclick="if(window.openGalleryAtCurrentIndex) window.openGalleryAtCurrentIndex(${property.id})"
                 onmouseenter="this.style.transform='scale(1.05)'"
                 onmouseleave="this.style.transform='scale(1)'"
                 title="Clique para abrir galeria">
                ${isVideo ? `
                    <div style="position: relative; width: 100%; height: 100%; background: linear-gradient(135deg, #1a5276, #2c3e50); display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-video" style="font-size: 1.8rem; color: rgba(255,255,255,0.8);"></i>
                        <div style="position: absolute; bottom: 2px; right: 4px; background: rgba(0,0,0,0.6); border-radius: 3px; padding: 1px 4px; font-size: 0.6rem; color: white;">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                ` : `
                    <img src="${firstImage}" 
                         loading="lazy"
                         style="width: 100%; height: 100%; object-fit: cover;"
                         onerror="this.src='${defaultImage}'; this.onerror=null;"
                         alt="${window.SharedCore?.escapeHtml(property.title) || property.title}">
                `}
            </div>
            
            <!-- INFORMAÇÕES DO IMÓVEL -->
            <div style="flex: 3; min-width: 200px;">
                <strong style="color: var(--primary); font-size: 1rem; display: block; margin-bottom: 0.3rem;">
                    ${window.SharedCore?.escapeHtml(property.title) || property.title}
                </strong>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.3rem;">
                    <small style="background: #e9ecef; padding: 0.2rem 0.5rem; border-radius: 4px;">
                        <i class="fas fa-tag"></i> ${property.price}
                    </small>
                    <small style="background: #e9ecef; padding: 0.2rem 0.5rem; border-radius: 4px;">
                        <i class="fas fa-map-marker-alt"></i> ${property.location.substring(0, 40)}${property.location.length > 40 ? '...' : ''}
                    </small>
                </div>
                <div style="font-size: 0.7rem; color: #666; display: flex; flex-wrap: wrap; gap: 0.8rem; margin-top: 0.2rem;">
                    <span><i class="fas fa-id-card"></i> ID: ${property.id}</span>
                    ${property.has_video ? '<span style="color: #9b59b6;"><i class="fas fa-video"></i> Tem vídeo</span>' : ''}
                    <span><i class="fas fa-images"></i> Imagens: ${property.images ? property.images.split(',').filter(i => i && i.trim() && i !== 'EMPTY').length : 0}</span>
                    ${property.pdfs && property.pdfs !== 'EMPTY' ? `<span><i class="fas fa-file-pdf"></i> PDFs: ${property.pdfs.split(',').filter(p => p && p.trim() && p !== 'EMPTY').length}</span>` : ''}
                    <span><i class="fas fa-eye"></i> <strong>Visualizações: ${viewCount}</strong></span>
                    ${lastView ? `<span><i class="fas fa-clock"></i> Última: ${new Date(lastView).toLocaleDateString('pt-BR')}</span>` : ''}
                </div>
            </div>
            
            <!-- BOTÕES DE AÇÃO -->
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; flex-shrink: 0;">
                <button onclick="editProperty(${property.id})" 
                        style="background: var(--accent); color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s ease;"
                        onmouseenter="this.style.transform='translateY(-2px)'"
                        onmouseleave="this.style.transform='translateY(0)'">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="if(window.resetGalleryViews) window.resetGalleryViews(${property.id}, '${property.title.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')" 
                        style="background: #e67e22; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s ease;"
                        onmouseenter="this.style.transform='translateY(-2px)'"
                        onmouseleave="this.style.transform='translateY(0)'">
                    <i class="fas fa-eye-slash"></i> Zerar views
                </button>
                <button onclick="deleteProperty(${property.id})" 
                        style="background: #e74c3c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s ease;"
                        onmouseenter="this.style.transform='translateY(-2px)'"
                        onmouseleave="this.style.transform='translateY(0)'">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        listContainer.appendChild(item);
    });
    
    container.appendChild(listContainer);
    
    // ========== CONTROLES DE PAGINAÇÃO (RODAPÉ) ==========
    if (totalPages > 1) {
        const paginationBottom = createPaginationControls(totalPages, page);
        container.appendChild(paginationBottom);
    }
    
    console.log(`✅ Página ${page}/${totalPages} - ${paginatedProperties.length} imóveis exibidos (total: ${totalItems})`);
};

// ========== FUNÇÃO PARA CRIAR CONTROLES DE PAGINAÇÃO ==========
function createPaginationControls(totalPages, currentPage) {
    const paginationDiv = document.createElement('div');
    paginationDiv.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin: 1rem 0; flex-wrap: wrap;';
    
    // Botão Primeira Página
    const firstBtn = document.createElement('button');
    firstBtn.innerHTML = '<i class="fas fa-angle-double-left"></i>';
    firstBtn.style.cssText = 'background: var(--primary); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s ease;';
    firstBtn.disabled = currentPage === 1;
    if (currentPage === 1) firstBtn.style.opacity = '0.5';
    firstBtn.onclick = () => window.loadPropertyList(1);
    paginationDiv.appendChild(firstBtn);
    
    // Botão Anterior
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.style.cssText = 'background: var(--primary); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s ease;';
    prevBtn.disabled = currentPage === 1;
    if (currentPage === 1) prevBtn.style.opacity = '0.5';
    prevBtn.onclick = () => window.loadPropertyList(currentPage - 1);
    paginationDiv.appendChild(prevBtn);
    
    // Números das Páginas (com elipse para muitas páginas)
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
        const firstPageSpan = document.createElement('span');
        firstPageSpan.textContent = '1';
        firstPageSpan.style.cssText = 'background: #e9ecef; color: var(--text); padding: 0.3rem 0.7rem; border-radius: 5px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease;';
        firstPageSpan.onclick = () => window.loadPropertyList(1);
        paginationDiv.appendChild(firstPageSpan);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.cssText = 'padding: 0.3rem 0.5rem; color: #666;';
            paginationDiv.appendChild(ellipsis);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.style.cssText = `background: ${i === currentPage ? 'var(--gold)' : '#e9ecef'}; color: ${i === currentPage ? 'white' : 'var(--text)'}; border: none; padding: 0.3rem 0.7rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s ease; font-weight: ${i === currentPage ? 'bold' : 'normal'};`;
        pageBtn.onclick = () => window.loadPropertyList(i);
        paginationDiv.appendChild(pageBtn);
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.cssText = 'padding: 0.3rem 0.5rem; color: #666;';
            paginationDiv.appendChild(ellipsis);
        }
        
        const lastPageSpan = document.createElement('span');
        lastPageSpan.textContent = totalPages;
        lastPageSpan.style.cssText = 'background: #e9ecef; color: var(--text); padding: 0.3rem 0.7rem; border-radius: 5px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease;';
        lastPageSpan.onclick = () => window.loadPropertyList(totalPages);
        paginationDiv.appendChild(lastPageSpan);
    }
    
    // Botão Próximo
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.style.cssText = 'background: var(--primary); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s ease;';
    nextBtn.disabled = currentPage === totalPages;
    if (currentPage === totalPages) nextBtn.style.opacity = '0.5';
    nextBtn.onclick = () => window.loadPropertyList(currentPage + 1);
    paginationDiv.appendChild(nextBtn);
    
    // Botão Última Página
    const lastBtn = document.createElement('button');
    lastBtn.innerHTML = '<i class="fas fa-angle-double-right"></i>';
    lastBtn.style.cssText = 'background: var(--primary); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s ease;';
    lastBtn.disabled = currentPage === totalPages;
    if (currentPage === totalPages) lastBtn.style.opacity = '0.5';
    lastBtn.onclick = () => window.loadPropertyList(totalPages);
    paginationDiv.appendChild(lastBtn);
    
    // Selector de itens por página (4/8/12/16) - Padrão 4 selecionado
    const perPageSelect = document.createElement('select');
    perPageSelect.style.cssText = 'background: white; border: 1px solid var(--primary); padding: 0.3rem 0.5rem; border-radius: 5px; font-size: 0.75rem; margin-left: 0.5rem; cursor: pointer;';
    perPageSelect.innerHTML = `
        <option value="4" ${window.adminItemsPerPage === 4 ? 'selected' : ''}>4 por página</option>
        <option value="8" ${window.adminItemsPerPage === 8 ? 'selected' : ''}>8 por página</option>
        <option value="12" ${window.adminItemsPerPage === 12 ? 'selected' : ''}>12 por página</option>
        <option value="16" ${window.adminItemsPerPage === 16 ? 'selected' : ''}>16 por página</option>
    `;
    perPageSelect.onchange = (e) => {
        window.adminItemsPerPage = parseInt(e.target.value);
        window.adminCurrentPage = 1; // Reset para primeira página
        window.loadPropertyList(1);
    };
    paginationDiv.appendChild(perPageSelect);
    
    return paginationDiv;
}

console.log('✅ properties.js - VERSÃO COMPLETA COM PAGINAÇÃO + ÍCONES NORMALIZADOS + FILTRO DIFERENCIADO + SHARE + NOVO BADGE + LINK DIRETO');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🏠 DOM carregado - inicializando...');

        if (typeof window.runLowPriority === 'function') {
            window.runLowPriority(() => {
                if (typeof window.loadPropertiesData === 'function') window.loadPropertiesData();
                window.runLowPriority(() => {
                    if (typeof window.setupFilters === 'function') window.setupFilters();
                });
            });
        } else {
            setTimeout(() => {
                if (typeof window.loadPropertiesData === 'function') window.loadPropertiesData();
                setTimeout(() => {
                    if (typeof window.setupFilters === 'function') window.setupFilters();
                }, 100);
            }, 100);
        }
    });
} else {
    if (typeof window.runLowPriority === 'function') {
        window.runLowPriority(() => {
            if (typeof window.loadPropertiesData === 'function') window.loadPropertiesData();
            window.runLowPriority(() => {
                if (typeof window.setupFilters === 'function') window.setupFilters();
            });
        });
    } else {
        setTimeout(() => {
            if (typeof window.loadPropertiesData === 'function') window.loadPropertiesData();
            setTimeout(() => {
                if (typeof window.setupFilters === 'function') window.setupFilters();
            }, 100);
        }, 100);
    }
}

window.getInitialProperties = getInitialProperties;

console.log('🎯 VERSÃO COMPLETA - Galeria + Paginação (4/8/12/16) + Ícones NORMALIZADOS + Filtro DIFERENCIADO');
console.log('📝 Descrições truncadas em 120 caracteres');
console.log('📱 WhatsApp: contatoAgent com ícone e número 5582996044513');
console.log('🎨 Features com ícones NORMALIZADOS');
console.log('📄 Admin: padrão de 4 itens por página para melhor experiência mobile');
console.log('🏢 Comercial: filtra por TYPE (comercial) - flexível para qualquer badge');
console.log('🔧 Função extractBairroFromLocation centralizada no SharedCore');
console.log('🔄 SHARE: Botão "Compartilhar" com toast de confirmação e URL ABSOLUTA');
console.log('🆕 NOVO BADGE: Imóveis com menos de 7 dias têm selo "NOVO" animado');
console.log('🔗 LINK DIRETO: Suporte a ?property=ID com mensagem amigável para IDs inválidos');
