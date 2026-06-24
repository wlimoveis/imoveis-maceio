// js/modules/sitemap-dynamic.js
// SITEMAP DINÂMICO - Gera sitemap.xml baseado nos imóveis ativos

(function() {
    'use strict';
    console.log('🗺️ Sitemap Dinâmico carregado');

    /**
     * Gera o sitemap.xml baseado nos imóveis atuais
     * @returns {string} XML do sitemap
     */
    function generateSitemap() {
        // Obter imóveis ativos
        const properties = window.properties || [];
        const activeProperties = properties.filter(p => p && p.id);
        
        // Data atual para o sitemap
        const today = new Date().toISOString().split('T')[0];
        
        // Início do XML
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        // Página inicial (sempre presente)
        xml += '  <!-- Página inicial -->\n';
        xml += '  <url>\n';
        xml += '    <loc>https://weberlessaimoveis.com.br/</loc>\n';
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>1.0</priority>\n';
        xml += '  </url>\n';
        
        // Imóveis ativos
        xml += '  <!-- Imóveis disponíveis -->\n';
        activeProperties.forEach(function(property) {
            const lastmod = property.updated_at ? property.updated_at.split('T')[0] : today;
            xml += '  <url>\n';
            xml += `    <loc>https://weberlessaimoveis.com.br/?property=${property.id}</loc>\n`;
            xml += `    <lastmod>${lastmod}</lastmod>\n`;
            xml += '    <changefreq>weekly</changefreq>\n';
            xml += '    <priority>0.9</priority>\n';
            xml += '  </url>\n';
        });
        
        // Final do XML
        xml += '</urlset>\n';
        
        return xml;
    }

    /**
     * Servir o sitemap como XML quando a URL for /sitemap.xml
     */
    function serveSitemap() {
        const currentPath = window.location.pathname;
        
        // Se a URL termina com sitemap.xml, servir o XML dinâmico
        if (currentPath.endsWith('sitemap.xml') || currentPath === '/sitemap.xml') {
            // Aguardar propriedades carregarem
            const checkProperties = setInterval(function() {
                if (window.properties && window.properties.length > 0) {
                    clearInterval(checkProperties);
                    
                    // Gerar XML
                    const xml = generateSitemap();
                    
                    // Substituir o conteúdo da página pelo XML
                    document.documentElement.innerHTML = xml;
                    
                    // Definir o tipo de conteúdo como XML
                    document.querySelector('meta[charset]')?.setAttribute('charset', 'UTF-8');
                    
                    console.log('🗺️ Sitemap dinâmico servido com', window.properties.length, 'imóveis');
                }
            }, 500);
            
            // Fallback: se não carregar em 5 segundos, usar sitemap básico
            setTimeout(function() {
                if (document.documentElement.innerHTML.indexOf('urlset') === -1) {
                    const basicXml = generateBasicSitemap();
                    document.documentElement.innerHTML = basicXml;
                    console.log('🗺️ Sitemap básico servido (fallback)');
                }
            }, 5000);
        }
    }

    /**
     * Sitemap básico de fallback
     */
    function generateBasicSitemap() {
        const today = new Date().toISOString().split('T')[0];
        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://weberlessaimoveis.com.br/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    }

    // ========== INICIALIZAÇÃO ==========
    
    // Servir sitemap quando a página carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', serveSitemap);
    } else {
        serveSitemap();
    }
    
    // Expor função para uso externo
    window.SitemapGenerator = {
        generate: generateSitemap,
        serve: serveSitemap,
        getPropertyCount: function() {
            return window.properties ? window.properties.length : 0;
        }
    };
    
    console.log('✅ Sitemap Dinâmico inicializado');
})();
