// js/modules/sitemap-dynamic.js
// SITEMAP DINÂMICO - Gera sitemap.xml baseado nos imóveis ativos
// ✅ Versão: 1.0
// ✅ Compatível com GitHub Pages

console.log('🗺️ Sitemap Dinâmico carregado - Versão 1.0');

(function() {
    'use strict';

    /**
     * Gera o sitemap.xml baseado nos imóveis atuais
     * @returns {string} XML do sitemap
     */
    function generateSitemap() {
        // Obter imóveis ativos
        var properties = window.properties || [];
        var activeProperties = properties.filter(function(p) { 
            return p && p.id && p.images && p.images !== 'EMPTY';
        });
        
        // Data atual
        var today = new Date().toISOString().split('T')[0];
        var siteUrl = 'https://weberlessaimoveis.com.br';
        
        console.log('🗺️ Gerando sitemap para ' + activeProperties.length + ' imóveis ativos');
        
        // Início do XML
        var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        // ========== PÁGINA INICIAL (sempre presente) ==========
        xml += '  <!-- Página inicial -->\n';
        xml += '  <url>\n';
        xml += '    <loc>' + siteUrl + '/</loc>\n';
        xml += '    <lastmod>' + today + '</lastmod>\n';
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>1.0</priority>\n';
        xml += '  </url>\n';
        
        // ========== IMÓVEIS ATIVOS ==========
        if (activeProperties.length > 0) {
            xml += '  <!-- Imóveis disponíveis (' + activeProperties.length + ') -->\n';
            
            activeProperties.forEach(function(property) {
                var lastmod = property.updated_at ? property.updated_at.split('T')[0] : today;
                var title = property.title || 'Imóvel';
                var location = property.location || '';
                
                xml += '  <url>\n';
                xml += '    <loc>' + siteUrl + '/?property=' + property.id + '</loc>\n';
                xml += '    <lastmod>' + lastmod + '</lastmod>\n';
                xml += '    <changefreq>weekly</changefreq>\n';
                xml += '    <priority>0.9</priority>\n';
                xml += '    <!-- ' + title + ' - ' + location + ' -->\n';
                xml += '  </url>\n';
            });
        }
        
        // ========== FIM DO XML ==========
        xml += '</urlset>\n';
        
        return xml;
    }

    /**
     * Substitui a página pelo XML do sitemap
     */
    function serveSitemap() {
        console.log('🗺️ Iniciando geração do sitemap...');
        
        // Verificar se as propriedades já estão carregadas
        if (window.properties && window.properties.length > 0) {
            console.log('🗺️ Propriedades já carregadas:', window.properties.length);
            renderSitemap();
            return;
        }
        
        // Aguardar o carregamento das propriedades
        var maxAttempts = 30; // 30 tentativas (15 segundos)
        var attempts = 0;
        
        var checkProperties = setInterval(function() {
            attempts++;
            
            if (window.properties && window.properties.length > 0) {
                clearInterval(checkProperties);
                console.log('🗺️ Propriedades carregadas após ' + attempts + ' tentativas:', window.properties.length);
                renderSitemap();
                return;
            }
            
            if (attempts >= maxAttempts) {
                clearInterval(checkProperties);
                console.warn('🗺️ Timeout: propriedades não carregadas, usando sitemap básico');
                renderBasicSitemap();
            }
        }, 500);
    }

    /**
     * Renderiza o sitemap completo
     */
    function renderSitemap() {
        try {
            var xml = generateSitemap();
            // Substituir o conteúdo da página pelo XML
            document.documentElement.innerHTML = xml;
            console.log('🗺️ Sitemap gerado com sucesso!');
        } catch (error) {
            console.error('🗺️ Erro ao gerar sitemap:', error);
            renderBasicSitemap();
        }
    }

    /**
     * Sitemap básico de fallback (apenas página inicial)
     */
    function renderBasicSitemap() {
        var today = new Date().toISOString().split('T')[0];
        var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        xml += '  <url>\n';
        xml += '    <loc>https://weberlessaimoveis.com.br/</loc>\n';
        xml += '    <lastmod>' + today + '</lastmod>\n';
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>1.0</priority>\n';
        xml += '  </url>\n';
        xml += '</urlset>\n';
        
        document.documentElement.innerHTML = xml;
        console.log('🗺️ Sitemap básico renderizado (fallback)');
    }

    // ========== INICIALIZAÇÃO ==========
    
    // Executar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', serveSitemap);
    } else {
        // DOM já carregado
        setTimeout(serveSitemap, 100);
    }
    
    // ========== EXPOSIÇÃO GLOBAL ==========
    window.SitemapGenerator = {
        generate: generateSitemap,
        getPropertyCount: function() {
            return window.properties ? window.properties.length : 0;
        },
        getActivePropertyCount: function() {
            if (!window.properties) return 0;
            return window.properties.filter(function(p) { 
                return p && p.id && p.images && p.images !== 'EMPTY';
            }).length;
        },
        forceRegenerate: function() {
            renderSitemap();
        }
    };
    
    console.log('✅ Sitemap Dinâmico inicializado');
    console.log('📊 Comandos disponíveis:');
    console.log('  • window.SitemapGenerator.generate() - Gerar XML');
    console.log('  • window.SitemapGenerator.forceRegenerate() - Regenerar');
    console.log('  • window.SitemapGenerator.getPropertyCount() - Total de imóveis');
    console.log('  • window.SitemapGenerator.getActivePropertyCount() - Imóveis ativos');
})();
