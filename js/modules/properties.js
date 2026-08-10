// ============================================================
// js/modules/properties.js
// VERSÃO 3.6 - COM SUPORTE A DESTAQUES MÚLTIPLOS (badge1 e badge2)
// ============================================================
// ✅ Responsabilidade Única: Gerenciamento de imóveis (CRUD)
// ✅ Renderização e estado
// ✅ Carregamento de dados do Supabase
// ✅ Correção de URLs delegada ao ImageUtils
// ✅ Cache delegado ao TemplateCache (Support System)
// ✅ Filtros delegados ao FilterManager (Cisão A)
// ✅ CORREÇÃO: getInitialProperties restaurada
// ✅ CORREÇÃO: filterPropertiesByType retorna array sempre
// ✅ CORREÇÃO: renderProperties com verificações de segurança
// ✅ NOVO: badge1 e badge2 (Destaques Múltiplos - Faixas Diagonais)
// ============================================================

console.log('✅ properties.js v3.6 carregado - Com Destaques Múltiplos (badge1/badge2)');

// ========== ESTADO GLOBAL ==========
window.properties = [];
window.editingPropertyId = null;
window.currentFilter = 'todos';

// ========== SELEÇÃO MÚLTIPLA DE IMÓVEIS ==========
window.selectedProperties = new Set();

window.generateShareLinkForSelected = function() {
    var selectedIds = Array.from(window.selectedProperties);
    
    if (selectedIds.length === 0) {
        alert('⚠️ Nenhum imóvel selecionado. Marque pelo menos um imóvel para compartilhar.');
        return null;
    }
    
    var baseUrl = window.location.origin + window.location.pathname;
    var idsParam = selectedIds.join(',');
    var shareUrl = new URL('?selected_properties=' + encodeURIComponent(idsParam), baseUrl).href;
    
    navigator.clipboard.writeText(shareUrl).then(function() {
        var toast = document.createElement('div');
        toast.textContent = '✅ Link copiado! ' + selectedIds.length + ' imóvel(is) selecionado(s). Compartilhe com seu cliente.';
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
            var style = document.createElement('style');
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
        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(function() { toast.remove(); }, 300);
        }, 3000);
    }).catch(function(err) {
        console.error('❌ Erro ao copiar link:', err);
        alert('⚠️ Não foi possível copiar o link. Copie manualmente da barra de endereços.');
    });
    
    return shareUrl;
};

window.selectAllProperties = function() {
    var checkboxes = document.querySelectorAll('.property-select-checkbox');
    checkboxes.forEach(function(checkbox) {
        checkbox.checked = true;
        var propertyId = parseInt(checkbox.getAttribute('data-property-id'));
        window.selectedProperties.add(propertyId);
    });
    updateSelectionCounter();
};

window.clearAllPropertiesSelection = function() {
    var checkboxes = document.querySelectorAll('.property-select-checkbox');
    checkboxes.forEach(function(checkbox) {
        checkbox.checked = false;
        var propertyId = parseInt(checkbox.getAttribute('data-property-id'));
        window.selectedProperties.delete(propertyId);
    });
    updateSelectionCounter();
};

window.togglePropertySelection = function(propertyId, checkbox) {
    if (checkbox.checked) {
        window.selectedProperties.add(propertyId);
    } else {
        window.selectedProperties.delete(propertyId);
    }
    updateSelectionCounter();
};

function updateSelectionCounter() {
    var counterElement = document.getElementById('selectedCount');
    var selectAllCheckbox = document.getElementById('selectAllCheckbox');
    var generateBtn = document.getElementById('generateShareLinkBtn');
    
    if (counterElement) {
        var count = window.selectedProperties.size;
        counterElement.textContent = count + ' imóvel' + (count !== 1 ? 'is' : '') + ' selecionado' + (count !== 1 ? 's' : '');
        counterElement.style.display = count > 0 ? 'inline-flex' : 'none';
    }
    
    if (generateBtn) {
        generateBtn.disabled = window.selectedProperties.size === 0;
        generateBtn.style.opacity = window.selectedProperties.size === 0 ? '0.5' : '1';
        generateBtn.style.cursor = window.selectedProperties.size === 0 ? 'not-allowed' : 'pointer';
    }
    
    if (selectAllCheckbox) {
        var allCheckboxes = document.querySelectorAll('.property-select-checkbox');
        var allChecked = allCheckboxes.length > 0 && Array.from(allCheckboxes).every(function(cb) { return cb.checked; });
        var someChecked = Array.from(allCheckboxes).some(function(cb) { return cb.checked; });
        
        selectAllCheckbox.checked = allChecked;
        selectAllCheckbox.indeterminate = someChecked && !allChecked;
    }
}

