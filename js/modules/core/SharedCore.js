// js/modules/core/SharedCore.js - VERSÃO ATUALIZADA (FUNÇÕES NÃO UTILIZADAS REMOVIDAS)
console.log('🔧 SharedCore.js carregado - Versão Otimizada (funções não utilizadas removidas)');

// ========== CONFIGURAÇÃO CENTRAL DO SISTEMA ==========
window.SYSTEM_CONFIG = window.SYSTEM_CONFIG || {
    version: '2.0.0',
    supportBaseUrl: 'https://wlimoveis.github.io/weberlessa-support/',
    supportModules: [
        'debug/ui/loading-manager.js',
        'debug/ui/media-ui-full.js',
        'debug/core/diagnostic-registry.js',
        'performance/performance-system.js',
        'debug/utils/core-diagnostics.js',
        'debug/utils/storage-diagnostics.js',
        'debug/utils/gallery-diagnostics.js',
        'debug/templates/property-template.js', 
        'debug/ui/location-autocomplete.js',
        'debug/utils/admin-diagnostics.js',
        'debug/utils/core-utilities.js',
        'debug/diagnostics/diagnostics53.js',
        'debug/diagnostics/diagnostics54.js',
        'debug/diagnostics/diagnostics55.js',
        'debug/diagnostics/diagnostics56.js',
        'debug/diagnostics/diagnostics57.js',
        'debug/diagnostics/diagnostics58.js',
        'debug/diagnostics/diagnostics59.js',
        'debug/diagnostics/diagnostics60.js',
        'debug/diagnostics/diagnostics61.js',
        'debug/diagnostics/diagnostics62.js',
        'debug/diagnostics/diagnostics63.js',
        'debug/diagnostics/diagnostics64.js',
        'debug/function-verifier.js',
        'debug/media-logger.js',
        'debug/media-recovery.js', 
        'debug/pdf-logger.js',
        'debug/utils/media-debug.js',
        'debug/filters/filter-fallbacks.js',
        'debug/events/event-manager.js',
        'debug/duplication-checker.js',
        'debug/emergency-recovery.js',
        'debug/validation.js',
        'debug/validation-essentials.js',
        'debug/simple-checker.js',
        'debug/media-migration-check.js',
        'debug/migration-cleanup.js'
    ],
    getSupportUrl: function(modulePath) {
        return this.supportBaseUrl + modulePath + (this.version ? `?v=${this.version}` : '');
    },
    shouldLoadSupport: function() {
        return window.location.search.includes('debug=true') || 
               window.location.search.includes('test=true') ||
               window.location.hostname.includes('localhost') ||
               window.location.hostname.includes('127.0.0.1');
    }
};

console.log('⚙️ [CONFIG] SYSTEM_CONFIG carregado. Support URL:', window.SYSTEM_CONFIG.supportBaseUrl);
console.log('📦 [CONFIG] Total de módulos:', window.SYSTEM_CONFIG.supportModules.length);

// ========== CONSTANTES SUPABASE FIXAS ==========
if (typeof SUPABASE_CONSTANTS === 'undefined') {
    const SUPABASE_CONSTANTS = {
        URL: 'https://wxdiowpswepsvklumgvx.supabase.co',
        KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4ZGlvd3Bzd2Vwc3ZrbHVtZ3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MTExNzksImV4cCI6MjA4Nzk4NzE3OX0.QsUHE_w5m5-pz3LcwdREuwmwvCiX3Hz8FYv8SAwhD6U',
        ADMIN_PASSWORD: "wl654",
        PDF_PASSWORD: "doc123"
    };
    window.SUPABASE_CONSTANTS = SUPABASE_CONSTANTS;
    console.log('✅ SUPABASE_CONSTANTS definido por SharedCore');
} else {
    console.log('✅ SUPABASE_CONSTANTS já definido por outro módulo');
}

Object.entries(window.SUPABASE_CONSTANTS).forEach(([key, value]) => {
    if (typeof window[key] === 'undefined' || window[key] === 'undefined') {
        window[key] = value;
        console.log(`✅ ${key} definida:`, key.includes('KEY') ? '✅ Disponível' : value.substring(0, 50) + '...');
    }
});

