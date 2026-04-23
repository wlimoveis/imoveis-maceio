// js/modules/utils/loading-manager.js - FALLBACK SILENCIOSO (Core System)
console.log('⏳ LoadingManager.js carregado - Modo Fallback');

/**
 * 🎯 LOADING MANAGER - MODO FALLBACK
 * Versão mínima para operação sem dependência visual
 * @version 3.0 - Core Fallback
 */

window.LoadingManager = (function() {
    // ========== ESTADO ==========
    let isVisible = false;
    let currentOperation = null;
    
    // ========== API PÚBLICA (MÍNIMA) ==========
    
    /**
     * Fallback: log apenas em debug
     */
    function show(title = 'Carregando...', message = 'Por favor, aguarde.', options = {}) {
        if (window.DEBUG_MODE || window.location.search.includes('debug=true')) {
            console.log(`[Loading Fallback] Show: ${title} - ${message}`, options);
        }
        isVisible = true;
        currentOperation = title;
        
        // Retorna objeto compatível com a API completa
        return {
            updateMessage: (msg) => updateMessage(msg),
            updateTitle: (newTitle) => updateTitle(newTitle),
            setProgress: (percent) => setProgress(percent),
            setVariant: (variant) => setVariant(variant),
            hide: () => hide(),
            getState: () => ({ isVisible: true, currentOperation })
        };
    }
    
    /**
     * Fallback: log apenas em debug
     */
    function hide(immediate = false) {
        if (window.DEBUG_MODE || window.location.search.includes('debug=true')) {
            console.log(`[Loading Fallback] Hide (immediate: ${immediate})`);
        }
        isVisible = false;
        currentOperation = null;
    }
    
    /**
     * Fallback: operação silenciosa
     */
    function updateMessage(newMessage) {
        if (window.DEBUG_MODE || window.location.search.includes('debug=true')) {
            console.log(`[Loading Fallback] Update message: ${newMessage}`);
        }
    }
    
    /**
     * Fallback: operação silenciosa
     */
    function updateTitle(newTitle) {
        if (window.DEBUG_MODE || window.location.search.includes('debug=true')) {
            console.log(`[Loading Fallback] Update title: ${newTitle}`);
        }
        currentOperation = newTitle;
    }
    
    /**
     * Fallback: operação silenciosa
     */
    function setProgress(percent) {
        if (window.DEBUG_MODE || window.location.search.includes('debug=true')) {
            console.log(`[Loading Fallback] Progress: ${percent}%`);
        }
    }
    
    /**
     * Fallback: operação silenciosa
     */
    function setVariant(variant) {
        if (window.DEBUG_MODE || window.location.search.includes('debug=true')) {
            console.log(`[Loading Fallback] Variant: ${variant}`);
        }
    }
    
    /**
     * Fallback: log de sucesso
     */
    function showSuccess(message = 'Operação concluída com sucesso!', autoHideDelay = 2000) {
        if (window.DEBUG_MODE || window.location.search.includes('debug=true')) {
            console.log(`[Loading Fallback] Success: ${message} (auto-hide: ${autoHideDelay}ms)`);
        }
        return { hide: () => {} };
    }
    
    /**
     * Fallback: log de erro
     */
    function showError(message = 'Ocorreu um erro. Tente novamente.', autoHideDelay = 3000) {
        if (window.DEBUG_MODE || window.location.search.includes('debug=true')) {
            console.log(`[Loading Fallback] Error: ${message} (auto-hide: ${autoHideDelay}ms)`);
        }
        return { hide: () => {} };
    }
    
    /**
     * Fallback: executa operação diretamente
     */
    function showWithProgress(title, message, initialProgress = 0) {
        if (window.DEBUG_MODE || window.location.search.includes('debug=true')) {
            console.log(`[Loading Fallback] Progress loading: ${title} - ${message} (${initialProgress}%)`);
        }
        return show(title, message, { showProgress: true, progress: initialProgress });
    }
    
    /**
     * Fallback: executa operação sem loading visual
     */
    async function withLoading(operation, title = 'Processando...', message = 'Aguarde') {
        if (window.DEBUG_MODE || window.location.search.includes('debug=true')) {
            console.log(`[Loading Fallback] withLoading: ${title} - ${message}`);
        }
        
        // Executa operação diretamente sem overhead de UI
        return await operation();
    }
    
    // ========== API PÚBLICA COMPATÍVEL ==========
    return {
        // Controle básico
        show,
        hide,
        updateMessage,
        updateTitle,
        setProgress,
        setVariant,
        
        // Métodos especializados
        showSuccess,
        showError,
        showWithProgress,
        withLoading,
        
        // Informações
        getState: () => ({ isVisible, currentOperation }),
        isVisible: () => isVisible,
        
        // Inicialização (no-op)
        init: () => {
            if (window.DEBUG_MODE || window.location.search.includes('debug=true')) {
                console.log('[Loading Fallback] Init called (no-op)');
            }
        },
        
        // Aliases para compatibilidade
        showLoading: show,
        hideLoading: hide,
        createOverlay: () => {}
    };
})();

console.log('✅ LoadingManager.js carregado - Modo Fallback pronto');
