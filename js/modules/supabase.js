// js/modules/supabase.js - Cliente Supabase Oficial CORRIGIDO E OTIMIZADO
console.log('🚀 Supabase.js carregado - Cliente Oficial CORRIGIDO E OTIMIZADO');

// Configuração GLOBAL - disponível para todos os módulos
console.log('🚀 Supabase.js - AMBIENTE DE PRODUÇÃO');

window.SUPABASE_CONFIG = {
    url: 'https://wxdiowpswepsvklumgvx.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4ZGlvd3Bzd2Vwc3ZrbHVtZ3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MTExNzksImV4cCI6MjA4Nzk4NzE3OX0.QsUHE_w5m5-pz3LcwdREuwmwvCiX3Hz8FYv8SAwhD6U',
    options: {
        auth: {
            persistSession: false,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
};

// Inicializar o cliente Supabase
(function initializeSupabase() {
    console.log('🔧 Inicializando cliente Supabase - PRODUÇÃO...');

    if (typeof supabase === 'undefined') {
        console.error('❌ Biblioteca Supabase não carregada!');
        return;
    }

    try {
        window.supabaseClient = supabase.createClient(
            window.SUPABASE_CONFIG.url,
            window.SUPABASE_CONFIG.key,
            window.SUPABASE_CONFIG.options
        );
        console.log('✅ Cliente Supabase de PRODUÇÃO criado');
    } catch (error) {
        console.error('❌ Erro ao criar cliente Supabase:', error);
    }
})();

function setupSupabaseClient() {
    try {
        window.supabaseClient = supabase.createClient(
            window.SUPABASE_CONFIG.url,
            window.SUPABASE_CONFIG.key,
            window.SUPABASE_CONFIG.options
        );

        console.log('✅ Cliente Supabase criado com sucesso');
        
        // Teste de conexão agora é feito via core-diagnostics.js quando necessário
        console.log('ℹ️ Use window.testSupabaseConnection() para testar a conexão');
        
    } catch (error) {
        console.error('❌ Erro ao criar cliente Supabase:', error);
    }
}

// ========== FUNÇÕES DE ACESSO À API ==========

// Carregar imóveis
window.supabaseLoadProperties = async function () {
    if (!window.supabaseClient) {
        return { data: [], error: 'Cliente não inicializado' };
    }

    try {
        const { data, error, count } = await window.supabaseClient
            .from('properties')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (error) {
            return { data: [], error: error.message };
        }

        return { data: data || [], count: count || 0, error: null };
    } catch (error) {
        return { data: [], error: error.message };
    }
};

// Salvar imóvel
window.supabaseSaveProperty = async function (propertyData) {
    if (!window.supabaseClient) {
        return { success: false, error: 'Cliente não inicializado' };
    }

    try {
        const { data, error } = await window.supabaseClient
            .from('properties')
            .insert([propertyData])
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data, id: data.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Atualizar imóvel
window.supabaseUpdateProperty = async function (id, propertyData) {
    if (!window.supabaseClient) {
        return { success: false, error: 'Cliente não inicializado' };
    }

    try {
        const { data, error } = await window.supabaseClient
            .from('properties')
            .update(propertyData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Deletar imóvel
window.supabaseDeleteProperty = async function (id) {
    if (!window.supabaseClient) {
        return { success: false, error: 'Cliente não inicializado' };
    }

    try {
        const { error } = await window.supabaseClient
            .from('properties')
            .delete()
            .eq('id', id);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Inicialização automática
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (!window.supabaseClient) setupSupabaseClient();
        }, 1000);
    });
} else {
    setTimeout(() => {
        if (!window.supabaseClient) setupSupabaseClient();
    }, 500);
}

console.log('✅ Módulo Supabase.js completamente carregado (versão otimizada)');
console.log('ℹ️ Funções de sincronização movidas para core-diagnostics.js');