const SharedCore = (function() {
    // ========== PERFORMANCE ESSENCIAIS ==========
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // ========== VALIDAÇÕES ==========
    const isMobileDevice = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
            .test(navigator.userAgent);
    };

    // ========== MANIPULAÇÃO DE STRINGS ==========
    const formatPrice = (price) => {
        if (!price && price !== 0) return 'R$ 0,00';
        
        if (typeof price === 'string' && price.includes('R$')) {
            return price;
        }
        
        const numericPrice = parseFloat(price.toString().replace(/[^0-9,-]/g, '').replace(',', '.'));
        
        if (isNaN(numericPrice)) return 'R$ 0,00';
        
        return numericPrice.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // ========== FUNÇÕES DE FEATURES E VIDEO - PROXY PURO ==========
    const formatFeaturesForDisplay = function(features) {
        if (window.SupportCoreUtils?.formatFeaturesForDisplay) {
            return window.SupportCoreUtils.formatFeaturesForDisplay(features);
        }
        if (!features) return '';
        try {
            if (Array.isArray(features)) return features.filter(f => f && f.trim()).join(', ');
            if (typeof features === 'string') {
                let cleaned = features.replace(/^\[|\]$/g, '').replace(/"/g, '');
                return cleaned.split(',').map(f => f.trim()).filter(f => f).join(', ');
            }
            return features.toString();
        } catch (error) {
            return '';
        }
    };
    
    const parseFeaturesForStorage = function(value) {
        if (window.SupportCoreUtils?.parseFeaturesForStorage) {
            return window.SupportCoreUtils.parseFeaturesForStorage(value);
        }
        if (!value) return '[]';
        try {
            if (Array.isArray(value)) return JSON.stringify(value.filter(f => f && f.trim()));
            if (typeof value === 'string') {
                if (value.trim().startsWith('[')) return value;
                const featuresArray = value.split(',').map(f => f.trim()).filter(f => f);
                return JSON.stringify(featuresArray);
            }
            return '[]';
        } catch (error) {
            return '[]';
        }
    };
    
    const ensureBooleanVideo = function(videoValue) {
        if (window.SupportCoreUtils?.ensureBooleanVideo) {
            return window.SupportCoreUtils.ensureBooleanVideo(videoValue);
        }
        if (videoValue === undefined || videoValue === null) return false;
        if (typeof videoValue === 'boolean') return videoValue;
        if (typeof videoValue === 'string') {
            const lower = videoValue.toLowerCase().trim();
            if (lower === 'true' || lower === '1' || lower === 'sim') return true;
            if (lower === 'false' || lower === '0' || lower === 'não') return false;
        }
        if (typeof videoValue === 'number') return videoValue === 1;
        return Boolean(videoValue);
    };
    
    // ========== UTILITÁRIOS GLOBAIS CENTRALIZADOS ==========
    const escapeHtml = function(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;');
    };

    const isVideoUrl = function(url) {
        if (!url) return false;
        const urlLower = url.toLowerCase();
        return urlLower.includes('.mp4') || 
               urlLower.includes('.mov') || 
               urlLower.includes('.webm') || 
               urlLower.includes('.avi') ||
               urlLower.includes('video/');
    };
    
    // ========== EXTRAÇÃO DE BAIRRO - CENTRALIZADO ==========
    const extractBairroFromLocation = function(location) {
        if (!location || typeof location !== 'string') return null;
        
        const locationClean = location.trim();
        
        const bairrosConhecidos = [
            'Pajuçara', 'Ponta Verde', 'Jatiúca', 'Jacarecica', 'Cruz das Almas',
            'Mangabeiras', 'Poço', 'Barro Duro', 'Gruta de Lourdes', 'Serraria',
            'Farol', 'Jardim Petrópolis', 'Centro', 'Prado', 'Jaraguá', 'Feitosa',
            'Pinheiro', 'Santa Lúcia', 'Santa Amélia', 'Tabuleiro do Martins',
            'Cidade Universitária', 'Clima Bom', 'Benedito Bentes', 'Santos Dumont',
            'São Jorge', 'Levada', 'Trapiche da Barra', 'Vergel do Lago',
            'Ouro Preto', 'Mutange', 'Fernão Velho', 'Forene', 'Rio Novo', 
            'Riacho Doce', 'Pontal da Barra', 'Guaxuma', 'Ipioca', 'Garça Torta',
            'Pescaria', 'Ponta da Terra', 'Murilopes', 'Zona Rural', 'Barra',
            'Barra de São Miguel', 'São Miguel dos Milagres', 'Boa Viagem'
        ];
        
        for (const b of bairrosConhecidos) {
            const regex = new RegExp(`\\b${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(locationClean)) {
                return b;
            }
        }
        
        if (locationClean.includes(',')) {
            const parts = locationClean.split(',');
            if (parts.length >= 2) {
                let possibleBairro = parts[1].trim();
                possibleBairro = possibleBairro.replace(/Maceió\/AL/i, '').replace(/AL$/i, '').replace(/-.*$/, '').trim();
                if (possibleBairro.length > 0 && possibleBairro.length < 50) {
                    possibleBairro = possibleBairro.split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    ).join(' ');
                    return possibleBairro;
                }
            }
        }
        
        if (locationClean.toLowerCase().includes('rural') || 
            locationClean.toLowerCase().includes('zona rural')) {
            return 'Zona Rural';
        }
        
        return null;
    };
    
    // ========== FUNÇÕES DE VALIDAÇÃO ==========
    const validateIdForSupabase = function(propertyId) {
        if (window.SupportCoreUtils?.validateIdForSupabase) {
            return window.SupportCoreUtils.validateIdForSupabase(propertyId);
        }
        if (!propertyId) return null;
        const num = Number(propertyId);
        return !isNaN(num) && num > 0 ? num : null;
    };
    
    const manageEditingState = function(id = null) {
        if (window.SupportCoreUtils?.manageEditingState) {
            return window.SupportCoreUtils.manageEditingState(id);
        }
        if (id === null) {
            window.editingPropertyId = null;
            return null;
        }
        window.editingPropertyId = id;
        return id;
    };

    const truncateText = (text, maxLength = 100) => {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    // ========== SISTEMA DE FORMATAÇÃO UNIFICADO DE PREÇO ==========
    const PriceFormatter = {
        formatNumberWithSeparators: function(number) {
            if (isNaN(number) || !number) return '0';
            const intNumber = Math.floor(Number(number));
            let formatted = intNumber.toLocaleString('pt-BR', {
                useGrouping: true,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
            if (formatted.includes('.')) return formatted;
            const numStr = intNumber.toString();
            const parts = [];
            for (let i = numStr.length; i > 0; i -= 3) {
                const start = Math.max(0, i - 3);
                parts.unshift(numStr.substring(start, i));
            }
            return parts.join('.');
        },

        formatForInput: function(value) {
            if (!value && value !== 0) return '';
            if (typeof value === 'string' && value.includes('R$')) {
                const numbersOnly = value.replace(/\D/g, '');
                if (numbersOnly === '') return value;
                const numericValue = parseInt(numbersOnly);
                if (isNaN(numericValue)) return value;
                return 'R$ ' + this.formatNumberWithSeparators(numericValue);
            }
            const numbersOnly = value.toString().replace(/\D/g, '');
            if (numbersOnly === '') return '';
            const numericValue = parseInt(numbersOnly);
            if (isNaN(numericValue)) return '';
            return 'R$ ' + this.formatNumberWithSeparators(numericValue);
        },
        
        extractNumbers: function(formattedPrice) {
            if (!formattedPrice) return '';
            return formattedPrice.toString().replace(/\D/g, '');
        },
        
        formatForDisplay: function(value) {
            if (!value && value !== 0) return 'R$ 0,00';
            if (typeof value === 'string' && value.includes('R$') && value.includes(',')) return value;
            const numbersOnly = value.toString().replace(/\D/g, '');
            const numericValue = parseInt(numbersOnly) || 0;
            return numericValue.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        },

        formatForCard: function(value, forceFormat = false) {
            if (!value && value !== 0) return 'R$ 0,00';
            if (!forceFormat && typeof value === 'string' && value.includes('R$')) return value;
            const numbersOnly = value.toString().replace(/[^0-9,-]/g, '').replace(',', '.');
            const numericValue = parseFloat(numbersOnly) || 0;
            return numericValue.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        },

        formatForAdmin: function(value) {
            return this.formatForInput(value);
        },
        
        setupAutoFormat: function(inputElement) {
            if (!inputElement || inputElement.tagName !== 'INPUT') return;
            if (inputElement.value && !inputElement.value.startsWith('R$')) {
                inputElement.value = this.formatForInput(inputElement.value);
            }
            inputElement.addEventListener('input', (e) => {
                if (e.inputType === 'deleteContentBackward' || 
                    e.inputType === 'deleteContentForward' ||
                    e.inputType === 'deleteByCut') {
                    return;
                }
                const cursorPos = e.target.selectionStart;
                const originalValue = e.target.value;
                e.target.value = this.formatForInput(e.target.value);
                const diff = e.target.value.length - originalValue.length;
                e.target.setSelectionRange(cursorPos + diff, cursorPos + diff);
            });
            inputElement.addEventListener('blur', (e) => {
                if (e.target.value && !e.target.value.startsWith('R$')) {
                    e.target.value = this.formatForInput(e.target.value);
                }
            });
        }
    };

    // ========== UTILITÁRIO DE CARREGAMENTO DE IMAGENS ==========
    const ImageLoader = {
        waitForCriticalImages: async function(selectors = ['.hero img', '.property-image img'], maxWait = 3000) {
            const images = [];
            selectors.forEach(selector => {
                images.push(...document.querySelectorAll(selector));
            });
            const limitedImages = images.slice(0, 8);
            if (limitedImages.length === 0) return 0;
            return new Promise((resolve) => {
                let loaded = 0;
                limitedImages.forEach(img => {
                    if (img.complete || img.tagName === 'I') {
                        loaded++;
                    } else {
                        img.onload = img.onerror = () => {
                            loaded++;
                            if (loaded >= limitedImages.length) resolve(loaded);
                        };
                    }
                });
                if (loaded >= limitedImages.length) {
                    resolve(loaded);
                } else {
                    setTimeout(() => resolve(loaded), maxWait);
                }
            });
        }
    };

    // ========== DOM UTILITIES ==========
    const elementExists = (id) => {
        return document.getElementById(id) !== null;
    };

    const createElement = (tag, attributes = {}, children = []) => {
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key.startsWith('on')) {
                element[key.toLowerCase()] = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
        return element;
    };

    // ========== LOGGING SISTEMÁTICO ==========
    const logModule = (moduleName, message, level = 'info', data = null) => {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}] [${moduleName.toUpperCase()}]`;
        const levels = {
            info: () => console.log(`${prefix} ℹ️ ${message}`, data || ''),
            warn: () => console.warn(`${prefix} ⚠️ ${message}`, data || ''),
            error: () => console.error(`${prefix} ❌ ${message}`, data || ''),
            success: () => console.log(`${prefix} ✅ ${message}`, data || ''),
            debug: () => console.debug(`${prefix} 🔍 ${message}`, data || '')
        };
        (levels[level] || levels.info)();
    };

    // ========== SUPABASE ESSENCIAL ==========
    const supabaseFetch = async (endpoint, options = {}) => {
        try {
            const SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
            const SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
            const proxyUrl = 'https://corsproxy.io/?';
            const targetUrl = `${SUPABASE_URL}/rest/v1${endpoint}`;
            const finalUrl = proxyUrl + encodeURIComponent(targetUrl);
            console.log(`📡 Supabase fetch: ${endpoint}`);
            const response = await fetch(finalUrl, {
                method: options.method || 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            if (!response.ok) {
                return { ok: false, data: [], error: `HTTP ${response.status}: ${response.statusText}` };
            }
            const data = await response.json();
            return { ok: true, data: data, count: Array.isArray(data) ? data.length : 1 };
        } catch (error) {
            return { ok: false, data: [], error: error.message };
        }
    };

    // ========== VALIDAÇÃO DE DADOS ==========
    const validateProperty = (propertyData) => {
        const errors = [];
        if (!propertyData?.title?.trim()) errors.push('Título é obrigatório');
        if (!propertyData?.price?.trim()) errors.push('Preço é obrigatório');
        if (!propertyData?.location?.trim()) errors.push('Localização é obrigatória');
        return { isValid: errors.length === 0, errors, hasErrors: errors.length > 0 };
    };

    // ========== MANIPULAÇÃO DE ARRAYS ==========
    const arrayUtils = {
        findDuplicates: (array, key) => {
            const seen = new Set();
            const duplicates = [];
            array.forEach(item => {
                const value = key ? item[key] : item;
                if (seen.has(value)) {
                    duplicates.push(item);
                } else {
                    seen.add(value);
                }
            });
            return duplicates;
        },
        sortByKey: (array, key, ascending = true) => {
            return [...array].sort((a, b) => {
                const aVal = a[key];
                const bVal = b[key];
                if (aVal < bVal) return ascending ? -1 : 1;
                if (aVal > bVal) return ascending ? 1 : -1;
                return 0;
            });
        }
    };

    const generateUniqueId = (prefix = 'id') => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 9);
        return `${prefix}_${timestamp}_${random}`;
    };

    const sanitizeText = (text, maxLength = null) => {
        if (!text) return '';
        let sanitized = text.toString()
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        if (maxLength && sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength - 3) + '...';
        }
        return sanitized;
    };

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('❌ Erro ao copiar:', err);
            return false;
        }
    };

    // ========== API PÚBLICA ==========
    return {
        // Performance
        debounce,
        
        // Validações
        isMobileDevice,
        validateProperty,
        
        // Formatação
        formatPrice,
        truncateText,
        
        // Features e Video (Proxy)
        formatFeaturesForDisplay,
        parseFeaturesForStorage,
        ensureBooleanVideo,
        
        // Extração de Bairro
        extractBairroFromLocation,
        
        // Validação de ID e Estado
        validateIdForSupabase,
        manageEditingState,
        
        // Utilitários centralizados
        escapeHtml,
        isVideoUrl,
        
        // Formatação de Preço
        PriceFormatter,
        formatPriceForInput: PriceFormatter.formatForInput.bind(PriceFormatter),
        getPriceNumbersOnly: PriceFormatter.extractNumbers.bind(PriceFormatter),
        setupPriceAutoFormat: function() {
            const priceField = document.getElementById('propPrice');
            if (priceField) PriceFormatter.setupAutoFormat(priceField);
        },
        
        // Utilitários de Mídia
        ImageLoader,
        
        // DOM
        elementExists,
        createElement,
        
        // Logging e Dados
        logModule,
        supabaseFetch,
        arrayUtils,
        
        // Utilitários Gerais
        copyToClipboard,
        generateUniqueId,
        sanitizeText,
        delay,
        
        // Constantes
        SUPABASE_CONSTANTS: window.SUPABASE_CONSTANTS
    };
})();