window.loadSelectedPropertiesFromUrl = function() {
    var urlParams = new URLSearchParams(window.location.search);
    var selectedIdsParam = urlParams.get('selected_properties');
    
    if (!selectedIdsParam) {
        return null;
    }
    
    try {
        var idsString = decodeURIComponent(selectedIdsParam);
        var ids = idsString.split(',').map(function(id) { return parseInt(id.trim()); }).filter(function(id) { return !isNaN(id); });
        
        if (ids.length === 0) return null;
        
        var selectedPropertiesList = window.properties.filter(function(p) { return ids.indexOf(p.id) !== -1; });
        
        if (selectedPropertiesList.length === 0) {
            console.warn('⚠️ Nenhum imóvel encontrado com os IDs fornecidos');
            return null;
        }
        
        var container = document.getElementById('properties-container');
        if (container && window.propertyTemplates) {
            container.innerHTML = selectedPropertiesList.map(function(prop) { return window.propertyTemplates.generate(prop); }).join('');
            
            var filterWarning = document.createElement('div');
            filterWarning.style.cssText = `
                background: #f0f4f8;
                border-left: 3px solid #94a3b8;
                padding: 0.4rem 0.8rem;
                margin-top: 1rem;
                margin-bottom: 0;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 0.5rem;
                font-size: 0.7rem;
                color: #64748b;
            `;
            filterWarning.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <i class="fas fa-link" style="color: #94a3b8; font-size: 0.65rem;" aria-hidden="true"></i>
                    <span>Link personalizado com <strong>${selectedPropertiesList.length}</strong> imóvel(is)</span>
                </div>
                <a href="./" style="background: transparent; color: #64748b; padding: 0.2rem 0.5rem; border-radius: 15px; text-decoration: none; font-size: 0.65rem; border: 1px solid #cbd5e1; transition: all 0.2s ease;" 
                   onmouseenter="this.style.background='#e2e8f0'; this.style.borderColor='#94a3b8'"
                   onmouseleave="this.style.background='transparent'; this.style.borderColor='#cbd5e1'">
                    <i class="fas fa-times" aria-hidden="true"></i> Limpar
                </a>
            `;
            container.appendChild(filterWarning);
        }
        
        return selectedPropertiesList;
    } catch (error) {
        console.error('❌ Erro ao processar link de seleção:', error);
        return null;
    }
};

window.loadPropertiesBasedOnUrl = function() {
    var urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('selected_properties')) {
        var selected = window.loadSelectedPropertiesFromUrl();
        if (selected && selected.length > 0) {
            return;
        }
    }
    
    if (urlParams.has('property')) {
        var propertyIdFromUrl = urlParams.get('property');
        var singleProperty = window.filterPropertyById(propertyIdFromUrl);
        
        var container = document.getElementById('properties-container');
        if (container && singleProperty && window.propertyTemplates) {
            container.innerHTML = window.propertyTemplates.generate(singleProperty);
            return;
        }
    }
    
    if (typeof window.renderProperties === 'function') {
        window.renderProperties('todos');
    }
};

// ========== UTILITÁRIOS ==========
window.ensureSupabaseCredentials = function() {
    if (!window.SUPABASE_CONSTANTS) {
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

window.calculateMarketTime = function(property) {
    var startDate;
    
    if (property.created_at && property.created_at !== 'undefined' && property.created_at !== null) {
        startDate = new Date(property.created_at);
        if (isNaN(startDate.getTime())) {
            startDate = new Date();
        }
    } else {
        startDate = new Date();
    }
    
    var today = new Date();
    var diffTime = Math.abs(today - startDate);
    var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
};

window.getMarketStatus = function(days) {
    if (days <= 30) return { text: 'Alta Liquidez', color: '#27ae60', bg: '#e8f8ef', iconColor: '#27ae60', icon: 'fa-hourglass-start' };
    if (days <= 90) return { text: 'Liquidez Média', color: '#f39c12', bg: '#fef5e7', iconColor: '#f39c12', icon: 'fa-hourglass-half' };
    if (days <= 180) return { text: 'Baixa Liquidez', color: '#e67e22', bg: '#fdf2e9', iconColor: '#e67e22', icon: 'fa-hourglass-half' };
    if (days <= 365) return { text: 'Estagnado', color: '#e74c3c', bg: '#fdecea', iconColor: '#e74c3c', icon: 'fa-hourglass-end' };
    return { text: 'Crítico!', color: '#8b0000', bg: '#fce4e4', iconColor: '#8b0000', icon: 'fa-hourglass-end' };
};

window.formatMarketTime = function(days) {
    if (days < 30) {
        return { number: days, unit: days !== 1 ? 'dias' : 'dia', type: 'days' };
    }
    if (days < 365) {
        var months = Math.floor(days / 30);
        var remainingDays = days % 30;
        if (remainingDays === 0) {
            return { number: months, unit: months !== 1 ? 'meses' : 'mês', type: 'months' };
        }
        return { number: months, unit: months !== 1 ? 'meses' : 'mês', type: 'months', remainingDays: remainingDays };
    }
    var years = Math.floor(days / 365);
    var remainingMonths = Math.floor((days % 365) / 30);
    if (remainingMonths === 0) {
        return { number: years, unit: years !== 1 ? 'anos' : 'ano', type: 'years' };
    }
    return { number: years, unit: years !== 1 ? 'anos' : 'ano', type: 'years', remainingMonths: remainingMonths };
};

window.formatMarketTimeText = function(days) {
    var formatted = window.formatMarketTime(days);
    if (formatted.remainingDays) {
        return formatted.number + ' ' + formatted.unit + ' e ' + formatted.remainingDays + ' ' + (formatted.remainingDays !== 1 ? 'dias' : 'dia');
    }
    if (formatted.remainingMonths) {
        return formatted.number + ' ' + formatted.unit + ' e ' + formatted.remainingMonths + ' ' + (formatted.remainingMonths !== 1 ? 'meses' : 'mês');
    }
    return formatted.number + ' ' + formatted.unit;
};

window.shareProperty = async function(id) {
    var property = window.properties.find(function(p) { return p.id === id; });
    if (!property) {
        console.error('❌ Imóvel não encontrado');
        return;
    }
    
    var shareUrl = new URL('?property=' + id, window.location.href).href;
    
    try {
        await navigator.clipboard.writeText(shareUrl);
        
        var card = document.querySelector('.property-card[data-property-id="' + id + '"]');
        if (card) {
            var toast = document.createElement('div');
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
                var style = document.createElement('style');
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
            setTimeout(function() {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s ease';
                setTimeout(function() { toast.remove(); }, 300);
            }, 2000);
        }
    } catch (err) {
        console.error('❌ Erro ao copiar:', err);
        alert('⚠️ Não foi possível copiar o link. Copie manualmente da barra de endereços.');
    }
};

window.filterPropertyById = function(propertyId) {
    if (!propertyId) return null;
    
    var idToFind = Number(propertyId);
    
    if (isNaN(idToFind)) {
        console.warn('⚠️ ID inválido na URL: "' + propertyId + '"');
        return null;
    }
    
    var foundProperty = window.properties.find(function(p) { return p.id === idToFind; });
    
    if (foundProperty) {
        console.log('🔍 Link direto: Exibindo apenas o imóvel ID ' + idToFind + ' - "' + foundProperty.title + '"');
    } else {
        console.warn('⚠️ Link direto: Imóvel com ID ' + idToFind + ' não encontrado.');
    }
    
    return foundProperty;
};

// ========== CARREGAR PROPRIEDADES ==========
window.loadPropertiesData = async function() {
    var loading = window.LoadingManager?.show?.('Carregando imóveis...', 'Buscando as melhores oportunidades em Maceió', { variant: 'processing' });
    
    try {
        window.ensureSupabaseCredentials();
        
        var loadStrategies = [
            function() { return window.supabaseLoadProperties?.()?.then(function(r) { return r?.data?.length ? r.data : null; }); },
            function() { return window.supabaseFetch?.('/properties?select=*')?.then(function(r) { return r.ok ? r.data : null; }); },
            function() { var stored = localStorage.getItem('properties'); return stored ? JSON.parse(stored) : null; },
            function() { return getInitialProperties(); }
        ];

        var propertiesData = null;
        
        setTimeout(function() { loading?.updateMessage?.('Encontre seu imóvel dos sonhos em Maceió 🌴'); }, 800);
        
        for (var i = 0; i < loadStrategies.length; i++) {
            try {
                propertiesData = await loadStrategies[i]();
                if (propertiesData && propertiesData.length > 0) break;
            } catch (e) { console.warn('⚠️ Estratégia ' + (i+1) + ' falhou:', e.message); }
        }

        window.properties = propertiesData || getInitialProperties();
        
        // ========== 🔥 CORREÇÃO AUTOMÁTICA DE URLs ==========
        if (window.ImageUtils && typeof window.ImageUtils.fixAllProperties === 'function') {
            console.log('🔄 [LOAD] Aplicando correção de URLs via ImageUtils...');
            var result = window.ImageUtils.fixAllProperties();
            if (result.fixedCount > 0) {
                console.log('✅ [LOAD] ' + result.fixedCount + ' propriedade(s) corrigida(s)');
                if (result.domainFixed > 0) {
                    console.log('🔄 [LOAD] ' + result.domainFixed + ' domínio(s) corrigido(s)');
                }
            }
        } else {
            console.warn('⚠️ [LOAD] ImageUtils não disponível, tentando fallback...');
            if (typeof window.fixAllPropertiesOnLoad === 'function') {
                window.fixAllPropertiesOnLoad();
            }
        }
        // ============================================================
        
        window.properties = window.properties.map(function(prop) {
            return {
                ...prop,
                has_video: window.SharedCore.ensureBooleanVideo(prop.has_video),
                features: window.SharedCore.parseFeaturesForStorage(prop.features),
                images: prop.images || '',
                pdfs: prop.pdfs || '',
                badge1: prop.badge1 || 'Nenhum',  // ✅ GARANTIR badge1
                badge2: prop.badge2 || 'Nenhum'   // ✅ GARANTIR badge2
            };
        });
        
        window.savePropertiesToStorage();
        loading?.setVariant?.('success');
        
        var propertyCount = window.properties.length;
        var finalMessage = propertyCount === 0 ? 'Pronto para começar! 🏠' :
                          propertyCount === 1 ? '✨ 1 imóvel disponível!' :
                          propertyCount <= 5 ? '✨ ' + propertyCount + ' opções incríveis!' :
                          propertyCount <= 20 ? '🏘️ ' + propertyCount + ' oportunidades em Maceió!' :
                          '🏆 ' + propertyCount + ' imóveis disponíveis!';
        
        loading?.updateMessage?.(finalMessage);
        
        // ========== 🔥 CORREÇÃO: Reaplicar filtro após carregar imóveis ==========
        if (window.FilterManager && typeof window.FilterManager.refreshFilters === 'function') {
            setTimeout(function() {
                window.FilterManager.refreshFilters();
                console.log('🔄 [FilterManager] Filtros recarregados após carregar imóveis');
            }, 300);
        } else if (typeof window.renderProperties === 'function') {
            setTimeout(function() {
                var currentFilter = window.currentFilter || 'Residencial';
                window.renderProperties(currentFilter, true);
                console.log('🔄 [Fallback] Propriedades renderizadas com filtro: ' + currentFilter);
            }, 400);
        }
        // ============================================================
        
        if (typeof window.loadPropertiesBasedOnUrl === 'function') {
            window.loadPropertiesBasedOnUrl();
        } else if (typeof window.renderProperties === 'function') {
            window.renderProperties('todos');
        }
        
        if (window.PerformanceSystem && window.PerformanceSystem.cache) {
            window.PerformanceSystem.cache.invalidatePattern('properties_data_cache');
            console.log('🧹 Cache de propriedades invalidado via PerformanceSystem');
        } else if (window.SmartCache?.invalidatePropertiesCache) {
            window.SmartCache.invalidatePropertiesCache();
        }
        
    } catch (error) {
        console.error('❌ Erro no carregamento:', error);
        loading?.setVariant?.('error');
        loading?.updateMessage?.('⚠️ Erro ao carregar imóveis');
        window.properties = getInitialProperties();
        if (typeof window.renderProperties === 'function') window.renderProperties('todos');
    } finally {
        setTimeout(function() { loading?.hide?.(); }, 1200);
    }
};

// ========== PROPERTY TEMPLATE ENGINE ==========
class PropertyTemplateEngine {
    constructor() {
        this.imageFallback = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
        this._localCache = new Map();
    }

    _safe(str) {
        if (!str) return '';
        if (window.SharedCore && typeof window.SharedCore.escapeHtml === 'function') {
            return window.SharedCore.escapeHtml(str);
        }
        return String(str).replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    _renderFeaturesList(features, isRural) {
        var displayFeatures = window.SharedCore.formatFeaturesForDisplay(features);
        if (!displayFeatures) return '';
        
        return displayFeatures.split(',').map(function(f) {
            var feature = f.trim();
            if (feature) {
                return window.FeatureIconMapper.renderFeatureWithIcon(feature, isRural);
            }
            return '';
        }).join('');
    }

    generate(property) {
        if (window.TemplateCache && typeof window.TemplateCache.getTemplate === 'function') {
            return window.TemplateCache.getTemplate(property, function(prop) { 
                return this._generateTemplate(prop); 
            }.bind(this));
        }
        
        var cacheKey = 'prop_' + property.id + '_' + (property.images?.length || 0) + '_' + property.has_video;
        if (this._localCache.has(cacheKey)) {
            return this._localCache.get(cacheKey);
        }
        
        var html = this._generateTemplate(property);
        this._localCache.set(cacheKey, html);
        
        if (this._localCache.size > 30) {
            var keysToDelete = Array.from(this._localCache.keys()).slice(0, 10);
            keysToDelete.forEach(function(key) { this._localCache.delete(key); }.bind(this));
        }
        
        return html;
    }
    
    _generateTemplate(property) {
        var displayFeatures = window.SharedCore.formatFeaturesForDisplay(property.features);
        var descriptionText = property.description || 'Descrição não disponível.';
        var truncatedDesc = descriptionText.length > 120 
            ? descriptionText.substring(0, 120) + '...' 
            : descriptionText;
        
        var newBadgeHtml = '';
        var featuresHtml = this._renderFeaturesList(property.features, property.rural);
        var formattedPrice = window.SharedCore.PriceFormatter.formatForCard(property.price);
        var safeTitle = this._safe(property.title) || 'Imóvel';
        var safeLocation = this._safe(property.location) || '';
        var altText = safeTitle + (safeLocation ? ' - ' + safeLocation : '') + ' - foto do imóvel';
        
        var html = `
            <div class="property-card" data-property-id="${property.id}" data-property-title="${this._safe(property.title)}">
                ${this.generateImageSection(property, newBadgeHtml, altText)}
                <div class="property-content">
                    <div class="property-price" data-price-field>${formattedPrice}</div>
                    <h3 class="property-title" data-title-field>${this._safe(property.title) || 'Sem título'}</h3>
                    <div class="property-location" data-location-field>
                        <i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${this._safe(property.location) || 'Local não informado'}
                    </div>
                    <p data-description-field>${this._safe(truncatedDesc)}</p>
                    ${displayFeatures ? `
                        <div class="property-features" data-features-field style="display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0;">
                            ${featuresHtml}
                        </div>
                    ` : ''}
                    <div style="display: flex; gap: 8px; margin-top: 10px;">
                        <button class="contact-btn" onclick="contactAgent(${property.id})" style="flex: 2;" aria-label="Entrar em contato sobre ${safeTitle}">
                            <i class="fab fa-whatsapp" aria-hidden="true"></i> Entrar em Contato
                        </button>
                        <button class="share-btn" onclick="shareProperty(${property.id})" aria-label="Compartilhar ${safeTitle}">
                            <i class="fas fa-share-alt" aria-hidden="true"></i>
                            <span style="font-size: 0.8rem;">Compartilhar</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        return html;
    }

    generateImageSection(property, newBadgeHtml, altText) {
        newBadgeHtml = newBadgeHtml || '';
        altText = altText || (this._safe(property.title) || 'Imóvel') + ' - foto do imóvel';
        
        var hasImages = property.images && property.images.length > 0 && property.images !== 'EMPTY';
        var imageUrls = hasImages ? property.images.split(',').filter(function(url) { return url && url.trim() !== ''; }) : [];
        var imageCount = imageUrls.length;
        var hasGallery = imageCount > 1;
        var hasPdfs = property.pdfs && property.pdfs !== 'EMPTY' && property.pdfs.trim() !== '';
        var safeTitle = this._safe(property.title) || 'Imóvel';
        
        var fallbackUrl = this.imageFallback;
        if (window.ImageUtils && typeof window.ImageUtils.getFallbackUrl === 'function') {
            fallbackUrl = window.ImageUtils.getFallbackUrl(property.title);
        }
        
        if (hasGallery && typeof window.createPropertyGallery === 'function') {
            try {
                return window.createPropertyGallery(property);
            } catch (e) {
                console.warn('❌ Erro na galeria, usando fallback:', e);
            }
        }
        
        var firstImageUrl = imageCount > 0 ? imageUrls[0] : fallbackUrl;
        
        return `
            <div class="property-image ${property.rural ? 'rural-image' : ''}" 
                 style="position: relative; height: 250px; overflow: hidden;">
                <div class="property-gallery-container" 
                     onclick="if(window.openGalleryAtCurrentIndex) openGalleryAtCurrentIndex(${property.id})" 
                     style="cursor:pointer; position:relative; width:100%; height:100%;">
                    
                    <img src="${firstImageUrl}" 
                         loading="lazy"
                         style="width: 100%; height: 100%; object-fit: cover;"
                         alt="${altText}"
                         data-original-src="${firstImageUrl}"
                         onerror="this.src='${fallbackUrl}'">
                    
                    ${property.badge ? `
                        <div class="property-badge ${property.rural ? 'rural-badge' : ''}" style="
                            position: absolute; 
                            top: 15px; 
                            left: 15px; 
                            background: var(--gold, #d4a017); 
                            color: white; 
                            padding: 0.4rem 1rem; 
                            border-radius: 20px; 
                            font-size: 0.8rem; 
                            font-weight: bold; 
                            z-index: 10;
                        ">
                            ${this._safe(property.badge)}
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
                            <i class="fas fa-images" aria-hidden="true"></i> ${imageCount}
                        </div>
                    ` : ''}
                    
                    <button class="gallery-expand-icon" 
                            aria-label="Expandir galeria de ${safeTitle}"
                            role="button"
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
                                border: 1px solid rgba(255,255,255,0.3);
                                display: flex; 
                                align-items: center; 
                                justify-content: center; 
                                font-size: 0.8rem; 
                                cursor: pointer; 
                                transition: all 0.3s ease; 
                                z-index: 10;
                            ">
                        <i class="fas fa-expand" aria-hidden="true"></i>
                    </button>
                </div>
                
                ${hasPdfs ? `
                    <button class="pdf-access" onclick="event.stopPropagation(); if(window.PdfSystem) window.PdfSystem.showModal(${property.id})" 
                            aria-label="Documentos PDF do imóvel ${safeTitle}"
                            style="
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
                        <i class="fas fa-file-pdf" aria-hidden="true"></i>
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    updateCardContent(propertyId, propertyData) {
        var card = document.querySelector('.property-card[data-property-id="' + propertyId + '"]');
        if (!card) {
            console.warn('⚠️ Card ' + propertyId + ' não encontrado');
            return false;
        }
        
        try {
            if (propertyData.price !== undefined) {
                var priceElement = card.querySelector('[data-price-field]');
                if (priceElement) {
                    var formattedPrice = window.SharedCore.PriceFormatter.formatForCard(propertyData.price);
                    priceElement.textContent = formattedPrice;
                }
            }
            
            if (propertyData.title !== undefined) {
                var titleElement = card.querySelector('[data-title-field]');
                if (titleElement) {
                    titleElement.textContent = this._safe(propertyData.title);
                }
                card.setAttribute('data-property-title', propertyData.title);
            }
            
            if (propertyData.location !== undefined) {
                var locationElement = card.querySelector('[data-location-field]');
                if (locationElement) {
                    locationElement.innerHTML = '<i class="fas fa-map-marker-alt" aria-hidden="true"></i> ' + this._safe(propertyData.location);
                }
            }
            
            if (propertyData.description !== undefined) {
                var descriptionElement = card.querySelector('[data-description-field]');
                if (descriptionElement) {
                    var descriptionText = propertyData.description || 'Descrição não disponível.';
                    var truncatedDesc = descriptionText.length > 120 
                        ? descriptionText.substring(0, 120) + '...' 
                        : descriptionText;
                    descriptionElement.textContent = this._safe(truncatedDesc);
                }
            }
            
            if (propertyData.features !== undefined) {
                var featuresElement = card.querySelector('[data-features-field]');
                var featuresHtml = this._renderFeaturesList(propertyData.features, propertyData.rural);
                
                if (featuresElement) {
                    if (featuresHtml) {
                        featuresElement.innerHTML = featuresHtml;
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
            
            if (window.TemplateCache && typeof window.TemplateCache.invalidate === 'function') {
                window.TemplateCache.invalidate(propertyId);
            } else if (this._localCache) {
                var pattern = 'prop_' + propertyId + '_';
                var keysToDelete = [];
                for (var key of this._localCache.keys()) {
                    if (key.indexOf(pattern) === 0) {
                        keysToDelete.push(key);
                    }
                }
                keysToDelete.forEach(function(key) { this._localCache.delete(key); }.bind(this));
            }
            
            card.classList.add('highlighted');
            setTimeout(function() {
                card.classList.remove('highlighted');
            }, 1000);
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao atualizar card ' + propertyId + ':', error);
            return false;
        }
    }
    
    clearCache() {
        if (window.TemplateCache && typeof window.TemplateCache.invalidateAll === 'function') {
            return window.TemplateCache.invalidateAll();
        }
        var count = this._localCache.size;
        this._localCache.clear();
        return count;
    }
}

window.propertyTemplates = new PropertyTemplateEngine();

// ========== FEATURE ICON MAPPER ==========
window.FeatureIconMapper = {
    mappings: [
        // ================================================================
        // 1. INFORMAÇÕES GERAIS / TIPO DE IMÓVEL
        // ================================================================
        { keywords: ['finalidade: locação de salas comerciais', 'locação de salas', 'aluguel de salas', 'locação comercial'], icon: 'fa-handshake', color: '#00b894', label: 'Locação' },
        { keywords: ['financiamento', 'parcelamento', 'plano facilitado', 'direto com a construtora', '100x', 'parcelas', 'financiamento direto', 'plano de pagamento', 'pagamento facilitado'], icon: 'fa-hand-holding-usd', color: '#27ae60', label: 'Financiamento' },
        { keywords: ['studio', '(studio', 'studio)', 'studio master', 'studio com', 'aparthotel', 'condohotel'], icon: 'fa-tree-city', color: '#0984e3', label: 'Studio' },
        { keywords: ['cobertura garden', 'cobertura duplex', 'cobertura n°', 'cobertura nº', 'cobertura n', 'cobertura 1', 'cobertura 2', 'cobertura 3', 'cobertura 4'], icon: 'fa-city', color: '#6c5ce7', label: 'Cobertura' },
        { keywords: ['salas comerciais c/wc', 'salas comerciais com wc', '04 salas comerciais', 'salas comerciais'], icon: 'fa-building-lock', color: '#0984e3', label: 'Salas Comerciais' },
        { keywords: ['area privativa:', 'area privativa com', 'area privativa de', 'area privativa m²', 'área privativa:'], icon: 'fa-building', color: '#0984e3', label: 'Apartamento' },
        { keywords: ['área construída', 'area construida', 'lote com área total', 'área total do lote'], icon: 'fa-solid fa-gopuram', color: '#6c5ce7', label: 'Área Construída' },
        { keywords: ['número de pavimentos', 'pavimentos térreo', 'pavimento térreo e andares'], icon: 'fa-kaaba', color: '#6c5ce7', label: 'Pavimentos' },
        { keywords: ['acesso rápido à bancos', 'bancos órgãos públicos', 'comércio e serviços', 'bares restaurantes farmácias'], icon: 'fa-barcode', color: '#e67e22', label: 'Comércio e Serviços' },
        { keywords: ['transporte público fácil acesso', 'ônibus e transporte por aplicativo', 'uber / 99'], icon: 'fa-bus', color: '#3498db', label: 'Transporte Público' },
        { keywords: ['aeroporto zumbi dos palmares', 'zumbi dos palmares', 'mcz'], icon: 'fa-plane', color: '#8e44ad', label: 'Aeroporto' },
        { keywords: ['maceió shopping', 'acesso rápido ao shopping', 'shopping park', 'vizinho ao shopping', 'parque shopping', 'próximo ao shopping', 'perto do shopping'], icon: 'fa-shopping-bag', color: '#8e44ad', label: 'Shopping' },
        { keywords: ['mini market', 'minimarket', 'mercado', 'loja de conveniência'], icon: 'fa-cart-shopping', color: '#e67e22', label: 'Mini Market' },
        { keywords: ['condomínio incluso', 'iptu incluso', 'taxas inclusas', 'condomínio e iptu'], icon: 'fa-handshake', color: '#00b894', label: 'Condomínio/IPTU Incluso' },
        { keywords: ['vagas de garagem:', 'vagas cobertas', 'vagas descobertas', 'vaga coberta', 'vaga descoberta'], icon: 'fa-car', color: '#3498db', label: 'Garagem' },
        { keywords: ['varanda gourmet com vista para o mar', 'varanda gourmet', 'varanda com vista', 'varanda disponibilidade', 'varanda: sim', 'varanda sim', 'varanda'], icon: 'fa-umbrella-beach', color: '#e67e22', label: 'Varanda' },
        { keywords: ['área externa privativa', 'terraço privativo', 'terraço descoberto', 'área externa'], icon: 'fa-umbrella-beach', color: '#e67e22', label: 'Área Externa/Terraço' },
        { keywords: ['elevador', 'elevadores', 'elevador social', 'elevador de serviço'], icon: 'fa-elevator', color: '#7f8c8d', label: 'Elevador' },
        { keywords: ['dce', 'dependência completa de empregada', 'dependencia completa de empregada', 'dce sim', 'dce: sim'], icon: 'fa-shower', color: '#1abc9c', label: 'DCE' },
        { keywords: ['banheiro da dce', 'banheiro de serviço', 'banheiro apoio', 'wc de serviço', 'wc social', 'wc apoio', 'banheiro'], icon: 'fa-shower', color: '#1abc9c', label: 'Banheiro' },
        { keywords: ['lavabo wc social', 'lavabo social', 'lavabo'], icon: 'fa-shower', color: '#1abc9c', label: 'Lavabo' },
        { keywords: ['vestiários', 'vestiário', 'diaristas', 'funcionários', 'vestiarios'], icon: 'fa-restroom', color: '#3498db', label: 'Vestiários' },
        { keywords: ['cozinha americana integrada à sala', 'cozinha integrada à sala', 'cozinha americana integrada'], icon: 'fa-utensils', color: '#f39c12', label: 'Cozinha Integrada' },
        { keywords: ['móveis planejados', 'moveis planejados', 'cozinha planejada', 'quarto planejado', 'wc planejado', 'móveis planejados cozinha'], icon: 'fa-kitchen-set', color: '#e67e22', label: 'Móveis Planejados' },
        { keywords: ['coworking home office', 'coworking', 'home office', 'sala de estudos', 'biblioteca', 'estudos'], icon: 'fa-laptop', color: '#0984e3', label: 'Coworking/Home Office' },
        { keywords: ['playground', 'brinquedoteca', 'estação kids', 'espaço pet', 'home cine', 'praça central'], icon: 'fa-child', color: '#f39c12', label: 'Área Infantil' },
        { keywords: ['campinho', 'futebol', 'futsal', 'jogo', 'jogos', 'salão de jogos', 'sala de jogos', 'quadra', 'quadra squash', 'quadra poliesportiva', 'squash', 'campo', 'esportes'], icon: 'fa-volleyball', color: '#27ae60', label: 'Esportes' },
        { keywords: ['academia', 'fitness', 'fitness academia', 'ginásio', 'musculação'], icon: 'fas fa-dumbbell', color: '#e74c3c', label: 'Academia' },
        { keywords: ['piscina privativa:', 'piscina na área externa', 'piscina cobertura', 'piscina', 'piscina suspensa panorâmica', 'skypool', 'piscina com deck', 'piscina borda infinita', 'piscina infantil aquecida', 'hidromassagem aquecidas', 'espelho d´agua', 'espelho d agua', 'espelho dagua', 'praca d aguas', 'deck molhado', 'espelho d`agua'], icon: 'fa-swimmer', color: '#3498db', label: 'Piscina' },
        { keywords: ['espaço gourmet', 'churrasqueira e forno de pizza'], icon: 'fa-pizza-slice', color: '#e67e22', label: 'Espaço Gourmet' },
        { keywords: ['salão de festas', 'salao de festas', 'eventos', 'celebração', 'comemoração', 'festas', 'salão de eventos', 'espaço para eventos'], icon: 'fa-glass-cheers', color: '#e84393', label: 'Salão de Festas' },
        { keywords: ['área de serviço', 'lavanderia', 'lavanderia compartilhada', 'lavanderia pay-per-use'], icon: 'fa-tshirt', color: '#95a5a6', label: 'Área de Serviço' },
        { keywords: ['bicicleta', 'bike', 'bicicletário', 'ciclovia', 'ciclista', 'bicicletas'], icon: 'fa-bicycle', color: '#27ae60', label: 'Bicicleta' },
        { keywords: ['posição/nascente', 'posição nascente leste', 'nascente leste', 'leste', 'posição disponibilidade'], icon: 'fa-sun', color: '#f39c12', label: 'Nascente (Leste)' },
        { keywords: ['vista para o mar disponibilidade', 'vista para o mar'], icon: 'fa-water', color: '#3498db', label: 'Vista Mar' },
        { keywords: ['suite master com hidromassagem', 'suíte master com hidromassagem', 'suite master', 'suites com closet', 'hidromassagem na suite', 'hidromassagem na suíte', 'master suite', 'suíte', 'suites'], icon: 'fa-bed', color: '#e74c3c', label: 'Suítes' },
        { keywords: ['restaurante'], icon: 'fa-utensils', color: '#e67e22', label: 'Restaurante' },
        { keywords: ['café'], icon: 'fa-mug-saucer', color: '#6c5ce7', label: 'Café' },
        { keywords: ['sauna'], icon: 'fa-hot-tub-person', color: '#e74c3c', label: 'Sauna' },
        { keywords: ['espaço spa', 'spa', 'spa com hidromassagem', 'spa hidromassagem', 'banheiras de hidromassagem'], icon: 'fa-spa', color: '#1abc9c', label: 'SPA' },
        { keywords: ['massagem'], icon: 'fas fa-hands', color: '#9b59b6', label: 'Massagem' },
        { keywords: ['sala para administração', 'sala para adm', 'depósito', 'administração', 'sala de administração'], icon: 'fa-warehouse', color: '#7f8c8d', label: 'Depósito / Administração' },
        { keywords: ['recepção', 'atendimento', 'check-in'], icon: 'fa-id-card', color: '#3498db', label: 'Recepção' },
        { keywords: ['recepção salas comerciais', 'salas comerciais no térreo', 'salas empresariais'], icon: 'fa-store', color: '#0984e3', label: 'Recepção/Salas Comerciais' },
        { keywords: ['churrasqueira'], icon: 'fa-drumstick-bite', color: '#e67e22', label: 'Churrasqueira' },
        { keywords: ['condomínio fechado', 'condominio fechado', 'câmeras de vigilância', 'portaria 24h', 'segurança 24h', 'ronda', 'condomínio', 'condominio'], icon: 'fa-shield-alt', color: '#2c3e50', label: 'Condomínio Fechado' },
        { keywords: ['sala de reunião', 'sala de reuniao', 'reunião', 'reuniao', 'espaço para reuniões', 'sala para reuniões'], icon: 'fa-users', color: '#6c5ce7', label: 'Sala de Reunião' },
        { keywords: ['varanda'], icon: 'fa-window-frame', color: '#e67e22', label: 'Varanda' },
        // ================================================================
        // ITENS PARA IMÓVEIS RURAIS / FAZENDAS
        // ================================================================
        { keywords: ['raças de sela', 'sela', 'lazer equestre', 'esporte equestre', 'tração animal', 'corrida equina', 'equinos', 'cavalo', 'cavalos', 'criação de cavalos', 'haras', 'picadeiro', 'hipismo', 'selaria', 'criação de animais'], icon: 'fa-sticker-mule', color: '#6c5ce7', label: 'Equinos (Sela/Tração)' },
        { keywords: ['horas de maceió', 'km de maceió', 'distância de maceió', 'minutos de maceió', 'deslocamento até', 'próximo à capital'], icon: 'fa-route', color: '#2c3e50', label: 'Deslocamento' },
        { keywords: ['mecanização', 'mecanizada', 'terra mecanizada', 'terra plana mecanizada', 'área mecanizada', 'topografia mecanizada', 'mecanizável', 'plana toda mecanizada'], icon: 'fa-solid fa-tractor', color: '#8B4513', label: 'Mecanização' },
        { keywords: ['galpão', 'armazém', 'depósito agrícola', 'guarda maquinário', 'maquinário', 'depósito de máquinas', 'armazenamento'], icon: 'fa-warehouse', color: '#7f8c8d', label: 'Galpão/Armazém' },
        { keywords: ['piquete', 'piquetes', 'vários piquetes', 'piquetes para criação', 'piquetes com capim', 'piquetes para gado', 'divisão de pasto', 'curral', 'currais', 'curral com balança', 'balança', 'mangueira', 'mangueiras', 'cerca', 'cercas'], icon: 'fa-object-group', color: '#8B4513', label: 'Piquetes/Currais' },
        { keywords: ['poço artesiano', 'muita água', 'rica em água', 'extremamente rica em água', 'recursos hídricos', 'córrego', 'rio', 'reservatório', 'fonte de água', 'nascentes', 'nascente água', 'lagoa', 'brejo', 'áreas de várzea', 'várzea', 'rio na propriedade', 'córrego na fazenda', 'água na fazenda'], icon: 'fa-water-ladder', color: '#3498db', label: 'Recursos Hídricos' },
        { keywords: ['fazenda', 'propriedade rural', 'sítio', 'chácara', 'terra', 'área rural', 'zona da mata', 'mata alagoana'], icon: 'fa-tree', color: '#27ae60', label: 'Fazenda' },
        { keywords: ['tarefas', 'tarefa', 'hectares', 'hectare', 'terreno rural', 'área de terra', 'área rural'], icon: 'fa-draw-polygon', color: '#2ecc71', label: 'Área de Terra' },
        { keywords: ['implementos agrícolas', 'implementos', 'carreta', 'carretas', 'equipamentos agrícolas', 'máquinas agrícolas'], icon: 'fa-solid fa-trailer', color: '#7f8c8d', label: 'Implementos Agrícolas' },
        { keywords: ['gado de corte', 'gado leiteiro', 'gado de leite', 'criação de gado', 'gado', 'rebanho bovino', 'bovinos', 'pecuária de corte', 'pecuária leiteira', 'gado corte', 'gado leite'], icon: 'fa-solid fa-cow', color: '#8B4513', label: 'Gado (Corte/Leite)' },
        { keywords: ['suinocultura', 'criação de porcos', 'porcos', 'suínos', 'baias', 'baia de porcos', 'granja de suínos'], icon: 'fa-solid fa-piggy-bank', color: '#e84393', label: 'Suinocultura' },
        { keywords: ['eletrificação', 'energia elétrica', 'energia', 'luz', 'iluminação', 'eletricidade', 'poste', 'rede elétrica'], icon: 'fa-bolt', color: '#f1c40f', label: 'Eletrificação' },
        { keywords: ['reserva legal', 'mata', 'reflorestamento', 'mata nativa', 'preservação', 'floresta', 'bosque'], icon: 'fa6-solid fa-tree', color: '#27ae60', label: 'Reserva Legal' },
        { keywords: ['cadastro rural', 'car', 'ccir', 'itr', 'georreferenciamento', 'incra', 'matrícula', 'registro de imóveis', 'selo', 'produto orgânico', 'certificação', 'selo sustentável', 'registro rural'], icon: 'fa-solid fa-file-shield', color: '#f1c40f', label: 'Cadastro Rural' },
        { keywords: ['casa de morador', 'moradia', 'residência rural', 'casa do caseiro', 'casa de vaqueiro'], icon: 'fa-solid fa-house-chimney', color: '#8B4513', label: 'Casa de Morador' },
        { keywords: ['casa sede', 'casa principal', 'sede da fazenda', 'casa grande'], icon: 'fa-solid fa-vihara', color: '#6c5ce7', label: 'Casa Sede' },
        { keywords: ['vaqueiro', 'funcionário', 'trabalhador rural', 'caseiro', 'morador', 'empregado rural'], icon: 'fa-solid fa-people-carry-box', color: '#3498db', label: 'Funcionários' },
        { keywords: ['caminhonete', 'pickup', 'camionete', 'veículo da propriedade'], icon: 'fa-solid fa-truck-pickup', color: '#2c3e50', label: 'Caminhonete' },
        { keywords: ['caminhão', 'caminhões', 'transporte de carga'], icon: 'fa-solid fa-truck-moving', color: '#34495e', label: 'Caminhão' },
        { keywords: ['heliponto', 'helicóptero', 'pouso de helicóptero'], icon: 'fa-solid fa-helicopter', color: '#e67e22', label: 'Heliponto' },
        { keywords: ['lavoura', 'milho', 'soja', 'trigo', 'cereal', 'grãos', 'plantação de grãos', 'lavoura de milho', 'lavoura de soja', 'feno', 'tifton', 'braquiária', 'capim-elefante', 'capim tifton', 'capim braquiária'], icon: 'fa-wheat-awn', color: '#f1c40f', label: 'Lavoura / Grãos' },
        { keywords: ['sistemas de criação', 'sistema de criação', 'confinamento', 'semi-confinamento', 'pastejo', 'rotacionado', 'criação intensiva', 'criação extensiva', 'manejo animal', 'manejo de rebanho'], icon: 'fa-solid fa-helmet-safety', color: '#f39c12', label: 'Sistemas de Criação' },
        { keywords: ['rebanho', 'animais', 'criação', 'boi', 'vaca', 'pecuária'], icon: 'fa-horse-head', color: '#8B4513', label: 'Rebanho' },
        { keywords: ['pista asfáltica', 'beira de pista', 'asfalto', 'estrada', 'acesso asfaltado', 'beira da estrada'], icon: 'fa-road', color: '#7f8c8d', label: 'Infraestrutura' },
        { keywords: ['capim', 'pastagem', 'pasto', 'forragem', 'cultivo', 'plantações', 'muita capim'], icon: 'fa-seedling', color: '#27ae60', label: 'Pastagem' },
        { keywords: ['frigorífico', 'agroindústria', 'agroindustria', 'processamento', 'cadeia de processamento', 'industrialização', 'beneficiamento'], icon: 'fas fa-industry', color: '#7f8c8d', label: 'Agroindústria' },
        { keywords: ['area privativa', 'area construida', 'area util', 'm²', 'metros quadrados', 'area total'], icon: 'fa-home', color: '#6c5ce7', label: 'Área' }
    ],
    
    normalizeText: function(text) {
        if (!text) return '';
        return text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    },
    
    matchesKeyword: function(text, keywordList) {
        var normalizedText = this.normalizeText(text);
        for (var i = 0; i < keywordList.length; i++) {
            var keyword = keywordList[i];
            var normalizedKeyword = this.normalizeText(keyword);
            if (normalizedText === normalizedKeyword || 
                normalizedText.indexOf(normalizedKeyword) !== -1 || 
                normalizedKeyword.indexOf(normalizedText) !== -1) {
                return true;
            }
            var words = normalizedText.split(/\s+/);
            for (var j = 0; j < words.length; j++) {
                var word = words[j];
                if (word === normalizedKeyword || 
                    (normalizedKeyword.length > 2 && word.indexOf(normalizedKeyword) !== -1)) {
                    return true;
                }
            }
        }
        return false;
    },
    
    getIconForFeature: function(featureText) {
        if (!featureText) return { icon: 'fa-tag', color: '#95a5a6', label: 'Característica' };
        var lowerText = this.normalizeText(featureText);
        for (var i = 0; i < this.mappings.length; i++) {
            var mapping = this.mappings[i];
            if (this.matchesKeyword(lowerText, mapping.keywords)) {
                return { icon: mapping.icon, color: mapping.color, label: mapping.label || featureText };
            }
        }
        return { icon: 'fa-tag', color: '#95a5a6', label: featureText };
    },
    
    renderFeatureWithIcon: function(featureText, isRural) {
        isRural = isRural || false;
        var iconData = this.getIconForFeature(featureText);
        var ruralClass = isRural ? 'rural-tag' : '';
        var safeText = window.SharedCore ? window.SharedCore.escapeHtml(featureText) : featureText;
        return `
            <span class="feature-tag ${ruralClass}" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #f0f0f0; border-radius: 20px; font-size: 0.75rem;">
                <i class="fas ${iconData.icon}" style="color: ${iconData.color}; font-size: 0.7rem;" aria-hidden="true"></i>
                <span>${safeText || featureText}</span>
            </span>
        `;
    }
};

// ============================================================
// INITIAL PROPERTIES - COM badge1 E badge2
// ============================================================
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
            badge1: "Oportunidade",
            badge2: "Vista Mar",
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
            badge1: "Exclusivo",
            badge2: "Beira Mar",
            rural: false, 
            images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80,https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", 
            created_at: new Date().toISOString() 
        },
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
            badge1: "Nenhum",
            badge2: "Nenhum",
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
            badge1: "Nenhum",
            badge2: "Nenhum",
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
            badge1: "Nenhum",
            badge2: "Nenhum",
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
            badge1: "Nenhum",
            badge2: "Nenhum",
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
            badge1: "Nenhum",
            badge2: "Nenhum",
            rural: false, 
            images: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", 
            created_at: new Date().toISOString() 
        }
    ];
}

// ============================================================
// DELEGAÇÃO DE FILTROS PARA O FilterManager (Cisão A) - CORRIGIDA
// ============================================================

/**
 * DELEGADO: filterPropertiesByCategoryAndBairro
 * Agora gerenciado pelo FilterManager
 */
window.filterPropertiesByCategoryAndBairro = function(category, bairro) {
    if (window.FilterManager && typeof window.FilterManager.applyMainFilter === 'function') {
        return window.FilterManager.applyMainFilter(category);
    }
    // Fallback: implementação simplificada
    console.warn('⚠️ FilterManager não disponível, usando fallback');
    if (!window.properties || !Array.isArray(window.properties)) return [];
    return window.properties.filter(function(p) {
        if (category === 'Residencial') return p.type === 'residencial';
        if (category === 'Comercial') return p.type === 'comercial';
        if (category === 'Rural') return p.type === 'rural' || p.rural === true;
        if (category === 'TerrenosIncorporacoes') {
            return p.badge === 'Terreno' || p.badge === 'Incorporação' || p.type === 'terrenos_incorporacoes';
        }
        return true;
    });
};

/**
 * DELEGADO: filterPropertiesByCategoryAndDestaque
 * Agora gerenciado pelo FilterManager
 */
window.filterPropertiesByCategoryAndDestaque = function(category, destaqueValue) {
    if (window.FilterManager && typeof window.FilterManager.applyMainFilter === 'function') {
        return window.FilterManager.applyMainFilter(category);
    }
    console.warn('⚠️ FilterManager não disponível, usando fallback');
    if (!window.properties || !Array.isArray(window.properties)) return [];
    var filtered = window.properties.slice();
    if (category && category !== 'todos') {
        var filterMap = {
            'Rural': function(p) { return p.type === 'rural' || p.rural === true; },
            'Residencial': function(p) { return p.type === 'residencial'; },
            'Comercial': function(p) { return p.type === 'comercial'; },
            'TerrenosIncorporacoes': function(p) { 
                return p.badge === 'Terreno' || p.badge === 'Incorporação' || p.type === 'terrenos_incorporacoes';
            }
        };
        var filterFn = filterMap[category];
        if (filterFn) filtered = filtered.filter(filterFn);
    }
    if (destaqueValue && destaqueValue !== 'null' && destaqueValue !== 'undefined' && destaqueValue !== '') {
        filtered = filtered.filter(function(p) { return p.badge === destaqueValue; });
    }
    return filtered;
};

/**
 * DELEGADO: renderPropertiesWithFilter
 * Agora gerenciado pelo FilterManager
 */
window.renderPropertiesWithFilter = function(filteredProperties) {
    if (window.FilterManager && typeof window.FilterManager.applyMainFilter === 'function') {
        // O FilterManager já renderiza automaticamente
        return;
    }
    // Fallback
    var container = document.getElementById('properties-container');
    if (!container) return;
    if (!filteredProperties || !Array.isArray(filteredProperties) || filteredProperties.length === 0) {
        container.innerHTML = '<p class="no-properties">Nenhum imóvel encontrado para este filtro.</p>';
        return;
    }
    if (window.propertyTemplates && typeof window.propertyTemplates.generate === 'function') {
        container.innerHTML = filteredProperties.map(function(prop) {
            return window.propertyTemplates.generate(prop);
        }).join('');
    }
    var countElement = document.getElementById('propertyCount');
    if (countElement) countElement.textContent = filteredProperties.length + ' imóvel(is)';
};

/**
 * DELEGADO: filterPropertiesByType - CORRIGIDO (retorna array sempre)
 * Agora gerenciado pelo FilterManager
 */
window.filterPropertiesByType = function(properties, filter) {
    // 🔴 CORREÇÃO: Verificar se properties é válido
    if (!properties || !Array.isArray(properties)) {
        console.warn('⚠️ filterPropertiesByType: properties não é um array válido');
        return []; // Retorna array vazio em vez de undefined
    }
    
    if (window.FilterManager && typeof window.FilterManager.applyMainFilter === 'function') {
        // O FilterManager já gerencia isso
        return properties;
    }
    
    // Fallback
    if (filter === 'todos' || !filter) return properties;
    var filterMap = {
        'Residencial': function(p) { return p.type === 'residencial'; },
        'Comercial': function(p) { return p.type === 'comercial'; },
        'Rural': function(p) { return p.type === 'rural' || p.rural === true; },
        'TerrenosIncorporacoes': function(p) { 
            return p.badge === 'Terreno' || p.badge === 'Incorporação' || p.type === 'terrenos_incorporacoes';
        }
    };
    var filterFn = filterMap[filter];
    return filterFn ? properties.filter(filterFn) : properties;
};

/**
 * DELEGADO: setupFilters
 * Agora gerenciado pelo FilterManager
 */
window.setupFilters = function() {
    if (window.FilterManager && typeof window.FilterManager.init === 'function') {
        return window.FilterManager.init();
    }
    console.warn('⚠️ FilterManager não disponível para setupFilters');
    // Fallback: implementação antiga
    var filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length) {
        filterButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var filter = this.getAttribute('data-filter');
                if (filter) {
                    window.currentFilter = filter;
                    window.renderProperties(filter);
                    filterButtons.forEach(function(b) { b.classList.remove('active'); });
                    this.classList.add('active');
                }
            });
        });
        return true;
    }
    return false;
};

