// ============================================================
// js/modules/utils/image-utils.js
// UTILITÁRIOS DE IMAGEM - CORREÇÃO DE URLs E FALLBACK
// ============================================================
// ✅ Responsabilidade Única: Manipulação de URLs de imagens
// ✅ Correção de domínios (auto-recuperação)
// ✅ Fallback para imagens quebradas
// ✅ Detecção de URLs válidas
// ✅ Independência total do Support System
// ============================================================

console.log('🖼️ image-utils.js carregado - Utilitários de Imagem');

(function() {
    'use strict';

    // ========== CONFIGURAÇÃO ==========
    var CONFIG = {
        supabaseDomain: 'wxdiowpswepsvklumgvx.supabase.co',
        supabaseUrl: 'https://wxdiowpswepsvklumgvx.supabase.co',
        bucket: 'properties',
        fallbackImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        oldDomains: ['syztbxvpdaplpetmixmt.supabase.co', 'wlimoveis.supabase.co']
    };

    // ========== FUNÇÃO PRINCIPAL: CORRIGIR URL ==========
    /**
     * CORRIGE UMA URL COM DOMÍNIO ANTIGO
     * @param {string} url - URL a ser corrigida
     * @returns {string} URL corrigida
     */
    function fixUrl(url) {
        if (!url || typeof url !== 'string') return url;
        if (url === 'EMPTY' || url.trim() === '') return url;

        // Se já tem o domínio correto, retorna
        if (url.indexOf(CONFIG.supabaseDomain) !== -1) return url;

        // Substituir domínios antigos
        for (var i = 0; i < CONFIG.oldDomains.length; i++) {
            if (url.indexOf(CONFIG.oldDomains[i]) !== -1) {
                return url.replace(CONFIG.oldDomains[i], CONFIG.supabaseDomain);
            }
        }

        // Se é um nome de arquivo, reconstrói
        if (url.indexOf('http') !== 0 && url.indexOf('_') !== -1 && url.indexOf('.') !== -1) {
            return CONFIG.supabaseUrl + '/storage/v1/object/public/' + CONFIG.bucket + '/' + url;
        }

        return url;
    }

    // ========== CORRIGIR PROPRIEDADE ==========
    /**
     * CORRIGE URLs DE UMA PROPRIEDADE
     * @param {Object} property - Propriedade a ser corrigida
     * @returns {Object} { property, fixed, changes }
     */
    function fixProperty(property) {
        if (!property) return { property: property, fixed: false, changes: [] };

        var fixed = false;
        var changes = [];

        // Corrigir imagens
        if (property.images && property.images !== 'EMPTY') {
            var urls = property.images.split(',').filter(function(u) { return u && u.trim(); });
            var fixedUrls = urls.map(function(u) { return fixUrl(u.trim()); });
            var newImages = fixedUrls.join(',');
            if (newImages !== property.images) {
                property.images = newImages;
                fixed = true;
                changes.push('images');
            }
        }

        // Corrigir PDFs
        if (property.pdfs && property.pdfs !== 'EMPTY') {
            var pdfUrls = property.pdfs.split(',').filter(function(u) { return u && u.trim(); });
            var fixedPdfUrls = pdfUrls.map(function(u) { return fixUrl(u.trim()); });
            var newPdfs = fixedPdfUrls.join(',');
            if (newPdfs !== property.pdfs) {
                property.pdfs = newPdfs;
                fixed = true;
                changes.push('pdfs');
            }
        }

        return { property: property, fixed: fixed, changes: changes };
    }

    // ========== CORRIGIR TODAS AS PROPRIEDADES ==========
    /**
     * CORRIGE TODAS AS PROPRIEDADES
     * @returns {Object} { fixedCount, domainFixed, properties }
     */
    function fixAllProperties() {
        if (!window.properties || window.properties.length === 0) {
            return { fixedCount: 0, domainFixed: 0, properties: [] };
        }

        var fixedCount = 0;
        var domainFixed = 0;

        for (var i = 0; i < window.properties.length; i++) {
            var prop = window.properties[i];
            var originalImages = prop.images || '';
            var result = fixProperty(prop);

            if (result.fixed) {
                fixedCount++;
                window.properties[i] = result.property;

                // Verificar se houve correção de domínio
                if (originalImages && originalImages !== result.property.images) {
                    var hasOldDomain = false;
                    for (var j = 0; j < CONFIG.oldDomains.length; j++) {
                        if (originalImages.indexOf(CONFIG.oldDomains[j]) !== -1) {
                            hasOldDomain = true;
                            break;
                        }
                    }
                    if (hasOldDomain) domainFixed++;
                }
            }
        }

        return {
            fixedCount: fixedCount,
            domainFixed: domainFixed,
            properties: window.properties
        };
    }

    // ========== TESTAR SE URL É VÁLIDA ==========
    /**
     * TESTA SE UMA URL DE IMAGEM É VÁLIDA
     * @param {string} url - URL a ser testada
     * @param {number} timeout - Timeout em ms
     * @returns {Promise<boolean>}
     */
    function testUrl(url, timeout) {
        timeout = timeout || 5000;
        return new Promise(function(resolve) {
            if (!url || typeof url !== 'string') {
                resolve(false);
                return;
            }

            var img = new Image();
            var timeoutId = setTimeout(function() {
                img.src = '';
                resolve(false);
            }, timeout);

            img.onload = function() {
                clearTimeout(timeoutId);
                resolve(true);
            };

            img.onerror = function() {
                clearTimeout(timeoutId);
                resolve(false);
            };

            img.src = url;
        });
    }

    // ========== GERAR URL DE FALLBACK ==========
    /**
     * RETORNA A URL DE FALLBACK
     * @param {string} title - Título do imóvel (para alt text)
     * @returns {string} URL do fallback
     */
    function getFallbackUrl(title) {
        // Se tiver título, podemos usar um fallback mais relevante
        if (title) {
            var searchTerm = encodeURIComponent(title + ' imóvel');
            return 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
        }
        return CONFIG.fallbackImage;
    }

    // ========== VERIFICAR SE URL É DO SUPABASE ==========
    /**
     * VERIFICA SE A URL É DO SUPABASE
     * @param {string} url - URL a ser verificada
     * @returns {boolean}
     */
    function isSupabaseUrl(url) {
        if (!url || typeof url !== 'string') return false;
        return url.indexOf('supabase.co') !== -1;
    }

    // ========== EXTRAIR NOME DO ARQUIVO ==========
    /**
     * EXTRAI O NOME DO ARQUIVO DE UMA URL
     * @param {string} url - URL completa
     * @returns {string} Nome do arquivo
     */
    function getFileName(url) {
        if (!url || typeof url !== 'string') return '';
        var parts = url.split('/');
        return parts[parts.length - 1] || '';
    }

    // ========== EXPOSIÇÃO GLOBAL ==========
    window.ImageUtils = {
        version: '1.0',
        config: CONFIG,

        // Funções principais
        fixUrl: fixUrl,
        fixProperty: fixProperty,
        fixAllProperties: fixAllProperties,

        // Funções de teste
        testUrl: testUrl,
        isSupabaseUrl: isSupabaseUrl,

        // Funções auxiliares
        getFallbackUrl: getFallbackUrl,
        getFileName: getFileName,

        // Utilitários
        oldDomains: CONFIG.oldDomains,
        currentDomain: CONFIG.supabaseDomain
    };

    // ========== INICIALIZAÇÃO ==========
    console.log('✅ ImageUtils v1.0 inicializado');
    console.log('📋 [IMAGE] Use ImageUtils.fixAllProperties() para corrigir URLs');

})();

// ============================================================
// FIM DO ARQUIVO - image-utils.js
// ============================================================
