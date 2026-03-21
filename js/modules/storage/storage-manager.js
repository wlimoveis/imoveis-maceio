// js/modules/storage/storage-manager.js
console.log('🗄️ storage-manager.js carregado - Módulo de exclusão de arquivos');

const StorageManager = (function() {
    // Constantes do Supabase (extraídas do window, como boa prática)
    const SUPABASE_URL = window.SUPABASE_CONSTANTS?.URL;
    const SUPABASE_KEY = window.SUPABASE_CONSTANTS?.KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('❌ StorageManager: SUPABASE_CONSTANTS não está disponível!');
    }

    /**
     * Função privada para extrair o nome do arquivo de uma URL.
     * @param {string} url - A URL completa ou o caminho do arquivo.
     * @returns {string|null} O nome do arquivo ou null se não for possível extrair.
     */
    const extractFileName = (url) => {
        if (!url) return null;
        try {
            let fileName = url.split('/').pop();
            fileName = fileName.split('?')[0];
            fileName = decodeURIComponent(fileName);
            return fileName;
        } catch (e) {
            console.warn(`⚠️ Não foi possível extrair nome do arquivo de: ${url}`);
            return null;
        }
    };

    /**
     * Exclui uma lista de arquivos do Storage do Supabase.
     * @param {Array<string>} urls - Lista de URLs completas dos arquivos a serem excluídos.
     * @returns {Promise<{success: boolean, deleted: number, errors: Array}>}
     */
    const deleteFilesFromStorage = async (urls) => {
        if (!urls || urls.length === 0) {
            return { success: true, deleted: 0, errors: [] };
        }

        if (!SUPABASE_URL || !SUPABASE_KEY) {
            console.error('❌ StorageManager: Configuração do Supabase ausente.');
            return { success: false, deleted: 0, errors: [{ error: 'Configuração do Supabase ausente' }] };
        }

        console.log(`🗑️ StorageManager: Excluindo ${urls.length} arquivo(s) do storage...`);

        let deleted = 0;
        let errors = [];
        const bucket = 'properties'; // Bucket padrão, pode ser parametrizado no futuro

        for (const url of urls) {
            if (!url || url === 'EMPTY') continue;

            const fileName = extractFileName(url);
            if (!fileName) {
                errors.push({ url, error: 'Não foi possível extrair o nome do arquivo' });
                continue;
            }

            const filePath = `${bucket}/${fileName}`;
            const deleteUrl = `${SUPABASE_URL}/storage/v1/object/${filePath}`;

            try {
                const response = await fetch(deleteUrl, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'apikey': SUPABASE_KEY
                    }
                });

                if (response.ok) {
                    deleted++;
                    console.log(`✅ StorageManager: Excluído: ${fileName}`);
                } else {
                    const errorText = await response.text();
                    console.warn(`⚠️ StorageManager: Falha ao excluir ${fileName}: ${response.status}`);
                    errors.push({ fileName, status: response.status, error: errorText });
                }
            } catch (error) {
                console.error(`❌ StorageManager: Erro ao excluir ${url}:`, error);
                errors.push({ url, error: error.message });
            }

            // Pequena pausa para não sobrecarregar a API
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`📊 StorageManager: Concluído. ${deleted} excluídos, ${errors.length} erros.`);
        return {
            success: errors.length === 0,
            deleted,
            errors
        };
    };

    // API Pública do módulo
    return {
        deleteFilesFromStorage
    };
})();

// Expor o módulo globalmente
window.StorageManager = StorageManager;
console.log('✅ storage-manager.js carregado e pronto.');