// ============================================================
// FIM DA DELEGAÇÃO DE FILTROS
// ============================================================

// ========== RENDER PROPERTIES - CORRIGIDA ==========
window.renderProperties = function(filter, forceClearCache) {
    filter = filter || 'todos';
    forceClearCache = forceClearCache || false;
    
    if (forceClearCache && window.propertyTemplates?.clearCache) window.propertyTemplates.clearCache();
    
    var container = document.getElementById('properties-container');
    if (!container) return;
    
    // 🔴 CORREÇÃO: Verificar se properties existe e é um array
    if (!window.properties || !Array.isArray(window.properties)) {
        console.warn('⚠️ renderProperties: window.properties não é um array');
        container.innerHTML = '<p class="no-properties">Nenhum imóvel disponível.</p>';
        return;
    }
    
    if (window.properties.length === 0) {
        container.innerHTML = '<p class="no-properties">Nenhum imóvel disponível.</p>';
        return;
    }

    // 🔴 CORREÇÃO: Garantir que filterPropertiesByType retorne um array
    var filtered = window.filterPropertiesByType(window.properties, filter);
    
    // 🔴 CORREÇÃO: Verificar se filtered é um array
    if (!filtered || !Array.isArray(filtered)) {
        console.warn('⚠️ renderProperties: filtered não é um array, usando properties');
        filtered = window.properties;
    }
    
    if (filtered.length === 0) { 
        container.innerHTML = '<p class="no-properties">Nenhum imóvel disponível para este filtro.</p>'; 
        return; 
    }

    container.innerHTML = filtered.map(function(prop) { return window.propertyTemplates.generate(prop); }).join('');
    
    var countElement = document.getElementById('propertyCount');
    if (countElement) countElement.textContent = filtered.length + ' imóveis';
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

window.contactAgent = function(id) {
    var property = window.properties.find(function(p) { return p.id === id; });
    if (!property) { alert('❌ Imóvel não encontrado!'); return; }
    var message = 'Olá! Tenho interesse no imóvel: ' + property.title + ' - ' + property.price;
    window.open('https://wa.me/5582996044513?text=' + encodeURIComponent(message), '_blank');
};

// ========== CRUD OPERATIONS ==========
window.addNewProperty = async function(propertyData) {
    if (!propertyData.title || !propertyData.price || !propertyData.location) {
        alert('❌ Preencha Título, Preço e Localização!');
        return null;
    }

    try {
        if (propertyData.price) propertyData.price = window.SharedCore.PriceFormatter.formatForInput(propertyData.price);
        propertyData.features = window.SharedCore.parseFeaturesForStorage(propertyData.features);
        propertyData.has_video = window.SharedCore.ensureBooleanVideo(propertyData.has_video);

        var mediaResult = { images: '', pdfs: '' };
        if (typeof MediaSystem !== 'undefined') {
            var hasMedia = (MediaSystem.state?.files?.length || 0) > 0 || (MediaSystem.state?.pdfs?.length || 0) > 0;
            if (hasMedia) {
                var tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2);
                mediaResult = await MediaSystem.uploadAll(tempId, propertyData.title);
                if (mediaResult.images) propertyData.images = mediaResult.images;
                if (mediaResult.pdfs) propertyData.pdfs = mediaResult.pdfs;
            }
        }

        var supabaseSuccess = false, supabaseId = null;
        if (window.ensureSupabaseCredentials() && typeof window.supabaseSaveProperty === 'function') {
            try {
                var supabaseResponse = await window.supabaseSaveProperty({
                    title: propertyData.title, price: propertyData.price, location: propertyData.location,
                    description: propertyData.description || '', features: propertyData.features,
                    type: propertyData.type || 'residencial', has_video: propertyData.has_video,
                    badge: propertyData.badge || 'Nenhum',
                    badge1: propertyData.badge1 || 'Nenhum',   // ✅ NOVO
                    badge2: propertyData.badge2 || 'Nenhum',   // ✅ NOVO
                    rural: propertyData.type === 'rural',
                    images: propertyData.images || '', pdfs: propertyData.pdfs || ''
                });
                if (supabaseResponse?.success) {
                    supabaseSuccess = true;
                    supabaseId = supabaseResponse.data?.id || supabaseResponse.data?.[0]?.id;
                }
            } catch (error) { console.error('❌ Erro no Supabase:', error); }
        }

        var maxId = 0;
        for (var i = 0; i < window.properties.length; i++) {
            var pId = parseInt(window.properties[i].id) || 0;
            if (pId > maxId) maxId = pId;
        }
        var newId = (supabaseSuccess && supabaseId) ? supabaseId : (maxId + 1);
        
        // ✅ NOVO OBJETO COM badge1 E badge2
        var newProperty = {
            id: newId,
            title: propertyData.title,
            price: propertyData.price,
            location: propertyData.location,
            description: propertyData.description || '',
            features: propertyData.features,
            type: propertyData.type || 'residencial',
            has_video: propertyData.has_video,
            badge: propertyData.badge || 'Nenhum',
            badge1: propertyData.badge1 || 'Nenhum',   // ✅ NOVO
            badge2: propertyData.badge2 || 'Nenhum',   // ✅ NOVO
            rural: propertyData.type === 'rural',
            images: propertyData.images || '',
            pdfs: propertyData.pdfs || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            savedToSupabase: supabaseSuccess,
            syncStatus: supabaseSuccess ? 'synced' : 'local_only'
        };

        window.properties.unshift(newProperty);
        window.savePropertiesToStorage();
        window.renderProperties('todos', true);
        if (typeof window.loadPropertyList === 'function') setTimeout(function() { window.loadPropertyList(); }, 100);
        
        if (window.TemplateCache && typeof window.TemplateCache.invalidateAll === 'function') {
            window.TemplateCache.invalidateAll();
        } else if (window.SmartCache?.invalidatePropertiesCache) {
            window.SmartCache.invalidatePropertiesCache();
        }
        
        if (typeof MediaSystem?.resetState === 'function') setTimeout(function() { MediaSystem.resetState(); }, 300);

        return newProperty;
    } catch (error) {
        console.error('❌ Erro ao adicionar imóvel:', error);
        alert('❌ Erro ao cadastrar imóvel:\n' + (error.message || 'Erro desconhecido'));
        return null;
    }
};

