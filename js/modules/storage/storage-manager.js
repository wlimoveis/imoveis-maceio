// js/modules/storage/storage-manager.js
console.log('🗄️ storage-manager.js carregado - Módulo de exclusão de arquivos');

const StorageManager = (function() {
    // Constantes do Supabase (extraídas do window, com verificação segura)
    let SUPABASE_URL = null;
    let SUPABASE_KEY = null;
    
    // Tentar obter as constantes de forma segura
    try {
        if (window.SUPABASE_CONSTANTS && typeof window.SUPABASE_CONSTANTS === 'object') {
            SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
            SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
        }
        
        // Fallback para variáveis globais individuais
        if (!SUPABASE_URL && window.SUPABASE_URL) {
            SUPABASE_URL = window.SUPABASE_URL;
        }
        if (!SUPABASE_KEY && window.SUPABASE_KEY) {
            SUPABASE_KEY = window.SUPABASE_KEY;
        }
        
        if (!SUPABASE_URL || !SUPABASE_KEY) {
            console.warn('⚠️ StorageManager: SUPABASE_CONSTANTS não está disponível!');
        } else {
            console.log('✅ StorageManager: Configuração do Supabase carregada');
        }
    } catch (error) {
        console.error('❌ StorageManager: Erro ao carregar configuração:', error);
    }

    /**
     * Função privada para extrair o nome do arquivo de uma URL.
     * @param {string} url - A URL completa ou o caminho do arquivo.
     * @returns {string|null} O nome do arquivo ou null se não for possível extrair.
     */
    var extractFileName = function(url) {
        if (!url || typeof url !== 'string') return null;
        try {
            var fileName = url.split('/').pop();
            if (fileName && fileName.indexOf('?') !== -1) {
                fileName = fileName.split('?')[0];
            }
            if (fileName) {
                try {
                    fileName = decodeURIComponent(fileName);
                } catch (e) {
                    // Manter o nome original se não puder decodificar
                }
            }
            return fileName;
        } catch (e) {
            console.warn('⚠️ Não foi possível extrair nome do arquivo de:', url);
            return null;
        }
    };

    /**
     * Exclui uma lista de arquivos do Storage do Supabase.
     * @param {Array} urls - Lista de URLs completas dos arquivos a serem excluídos.
     * @returns {Promise<Object>} Resultado da operação
     */
    var deleteFilesFromStorage = async function(urls) {
        // Verificar se há URLs para excluir
        if (!urls || urls.length === 0) {
            return { success: true, deleted: 0, errors: [] };
        }

        // Verificar configuração
        if (!SUPABASE_URL || !SUPABASE_KEY) {
            console.error('❌ StorageManager: Configuração do Supabase ausente.');
            return { 
                success: false, 
                deleted: 0, 
                errors: [{ error: 'Configuração do Supabase ausente' }] 
            };
        }

        console.log('🗑️ StorageManager: Excluindo ' + urls.length + ' arquivo(s) do storage...');

        var deleted = 0;
        var errors = [];
        var bucket = 'properties'; // Bucket padrão

        for (var i = 0; i < urls.length; i++) {
            var url = urls[i];
            
            // Pular URLs inválidas
            if (!url || url === 'EMPTY' || typeof url !== 'string') {
                continue;
            }

            var fileName = extractFileName(url);
            if (!fileName) {
                errors.push({ url: url, error: 'Não foi possível extrair o nome do arquivo' });
                continue;
            }

            var filePath = bucket + '/' + fileName;
            var deleteUrl = SUPABASE_URL + '/storage/v1/object/' + filePath;

            try {
                var response = await fetch(deleteUrl, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + SUPABASE_KEY,
                        'apikey': SUPABASE_KEY
                    }
                });

                if (response.ok) {
                    deleted++;
                    console.log('✅ StorageManager: Excluído:', fileName);
                } else {
                    var errorText = await response.text();
                    console.warn('⚠️ StorageManager: Falha ao excluir ' + fileName + ': ' + response.status);
                    errors.push({ 
                        fileName: fileName, 
                        status: response.status, 
                        error: errorText 
                    });
                }
            } catch (error) {
                console.error('❌ StorageManager: Erro ao excluir', url, error);
                errors.push({ 
                    url: url, 
                    error: error.message || 'Erro desconhecido' 
                });
            }

            // Pequena pausa para não sobrecarregar a API
            await new Promise(function(resolve) {
                setTimeout(resolve, 100);
            });
        }

        console.log('📊 StorageManager: Concluído. ' + deleted + ' excluídos, ' + errors.length + ' erros.');
        return {
            success: errors.length === 0,
            deleted: deleted,
            errors: errors
        };
    };

    // API Pública do módulo
    return {
        deleteFilesFromStorage: deleteFilesFromStorage
    };
})();

// Expor o módulo globalmente de forma segura
if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
}

console.log('✅ storage-manager.js carregado e pronto.');