window.SharedCore = SharedCore;

// ========== COMPATIBILIDADE GLOBAL ==========
(function setupGlobalCompatibility() {
    console.log('🔗 Configurando compatibilidade global...');
    
    if (typeof window.formatPrice === 'undefined') {
        window.formatPrice = function(value) {
            return SharedCore.PriceFormatter.formatForCard(value);
        };
    }
    
    if (typeof window.formatPriceForInput === 'undefined') {
        window.formatPriceForInput = function(value) {
            return SharedCore.PriceFormatter.formatForInput(value);
        };
    }
    
    if (typeof window.formatFeaturesForDisplay === 'undefined') {
        window.formatFeaturesForDisplay = function(features) {
            return SharedCore.formatFeaturesForDisplay(features);
        };
    }
    
    if (typeof window.parseFeaturesForStorage === 'undefined') {
        window.parseFeaturesForStorage = function(value) {
            return SharedCore.parseFeaturesForStorage(value);
        };
    }
    
    if (typeof window.ensureBooleanVideo === 'undefined') {
        window.ensureBooleanVideo = function(videoValue) {
            return SharedCore.ensureBooleanVideo(videoValue);
        };
    }
    
    if (typeof window.extractBairroFromLocation === 'undefined') {
        window.extractBairroFromLocation = function(location) {
            return SharedCore.extractBairroFromLocation(location);
        };
    }
    
    if (typeof window.validateIdForSupabase === 'undefined') {
        window.validateIdForSupabase = function(propertyId) {
            return SharedCore.validateIdForSupabase(propertyId);
        };
    }
    
    if (typeof window.manageEditingState === 'undefined') {
        window.manageEditingState = function(id) {
            return SharedCore.manageEditingState(id);
        };
    }
    
    if (typeof window.escapeHtml === 'undefined') {
        window.escapeHtml = function(str) {
            return SharedCore.escapeHtml(str);
        };
    }
    
    if (typeof window.isVideoUrl === 'undefined') {
        window.isVideoUrl = function(url) {
            return SharedCore.isVideoUrl(url);
        };
    }
    
    console.log('✅ Compatibilidade global configurada');
})();