window.updateProperty = async function(id, propertyData) {
    if (!id || id === 'null' || id === 'undefined') {
        if (window.editingPropertyId) id = window.editingPropertyId;
        else { alert('❌ Não foi possível identificar o imóvel!'); return { success: false, localOnly: true, error: 'ID inválido' }; }
    }

    var index = window.properties.findIndex(function(p) { return p.id == id; });
    if (index === -1) { alert('❌ Imóvel não encontrado!'); return { success: false, localOnly: true, error: 'Imóvel não encontrado' }; }

    try {
        if (propertyData.price) propertyData.price = window.SharedCore.PriceFormatter.formatForInput(propertyData.price);
        var processedData = Object.assign({}, propertyData, { has_video: window.SharedCore.ensureBooleanVideo(propertyData.has_video) });
        
        // ✅ NOVO updateData COM badge1 E badge2
        var updateData = {
            title: processedData.title || window.properties[index].title,
            price: processedData.price || window.properties[index].price,
            location: processedData.location || window.properties[index].location,
            description: processedData.description || window.properties[index].description || '',
            features: processedData.features || window.properties[index].features,
            type: processedData.type || window.properties[index].type || 'residencial',
            has_video: processedData.has_video,
            badge: processedData.badge || window.properties[index].badge || 'Nenhum',
            badge1: processedData.badge1 || window.properties[index].badge1 || 'Nenhum',   // ✅ NOVO
            badge2: processedData.badge2 || window.properties[index].badge2 || 'Nenhum',   // ✅ NOVO
            rural: processedData.type === 'rural' || window.properties[index].rural || false,
            images: processedData.images || window.properties[index].images || '',
            pdfs: processedData.pdfs || window.properties[index].pdfs || ''
        };

        if (!window.updateLocalProperty(id, updateData)) throw new Error('Falha ao atualizar localmente');

        var supabaseSuccess = false, supabaseError = null;
        if (window.ensureSupabaseCredentials()) {
            try {
                var validId = window.SharedCore.validateIdForSupabase(id);
                var response = await fetch(window.SUPABASE_URL + '/rest/v1/properties?id=eq.' + validId, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'apikey': window.SUPABASE_KEY, 'Authorization': 'Bearer ' + window.SUPABASE_KEY, 'Prefer': 'return=representation' },
                    body: JSON.stringify(updateData)
                });
                if (response.ok) supabaseSuccess = true;
                else supabaseError = await response.text();
            } catch (error) { supabaseError = error.message; }
        }

        alert(supabaseSuccess ? '✅ Imóvel "' + updateData.title + '" atualizado PERMANENTEMENTE!' : '⚠️ Imóvel "' + updateData.title + '" atualizado apenas LOCALMENTE.');
        return { success: true, localOnly: !supabaseSuccess, error: supabaseError };
    } catch (error) {
        console.error('❌ Erro ao atualizar imóvel:', error);
        alert('❌ Erro: ' + error.message);
        return { success: false, localOnly: true, error: error.message };
    }
};

