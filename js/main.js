// js/main.js - SISTEMA DE INICIALIZAÇÃO OTIMIZADO E ENXUTO
console.log('🚀 main.js carregado - Sistema de Inicialização Otimizado');

/**
 * FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO OTIMIZADA
 */
window.initializeWeberLessaSystem = async function() {
    console.log('⚙️ Inicializando Sistema Weber Lessa com otimizações...');
    
    let initLoading = null;
    const loadingStartTime = Date.now();
    
    if (window.LoadingManager && typeof window.LoadingManager.show === 'function') {
        initLoading = window.LoadingManager.show(
            'Iniciando Weber Lessa Imóveis...',
            'Carregando sistema completo...',
            { variant: 'processing' }
        );
        console.log('✅ Loading inicial ativado');
    }
    
    try {
        setTimeout(() => {
            initLoading?.updateMessage?.('Preparando módulos essenciais...');
        }, 400);
        
        // ✅ PRIMEIRA CAMADA DE PROTEÇÃO: GARANTIR FUNCIONALIDADE BÁSICA
        // Esta é a correção crítica apontada pelo outro agente
        if (typeof window.ensureBasicFunctionality === 'function') {
            console.log('🔧 Garantindo funcionalidade básica (camada 1)...');
            window.ensureBasicFunctionality();
        } else {
            console.log('ℹ️ Função de compatibilidade não disponível');
        }
        
        // ✅ SEGUNDA CAMADA: UNIFICAÇÃO DO LOCALSTORAGE (se disponível)
        if (typeof window.unifyLocalStorageKeys === 'function') {
            console.log('🔄 Executando unificação do localStorage...');
            window.unifyLocalStorageKeys();
        } else {
            console.log('ℹ️ Função de unificação não disponível (modo produção)');
        }
        
        // ✅ CARREGAMENTO PRINCIPAL COM VERIFICAÇÃO DE LINK DIRETO
        if (typeof window.loadPropertiesData === 'function') {
            console.log('🏠 Carregando imóveis via sistema existente...');
            await window.loadPropertiesData();
            console.log('✅ Imóveis carregados com sucesso');
            
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
        } else {
            console.error('❌ loadPropertiesData() não encontrado!');
        }
        
        initLoading?.updateMessage?.('Configurando interface...');
        
        // ✅ CONFIGURAÇÃO DA INTERFACE
        if (typeof window.setupFilters === 'function') {
            console.log('🎛️ Configurando filtros...');
            window.setupFilters();
            console.log('✅ Filtros configurados');
        }
        
        if (typeof window.setupForm === 'function') {
            console.log('📝 Configurando formulário admin...');
            window.setupForm();
            console.log('✅ Formulário admin configurado');
        }
        
        if (typeof window.setupGalleryEvents === 'function') {
            console.log('🎮 Configurando eventos da galeria...');
            window.setupGalleryEvents();
            console.log('✅ Galeria configurada');
        }
        
        // ✅ OTIMIZAÇÃO DE IMAGENS (se disponível)
        let imagesLoaded = 0;
        if (typeof window.waitForCriticalImages === 'function') {
            imagesLoaded = await window.waitForCriticalImages();
            console.log(`🖼️ ${imagesLoaded} imagem(ns) principal(is) otimizada(s)`);
        } else {
            console.log('ℹ️ Otimização de imagem não disponível (modo produção)');
        }
        
        const totalTime = Date.now() - loadingStartTime;
        const propertyCount = window.properties ? window.properties.length : 0;
        
        console.log(`✅ Sistema completamente carregado em ${totalTime}ms`);
        console.log(`📊 ${propertyCount} imóveis disponíveis`);
        
        if (initLoading) {
            let finalMessage = '';
            if (propertyCount === 0) {
                finalMessage = 'Sistema pronto! Adicione seu primeiro imóvel 🏠';
            } else if (propertyCount <= 5) {
                finalMessage = `✨ ${propertyCount} oportunidade(s) disponível(eis)!`;
            } else {
                finalMessage = `🎯 ${propertyCount} oportunidades em Maceió!`;
            }
            
            initLoading.setVariant('success');
            initLoading.updateMessage(finalMessage);
        }
        
        // ✅ TESTE DE INTEGRAÇÃO (apenas debug)
        if (typeof window.runIntegrationTest === 'function') {
            setTimeout(() => {
                window.runIntegrationTest(totalTime, imagesLoaded);
            }, 300);
        }
        
    } catch (error) {
        console.error('❌ Erro na inicialização otimizada:', error);
        
        if (initLoading) {
            initLoading.setVariant('error');
            initLoading.updateMessage('Sistema carregado com limitações');
            initLoading.updateTitle('Aviso de Inicialização');
        }
        
    } finally {
        setTimeout(() => {
            if (initLoading) {
                initLoading.hide();
                console.log('🎉 Loading inicial finalizado - Site 100% operacional');
            }
        }, 800);
    }
};

/**
 * INICIALIZAÇÃO AUTOMÁTICA
 */
function startOptimizedInitialization() {
    console.log('🏁 Iniciando inicialização otimizada...');
    
    // ✅ TERCEIRA CAMADA DE PROTEÇÃO: Fallback duplo por segurança
    if (typeof window.ensureBasicFunctionality === 'function') {
        console.log('🔧 Garantindo funcionalidade básica (camada 2 - fallback)...');
        window.ensureBasicFunctionality();
    }
    
    if (typeof window.initializeWeberLessaSystem === 'function') {
        setTimeout(() => {
            window.initializeWeberLessaSystem();
        }, 200);
    } 
    // Fallback para o fluxo original (se a função principal não existir)
    else {
        console.log('⚠️ Usando inicialização fallback (fluxo original)...');
        
        if (typeof window.loadPropertiesData === 'function') {
            setTimeout(() => {
                window.loadPropertiesData().then(() => {
                    if (typeof window.setupFilters === 'function') {
                        window.setupFilters();
                    }
                    console.log('✅ Sistema inicializado via fallback');
                });
            }, 300);
        } else {
            console.error('❌ Nenhum sistema de inicialização disponível');
            document.body.style.opacity = '1';
        }
    }
}

// Inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🏠 DOM completamente carregado');
        setTimeout(startOptimizedInitialization, 150);
    });
} else {
    console.log('⚡ DOM já carregado - iniciando agora');
    setTimeout(startOptimizedInitialization, 150);
}

console.log('✅ main.js otimizado carregado - Sistema pronto para inicializar');