function initializeGlobalCompatibility() {
    console.log('🔗 Inicializando compatibilidade global...');
    
    const globalExports = {
        debounce: SharedCore.debounce,
        isMobileDevice: SharedCore.isMobileDevice,
        formatPrice: SharedCore.formatPrice,
        truncateText: SharedCore.truncateText,
        formatFeaturesForDisplay: SharedCore.formatFeaturesForDisplay,
        parseFeaturesForStorage: SharedCore.parseFeaturesForStorage,
        ensureBooleanVideo: SharedCore.ensureBooleanVideo,
        extractBairroFromLocation: SharedCore.extractBairroFromLocation,
        validateIdForSupabase: SharedCore.validateIdForSupabase,
        manageEditingState: SharedCore.manageEditingState,
        formatPriceForInput: SharedCore.formatPriceForInput,
        getPriceNumbersOnly: SharedCore.getPriceNumbersOnly,
        setupPriceAutoFormat: SharedCore.setupPriceAutoFormat,
        elementExists: SharedCore.elementExists,
        logModule: SharedCore.logModule,
        supabaseFetch: SharedCore.supabaseFetch,
        copyToClipboard: SharedCore.copyToClipboard,
        escapeHtml: SharedCore.escapeHtml,
        isVideoUrl: SharedCore.isVideoUrl,
        generateUniqueId: SharedCore.generateUniqueId,
        sanitizeText: SharedCore.sanitizeText,
        delay: SharedCore.delay
    };
    
    Object.entries(globalExports).forEach(([name, func]) => {
        if (typeof window[name] === 'undefined' && typeof func === 'function') {
            window[name] = func;
        }
    });
    
    console.log(`✅ ${Object.keys(globalExports).length} funções disponíveis globalmente`);
}

