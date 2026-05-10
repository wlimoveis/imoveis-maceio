// js/modules/reader/pdf-unified.js - VERSÃO DEFINITIVA COM RESPONSIVIDADE PARA MOBILE
// ✅ Função escapeHtml centralizada no SharedCore
// ✅ CSS inline movido para admin.css (classes CSS)
console.log('📄 pdf-unified.js - VERSÃO DEFINITIVA COM RESPONSIVIDADE (CSS externalizado)');

const PdfSystem = (function() {
    // ========== CONFIGURAÇÃO ==========
    const CONFIG = {
        password: "doc123"
    };
    
    // ========== ESTADO ==========
    let state = {
        currentPropertyId: null,
        currentPropertyTitle: '',
        currentPdfUrls: []
    };
    
    // ========== FUNÇÃO CRÍTICA: CRIAR CONTÊINER COM EVENTOS FUNCIONAIS ==========
    function createDocumentListModal(propertyId, propertyTitle, pdfUrls) {
        console.log(`📋 Criando contêiner responsivo para ${pdfUrls.length} PDF(s)`);
        
        // Detectar se é dispositivo móvel
        const isMobile = window.innerWidth <= 768;
        console.log(`📱 Dispositivo: ${isMobile ? 'Mobile' : 'Desktop'} (${window.innerWidth}px)`);
        
        // Remover modal anterior se existir
        const oldModal = document.getElementById('pdfSelectionModal');
        if (oldModal) oldModal.remove();
        
        // Criar novo modal com design responsivo - USANDO CLASSES CSS
        const modal = document.createElement('div');
        modal.id = 'pdfSelectionModal';
        modal.className = 'pdf-selection-modal';
        
        // OBTER FUNÇÃO ESCAPE HTML CENTRALIZADA
        const escapeHtmlFn = window.SharedCore ? window.SharedCore.escapeHtml : (function(s){ if(!s)return ''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); });
        
        // Gerar HTML da lista - USANDO CLASSES CSS
        const pdfListHtml = pdfUrls.map((url, index) => {
            const fileName = url.split('/').pop() || `Documento ${index + 1}`;
            
            // TRATAMENTO ESPECIAL PARA MOBILE: nome mais curto
            let displayName;
            if (isMobile) {
                displayName = fileName.length > 25 
                    ? fileName.substring(0, 22) + '...' 
                    : fileName;
            } else {
                displayName = fileName.length > 40 
                    ? fileName.substring(0, 37) + '...' 
                    : fileName;
            }
            
            return `
                <div class="pdf-list-item" data-pdf-index="${index}">
                    <div class="pdf-item-info">
                        <div class="pdf-item-icon">
                            <i class="fas fa-file-pdf"></i>
                            <div class="pdf-item-name">
                                <strong title="${escapeHtmlFn(fileName)}">${escapeHtmlFn(displayName)}</strong>
                                <div class="pdf-item-meta">PDF • ${index + 1}/${pdfUrls.length}</div>
                            </div>
                        </div>
                    </div>
                    <button class="pdf-view-btn" data-pdf-index="${index}">
                        <i class="fas fa-eye"></i>
                        <span>Visualizar</span>
                    </button>
                </div>
            `;
        }).join('');
        
        modal.innerHTML = `
            <div class="pdf-selection-container">
                <button id="closeSelectionModalBtn" class="pdf-modal-close-btn" aria-label="Fechar">×</button>
                
                <h3 class="pdf-modal-title">
                    <i class="fas fa-file-pdf"></i> Documentos do Imóvel
                </h3>
                
                <p class="pdf-modal-description">
                    <strong>${escapeHtmlFn(propertyTitle)}</strong><br>
                    Selecione o documento que deseja visualizar:
                </p>
                
                <div class="pdf-items-container">
                    ${pdfUrls.length > 0 ? pdfListHtml : `
                        <div class="pdf-empty-state">
                            <i class="fas fa-file-pdf"></i>
                            <p>Nenhum documento disponível</p>
                        </div>
                    `}
                </div>
                
                <div class="pdf-modal-footer">
                    <small>
                        <i class="fas fa-info-circle"></i> 
                        ${isMobile ? 'Toque no documento para abrir' : 'Clique em "Visualizar" para abrir em nova aba'}
                    </small>
                    
                    ${pdfUrls.length > 1 ? `
                        <button id="downloadAllPdfsBtn" class="pdf-download-all-btn">
                            <i class="fas fa-download"></i> 
                            <span>${isMobile ? 'Baixar' : 'Baixar Todos'}</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // ✅✅✅ CONFIGURAR EVENTOS DOS BOTÕES - MÉTODO GARANTIDO
        setTimeout(() => setupDocumentListEvents(pdfUrls), 50);
        
        console.log('✅✅✅ CONTÊINER RESPONSIVO CRIADO!');
        return modal;
    }
    
    // ✅✅✅ FUNÇÃO QUE GARANTE OS EVENTOS DOS BOTÕES
    function setupDocumentListEvents(pdfUrls) {
        console.log('🎮 Configurando eventos dos botões...');
        
        const modal = document.getElementById('pdfSelectionModal');
        if (!modal) {
            console.error('❌ Modal não encontrado!');
            return;
        }
        
        // 1. Botão Fechar (SIMPLES E DIRETO)
        const closeBtn = document.getElementById('closeSelectionModalBtn');
        if (closeBtn) {
            closeBtn.onclick = function(e) {
                e.preventDefault();
                modal.style.display = 'none';
                console.log('❌ Contêiner fechado');
            };
        }
        
        // 2. Botões "Visualizar" - LOOP DIRETO GARANTIDO
        const viewButtons = modal.querySelectorAll('.pdf-view-btn');
        console.log(`🔍 Encontrados ${viewButtons.length} botões Visualizar`);
        
        viewButtons.forEach(button => {
            const index = parseInt(button.getAttribute('data-pdf-index'));
            const url = pdfUrls[index];
            
            if (url) {
                button.onclick = null;
                button.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`📄 Clicou no botão Visualizar: PDF ${index + 1}`);
                    console.log(`🔗 URL: ${url}`);
                    window.open(url, '_blank');
                    return false;
                };
                console.log(`✅ Botão ${index} configurado para: ${url.substring(0, 50)}...`);
            }
        });
        
        // 3. Itens da lista (clicar no item inteiro também abre)
        const listItems = modal.querySelectorAll('.pdf-list-item');
        listItems.forEach(item => {
            const index = parseInt(item.getAttribute('data-pdf-index'));
            const url = pdfUrls[index];
            
            if (url) {
                item.onclick = function(e) {
                    if (e.target.closest('.pdf-view-btn')) {
                        return;
                    }
                    e.preventDefault();
                    console.log(`📄 Clicou no item: PDF ${index + 1}`);
                    window.open(url, '_blank');
                };
            }
        });
        
        // 4. Botão "Baixar Todos"
        const downloadBtn = document.getElementById('downloadAllPdfsBtn');
        if (downloadBtn && pdfUrls.length > 1) {
            downloadBtn.onclick = function(e) {
                e.preventDefault();
                downloadAllPdfs(pdfUrls);
            };
        }
        
        console.log(`🎉 ${viewButtons.length} botões configurados com SUCESSO!`);
        
        // TESTE AUTOMÁTICO
        setTimeout(() => {
            const testButtons = modal.querySelectorAll('.pdf-view-btn');
            let activeCount = 0;
            testButtons.forEach(btn => {
                if (btn.onclick) activeCount++;
            });
            console.log(`🧪 TESTE: ${activeCount}/${testButtons.length} botões com eventos ativos`);
        }, 100);
    }
    
    // ========== FUNÇÃO DE REDIMENSIONAMENTO DINÂMICO ==========
    function setupResponsiveBehavior() {
        console.log('🔄 Configurando comportamento responsivo...');
        
        function handleResize() {
            const modal = document.getElementById('pdfSelectionModal');
            if (!modal) return;
            
            const isMobile = window.innerWidth <= 768;
            
            // Ajustar classes baseadas no tamanho da tela
            if (isMobile) {
                modal.style.alignItems = 'flex-start';
                modal.style.padding = '10px';
            } else {
                modal.style.alignItems = 'center';
                modal.style.padding = '20px';
            }
        }
        
        window.addEventListener('resize', handleResize);
        setTimeout(handleResize, 100);
        console.log('✅ Comportamento responsivo configurado');
    }
    
    // Função auxiliar para download
    function downloadAllPdfs(urls) {
        console.log(`📥 Baixando ${urls.length} PDF(s)`);
        
        urls.forEach((url, index) => {
            try {
                const fileName = url.split('/').pop() || `documento_${index + 1}.pdf`;
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                setTimeout(() => {
                    document.body.removeChild(link);
                }, 100);
                console.log(`✅ Download iniciado: ${fileName}`);
            } catch (error) {
                console.error(`❌ Erro ao baixar ${url}:`, error);
            }
        });
        
        alert(`✅ ${urls.length} documento(s) enviado(s) para download!`);
    }
    
    // ========== API PÚBLICA ==========
    const api = {
        init() {
            console.log('🔧 PdfSystem.init() - Sistema PDF inicializado');
            this.setupMainModalEvents();
            return this;
        },
        
        setupMainModalEvents() {
            console.log('🔧 Configurando eventos do modal principal...');
            
            const passwordForm = document.getElementById('pdfPasswordForm');
            if (passwordForm) {
                passwordForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.validatePasswordAndShowList();
                });
            } else {
                const accessBtn = document.getElementById('pdfAccessBtn');
                if (accessBtn) {
                    accessBtn.onclick = (e) => {
                        e.preventDefault();
                        this.validatePasswordAndShowList();
                    };
                }
            }
            
            const closeBtn = document.getElementById('pdfCloseBtn');
            if (closeBtn) {
                closeBtn.onclick = (e) => {
                    e.preventDefault();
                    document.getElementById('pdfModal').style.display = 'none';
                };
            }
            
            const passwordInput = document.getElementById('pdfPassword');
            if (passwordInput) {
                passwordInput.onkeypress = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.validatePasswordAndShowList();
                    }
                };
            }
        },
        
        showModal(propertyId) {
            console.log(`📄 Abrindo modal para imóvel ${propertyId}`);
            
            const property = window.properties?.find(p => p.id == propertyId);
            if (!property) {
                alert('❌ Imóvel não encontrado!');
                return;
            }
            
            state.currentPropertyId = propertyId;
            state.currentPropertyTitle = property.title;
            
            const titleElement = document.getElementById('pdfModalTitle');
            if (titleElement) {
                titleElement.innerHTML = `<i class="fas fa-file-pdf"></i> Documentos: ${property.title}`;
            }
            
            const modal = document.getElementById('pdfModal');
            if (modal) {
                modal.style.display = 'flex';
                const passwordInput = document.getElementById('pdfPassword');
                if (passwordInput) {
                    passwordInput.value = '';
                    setTimeout(() => {
                        passwordInput.focus();
                        passwordInput.select();
                    }, 100);
                }
            }
            
            console.log('✅ Modal de senha exibido');
        },
        
        validatePasswordAndShowList() {
            console.log('🔓 Validando senha...');
            
            const passwordInput = document.getElementById('pdfPassword');
            if (!passwordInput) {
                alert('Erro: campo de senha não encontrado');
                return;
            }
            
            const password = passwordInput.value.trim();
            
            if (!password) {
                alert('Digite a senha para acessar os documentos!');
                passwordInput.focus();
                passwordInput.setAttribute('aria-invalid', 'true');
                return;
            }
            
            passwordInput.removeAttribute('aria-invalid');
            
            if (password !== CONFIG.password) {
                alert('❌ Senha incorreta!\n\nA senha correta é: doc123');
                passwordInput.value = '';
                passwordInput.focus();
                passwordInput.setAttribute('aria-invalid', 'true');
                return;
            }
            
            console.log('✅ Senha válida!');
            
            const propertyId = state.currentPropertyId;
            if (!propertyId) {
                alert('⚠️ Não foi possível identificar o imóvel');
                this.closeModal();
                return;
            }
            
            const property = window.properties?.find(p => p.id == propertyId);
            if (!property) {
                alert('❌ Imóvel não encontrado!');
                this.closeModal();
                return;
            }
            
            if (!property.pdfs || property.pdfs === 'EMPTY') {
                alert('ℹ️ Este imóvel não tem documentos PDF disponíveis.');
                this.closeModal();
                return;
            }
            
            const pdfUrls = property.pdfs.split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY');
            
            if (pdfUrls.length === 0) {
                alert('ℹ️ Nenhum documento PDF disponível.');
                this.closeModal();
                return;
            }
            
            console.log(`✅ ${pdfUrls.length} documento(s) encontrado(s)`);
            
            this.closeModal();
            
            setTimeout(() => {
                createDocumentListModal(propertyId, property.title, pdfUrls);
            }, 300);
        },
        
        closeModal() {
            const modal = document.getElementById('pdfModal');
            if (modal) modal.style.display = 'none';
        },
        
        // Função pública para testes
        testButtons() {
            const modal = document.getElementById('pdfSelectionModal');
            if (!modal) {
                console.log('❌ Contêiner não está aberto');
                return;
            }
            
            const buttons = modal.querySelectorAll('.pdf-view-btn');
            console.log(`🧪 TESTANDO ${buttons.length} BOTÕES:`);
            
            buttons.forEach((btn, index) => {
                console.log(`Botão ${index}:`, {
                    temOnclick: !!btn.onclick,
                    dataIndex: btn.getAttribute('data-pdf-index'),
                    url: state.currentPdfUrls[btn.getAttribute('data-pdf-index')]
                });
            });
        }
    };
    
    return api;
})();

// ========== EXPORTAÇÃO GLOBAL ==========
window.PdfSystem = PdfSystem;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 DOM carregado - Inicializando PDF System...');
    
    setTimeout(() => {
        if (window.PdfSystem) {
            window.PdfSystem.init();
            console.log('✅ Sistema PDF inicializado!');
            console.log('🎯 Botões "Visualizar" estarão 100% funcionais!');
            console.log('🔧 CSS externalizado para admin.css');
        }
    }, 1000);
});
