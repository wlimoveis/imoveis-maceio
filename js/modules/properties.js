// js/modules/properties.js - VERSÃO COMPLETA COM PAGINAÇÃO + ÍCONES NORMALIZADOS + FILTRO DIFERENCIADO + SHARE + NOVO BADGE + LINK DIRETO
console.log('🏠 properties.js - VERSÃO COMPLETA COM PAGINAÇÃO + ÍCONES NORMALIZADOS + FILTRO DIFERENCIADO + SHARE + NOVO BADGE + LINK DIRETO');

window.properties = [];
window.editingPropertyId = null;
window.currentFilter = 'todos';

// ========== VARIÁVEIS DE PAGINAÇÃO DO ADMIN ==========
window.adminCurrentPage = 1;
window.adminItemsPerPage = 4;

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

// ========== COMPARTILHAR IMÓVEL (COPIA LINK) ==========
window.shareProperty = async function(id) {
    const property = window.properties.find(p => p.id === id);
    if (!property) {
        console.error('❌ Imóvel não encontrado');
        return;
    }
    
    const shareUrl = new URL(`?property=${id}`, window.location.href).href;
    console.log(`🔗 Link de compartilhamento gerado: ${shareUrl}`);
    
    try {
        await navigator.clipboard.writeText(shareUrl);
        
        const card = document.querySelector(`.property-card[data-property-id="${id}"]`);
        if (card) {
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
    
    const idToFind = Number(propertyId);
    
    if (isNaN(idToFind)) {
        console.warn(`⚠️ ID inválido na URL: "${propertyId}"`);
        return null;
    }
    
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
    const urlParams = new URLSearchParams(window.location.search);
    const propertyIdFromUrl = urlParams.get('property');
    
    if (!propertyIdFromUrl) {
        console.log('🏠 Nenhum imóvel específico na URL. Exibindo todos.');
        if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos');
        }
        return;
    }
    
    console.log(`🔗 Link direto detectado para o imóvel ID: ${propertyIdFromUrl}`);
    const singleProperty = window.filterPropertyById(propertyIdFromUrl);
    
    const container = document.getElementById('properties-container');
    if (!container) {
        console.error('❌ Container "properties-container" não encontrado.');
        return;
    }
    
    if (singleProperty) {
        if (window.propertyTemplates && typeof window.propertyTemplates.generate === 'function') {
            const singlePropertyHtml = window.propertyTemplates.generate(singleProperty);
            container.innerHTML = singlePropertyHtml;
            console.log(`✨ Exibindo apenas o imóvel: "${singleProperty.title}"`);
        } else {
            console.error('❌ Template engine não encontrado.');
            container.innerHTML = '<p class="error-message">Erro ao carregar o imóvel solicitado.</p>';
        }
    } else {
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
        
        if (this._localCache.size > 30) {
            const keysToDelete = Array.from(this._localCache.keys()).slice(0, 10);
            keysToDelete.forEach(key => this._localCache.delete(key));
        }
        
        return html;
    }
    
    isNewProperty(createdAt) {
        if (!createdAt) return false;
        const createdDate = new Date(createdAt);
        const now = new Date();
        const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    }
    
    _generateTemplate(property) {
        // SIMPLIFICADO: SharedCore já existe quando este código executa
        const displayFeatures = window.SharedCore.formatFeaturesForDisplay(property.features);
        
        // SIMPLIFICADO: PriceFormatter sempre disponível
        const formatPrice = (price) => {
            return window.SharedCore.PriceFormatter.formatForCard(price);
        };

        const descriptionText = property.description || 'Descrição não disponível.';
        const truncatedDesc = descriptionText.length > 120 
            ? descriptionText.substring(0, 120) + '...' 
            : descriptionText;

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
        const hasVideo = window.SharedCore.ensureBooleanVideo(property.has_video);
        
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
                    const formattedPrice = window.SharedCore.PriceFormatter.formatForCard(propertyData.price);
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
            
            if (propertyData.features !== undefined) {
                const featuresElement = card.querySelector('[data-features-field]');
                const displayFeatures = window.SharedCore.formatFeaturesForDisplay(propertyData.features);
                
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
                const hasVideo = window.SharedCore.ensureBooleanVideo(propertyData.has_video);
                
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

// ========== SISTEMA DE ÍCONES PARA FEATURES ==========
window.FeatureIconMapper = {
    mappings: [
        { keywords: ['garagem', 'vaga', 'estacionamento', 'garagens', 'vagas'], icon: 'fa-car', color: '#3498db', label: 'Garagem/Vaga' },
        { keywords: ['quarto', 'dormitório', 'dormitorio', 'suíte', 'suite', 'quartos', 'qtos', 'qto', 'qts'], icon: 'fa-bed', color: '#e74c3c', label: 'Quarto' },
        { keywords: ['banheiro', 'wc', 'lavabo', 'banheiros'], icon: 'fa-shower', color: '#1abc9c', label: 'Banheiro' },
        { keywords: ['cozinha', 'copa', 'cozinha americana'], icon: 'fa-utensils', color: '#f39c12', label: 'Cozinha' },
        { keywords: ['sala', 'estar', 'living', 'salao'], icon: 'fa-couch', color: '#9b59b6', label: 'Sala' },
        { keywords: ['varanda', 'sacada', 'terraço'], icon: 'fa-umbrella-beach', color: '#e67e22', label: 'Varanda' },
        { keywords: ['piscina'], icon: 'fa-swimmer', color: '#3498db', label: 'Piscina' },
        { keywords: ['churrasqueira', 'churrasco'], icon: 'fa-drumstick-bite', color: '#e67e22', label: 'Churrasqueira' },
        { keywords: ['ar condicionado', 'ar-condicionado'], icon: 'fa-snowflake', color: '#1abc9c', label: 'Ar Condicionado' },
        { keywords: ['elevador'], icon: 'fa-arrow-up', color: '#7f8c8d', label: 'Elevador' },
        { keywords: ['portaria', '24h', 'segurança'], icon: 'fa-shield-alt', color: '#2c3e50', label: 'Segurança' },
        { keywords: ['jardim', 'paisagismo'], icon: 'fa-leaf', color: '#27ae60', label: 'Jardim' },
        { keywords: ['quintal', 'área externa'], icon: 'fa-tree', color: '#27ae60', label: 'Quintal' },
        { keywords: ['academia', 'ginásio'], icon: 'fa-dumbbell', color: '#e74c3c', label: 'Academia' },
        { keywords: ['área de serviço', 'lavanderia'], icon: 'fa-tshirt', color: '#95a5a6', label: 'Lavanderia' },
        { keywords: ['escritório', 'home office'], icon: 'fa-laptop', color: '#3498db', label: 'Escritório' },
        { keywords: ['lazer'], icon: 'fa-gamepad', color: '#9b59b6', label: 'Lazer' },
        { keywords: ['playground', 'parquinho'], icon: 'fa-child', color: '#f39c12', label: 'Playground' },
        { keywords: ['mobiliado', 'mobília'], icon: 'fa-couch', color: '#e67e22', label: 'Mobiliado' },
        { keywords: ['vista mar', 'vista para o mar'], icon: 'fa-water', color: '#3498db', label: 'Vista Mar' },
        { keywords: ['perto praia', 'proximo praia'], icon: 'fa-umbrella-beach', color: '#f39c12', label: 'Perto da Praia' },
        { keywords: ['comércio', 'loja', 'comercial'], icon: 'fa-store', color: '#e74c3c', label: 'Comercial' },
        { keywords: ['sítio', 'chácara', 'fazenda', 'rural'], icon: 'fa-tractor', color: '#27ae60', label: 'Rural' },
        { keywords: ['reforma', 'novo'], icon: 'fa-hammer', color: '#f39c12', label: 'Novo/Reforma' }
    ],
    
    normalizeText: function(text) {
        if (!text) return '';
        return text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    },
    
    matchesKeyword: function(text, keywordList) {
        const normalizedText = this.normalizeText(text);
        for (const keyword of keywordList) {
            const normalizedKeyword = this.normalizeText(keyword);
            if (normalizedText === normalizedKeyword || normalizedText.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedText)) {
                return true;
            }
            const words = normalizedText.split(/\s+/);
            for (const word of words) {
                if (word === normalizedKeyword || (normalizedKeyword.length > 2 && word.includes(normalizedKeyword))) {
                    return true;
                }
            }
        }
        return false;
    },
    
    getIconForFeature: function(featureText) {
        if (!featureText) return { icon: 'fa-tag', color: '#95a5a6', label: 'Característica' };
        const lowerText = this.normalizeText(featureText);
        for (let mapping of this.mappings) {
            if (this.matchesKeyword(lowerText, mapping.keywords)) {
                return { icon: mapping.icon, color: mapping.color, label: mapping.label || featureText };
            }
        }
        return { icon: 'fa-tag', color: '#95a5a6', label: featureText };
    },
    
    renderFeatureWithIcon: function(featureText, isRural = false) {
        const iconData = this.getIconForFeature(featureText);
        const ruralClass = isRural ? 'rural-tag' : '';
        return `
            <span class="feature-tag ${ruralClass}" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #f0f0f0; border-radius: 20px; font-size: 0.75rem;">
                <i class="fas ${iconData.icon}" style="color: ${iconData.color}; font-size: 0.7rem;"></i>
                <span>${window.SharedCore.escapeHtml(featureText) || featureText}</span>
            </span>
        `;
    }
};

window.FeatureIconMapper = FeatureIconMapper;

// ========== FILTRAR PROPRIEDADES POR CATEGORIA E BAIRRO ==========
window.filterPropertiesByCategoryAndBairro = function(category, bairro) {
    console.log(`🎯 Filtrando: categoria="${category}", bairro="${bairro}"`);
    
    if (!window.properties) return [];
    
    const CATEGORY_CONFIG = {
        'Comercial': { filterBy: 'type', expectedValues: ['comercial'] },
        'Residencial': { filterBy: 'badge', expectedValues: ['Novo', 'Destaque', 'Luxo'], requiredType: 'residencial' },
        'Rural': { filterBy: 'badge', expectedValues: ['Fazenda', 'Chácara', 'Rural'], requiredType: 'rural' },
        'Minha Casa Minha Vida': { filterBy: 'badge', expectedValues: ['MCMV'], requiredType: null }
    };
    
    const config = CATEGORY_CONFIG[category];
    if (!config) {
        console.warn(`⚠️ Categoria "${category}" não reconhecida, usando fallback`);
        if (typeof window.renderProperties === 'function') window.renderProperties(category);
        return [];
    }
    
    let filtered = [];
    
    if (config.filterBy === 'type') {
        filtered = window.properties.filter(p => p.type && config.expectedValues.includes(p.type));
    } else {
        filtered = window.properties.filter(p => {
            const hasCorrectBadge = p.badge && config.expectedValues.includes(p.badge);
            if (config.requiredType) return hasCorrectBadge && p.type === config.requiredType;
            return hasCorrectBadge;
        });
    }
    
    if (bairro && bairro !== 'null' && bairro !== 'undefined' && bairro !== '') {
        const normalizedBairroFilter = bairro.trim().toLowerCase();
        filtered = filtered.filter(p => {
            if (!p.location) return false;
            let propertyBairro = window.SharedCore.extractBairroFromLocation(p.location);
            if (propertyBairro) {
                propertyBairro = propertyBairro.trim().toLowerCase();
                return propertyBairro === normalizedBairroFilter;
            }
            return false;
        });
    }
    
    if (typeof window.renderPropertiesWithFilter === 'function') {
        window.renderPropertiesWithFilter(filtered);
    } else {
        const container = document.getElementById('properties-container');
        if (container) {
            container.innerHTML = filtered.length === 0 
                ? '<p class="no-properties">Nenhum imóvel encontrado para este filtro.</p>'
                : filtered.map(prop => window.propertyTemplates.generate(prop)).join('');
        }
    }
    
    const countElement = document.getElementById('propertyCount');
    if (countElement) countElement.textContent = `${filtered.length} imóvel(is)`;
    
    return filtered;
};

window.filterPropertiesByCategoryAndDestaque = function(category, destaqueValue) {
    if (!window.properties) return [];
    let filtered = [...window.properties];
    
    if (category && category !== 'todos') {
        const filterMap = {
            'Rural': p => p.type === 'rural' || p.rural === true,
            'Residencial': p => p.type === 'residencial',
            'Comercial': p => p.type === 'comercial',
            'Minha Casa Minha Vida': p => p.badge === 'MCMV'
        };
        const filterFn = filterMap[category];
        if (filterFn) filtered = filtered.filter(filterFn);
    }
    
    if (destaqueValue && destaqueValue !== 'null' && destaqueValue !== 'undefined' && destaqueValue !== '') {
        filtered = filtered.filter(p => p.badge === destaqueValue);
    }
    
    if (typeof window.renderPropertiesWithFilter === 'function') window.renderPropertiesWithFilter(filtered);
    return filtered;
};

window.renderPropertiesWithFilter = function(filteredProperties) {
    const container = document.getElementById('properties-container');
    if (!container) return;
    
    if (!filteredProperties || filteredProperties.length === 0) {
        container.innerHTML = '<p class="no-properties">Nenhum imóvel encontrado para este filtro.</p>';
        return;
    }
    
    container.innerHTML = filteredProperties.map(prop => window.propertyTemplates.generate(prop)).join('');
    
    const countElement = document.getElementById('propertyCount');
    if (countElement) countElement.textContent = `${filteredProperties.length} imóvel(is)`;
};

window.updatePropertyCard = function(propertyId, updatedData = null) {
    const property = window.properties?.find(p => p.id === propertyId);
    if (!property) return false;
    
    const propertyToRender = updatedData ? { ...property, ...updatedData } : property;
    
    if (updatedData && window.propertyTemplates.updateCardContent) {
        const partialSuccess = window.propertyTemplates.updateCardContent(propertyId, propertyToRender);
        if (partialSuccess) {
            const index = window.properties.findIndex(p => p.id === propertyId);
            if (index !== -1) window.properties[index] = { ...window.properties[index], ...updatedData };
            return true;
        }
    }
    
    const allCards = document.querySelectorAll('.property-card');
    let cardToUpdate = null;
    allCards.forEach(card => {
        if (card.getAttribute('data-property-id') == propertyId) cardToUpdate = card;
    });
    
    if (cardToUpdate) {
        cardToUpdate.outerHTML = window.propertyTemplates.generate(propertyToRender);
        const index = window.properties.findIndex(p => p.id === propertyId);
        if (index !== -1) window.properties[index] = propertyToRender;
        setTimeout(() => {
            const updatedCard = document.querySelector(`[data-property-id="${propertyId}"]`);
            if (updatedCard) {
                updatedCard.classList.add('highlighted');
                setTimeout(() => updatedCard.classList.remove('highlighted'), 1000);
            }
        }, 50);
        return true;
    }
    return false;
};

window.waitForAllPropertyImages = async function() {
    const images = document.querySelectorAll('.property-image img');
    if (images.length === 0) return 0;
    
    const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
            img.addEventListener('load', () => resolve());
            img.addEventListener('error', () => resolve());
        });
    });
    
    await Promise.all(imagePromises);
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
    const loading = window.LoadingManager?.show?.('Carregando imóveis...', 'Buscando as melhores oportunidades em Maceió', { variant: 'processing' });
    
    try {
        window.ensureSupabaseCredentials();
        
        const loadStrategies = [
            () => window.supabaseLoadProperties?.()?.then(r => r?.data?.length ? r.data : null),
            () => window.supabaseFetch?.('/properties?select=*')?.then(r => r.ok ? r.data : null),
            () => { const stored = localStorage.getItem('properties'); return stored ? JSON.parse(stored) : null; },
            () => getInitialProperties()
        ];

        let propertiesData = null;
        
        setTimeout(() => loading?.updateMessage?.('Encontre seu imóvel dos sonhos em Maceió 🌴'), 800);
        
        for (let i = 0; i < loadStrategies.length; i++) {
            try {
                propertiesData = await loadStrategies[i]();
                if (propertiesData && propertiesData.length > 0) break;
            } catch (e) { console.warn(`⚠️ Estratégia ${i+1} falhou:`, e.message); }
        }

        window.properties = propertiesData || getInitialProperties();
        
        window.properties = window.properties.map(prop => ({
            ...prop,
            has_video: window.SharedCore.ensureBooleanVideo(prop.has_video),
            features: window.SharedCore.parseFeaturesForStorage(prop.features),
            images: prop.images || '',
            pdfs: prop.pdfs || ''
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
        
        if (typeof window.loadPropertiesBasedOnUrl === 'function') {
            window.loadPropertiesBasedOnUrl();
        } else if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos');
        }
        
        if (window.SmartCache?.invalidatePropertiesCache) window.SmartCache.invalidatePropertiesCache();
        
    } catch (error) {
        console.error('❌ Erro no carregamento:', error);
        loading?.setVariant?.('error');
        loading?.updateMessage?.('⚠️ Erro ao carregar imóveis');
        window.properties = getInitialProperties();
        if (typeof window.renderProperties === 'function') window.renderProperties('todos');
    } finally {
        setTimeout(() => loading?.hide?.(), 1200);
    }
};

function getInitialProperties() {
    return [
        { id: 1, title: "Casa 2Qtos - Forene", price: "R$ 180.000", location: "Residência Conj. Portal do Renascer, Forene", description: "Casa a 100m do CEASA; - Medindo 6,60m frente X 19m lado; - 125,40m² de área total; -Somente um único dono; - 02 Quartos, Sala; - Cozinha; - 02 Banheiros; - Varanda; - 02 Vagas de garagem; - Água de Poço Artesiano;", features: JSON.stringify(["02 Quartos", "Sala", "Cozinha", "02 Banheiros", "Varanda", "02 Vagas de garagem"]), type: "residencial", has_video: true, badge: "Destaque", rural: false, images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80,https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", created_at: new Date().toISOString() },
        { id: 2, title: "Apartamento 4Qtos (178m²) - Ponta Verde", price: "R$ 1.500.000", location: "Rua Saleiro Pitão, Ponta Verde - Maceió/AL", description: "Apartamento amplo, super claro e arejado, imóvel diferenciado com 178m² de área privativa, oferecendo conforto, espaço e alto padrão de acabamento. 4 Qtos, sendo 03 suítes, sala ampla com varanda, cozinha, dependência de empregada, área de serviço, 02 vagas de garagem no subsolo.", features: JSON.stringify(["4 Qtos s/ 3 suítes", "Sala ampla com varanda", "Cozinha", "Área de serviço", "DCE", "02 vagas de garagem"]), type: "residencial", has_video: false, badge: "Luxo", rural: false, images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80,https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", created_at: new Date().toISOString() },
        { id: 99, title: "Loja Comercial - Centro", price: "R$ 350.000", location: "Rua do Comércio, Centro, Maceió/AL", description: "Loja comercial em ponto privilegiado no Centro de Maceió. Ótima para comércio varejista, com grande fluxo de pessoas e fácil acesso.", features: JSON.stringify(["100m²", "Banheiro", "Ponto comercial", "Boa localização"]), type: "comercial", has_video: false, badge: "Comercial", rural: false, images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", created_at: new Date().toISOString() },
        { id: 100, title: "Sala Comercial - Ponta Verde", price: "R$ 280.000", location: "Av. Álvaro Otacílio, Ponta Verde, Maceió/AL", description: "Sala comercial no coração de Ponta Verde. Ambiente moderno, ideal para escritórios, consultórios ou pequenos negócios.", features: JSON.stringify(["50m²", "Ar condicionado", "Estacionamento", "Excelente localização"]), type: "comercial", has_video: false, badge: "Comercial", rural: false, images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", created_at: new Date().toISOString() },
        { id: 101, title: "Loja Comercial - Centro", price: "R$ 450.000", location: "Rua do Comércio, Centro, Maceió/AL", description: "Loja comercial em ponto privilegiado no Centro de Maceió. Ótimo para qualquer negócio.", features: JSON.stringify(["80m²", "Banheiro", "Ponto comercial", "Vidraça frontal"]), type: "comercial", has_video: false, badge: "Comercial", rural: false, images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", created_at: new Date().toISOString() },
        { id: 102, title: "Sala Comercial - Ponta Verde", price: "R$ 320.000", location: "Av. Álvaro Otacílio, Ponta Verde, Maceió/AL", description: "Sala comercial no coração de Ponta Verde. Próximo a bancos e comércio.", features: JSON.stringify(["50m²", "Ar condicionado", "2 vagas garagem", "Recepção"]), type: "comercial", has_video: false, badge: "Comercial", rural: false, images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", created_at: new Date().toISOString() },
        { id: 103, title: "Galpão Comercial - Tabuleiro", price: "R$ 850.000", location: "Av. Menino Marcelo, Tabuleiro do Martins, Maceió/AL", description: "Galpão comercial para depósito ou indústria. Área ampla com escritório.", features: JSON.stringify(["300m²", "Pé direito alto", "Escritório", "Banheiros", "Estacionamento"]), type: "comercial", has_video: false, badge: "Comercial", rural: false, images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", created_at: new Date().toISOString() }
    ];
}

window.renderProperties = function(filter = 'todos', forceClearCache = false) {
    if (forceClearCache && window.propertyTemplates?.clearCache) window.propertyTemplates.clearCache();
    
    const container = document.getElementById('properties-container');
    if (!container) return;
    if (!window.properties?.length) { container.innerHTML = '<p class="no-properties">Nenhum imóvel disponível.</p>'; return; }

    const filtered = window.filterPropertiesByType(window.properties, filter);
    if (filtered.length === 0) { container.innerHTML = '<p class="no-properties">Nenhum imóvel disponível para este filtro.</p>'; return; }

    container.innerHTML = filtered.map(prop => window.propertyTemplates.generate(prop)).join('');
    
    const countElement = document.getElementById('propertyCount');
    if (countElement) countElement.textContent = `${filtered.length} imóveis`;
};

window.filterPropertiesByType = function(properties, filter) {
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
    try {
        if (!window.properties?.length) return false;
        localStorage.setItem('properties', JSON.stringify(window.properties));
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        return false;
    }
};

window.updateLocalStorage = function() { return window.savePropertiesToStorage(); };

window.setupFilters = function() {
    if (window.FilterManager?.setupWithFallback) return window.FilterManager.setupWithFallback();
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length) {
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
        return true;
    }
    return false;
};

window.contactAgent = function(id) {
    const property = window.properties.find(p => p.id === id);
    if (!property) { alert('❌ Imóvel não encontrado!'); return; }
    const message = `Olá! Tenho interesse no imóvel: ${property.title} - ${property.price}`;
    window.open(`https://wa.me/5582996044513?text=${encodeURIComponent(message)}`, '_blank');
};

window.addNewProperty = async function(propertyData) {
    console.group('➕ ADICIONANDO NOVO IMÓVEL');
    if (!propertyData.title || !propertyData.price || !propertyData.location) {
        alert('❌ Preencha Título, Preço e Localização!');
        console.groupEnd();
        return null;
    }

    try {
        if (propertyData.price) propertyData.price = window.SharedCore.PriceFormatter.formatForInput(propertyData.price);
        propertyData.features = window.SharedCore.parseFeaturesForStorage(propertyData.features);
        propertyData.has_video = window.SharedCore.ensureBooleanVideo(propertyData.has_video);

        let mediaResult = { images: '', pdfs: '' };
        if (typeof MediaSystem !== 'undefined') {
            const hasMedia = MediaSystem.state?.files?.length > 0 || MediaSystem.state?.pdfs?.length > 0;
            if (hasMedia) {
                const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2)}`;
                mediaResult = await MediaSystem.uploadAll(tempId, propertyData.title);
                if (mediaResult.images) propertyData.images = mediaResult.images;
                if (mediaResult.pdfs) propertyData.pdfs = mediaResult.pdfs;
            }
        }

        let supabaseSuccess = false, supabaseId = null;
        if (window.ensureSupabaseCredentials() && typeof window.supabaseSaveProperty === 'function') {
            try {
                const supabaseResponse = await window.supabaseSaveProperty({
                    title: propertyData.title, price: propertyData.price, location: propertyData.location,
                    description: propertyData.description || '', features: propertyData.features,
                    type: propertyData.type || 'residencial', has_video: propertyData.has_video,
                    badge: propertyData.badge || 'Novo', rural: propertyData.type === 'rural',
                    images: propertyData.images || '', pdfs: propertyData.pdfs || ''
                });
                if (supabaseResponse?.success) {
                    supabaseSuccess = true;
                    supabaseId = supabaseResponse.data?.id || supabaseResponse.data?.[0]?.id;
                }
            } catch (error) { console.error('❌ Erro no Supabase:', error); }
        }

        const newId = (supabaseSuccess && supabaseId) ? supabaseId : (Math.max(...window.properties.map(p => parseInt(p.id) || 0), 0) + 1);
        const newProperty = {
            id: newId, title: propertyData.title, price: propertyData.price, location: propertyData.location,
            description: propertyData.description || '', features: propertyData.features,
            type: propertyData.type || 'residencial', has_video: propertyData.has_video,
            badge: propertyData.badge || 'Novo', rural: propertyData.type === 'rural',
            images: propertyData.images || '', pdfs: propertyData.pdfs || '',
            created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            savedToSupabase: supabaseSuccess, syncStatus: supabaseSuccess ? 'synced' : 'local_only'
        };

        window.properties.unshift(newProperty);
        window.savePropertiesToStorage();
        window.renderProperties('todos', true);
        if (typeof window.loadPropertyList === 'function') setTimeout(() => window.loadPropertyList(), 100);
        if (window.SmartCache?.invalidatePropertiesCache) window.SmartCache.invalidatePropertiesCache();
        if (typeof MediaSystem?.resetState === 'function') setTimeout(() => MediaSystem.resetState(), 300);

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
        if (window.editingPropertyId) id = window.editingPropertyId;
        else { alert('❌ Não foi possível identificar o imóvel!'); console.groupEnd(); return { success: false, localOnly: true, error: 'ID inválido' }; }
    }

    const index = window.properties.findIndex(p => p.id == id);
    if (index === -1) { alert('❌ Imóvel não encontrado!'); console.groupEnd(); return { success: false, localOnly: true, error: 'Imóvel não encontrado' }; }

    try {
        if (propertyData.price) propertyData.price = window.SharedCore.PriceFormatter.formatForInput(propertyData.price);
        const processedData = { ...propertyData, has_video: window.SharedCore.ensureBooleanVideo(propertyData.has_video) };
        const updateData = {
            title: processedData.title || window.properties[index].title,
            price: processedData.price || window.properties[index].price,
            location: processedData.location || window.properties[index].location,
            description: processedData.description || window.properties[index].description || '',
            features: processedData.features || window.properties[index].features,
            type: processedData.type || window.properties[index].type || 'residencial',
            has_video: processedData.has_video,
            badge: processedData.badge || window.properties[index].badge || 'Novo',
            rural: processedData.type === 'rural' || window.properties[index].rural || false,
            images: processedData.images || window.properties[index].images || '',
            pdfs: processedData.pdfs || window.properties[index].pdfs || ''
        };

        if (!window.updateLocalProperty(id, updateData)) throw new Error('Falha ao atualizar localmente');

        let supabaseSuccess = false, supabaseError = null;
        if (window.ensureSupabaseCredentials()) {
            try {
                // SIMPLIFICADO: SharedCore.validateIdForSupabase sempre disponível
                const validId = window.SharedCore.validateIdForSupabase(id);
                const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${validId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'apikey': window.SUPABASE_KEY, 'Authorization': `Bearer ${window.SUPABASE_KEY}`, 'Prefer': 'return=representation' },
                    body: JSON.stringify(updateData)
                });
                if (response.ok) supabaseSuccess = true;
                else supabaseError = await response.text();
            } catch (error) { supabaseError = error.message; }
        }

        alert(supabaseSuccess ? `✅ Imóvel "${updateData.title}" atualizado PERMANENTEMENTE!` : `⚠️ Imóvel "${updateData.title}" atualizado apenas LOCALMENTE.`);
        console.groupEnd();
        return { success: true, localOnly: !supabaseSuccess, error: supabaseError };
    } catch (error) {
        console.error('❌ Erro ao atualizar imóvel:', error);
        console.groupEnd();
        alert(`❌ Erro: ${error.message}`);
        return { success: false, localOnly: true, error: error.message };
    }
};

window.updateLocalProperty = function(propertyId, updatedData) {
    const index = window.properties.findIndex(p => p.id == propertyId);
    if (index === -1) return false;
    
    window.properties[index] = { ...window.properties[index], ...updatedData, id: propertyId, updated_at: new Date().toISOString() };
    window.savePropertiesToStorage();
    if (typeof window.loadPropertyList === 'function') setTimeout(() => window.loadPropertyList(), 100);
    if (typeof window.updatePropertyCard === 'function') setTimeout(() => window.updatePropertyCard(propertyId, updatedData), 150);
    else if (typeof window.renderProperties === 'function') setTimeout(() => window.renderProperties(window.currentFilter || 'todos', true), 200);
    return true;
};

window.deleteProperty = async function(id) {
    console.group(`🗑️ deleteProperty: ${id}`);
    const property = window.properties.find(p => p.id === id);
    if (!property) { alert('❌ Imóvel não encontrado!'); console.groupEnd(); return false; }
    if (!confirm(`⚠️ TEM CERTEZA que deseja excluir o imóvel?\n\n"${property.title}"\n\nEsta ação NÃO pode ser desfeita.`)) {
        console.log('❌ Exclusão cancelada'); console.groupEnd(); return false;
    }

    let supabaseSuccess = false;
    if (window.ensureSupabaseCredentials()) {
        try {
            // SIMPLIFICADO: SharedCore.validateIdForSupabase sempre disponível
            const validId = window.SharedCore.validateIdForSupabase(id);
            const response = await fetch(`${window.SUPABASE_URL}/rest/v1/properties?id=eq.${validId}`, {
                method: 'DELETE',
                headers: { 'apikey': window.SUPABASE_KEY, 'Authorization': `Bearer ${window.SUPABASE_KEY}` }
            });
            if (response.ok) supabaseSuccess = true;
        } catch (error) { console.error('❌ Erro ao excluir do Supabase:', error); }
    }

    window.properties = window.properties.filter(p => p.id !== id);
    window.savePropertiesToStorage();
    if (typeof window.renderProperties === 'function') window.renderProperties('todos', true);
    if (typeof window.loadPropertyList === 'function') setTimeout(() => window.loadPropertyList(), 100);

    alert(supabaseSuccess ? `✅ Imóvel "${property.title}" excluído PERMANENTEMENTE!` : `⚠️ Imóvel "${property.title}" excluído apenas LOCALMENTE.`);
    console.groupEnd();
    return supabaseSuccess;
};

window.loadPropertyList = function(page = window.adminCurrentPage) {
    if (!window.properties?.length) return;
    const container = document.getElementById('propertyList');
    if (!container) return;
    
    window.adminCurrentPage = page;
    const totalItems = window.properties.length;
    const totalPages = Math.ceil(totalItems / window.adminItemsPerPage);
    const startIndex = (page - 1) * window.adminItemsPerPage;
    const paginatedProperties = window.properties.slice(startIndex, Math.min(startIndex + window.adminItemsPerPage, totalItems));
    
    container.innerHTML = '';
    
    const statsHeader = document.createElement('div');
    statsHeader.style.cssText = 'background: #e8f4fd; padding: 0.8rem 1rem; border-radius: 8px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;';
    statsHeader.innerHTML = `<span><strong>Total de imóveis:</strong> ${totalItems}</span>`;
    container.appendChild(statsHeader);
    
    if (totalPages > 1) container.appendChild(createPaginationControls(totalPages, page));
    
    const listContainer = document.createElement('div');
    listContainer.style.cssText = 'margin: 1rem 0;';
    const defaultImage = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80';
    
    paginatedProperties.forEach(property => {
        let firstImage = defaultImage;
        if (property.images && property.images !== 'EMPTY') {
            const urls = property.images.split(',').filter(u => u.trim());
            if (urls.length) firstImage = urls[0];
        }
        const item = document.createElement('div');
        item.className = 'property-item';
        item.style.cssText = 'background: #f5f5f5; padding: 1rem; margin: 0.5rem 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-left: 4px solid var(--primary);';
        item.innerHTML = `
            <div style="flex-shrink:0; width:70px; height:70px; border-radius:8px; overflow:hidden; background:#2c3e50;">
                <img src="${firstImage}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='${defaultImage}'">
            </div>
            <div style="flex:3; min-width:200px;">
                <strong>${window.SharedCore.escapeHtml(property.title)}</strong>
                <div><small>${property.price}</small></div>
                <div><small>${property.location.substring(0, 40)}${property.location.length > 40 ? '...' : ''}</small></div>
            </div>
            <div style="display:flex; gap:0.5rem;">
                <button onclick="editProperty(${property.id})" style="background:var(--accent); color:white; border:none; padding:0.5rem 1rem; border-radius:5px; cursor:pointer;"><i class="fas fa-edit"></i> Editar</button>
                <button onclick="deleteProperty(${property.id})" style="background:#e74c3c; color:white; border:none; padding:0.5rem 1rem; border-radius:5px; cursor:pointer;"><i class="fas fa-trash"></i> Excluir</button>
            </div>
        `;
        listContainer.appendChild(item);
    });
    container.appendChild(listContainer);
    if (totalPages > 1) container.appendChild(createPaginationControls(totalPages, page));
};

function createPaginationControls(totalPages, currentPage) {
    const div = document.createElement('div');
    div.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin: 1rem 0; flex-wrap: wrap;';
    
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.style.cssText = 'background: var(--primary); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer;';
    prevBtn.disabled = currentPage === 1;
    if (currentPage === 1) prevBtn.style.opacity = '0.5';
    prevBtn.onclick = () => window.loadPropertyList(currentPage - 1);
    div.appendChild(prevBtn);
    
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.style.cssText = `background: ${i === currentPage ? 'var(--gold)' : '#e9ecef'}; color: ${i === currentPage ? 'white' : 'var(--text)'}; border: none; padding: 0.3rem 0.7rem; border-radius: 5px; cursor: pointer;`;
        btn.onclick = () => window.loadPropertyList(i);
        div.appendChild(btn);
    }
    
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.style.cssText = 'background: var(--primary); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer;';
    nextBtn.disabled = currentPage === totalPages;
    if (currentPage === totalPages) nextBtn.style.opacity = '0.5';
    nextBtn.onclick = () => window.loadPropertyList(currentPage + 1);
    div.appendChild(nextBtn);
    
    return div;
}

console.log('✅ properties.js - VERSÃO COMPLETA (SEM FALLBACKS)');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        window.runLowPriority(() => {
            window.loadPropertiesData();
            window.runLowPriority(() => window.setupFilters());
        });
    });
} else {
    window.runLowPriority(() => {
        window.loadPropertiesData();
        window.runLowPriority(() => window.setupFilters());
    });
}