document.addEventListener('DOMContentLoaded', function() {
    initializeGlobalCompatibility();
    setTimeout(() => {
        const priceField = document.getElementById('propPrice');
        if (priceField && window.SharedCore?.PriceFormatter) {
            window.SharedCore.PriceFormatter.setupAutoFormat(priceField);
            console.log('✅ Formatação automática de preço configurada');
        }
    }, 800);
});

setTimeout(() => {
    console.group('🧪 VALIDAÇÃO DO SHAREDCORE');
    
    const essentialFunctions = [
        'debounce', 'formatPrice', 'supabaseFetch', 'elementExists', 
        'isMobileDevice', 'copyToClipboard', 'logModule', 'validateProperty',
        'escapeHtml', 'isVideoUrl', 'extractBairroFromLocation'
    ];
    
    let allAvailable = true;
    essentialFunctions.forEach(func => {
        const available = typeof window[func] === 'function';
        console.log(`${available ? '✅' : '❌'} ${func} disponível`);
        if (!available) allAvailable = false;
    });
    
    const essentialConstants = ['SUPABASE_URL', 'SUPABASE_KEY', 'ADMIN_PASSWORD', 'PDF_PASSWORD'];
    essentialConstants.forEach(constant => {
        const exists = window[constant] !== undefined;
        console.log(`${exists ? '✅' : '❌'} ${constant} definida`);
        if (!exists) allAvailable = false;
    });
    
    console.log(allAvailable ? '🎪 SHAREDCORE VALIDADO' : '⚠️ VERIFICAÇÃO REQUERIDA');
    console.groupEnd();
}, 2000);

console.log(`✅ SharedCore.js pronto - Versão otimizada (funções não utilizadas removidas)`);