window.updateLocalProperty = function(propertyId, updatedData) {
    var index = window.properties.findIndex(function(p) { return p.id == propertyId; });
    if (index === -1) return false;
    
    window.properties[index] = Object.assign({}, window.properties[index], updatedData, { id: propertyId, updated_at: new Date().toISOString() });
    window.savePropertiesToStorage();
    if (typeof window.loadPropertyList === 'function') setTimeout(function() { window.loadPropertyList(); }, 100);
    if (typeof window.updatePropertyCard === 'function') setTimeout(function() { window.updatePropertyCard(propertyId, updatedData); }, 150);
    else if (typeof window.renderProperties === 'function') setTimeout(function() { window.renderProperties(window.currentFilter || 'todos', true); }, 200);
    return true;
};

window.deleteProperty = async function(id) {
    var property = window.properties.find(function(p) { return p.id === id; });
    if (!property) {
        alert('❌ Imóvel não encontrado!');
        return false;
    }
    
    if (!confirm('⚠️ TEM CERTEZA que deseja excluir o imóvel?\n\n"' + property.title + '"\n\nEsta ação NÃO pode ser desfeita.')) {
        return false;
    }

    var mediaDeletionSuccess = true;
    var mediaDeletionError = null;

    if (typeof MediaSystem !== 'undefined' && typeof MediaSystem.deleteFilesFromStorage === 'function') {
        var imageUrls = property.images && property.images !== 'EMPTY' 
            ? property.images.split(',').filter(function(url) { return url && url.trim() !== ''; }) 
            : [];
        var pdfUrls = property.pdfs && property.pdfs !== 'EMPTY' 
            ? property.pdfs.split(',').filter(function(url) { return url && url.trim() !== ''; }) 
            : [];
        var allFileUrls = imageUrls.concat(pdfUrls);

        if (allFileUrls.length > 0) {
            try {
                var deletionResult = await MediaSystem.deleteFilesFromStorage(allFileUrls);
                if (!deletionResult.success) {
                    mediaDeletionError = 'Falha ao excluir ' + deletionResult.failedCount + ' arquivo(s)';
                    mediaDeletionSuccess = false;
                }
            } catch (error) {
                mediaDeletionError = error.message;
                mediaDeletionSuccess = false;
                
                var userConfirmed = confirm('⚠️ ERRO AO EXCLUIR ARQUIVOS:\n\n' + mediaDeletionError + '\n\nDeseja continuar com a exclusão do registro?');
                if (!userConfirmed) {
                    alert('❌ Exclusão cancelada');
                    return false;
                }
            }
        }
    }

    var supabaseSuccess = false;
    var supabaseError = null;

    if (window.ensureSupabaseCredentials()) {
        try {
            var validId = window.SharedCore.validateIdForSupabase(id);
            var response = await fetch(window.SUPABASE_URL + '/rest/v1/properties?id=eq.' + validId, {
                method: 'DELETE',
                headers: {
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': 'Bearer ' + window.SUPABASE_KEY
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

    window.properties = window.properties.filter(function(p) { return p.id !== id; });
    
    var saved = window.savePropertiesToStorage();
    
    if (!saved) {
        console.error('❌ Falha ao salvar após exclusão local');
        alert('⚠️ Erro ao salvar alterações localmente!');
        return false;
    }

    if (typeof window.renderProperties === 'function') {
        window.renderProperties('todos', true);
    }
    if (typeof window.loadPropertyList === 'function') {
        setTimeout(function() { window.loadPropertyList(); }, 100);
    }

    var finalMessage = '';
    if (supabaseSuccess) {
        finalMessage = '✅ Imóvel "' + property.title + '" excluído PERMANENTEMENTE!\n\n';
        finalMessage += '✓ Registro removido do servidor.\n';
        if (mediaDeletionSuccess) {
            finalMessage += '✓ Arquivos de mídia excluídos do Storage.';
        } else {
            finalMessage += '⚠️ Falha na exclusão de arquivos: ' + (mediaDeletionError || 'erro desconhecido');
        }
    } else {
        finalMessage = '⚠️ Imóvel "' + property.title + '" excluído apenas LOCALMENTE.\n\n';
        finalMessage += '✓ Registro removido do navegador.\n';
        if (supabaseError) {
            finalMessage += '❌ Erro no servidor: ' + supabaseError.substring(0, 100) + '...\n';
        }
        if (!mediaDeletionSuccess) {
            finalMessage += '⚠️ Arquivos de mídia NÃO foram excluídos do Storage.';
        }
    }
    alert(finalMessage);

    return supabaseSuccess;
};

// ========== PAGINAÇÃO ==========
window.adminCurrentPage = 1;
var isMobileForPagination = window.innerWidth <= 768;
window.adminItemsPerPage = isMobileForPagination ? 3 : 4;

function createPaginationControls(totalPages, currentPage, itemsPerPage) {
    itemsPerPage = itemsPerPage || null;
    var paginationDiv = document.createElement('div');
    
    var isDesktop = window.innerWidth > 768;
    var isMobile = window.innerWidth <= 768;
    
    if (isDesktop) {
        paginationDiv.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 0.4rem; margin: 0.5rem 0 0 0; flex-wrap: wrap; padding: 0.3rem 0.5rem;';
    } else {
        paginationDiv.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 0.3rem; margin: 0.8rem 0 0.3rem 0; flex-wrap: wrap; padding: 0.4rem 0.2rem; overflow-x: auto; -webkit-overflow-scrolling: touch;';
    }
    
    var currentItemsPerPage = itemsPerPage || (isMobile ? 3 : window.adminItemsPerPage || 4);
    var maxVisible = isMobile ? 5 : 8;
    
    var prevBtn = createNavButton('◀', currentPage === 1, function() { 
        if (currentPage > 1) window.loadPropertyList(currentPage - 1); 
    }, isDesktop);
    prevBtn.title = 'Página anterior';
    paginationDiv.appendChild(prevBtn);
    
    var pagesToShow = [];
    
    if (totalPages <= maxVisible) {
        for (var i = 1; i <= totalPages; i++) {
            pagesToShow.push(i);
        }
    } else {
        var halfVisible = Math.floor((maxVisible - 1) / 2);
        var startPage = Math.max(1, currentPage - halfVisible);
        var endPage = Math.min(totalPages, currentPage + halfVisible);
        
        if (currentPage <= halfVisible + 1) {
            endPage = Math.min(totalPages, maxVisible);
        }
        
        if (currentPage > totalPages - halfVisible) {
            startPage = Math.max(1, totalPages - maxVisible + 1);
        }
        
        if (endPage - startPage + 1 < maxVisible) {
            if (startPage === 1) {
                endPage = Math.min(totalPages, startPage + maxVisible - 1);
            } else if (endPage === totalPages) {
                startPage = Math.max(1, endPage - maxVisible + 1);
            }
        }
        
        for (var i = startPage; i <= endPage; i++) {
            pagesToShow.push(i);
        }
    }
    
    pagesToShow.forEach(function(pageNum) {
        var pageBtn = createPageButton(pageNum, currentPage, isDesktop);
        paginationDiv.appendChild(pageBtn);
    });
    
    var nextBtn = createNavButton('▶', currentPage === totalPages, function() { 
        if (currentPage < totalPages) window.loadPropertyList(currentPage + 1); 
    }, isDesktop);
    nextBtn.title = 'Próxima página';
    paginationDiv.appendChild(nextBtn);
    
    if (isMobile) {
        var pageIndicator = document.createElement('span');
        pageIndicator.textContent = currentPage + '/' + totalPages;
        pageIndicator.style.cssText = `
            font-size: 0.6rem;
            color: #666;
            padding: 0.2rem 0.5rem;
            background: #f0f0f0;
            border-radius: 10px;
            margin-left: 0.2rem;
            white-space: nowrap;
        `;
        paginationDiv.appendChild(pageIndicator);
    }
    
    var perPageSelect = createPerPageSelect(currentItemsPerPage, isDesktop);
    perPageSelect.title = 'Itens por página';
    paginationDiv.appendChild(perPageSelect);
    
    return paginationDiv;
}

function createNavButton(text, disabled, onClick, isDesktop) {
    isDesktop = isDesktop || false;
    var btn = document.createElement('button');
    btn.innerHTML = text;
    
    var padding = isDesktop ? '0.3rem 0.6rem' : '0.4rem 0.7rem';
    var fontSize = isDesktop ? '0.7rem' : '0.65rem';
    var minWidth = isDesktop ? '32px' : '28px';
    var height = isDesktop ? '32px' : '28px';
    
    btn.style.cssText = `
        background: ${disabled ? '#e9ecef' : '#1a5276'};
        color: ${disabled ? '#999' : 'white'};
        border: 1px solid ${disabled ? '#ddd' : '#0e3d5c'};
        padding: ${padding};
        border-radius: 4px;
        cursor: ${disabled ? 'not-allowed' : 'pointer'};
        font-size: ${fontSize};
        font-weight: 600;
        min-width: ${minWidth};
        height: ${height};
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        opacity: ${disabled ? '0.5' : '1'};
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    
    btn.disabled = disabled;
    if (!disabled) {
        btn.onclick = onClick;
        btn.onmouseenter = function() {
            this.style.background = '#0e3d5c';
            this.style.transform = 'scale(1.05)';
        };
        btn.onmouseleave = function() {
            this.style.background = '#1a5276';
            this.style.transform = 'scale(1)';
        };
        btn.onmousedown = function() {
            this.style.transform = 'scale(0.95)';
        };
        btn.onmouseup = function() {
            this.style.transform = 'scale(1.05)';
        };
    }
    return btn;
}

function createPageButton(pageNum, currentPage, isDesktop) {
    isDesktop = isDesktop || false;
    var btn = document.createElement('button');
    btn.textContent = pageNum;
    
    var isActive = pageNum === currentPage;
    var padding = isDesktop ? '0.3rem 0.6rem' : '0.3rem 0.5rem';
    var fontSize = isDesktop ? '0.75rem' : '0.65rem';
    var minWidth = isDesktop ? '32px' : '26px';
    var height = isDesktop ? '32px' : '26px';
    
    if (isActive) {
        btn.style.cssText = `
            background: #d4a017 !important;
            color: white !important;
            border: 1px solid #b8941f !important;
            padding: ${padding};
            border-radius: 4px;
            cursor: default;
            font-size: ${fontSize};
            font-weight: 700;
            min-width: ${minWidth};
            height: ${height};
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), 
                        inset 0 -1px 2px rgba(255,255,255,0.1),
                        0 1px 2px rgba(0,0,0,0.1) !important;
            transform: scale(0.95) !important;
            transition: all 0.15s ease;
            position: relative;
            top: 1px;
            pointer-events: none;
        `;
    } else {
        btn.style.cssText = `
            background: white;
            color: #1a5276;
            border: 1px solid #d1d8dd;
            padding: ${padding};
            border-radius: 4px;
            cursor: pointer;
            font-size: ${fontSize};
            font-weight: 400;
            min-width: ${minWidth};
            height: ${height};
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        `;
        
        btn.onmouseenter = function() {
            this.style.background = '#e8f4f8';
            this.style.borderColor = '#1a5276';
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 2px 8px rgba(26, 82, 118, 0.15)';
        };
        btn.onmouseleave = function() {
            this.style.background = 'white';
            this.style.borderColor = '#d1d8dd';
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        };
        btn.onmousedown = function() {
            this.style.transform = 'scale(0.95)';
            this.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1)';
        };
        btn.onmouseup = function() {
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 2px 8px rgba(26, 82, 118, 0.15)';
        };
        
        btn.onclick = function() { 
            window.loadPropertyList(pageNum); 
        };
    }
    
    btn.title = isActive ? 'Página atual: ' + pageNum : 'Ir para página ' + pageNum;
    
    return btn;
}

function createPerPageSelect(currentItemsPerPage, isDesktop) {
    isDesktop = isDesktop || false;
    var select = document.createElement('select');
    
    var padding = isDesktop ? '0.2rem 0.3rem' : '0.2rem 0.2rem';
    var fontSize = isDesktop ? '0.65rem' : '0.6rem';
    var marginLeft = isDesktop ? '0.3rem' : '0.2rem';
    
    select.style.cssText = `
        background: white;
        border: 1px solid #d1d8dd;
        padding: ${padding};
        border-radius: 4px;
        font-size: ${fontSize};
        margin-left: ${marginLeft};
        cursor: pointer;
        height: ${isDesktop ? '32px' : '26px'};
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #1a5276;
        font-weight: 500;
    `;
    
    select.innerHTML = `
        <option value="3" ${currentItemsPerPage === 3 ? 'selected' : ''}>3</option>
        <option value="4" ${currentItemsPerPage === 4 ? 'selected' : ''}>4</option>
        <option value="8" ${currentItemsPerPage === 8 ? 'selected' : ''}>8</option>
        <option value="12" ${currentItemsPerPage === 12 ? 'selected' : ''}>12</option>
    `;
    
    select.title = 'Itens por página';
    
    select.onchange = function(e) {
        var newValue = parseInt(e.target.value);
        if (!isNaN(newValue) && newValue > 0) {
            window.adminItemsPerPage = newValue;
            window.adminCurrentPage = 1;
            window.loadPropertyList(1);
        }
    };
    
    return select;
}

window.loadPropertyList = function(page) {
    page = page || window.adminCurrentPage;
    
    if (!window.properties || typeof window.properties.forEach !== 'function') {
        console.error('❌ window.properties não é um array válido');
        return;
    }
    
    var container = document.getElementById('propertyList');
    var countElement = document.getElementById('propertyCount');
    
    if (!container) return;
    
    var isMobile = window.innerWidth <= 768;
    var isDesktop = window.innerWidth > 768;
    var itemsPerPage = isMobile ? 3 : window.adminItemsPerPage;
    
    window.adminCurrentPage = page;
    
    var totalItems = window.properties.length;
    var totalPages = Math.ceil(totalItems / itemsPerPage);
    var startIndex = (page - 1) * itemsPerPage;
    var endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    var paginatedProperties = window.properties.slice(startIndex, endIndex);
    
    container.innerHTML = '';
    
    if (countElement) {
        countElement.textContent = totalItems;
    }
    
    if (totalItems === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Nenhum imóvel cadastrado</p>';
        return;
    }
    
    if (isDesktop) {
        container.style.maxHeight = 'none';
        container.style.overflowY = 'visible';
        container.style.paddingRight = '8px';
        container.style.paddingBottom = '0';
        container.style.marginBottom = '0';
    } else {
        container.style.maxHeight = '650px';
        container.style.overflowY = 'auto';
        container.style.paddingRight = '5px';
        container.style.paddingBottom = '20px';
    }
    
    var totalViews = window.getTotalGalleryViews ? window.getTotalGalleryViews() : 0;
    
    // BARRA DE SELEÇÃO MÚLTIPLA
    var selectionBar = document.createElement('div');
    selectionBar.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 0.4rem 0.8rem;
        border-radius: 8px;
        margin-bottom: 0.5rem;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.4rem;
    `;
    
    var selectionLeft = document.createElement('div');
    selectionLeft.style.cssText = 'display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem;';
    
    var selectAllContainer = document.createElement('label');
    selectAllContainer.style.cssText = 'display: flex; align-items: center; gap: 0.3rem; color: white; cursor: pointer; font-size: 0.7rem;';
    selectAllContainer.innerHTML = `
        <input type="checkbox" id="selectAllCheckbox" style="width: 13px; height: 13px; cursor: pointer;">
        <span><i class="fas fa-check-double" aria-hidden="true"></i> Selecionar Todos</span>
    `;
    selectionLeft.appendChild(selectAllContainer);
    
    var clearBtn = document.createElement('button');
    clearBtn.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i> Limpar';
    clearBtn.style.cssText = `
        background: rgba(255,255,255,0.2);
        color: white;
        border: none;
        padding: 0.15rem 0.5rem;
        border-radius: 20px;
        cursor: pointer;
        font-size: 0.65rem;
        transition: all 0.2s ease;
    `;
    clearBtn.onmouseenter = function() { clearBtn.style.background = 'rgba(255,255,255,0.3)'; };
    clearBtn.onmouseleave = function() { clearBtn.style.background = 'rgba(255,255,255,0.2)'; };
    clearBtn.onclick = function() { window.clearAllPropertiesSelection(); };
    selectionLeft.appendChild(clearBtn);
    
    var selectionRight = document.createElement('div');
    selectionRight.style.cssText = 'display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem;';
    
    var selectedCountSpan = document.createElement('span');
    selectedCountSpan.id = 'selectedCount';
    selectedCountSpan.style.cssText = `
        background: rgba(255,255,255,0.2);
        padding: 0.15rem 0.5rem;
        border-radius: 20px;
        font-size: 0.65rem;
        color: white;
        display: none;
    `;
    selectedCountSpan.innerHTML = '0';
    selectionRight.appendChild(selectedCountSpan);
    
    var generateLinkBtn = document.createElement('button');
    generateLinkBtn.id = 'generateShareLinkBtn';
    generateLinkBtn.innerHTML = '<i class="fas fa-share-alt" aria-hidden="true"></i> Link';
    generateLinkBtn.style.cssText = `
        background: #27ae60;
        color: white;
        border: none;
        padding: 0.2rem 0.7rem;
        border-radius: 30px;
        cursor: pointer;
        font-size: 0.7rem;
        font-weight: bold;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
    `;
    generateLinkBtn.onmouseenter = function() { generateLinkBtn.style.background = '#2ecc71'; };
    generateLinkBtn.onmouseleave = function() { generateLinkBtn.style.background = '#27ae60'; };
    generateLinkBtn.onclick = function() { window.generateShareLinkForSelected(); };
    selectionRight.appendChild(generateLinkBtn);
    
    selectionBar.appendChild(selectionLeft);
    selectionBar.appendChild(selectionRight);
    container.appendChild(selectionBar);
    
    // ESTATÍSTICAS
    var statsHeader = document.createElement('div');
    statsHeader.style.cssText = 'background: #e8f4fd; padding: 0.3rem; border-radius: 8px; margin-bottom: 0.4rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.3rem;';
    
    var statsContainer = document.createElement('div');
    statsContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.3rem;';
    
    var viewsSpan = document.createElement('span');
    viewsSpan.style.cssText = 'display: inline-flex; align-items: center; gap: 0.2rem; font-size: 0.6rem;';
    viewsSpan.innerHTML = '<i class="fas fa-eye" aria-hidden="true"></i> <strong>Views:</strong> ' + totalViews;
    statsContainer.appendChild(viewsSpan);
    
    var itemsSpan = document.createElement('span');
    itemsSpan.style.cssText = 'display: inline-flex; align-items: center; gap: 0.2rem; font-size: 0.6rem;';
    itemsSpan.innerHTML = '<i class="fas fa-building" aria-hidden="true"></i> <strong>Total:</strong> ' + totalItems;
    statsContainer.appendChild(itemsSpan);
    
    var showingSpan = document.createElement('span');
    showingSpan.style.cssText = 'display: inline-flex; align-items: center; gap: 0.2rem; font-size: 0.6rem;';
    showingSpan.innerHTML = '<i class="fas fa-list" aria-hidden="true"></i> <strong>Exibindo:</strong> ' + (startIndex + 1) + '-' + endIndex;
    statsContainer.appendChild(showingSpan);
    
    statsHeader.appendChild(statsContainer);
    container.appendChild(statsHeader);
    
    var listContainer = document.createElement('div');
    listContainer.id = 'propertyListItems';
    listContainer.style.cssText = 'margin: 0.2rem 0;';
    
    var defaultImage = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80';
    
    paginatedProperties.forEach(function(property) {
        var viewCount = window.getGalleryViews ? window.getGalleryViews(property.id) : 0;
        var lastView = window.getLastGalleryView ? window.getLastGalleryView(property.id) : null;
        
        var marketDays = window.calculateMarketTime(property);
        var marketStatus = window.getMarketStatus(marketDays);
        var marketTimeObj = window.formatMarketTime(marketDays);
        
        var firstImage = defaultImage;
        var isVideo = false;
        
        if (property.images && property.images !== 'EMPTY') {
            var imageUrls = property.images.split(',').filter(function(url) { return url && url.trim() !== ''; });
            if (imageUrls.length > 0) {
                firstImage = imageUrls[0];
                isVideo = window.SharedCore ? window.SharedCore.isVideoUrl(firstImage) : false;
            }
        }
        
        var isSelected = window.selectedProperties.has(property.id);
        
        var item = document.createElement('div');
        item.className = 'property-item';
        
        if (isDesktop) {
            item.style.cssText = 'background: ' + (isSelected ? '#e8f4fd' : '#f5f5f5') + '; padding: 0.3rem 0.5rem; margin: 0.2rem 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; border-left: 4px solid ' + (isSelected ? '#2196f3' : 'var(--primary)') + '; transition: all 0.3s ease;';
        } else {
            item.style.cssText = 'background: ' + (isSelected ? '#e8f4fd' : '#f5f5f5') + '; padding: 0.8rem; margin: 0.5rem 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-left: 4px solid ' + (isSelected ? '#2196f3' : 'var(--primary)') + '; transition: all 0.3s ease;';
        }
        
        var escapeTitle = window.SharedCore ? window.SharedCore.escapeHtml(property.title) : (property.title || '').replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
        
        var timeDisplayHtml = '';
        if (marketTimeObj.type === 'days') {
            timeDisplayHtml = '<strong style="font-size: ' + (isDesktop ? '0.8rem' : '1rem') + '; color: ' + marketStatus.color + ';">' + marketTimeObj.number + '</strong> <span style="font-size: 0.55rem;">' + marketTimeObj.unit + '</span>';
        } else if (marketTimeObj.type === 'months') {
            timeDisplayHtml = '<strong style="font-size: ' + (isDesktop ? '0.8rem' : '1rem') + '; color: ' + marketStatus.color + ';">' + marketTimeObj.number + '</strong> <span style="font-size: 0.55rem;">' + marketTimeObj.unit + '</span>';
            if (marketTimeObj.remainingDays) {
                timeDisplayHtml += ' e <strong style="font-size: ' + (isDesktop ? '0.7rem' : '0.9rem') + '; color: ' + marketStatus.color + ';">' + marketTimeObj.remainingDays + '</strong> <span style="font-size: 0.55rem;">' + (marketTimeObj.remainingDays !== 1 ? 'dias' : 'dia') + '</span>';
            }
        } else if (marketTimeObj.type === 'years') {
            timeDisplayHtml = '<strong style="font-size: ' + (isDesktop ? '0.8rem' : '1rem') + '; color: ' + marketStatus.color + ';">' + marketTimeObj.number + '</strong> <span style="font-size: 0.55rem;">' + marketTimeObj.unit + '</span>';
            if (marketTimeObj.remainingMonths) {
                timeDisplayHtml += ' e <strong style="font-size: ' + (isDesktop ? '0.7rem' : '0.9rem') + '; color: ' + marketStatus.color + ';">' + marketTimeObj.remainingMonths + '</strong> <span style="font-size: 0.55rem;">' + (marketTimeObj.remainingMonths !== 1 ? 'meses' : 'mês') + '</span>';
            }
        }
        
        var titleFontSize = isDesktop ? '0.75rem' : '0.9rem';
        var priceFontSize = isDesktop ? '0.6rem' : '0.75rem';
        var indicatorFontSize = isDesktop ? '0.5rem' : '0.65rem';
        var iconFontSize = isDesktop ? '0.6rem' : '0.8rem';
        
        // badge1 e badge2 no admin list
        var badgesDisplay = '';
        if (property.badge1 && property.badge1 !== 'Nenhum') {
            badgesDisplay += '<span style="background:#e74c3c; color:white; padding:0.08rem 0.3rem; border-radius:3px; font-size:' + indicatorFontSize + ';">' + property.badge1 + '</span> ';
        }
        if (property.badge2 && property.badge2 !== 'Nenhum') {
            badgesDisplay += '<span style="background:#3498db; color:white; padding:0.08rem 0.3rem; border-radius:3px; font-size:' + indicatorFontSize + ';">' + property.badge2 + '</span>';
        }
        
        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0;">
                <input type="checkbox" 
                       class="property-select-checkbox" 
                       data-property-id="${property.id}"
                       ${isSelected ? 'checked' : ''}
                       style="width: 13px; height: 13px; cursor: pointer;"
                       onchange="window.togglePropertySelection(${property.id}, this)">
            </div>
            <div style="flex-shrink: 0; width: 40px; height: 40px; border-radius: 4px; overflow: hidden; background: #2c3e50; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.1);" 
                 onclick="if(window.openGalleryAtCurrentIndex) window.openGalleryAtCurrentIndex(${property.id})"
                 title="Clique para abrir galeria">
                ${isVideo ? `
                    <div style="position: relative; width: 100%; height: 100%; background: linear-gradient(135deg, #1a5276, #2c3e50); display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-video" style="font-size: 0.9rem; color: rgba(255,255,255,0.8);" aria-hidden="true"></i>
                    </div>
                ` : `
                    <img src="${firstImage}" 
                         loading="lazy"
                         style="width: 100%; height: 100%; object-fit: cover;"
                         alt="${escapeTitle}"
                         onerror="this.src='${defaultImage}'; this.onerror=null;">
                `}
            </div>
            <div style="flex: 3; min-width: 140px;">
                <strong style="color: var(--primary); font-size: ${titleFontSize}; display: block; margin-bottom: 0.1rem;">
                    ${escapeTitle}
                </strong>
                <div style="display: flex; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 0.1rem;">
                    <small style="background: #e9ecef; padding: 0.08rem 0.3rem; border-radius: 3px; font-size: ${priceFontSize};">
                        <i class="fas fa-tag" aria-hidden="true"></i> ${property.price}
                    </small>
                    <small style="background: #e9ecef; padding: 0.08rem 0.3rem; border-radius: 3px; font-size: ${priceFontSize};">
                        <i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${property.location.substring(0, 30)}${property.location.length > 30 ? '...' : ''}
                    </small>
                </div>
                <div style="font-size: ${indicatorFontSize}; color: #666; display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.05rem;">
                    <span style="background: #e9ecef; padding: 0.08rem 0.3rem; border-radius: 3px;">
                        <i class="fas fa-id-card" aria-hidden="true"></i> ${property.id}
                    </span>
                    <span style="background: #e9ecef; padding: 0.08rem 0.3rem; border-radius: 3px;">
                        <i class="fas fa-images" aria-hidden="true"></i> ${property.images ? property.images.split(',').filter(function(i) { return i && i.trim() && i !== 'EMPTY'; }).length : 0}
                    </span>
                    ${property.pdfs && property.pdfs !== 'EMPTY' ? `
                        <span style="background: #e9ecef; padding: 0.08rem 0.3rem; border-radius: 3px;">
                            <i class="fas fa-file-pdf" aria-hidden="true"></i> ${property.pdfs.split(',').filter(function(p) { return p && p.trim() && p !== 'EMPTY'; }).length}
                        </span>
                    ` : ''}
                    <span style="background: #e3f2fd; padding: 0.08rem 0.3rem; border-radius: 3px;">
                        <i class="fas fa-eye" style="color: #1976d2;" aria-hidden="true"></i>
                        <strong style="color: #1976d2;">${viewCount}</strong>
                    </span>
                    ${lastView ? `
                        <span style="background: #f3e5f5; padding: 0.08rem 0.3rem; border-radius: 3px;">
                            <i class="fas fa-clock" style="color: #7b1fa2;" aria-hidden="true"></i>
                            <strong style="color: #7b1fa2;">${new Date(lastView).toLocaleDateString('pt-BR')}</strong>
                        </span>
                    ` : ''}
                    <span style="background: ${marketStatus.bg}; padding: 0.08rem 0.3rem; border-radius: 3px; display: inline-flex; align-items: center; gap: 0.1rem;">
                        <i class="fas ${marketStatus.icon}" style="color: ${marketStatus.iconColor}; font-size: ${iconFontSize};" aria-hidden="true"></i>
                        <strong style="color: ${marketStatus.color};">Tempo:</strong>
                        <span style="color: ${marketStatus.color};">${marketStatus.text}</span>
                        <span style="display: inline-flex; align-items: baseline; gap: 0.05rem;">
                            ${timeDisplayHtml}
                        </span>
                    </span>
                    ${badgesDisplay ? `
                        <span style="background: #fce4ec; padding: 0.08rem 0.3rem; border-radius: 3px; display: inline-flex; align-items: center; gap: 0.1rem;">
                            <i class="fas fa-tags" style="color: #c0392b; font-size: ${iconFontSize};" aria-hidden="true"></i>
                            ${badgesDisplay}
                        </span>
                    ` : ''}
                </div>
            </div>
            <div style="display: flex; gap: 0.25rem; flex-wrap: wrap; flex-shrink: 0;">
                <button onclick="editProperty(${property.id})" 
                        style="background: var(--accent); color: white; border: none; padding: 0.2rem 0.45rem; border-radius: 3px; cursor: pointer; font-size: 0.6rem;">
                    <i class="fas fa-edit" aria-hidden="true"></i> Editar
                </button>
                <button onclick="if(window.resetGalleryViews) window.resetGalleryViews(${property.id}, '${escapeTitle.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')" 
                        style="background: #e67e22; color: white; border: none; padding: 0.2rem 0.45rem; border-radius: 3px; cursor: pointer; font-size: 0.6rem;">
                    <i class="fas fa-eye-slash" aria-hidden="true"></i> Zerar
                </button>
                <button onclick="deleteProperty(${property.id})" 
                        style="background: #e74c3c; color: white; border: none; padding: 0.2rem 0.45rem; border-radius: 3px; cursor: pointer; font-size: 0.6rem;">
                    <i class="fas fa-trash" aria-hidden="true"></i> Excluir
                </button>
            </div>
        `;
        listContainer.appendChild(item);
    });
    
    container.appendChild(listContainer);
    
    if (totalPages > 1) {
        var paginationWrapper = document.createElement('div');
        paginationWrapper.style.cssText = isDesktop ? 'margin-top: 0.1rem; padding-top: 0.05rem; border-top: 1px solid #e0e0e0; margin-bottom: 0; padding-bottom: 0;' : 'margin-top: 1rem; padding-top: 0.5rem; border-top: 1px solid #e0e0e0;';
        var paginationBottom = createPaginationControls(totalPages, page, itemsPerPage);
        paginationWrapper.appendChild(paginationBottom);
        container.appendChild(paginationWrapper);
    }
    
    var selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.onclick = function(e) {
            if (e.target.checked) {
                window.selectAllProperties();
            } else {
                window.clearAllPropertiesSelection();
            }
        };
    }
    
    updateSelectionCounter();
};

// ========== INICIALIZAÇÃO ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        window.runLowPriority(function() {
            window.loadPropertiesData();
            window.runLowPriority(function() { window.setupFilters(); });
        });
    });
} else {
    window.runLowPriority(function() {
        window.loadPropertiesData();
        window.runLowPriority(function() { window.setupFilters(); });
    });
}

// =============================================
// FIM DO ARQUIVO - properties.js v3.6
// ============================================
// STATUS: ✅ COMPLETO E FUNCIONAL
// Versão: 3.6
// Última atualização: 2026-08-10
// ✅ CORRIGIDO: getInitialProperties restaurada
// ✅ CORRIGIDO: filterPropertiesByType retorna array sempre
// ✅ CORRIGIDO: renderProperties com verificações de segurança
// ✅ NOVO: badge1 e badge2 no addNewProperty
// ✅ NOVO: badge1 e badge2 no updateProperty
// ✅ NOVO: badge1 e badge2 no loadPropertiesData (garantia)
// ✅ NOVO: badge1 e badge2 nos dados de exemplo
// ✅ REFATORADO: Correção de URLs delegada ao ImageUtils
// ✅ OTIMIZADO: Cache delegado ao TemplateCache
// ✅ CISÃO A: Filtros delegados ao FilterManager
// ✅ SRP: Responsabilidade única (CRUD + Estado + Renderização)
// ============================================
